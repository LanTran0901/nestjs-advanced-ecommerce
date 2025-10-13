import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { S3Service } from 'src/common/services/s3.service';
import { CreateProductDto, UpdateProductDto, FilterProductsDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
    userId: number,
  ) {
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const uploadResult = await this.s3Service.uploadImage(file);
        imageUrls.push(uploadResult);
      }
    }
    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        basePrice: createProductDto.basePrice,
        virtualPrice: createProductDto.virtualPrice,
        brandId: createProductDto.brandId,
        images: imageUrls,
        variants: createProductDto.variants,
        publishedAt: createProductDto.publishedAt,
        createdById: userId,
        categories: {
          connect: createProductDto.categoryIds.map((id) => ({ id })),
        },

        skus: {
          create: createProductDto.skus.map((sku) => ({
            value: sku.value,
            price: sku.price,
            stock: sku.stock,
            image: sku.image,
            createdById: userId,
          })),
        },
      },
      include: {
        brand: true,
        categories: true,
        skus: true,
        productTranslations: true,
      },
    });

    return {
      message: 'Product created successfully',
      product,
    };
  }

  async findAll(filterDto: FilterProductsDto) {
    const { page, limit, minPrice, maxPrice, brandIds, categoryIds, search } = filterDto;
    const skip = (page - 1) * limit;

    // Build where condition
    const whereCondition: any = {
      deletedAt: null,
    };

    // Price filter - check SKU prices
    if (minPrice || maxPrice) {
      whereCondition.skus = {
        some: {
          deletedAt: null,
          price: {
            ...(minPrice && { gte: minPrice }),
            ...(maxPrice && { lte: maxPrice }),
          },
        },
      };
    }

    // Brand filter
    if (brandIds && brandIds.length > 0) {
      whereCondition.brandId = {
        in: brandIds,
      };
    }

    // Category filter
    if (categoryIds && categoryIds.length > 0) {
      whereCondition.categories = {
        some: {
          id: {
            in: categoryIds,
          },
          deletedAt: null,
        },
      };
    }

    // Search filter
    if (search) {
      whereCondition.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          productTranslations: {
            some: {
              deletedAt: null,
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereCondition,
        skip,
        take: limit,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          categories: {
            where: {
              deletedAt: null,
            },
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          skus: {
            where: {
              deletedAt: null,
            },
            select: {
              id: true,
              value: true,
              price: true,
              stock: true,
              image: true,
            },
            orderBy: {
              price: 'asc',
            },
          },
          productTranslations: {
            where: {
              deletedAt: null,
            },
            select: {
              id: true,
              languageId: true,
              name: true,
              description: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              content: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({
        where: whereCondition,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);


    return {
      message: 'Products retrieved successfully',
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
      },
    };
  }

  async findOne(id: number, languageId?: string) {
    const whereCondition: any = {
      deletedAt: null,
    };

    // If languageId is provided, filter translations by that language
    if (languageId) {
      whereCondition.id = languageId;
    }

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            logo: true,
            parentCategoryId: true,
          },
        },
        skus: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            value: true,
            price: true,
            stock: true,
            image: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        productTranslations: {
          where: languageId ? {
            deletedAt: null,
            languageId: languageId,
          } : {
            deletedAt: null,
          },
          select: {
            name: true,
            description: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            medias: {
              select: {
                id: true,
                url: true,
                type: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Calculate average rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
          product.reviews.length
        : 0;

    return {
      message: 'Product retrieved successfully',
      data: {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10, 
        totalReviews: product.reviews.length,
      },
    };
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    files: Express.Multer.File[],
    userId: number,
  ) {
    const imageUrls: string[] = [];

    // First check if product exists and is not deleted
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        skus: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    if (files && files.length > 0) {
      for (const file of files) {
        const uploadResult = await this.s3Service.uploadImage(file);
        imageUrls.push(uploadResult);
      }
    }

    let { skus, categoryIds, images, ...updateData } = updateProductDto;
    const updatedProduct = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { ...updateData, updatedById: userId,categories: {
            //delete all then overwrite again
            set: [],
            connect: updateProductDto?.categoryIds?.map((categoryId) => ({
              id: categoryId,
            })),
          },
          images: {
            set: [...(images || []), ...imageUrls],
          },},
      });

      let existingSkus = await tx.sKU.findMany({
        where: { productId: id },
      });
      let skuIdsToCreate = skus?.filter((sku) => {
        // check 1 new sku different from all current ones
        return existingSkus.every((item) => item.value != sku.value);
      });
      let skusToDelete = existingSkus
        ?.filter((sku) => {
          return skus?.every((item) => item.value != sku.value);
        })
        .map((item) => item.id);

      let skusToUpdate = skus
        ?.filter((sku) => {
          return existingSkus.some((item) => item.value == sku.value);
        })
        .map((item) => {
          let foundId = existingSkus.find((x) => x.value == item.value)?.id;
          return { ...item, id: foundId };
        });

      await tx.sKU.createMany({
        data:
          skuIdsToCreate?.map((sku) => ({
            value: sku.value,
            price: sku.price,
            stock: sku.stock,
            image: sku.image,
            productId: id,
            createdById: userId,
          })) || [],
      });
      await Promise.all(
        skusToUpdate?.map(async (item) => {
          await tx.sKU.update({
            where: { id: item.id, productId: id },
            data: { ...item },
          });
        }) || [],
      );
      await tx.sKU.updateMany({
        where: {
          id: { in: skusToDelete },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          deletedById: userId,
        },
      });

      return await tx.product.findUnique({
        where: { id },
        include: {
          brand: true,
          categories: true,
          skus: {
            where: {
              deletedAt: null,
            },
          },
          productTranslations: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
    });

    return {
      message: 'Product updated successfully',
      data: updatedProduct,
    };
  }

  async remove(id: number, userId: number) {
    // First check if product exists and is not already deleted
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found or already deleted');
    }

    // Soft delete the product and its related SKUs
    const deletedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Soft delete all related SKUs
      await tx.sKU.updateMany({
        where: {
          productId: id,
          deletedAt: null,
        },
        data: {
          deletedAt,
          deletedById: userId,
        },
      });

      // Soft delete product translations
      await tx.productTranslation.updateMany({
        where: {
          productId: id,
          deletedAt: null,
        },
        data: {
          deletedAt,
          deletedById: userId,
        },
      });

      // Soft delete the product
      await tx.product.update({
        where: { id },
        data: {
          deletedAt,
          deletedById: userId,
        },
      });
    });

    return {
      message: 'Product deleted successfully',
      data: {
        id,
        deletedAt,
      },
    };
  }

  async getFilterOptions() {
    // Get available brands
    const brands = await this.prisma.brand.findMany({
      where: {
        deletedAt: null,
        products: {
          some: {
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        name: true,
        logo: true,
        _count: {
          select: {
            products: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get available categories
    const categories = await this.prisma.category.findMany({
      where: {
        deletedAt: null,
        products: {
          some: {
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        name: true,
        logo: true,
        parentCategoryId: true,
        _count: {
          select: {
            products: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get price range
    const priceRange = await this.prisma.sKU.aggregate({
      where: {
        deletedAt: null,
        product: {
          deletedAt: null,
        },
      },
      _min: {
        price: true,
      },
      _max: {
        price: true,
      },
    });

    return {
      message: 'Filter options retrieved successfully',
      data: {
        brands: brands.map((brand) => ({
          ...brand,
          productCount: brand._count.products,
          _count: undefined,
        })),
        categories: categories.map((category) => ({
          ...category,
          productCount: category._count.products,
          _count: undefined,
        })),
        priceRange: {
          min: priceRange._min.price || 0,
          max: priceRange._max.price || 0,
        },
      },
    };
  }
}
