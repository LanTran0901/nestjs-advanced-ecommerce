import { Injectable, NotFoundException,  BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import {  UpdateCartItemDto, AddToCartDto, RemoveMultipleItemsDto } from './dto/cart.dto';
import { CartItemWithDetails } from 'src/types';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addToCart(addToCartDto: AddToCartDto, userId: number): Promise<CartItemWithDetails> {
    const { skuId, quantity } = addToCartDto;

    // Validate SKU and stock
    const sku = await this.validateSKUAndStock(skuId, quantity);

    // Check if cart item already exists
    const existingCartItem = await this.findCartItem(skuId, userId);

    if (existingCartItem) {
      // Update existing cart item
      const newQuantity = existingCartItem.quantity + quantity;
      
      // Validate total quantity against stock
      await this.validateSKUAndStock(skuId, newQuantity);

      const updatedCartItem = await this.prisma.cartItem.update({
        where: {
          userId_skuId: {
            userId,
            skuId,
          },
        },
        data: {
          quantity: newQuantity,
        },
        include: {
          sku: {
            include: {
              product: {
                include: {
                  brand: true,
                },
              },
            },
          },
        },
      });

      return updatedCartItem as CartItemWithDetails;
    } else {
      // Create new cart item
      const newCartItem = await this.prisma.cartItem.create({
        data: {
          skuId,
          userId,
          quantity,
        },
        include: {
          sku: {
            include: {
              product: {
                include: {
                  brand: true,
                },
              },
            },
          },
        },
      });

      return newCartItem as CartItemWithDetails;
    }
  }

  async getCart(userId: number) {
    // Get all cart items for the user with details
    const cartItems = await this.getCartItemsWithDetails(userId);
    
    // Calculate cart summary
    const summary = await this.calculateCartSummary(userId);

    return {
      totalItems: summary.totalItems,
      totalAmount: summary.totalAmount,
      items: cartItems,
    };
  }

  async updateCartItem(skuId: number, updateCartItemDto: UpdateCartItemDto, userId: number) {
    const { quantity } = updateCartItemDto;

    // Find existing cart item
    const existingCartItem = await this.findCartItem(skuId, userId);
    
    if (!existingCartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Validate SKU and stock for new quantity
    await this.validateSKUAndStock(skuId, quantity);

    // Update cart item
    const updatedCartItem = await this.prisma.cartItem.update({
      where: {
        userId_skuId: {
          userId,
          skuId,
        },
      },
      data: {
        quantity,
      },
      include: {
        sku: {
          include: {
            product: {
              include: {
                brand: true,
              },
            },
          },
        },
      },
    });

    return updatedCartItem as CartItemWithDetails;
  }

  async removeFromCart(skuId: number, userId: number) {
    // Check if cart item exists
    const existingCartItem = await this.findCartItem(skuId, userId);
    
    if (!existingCartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Delete the cart item
    await this.prisma.cartItem.delete({
      where: {
        userId_skuId: {
          userId,
          skuId,
        },
      },
    });
  }

  async clearCart(userId: number) {
    // Delete all cart items for the user
    await this.prisma.cartItem.deleteMany({
      where: {
        userId,
      },
    });
  }

  async removeMultipleItems(removeMultipleItemsDto: RemoveMultipleItemsDto, userId: number) {
    const { productIds } = removeMultipleItemsDto;
    await this.prisma.cartItem.deleteMany({
        where: {
          id: {
            in: productIds,
          },
          userId
        },
      });
    
  }
  // Helper methods (to be implemented)
  private async validateSKUAndStock(skuId: number, quantity: number) {
    // Find SKU and check if it exists
    const sku = await this.prisma.sKU.findFirst({
      where: {
        id: skuId,
        deletedAt: null,
        product: {
          deletedAt: null,
        },
      },
    });

    if (!sku) {
      throw new NotFoundException('SKU not found or product has been deleted');
    }

    // Check stock availability
    if (sku.stock < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${sku.stock}, Requested: ${quantity}`);
    }

    return sku;
  }

  private async findCartItem(skuId: number, userId: number) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_skuId: {
          userId,
          skuId,
        },
      },
      include: {
        sku: {
          include: {
            product: {
              include: {
                brand: true,
              },
            },
          },
        },
      },
    });

    return cartItem as CartItemWithDetails | null;
  }

  private async calculateCartSummary(userId: number) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: {
        userId,
      },
      include: {
        sku: true,
      },
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.quantity * item.sku.price), 0);

    return {
      totalItems,
      totalAmount,
    };
  }

  private async getCartItemsWithDetails(userId: number) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: {
        userId,
        sku: {
          deletedAt: null,
          product: {
            deletedAt: null,
          },
        },
      },
      include: {
        sku: true,
        user: true
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const groupedByShop = new Map<number,any>();
    
    for (let item of cartItems) {
      const shopId = item.userId; 
      const shopName = item.user.name; 
      if (!groupedByShop.has(shopId)) {
        groupedByShop.set(shopId, {
          shopId,
          shopName,
          items: []
        });
      }
      groupedByShop.get(shopId).items.push({
        id: item.id,
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        sku: item.sku,
        subtotal: item.quantity * item.sku.price
      });
    }
    return Object.fromEntries(groupedByShop);
  }
}