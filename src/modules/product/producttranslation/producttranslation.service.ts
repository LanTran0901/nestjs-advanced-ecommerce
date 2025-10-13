import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateProductTranslationDto, UpdateProductTranslationDto } from './dto/producttranslation.dto';

@Injectable()
export class ProductTranslationService {
  constructor(private prisma: PrismaService) {}

  async create(createProductTranslationDto: CreateProductTranslationDto, userId: number) {
    // Check if product exists
    const product = await this.prisma.product.findFirst({
      where: { 
        id: createProductTranslationDto.productId,
        deletedAt: null
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${createProductTranslationDto.productId} not found`);
    }

    // Check if language exists
    const language = await this.prisma.language.findFirst({
      where: { 
        id: createProductTranslationDto.languageId,
        deletedAt: null
      },
    });

    if (!language) {
      throw new NotFoundException(`Language with ID ${createProductTranslationDto.languageId} not found`);
    }

    // Check if translation already exists for this product and language
    const existingTranslation = await this.prisma.productTranslation.findFirst({
      where: { 
        productId: createProductTranslationDto.productId,
        languageId: createProductTranslationDto.languageId,
        deletedAt: null
      },
    });

    if (existingTranslation) {
      throw new ConflictException(`Translation for product ID ${createProductTranslationDto.productId} and language ID ${createProductTranslationDto.languageId} already exists`);
    }

    // Create the translation
    const translation = await this.prisma.productTranslation.create({
      data: {
        ...createProductTranslationDto,
        createdById: userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            virtualPrice: true
          }
        },
        language: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return translation;
  }

  async findAll(query: { 
    includeDeleted?: boolean; 
    productId?: number;
    languageId?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { 
      includeDeleted = false, 
      productId,
      languageId, 
      search, 
      page = 1, 
      limit = 10 
    } = query;

    // Build where clause
    const where: any = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (productId) {
      where.productId = productId;
    }

    if (languageId) {
      where.languageId = languageId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Get total count
    const total = await this.prisma.productTranslation.count({ where });

    // Get translations
    const translations = await this.prisma.productTranslation.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            virtualPrice: true
          }
        },
        language: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    });

    return {
      data: translations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async findOne(id: number) {
    const translation = await this.prisma.productTranslation.findFirst({
      where: { 
        id,
        deletedAt: null
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            virtualPrice: true
          }
        },
        language: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!translation) {
      throw new NotFoundException(`Product translation with ID ${id} not found`);
    }

    return translation;
  }

  async findByProductAndLanguage(productId: number, languageId: string) {
    const translation = await this.prisma.productTranslation.findFirst({
      where: { 
        productId,
        languageId,
        deletedAt: null
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            virtualPrice: true
          }
        },
        language: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!translation) {
      throw new NotFoundException(`Product translation not found for product ID ${productId} and language ID ${languageId}`);
    }

    return translation;
  }

  async findTranslationsByProduct(productId: number) {
    // Check if product exists
    const product = await this.prisma.product.findFirst({
      where: { 
        id: productId,
        deletedAt: null
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const translations = await this.prisma.productTranslation.findMany({
      where: { 
        productId,
        deletedAt: null
      },
      include: {
        language: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return translations;
  }

  async update(id: number, updateProductTranslationDto: UpdateProductTranslationDto, userId: number) {
    // Check if translation exists
    const existingTranslation = await this.prisma.productTranslation.findFirst({
      where: { 
        id,
        deletedAt: null
      }
    });

    if (!existingTranslation) {
      throw new NotFoundException(`Product translation with ID ${id} not found`);
    }

    // Update the translation
    const translation = await this.prisma.productTranslation.update({
      where: { id },
      data: {
        ...updateProductTranslationDto,
        updatedById: userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            virtualPrice: true
          }
        },
        language: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return translation;
  }

  async updateByProductAndLanguage(productId: number, languageId: string, updateProductTranslationDto: UpdateProductTranslationDto, userId: number) {
    // Check if translation exists
    const existingTranslation = await this.prisma.productTranslation.findFirst({
      where: { 
        productId,
        languageId,
        deletedAt: null
      }
    });

    if (!existingTranslation) {
      throw new NotFoundException(`Product translation not found for product ID ${productId} and language ID ${languageId}`);
    }

    // Update the translation
    const translation = await this.prisma.productTranslation.update({
      where: { id: existingTranslation.id },
      data: {
        ...updateProductTranslationDto,
        updatedById: userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            virtualPrice: true
          }
        },
        language: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return translation;
  }

  async remove(id: number, userId: number) {
    // Check if translation exists
    const existingTranslation = await this.prisma.productTranslation.findFirst({
      where: { 
        id,
        deletedAt: null
      }
    });

    if (!existingTranslation) {
      throw new NotFoundException(`Product translation with ID ${id} not found`);
    }

    // Soft delete the translation
    const translation = await this.prisma.productTranslation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            virtualPrice: true
          }
        },
        language: {
          select: {
            id: true,
            name: true
          }
        },
        deletedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return translation;
  }

  async removeByProductAndLanguage(productId: number, languageId: string, userId: number) {
    // Check if translation exists
    const existingTranslation = await this.prisma.productTranslation.findFirst({
      where: { 
        productId,
        languageId,
        deletedAt: null
      }
    });

    if (!existingTranslation) {
      throw new NotFoundException(`Product translation not found for product ID ${productId} and language ID ${languageId}`);
    }

    // Soft delete the translation
    const translation = await this.prisma.productTranslation.update({
      where: { id: existingTranslation.id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            virtualPrice: true
          }
        },
        language: {
          select: {
            id: true,
            name: true
          }
        },
        deletedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return translation;
  }

  async restore(id: number, userId: number) {
    // Check if translation exists and is deleted
    const existingTranslation = await this.prisma.productTranslation.findFirst({
      where: { 
        id,
        deletedAt: { not: null }
      }
    });

    if (!existingTranslation) {
      throw new NotFoundException(`Deleted product translation with ID ${id} not found`);
    }

    // Restore the translation
    const translation = await this.prisma.productTranslation.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            virtualPrice: true
          }
        },
        language: {
          select: {
            id: true,
            name: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return translation;
  }
}