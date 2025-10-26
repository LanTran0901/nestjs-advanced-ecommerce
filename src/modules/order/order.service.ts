import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  QueryOrderDto,
  OrderStatus,
} from './dto/order.dto';
import { QueueService } from 'src/common/queue/queue.service';
import Redlock from 'redlock';

@Injectable()
export class OrderService {
  // Payment configuration - you should move these to environment variables
  private readonly PAYMENT_CONFIG = {
    bankAccount: '0010000000355',
    bankName: 'Vietcombank',
    baseUrl: 'https://qr.sepay.vn/img',
  };

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    @Inject('REDLOCK') private readonly redlock: Redlock,
  ) {}

  /**
   * Generate QR payment link using Sepay format
   */
  private generateQRPaymentLink(amount: number, orderId: string) {
    const description = encodeURIComponent(`Thanh toan don hang ${orderId}`);

    return `${this.PAYMENT_CONFIG.baseUrl}?acc=${this.PAYMENT_CONFIG.bankAccount}&bank=${this.PAYMENT_CONFIG.bankName}&amount=${amount}&des=${description}`;
  }

  async create(createOrderDto: CreateOrderDto, currentUserId: number) {
    return await this.prisma.$transaction(async (prisma) => {
      const createdOrders: any[] = [];
      const allCartItemIds: number[] = [];

      // Collect all cart item IDs from all orders
      for (const orderData of createOrderDto) {
        allCartItemIds.push(...orderData.items);
      }

      // 1. Fetch all cart items with SKU and product information
      const allCartItems = await prisma.cartItem.findMany({
        where: {
          id: { in: allCartItemIds },
          userId: currentUserId,
        },
        include: {
          sku: {
            include: { product: { include: { productTranslations: true } } },
          },
        },
      });

      if (allCartItems.length === 0) {
        throw new BadRequestException('No valid cart items found');
      }

      if (allCartItems.length !== allCartItemIds.length) {
        throw new BadRequestException(
          'Some cart items are invalid or do not belong to you',
        );
      }
      const lock = await this.redlock.acquire(
        allCartItems.map((item) => item.skuId),
        3000,
      );
      // Create a map for quick lookup
      const cartItemMap = new Map(allCartItems.map((item) => [item.id, item]));

      // 2. Create a single payment record for all orders (initially PENDING)
      const payment = await prisma.payment.create({
        data: {
          status: 'PENDING',
        },
      });
      this.prisma.$transaction(async (tx) => {
        // 3. Process each order
        for (const orderData of createOrderDto) {
          // Get cart items for this specific order
          const orderCartItems = orderData.items
            .map((itemId) => cartItemMap.get(itemId))
            .filter((item) => item != undefined);

          if (orderCartItems.length === 0) {
            throw new BadRequestException(
              `No valid cart items found for order with shop ${orderData.shopId}`,
            );
          }

          // Validate stock availability and calculate total for this order
          let totalAmount = 0;

          for (const cartItem of orderCartItems) {
            if (!cartItem?.sku || cartItem.sku.deletedAt) {
              throw new NotFoundException(
                `SKU for cart item ${cartItem?.id} not found or deleted`,
              );
            }

            if (cartItem.sku.stock < cartItem.quantity) {
              throw new BadRequestException(`Insufficient stock`);
            }

            totalAmount += cartItem.sku.price * cartItem.quantity;
          }

          // 4. Create order with ProductSKUSnapshots (linked to the shared payment)
          const order = await prisma.order.create({
            data: {
              userId: currentUserId,
              status: orderData.status,
              receiver: orderData.receiver,
              shopId: orderData.shopId,
              paymentId: payment.id, // Link to shared payment
              createdById: currentUserId,
              items: {
                create: orderCartItems.map((cartItem) => ({
                  quantity: cartItem.quantity,
                  skuId: cartItem.sku.id,
                  productId: cartItem.sku.productId,
                  productName: cartItem.sku.product.name,
                  skuPrice: cartItem.sku.price,
                  skuValue: cartItem.sku.value,
                  image: cartItem.sku.image,
                  productTranslations: cartItem.sku.product.productTranslations,
                })),
              },
              totalPrice: totalAmount,
            },
            include: {
              items: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  phoneNumber: true,
                },
              },
              payment: true,
              shop: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

          // 5. Update inventory (reduce stock) for this order

          for (const cartItem of orderCartItems) {
            const originalCartItem = allCartItems.find(
              (item) => item.skuId === cartItem.skuId,
            );

            await prisma.sKU.update({
              where: {
                id: cartItem.skuId,
                updatedAt: originalCartItem?.sku.updatedAt,
              },
              data: {
                stock: {
                  decrement: cartItem.quantity,
                },
              },
            });
          }

          // Add cancel order job for this order
          await this.queueService.addCancelOrderJob({
            orderId: order.id,
            userId: currentUserId,
          });

          createdOrders.push({
            ...order,
            totalAmount,
          });
        }

        // 6. Clear all user's cart items (after all orders are successfully created)
        await this.prisma.cartItem.deleteMany({
          where: {
            id: { in: allCartItemIds },
            userId: currentUserId,
          },
        });
      });
      lock.release();
      // Calculate total payment amount for all orders
      const totalPaymentAmount = createdOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0,
      );

      // Generate QR payment link for the total amount
      const qrPaymentLink = this.generateQRPaymentLink(
        totalPaymentAmount,
        payment.id.toString(),
      );

      return {
        orders: createdOrders,
        totalOrders: createdOrders.length,
        payment: {
          id: payment.id,
          status: payment.status,
          totalAmount: totalPaymentAmount,
          qrPaymentLink: qrPaymentLink,
        },
        message: `${createdOrders.length} order(s) created successfully with shared payment`,
      };
    });
  }

  async findAll(queryOrderDto: QueryOrderDto, currentUserId: number) {
    const { page, limit, status } = queryOrderDto;
    const skip = (page - 1) * limit;

    // Build where condition for shop orders
    const whereCondition: any = {
      shopId: currentUserId, // Only orders from current user's shop
      deletedAt: null,
    };

    // Apply optional filters
    if (status) {
      whereCondition.status = status;
    }

    const [totalItems, orders] = await Promise.all([
      this.prisma.order.count({
        where: whereCondition,
      }),
      this.prisma.order.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
              productName: true,
              skuPrice: true,
              skuValue: true,
              image: true,
              productTranslations: true,
              skuId: true,
              productId: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              content: true,
              productId: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    // Calculate summary statistics for the shop
    const statusCounts = await this.prisma.order.groupBy({
      by: ['status'],
      where: {
        shopId: currentUserId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const totalRevenue = await this.prisma.order.aggregate({
      where: {
        shopId: currentUserId,
        status: OrderStatus.DELIVERED,
        deletedAt: null,
      },
      _sum: {
        totalPrice: true,
      },
    });

    return {
      data: orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
      summary: {
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        totalOrders: totalItems,
      },
      message: 'Shop orders retrieved successfully',
    };
  }

  async findMyOrders(queryOrderDto: QueryOrderDto, currentUserId: number) {
    const { page, limit, status } = queryOrderDto;
    const skip = (page - 1) * limit;

    // Build where condition
    const whereCondition: any = {
      userId: currentUserId,
      deletedAt: null,
    };

    if (status) {
      whereCondition.status = status;
    }

    // Execute count and find operations concurrently
    const [totalItems, orders] = await Promise.all([
      this.prisma.order.count({
        where: whereCondition,
      }),
      this.prisma.order.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
              productName: true,
              skuPrice: true,
              skuValue: true,
              image: true,
              productTranslations: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviews: {
            where: {
              userId: currentUserId,
            },
            select: {
              id: true,
              rating: true,
              content: true,
              productId: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    return {
      data: orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
      message: 'Orders retrieved successfully',
    };
  }

  async findOne(id: number, currentUserId: number) {
    // Check if order exists and is not deleted
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            productName: true,
            skuPrice: true,
            skuValue: true,
            image: true,
            productTranslations: true,
            skuId: true,
            productId: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviews: {
          where: {
            userId: currentUserId,
          },
          select: {
            id: true,
            rating: true,
            content: true,
            productId: true,
            medias: {
              select: {
                id: true,
                url: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user has permission to view this order
    // Users can only view their own orders unless they are ADMIN or SELLER (shop owner)
    const hasPermission =
      order.userId === currentUserId || // Order owner
      order.shopId === currentUserId; // Shop owner

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    return {
      data: order,
      message: 'Order retrieved successfully',
    };
  }

  async updateStatus(id: number, status: OrderStatus, currentUserId: number) {
    // First, find the order and check if it exists
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        shop: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate user permission to update order status
    // Only the shop owner can update order status
    if (order.shopId !== currentUserId) {
      throw new ForbiddenException(
        'Only the shop owner can update order status',
      );
    }

    // Validate status transition rules
    const isValidTransition = this.isValidStatusTransition(
      order.status,
      status,
    );
    if (!isValidTransition) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${status}`,
      );
    }

    // Update the order status
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        updatedById: currentUserId,
      },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            productName: true,
            skuPrice: true,
            skuValue: true,
            image: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      data: updatedOrder,
      message: `Order status updated to ${status} successfully`,
    };
  }

  private isValidStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [
        OrderStatus.PENDING_PICKUP,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PENDING_PICKUP]: [
        OrderStatus.PENDING_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PENDING_DELIVERY]: [
        OrderStatus.DELIVERED,
        OrderStatus.RETURNED,
      ],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.RETURNED]: [], // No further transitions allowed
      [OrderStatus.CANCELLED]: [], // No further transitions allowed
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  async remove(id: number, currentUserId: number) {
    // TODO: Implement soft delete order logic
    // This will include:
    // - Check if order exists
    // - Validate user permissions
    // - Check if order can be deleted (business rules)
    // - Soft delete the order
    // - Update related entities if needed

    throw new Error('Order deletion logic not implemented yet');
  }

  async cancel(id: number, currentUserId: number) {
    return await this.prisma.$transaction(async (prisma) => {
      // Find the order with items for inventory restoration
      const order = await prisma.order.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
              skuId: true,
              productName: true,
              skuPrice: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Validate user permission to cancel order
      // Order can be cancelled by: order owner or shop owner
      const canCancel =
        order.userId === currentUserId || // Order owner
        order.shopId === currentUserId; // Shop owner

      if (!canCancel) {
        throw new ForbiddenException(
          'You do not have permission to cancel this order',
        );
      }

      // Check if order can be cancelled based on current status
      const cancellableStatuses: OrderStatus[] = [
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.PENDING_PICKUP,
      ];

      if (!cancellableStatuses.includes(order.status)) {
        throw new BadRequestException(
          `Order cannot be cancelled. Current status: ${order.status}. Only orders with status PENDING_PAYMENT or PENDING_PICKUP can be cancelled.`,
        );
      }

      // Update order status to CANCELLED
      const cancelledOrder = await prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          updatedById: currentUserId,
        },
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
              productName: true,
              skuPrice: true,
              skuValue: true,
              image: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Restore inventory for all order items
      await Promise.all(
        order.items.map(async (item) => {
          if (item.skuId) {
            await prisma.sKU.update({
              where: { id: item.skuId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }),
      );

      // Update payment status to FAILED if it was PENDING
      if (order.payment.status === 'PENDING') {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: {
            status: 'FAILED',
          },
        });
      }

      return {
        data: cancelledOrder,
        message: 'Order cancelled successfully. Inventory has been restored.',
        details: {
          restoredItems: order.items.length,
          refundStatus:
            order.payment.status === 'SUCCESS'
              ? 'REFUND_REQUIRED'
              : 'NO_REFUND_NEEDED',
        },
      };
    });
  }
}
