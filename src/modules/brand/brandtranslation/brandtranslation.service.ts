import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateBrandTranslationDto, UpdateBrandTranslationDto } from './dto/brandtranslation.dto';

@Injectable()
export class BrandTranslationService {
  constructor(private prisma: PrismaService) {}

  async create(createBrandTranslationDto: CreateBrandTranslationDto, userId: number) {
    // Check if brand exists
    const brand = await this.prisma.brand.findFirst({
      where: { 
        id: createBrandTranslationDto.brandId,
        deletedAt: null
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${createBrandTranslationDto.brandId} not found`);
    }

    // Check if language exists
    const language = await this.prisma.language.findFirst({
      where: { 
        id: createBrandTranslationDto.languageId,
        deletedAt: null
      },
    });

    if (!language) {
      throw new NotFoundException(`Language with ID ${createBrandTranslationDto.languageId} not found`);
    }

    // Check if translation already exists for this brand and language
    const existingTranslation = await this.prisma.brandTranslation.findFirst({
      where: { 
        brandId: createBrandTranslationDto.brandId,
        languageId: createBrandTranslationDto.languageId,
        deletedAt: null
      },
    });

    if (existingTranslation) {
      throw new ConflictException(`Translation for brand ID ${createBrandTranslationDto.brandId} and language ID ${createBrandTranslationDto.languageId} already exists`);
    }

    // Create the translation
    const translation = await this.prisma.brandTranslation.create({
      data: {
        ...createBrandTranslationDto,
        createdById: userId,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true
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
    brandId?: number;
    languageId?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { 
      includeDeleted = false, 
      brandId,
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

    if (brandId) {
      where.brandId = brandId;
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
    const total = await this.prisma.brandTranslation.count({ where });

    // Get translations
    const translations = await this.prisma.brandTranslation.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true
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
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  async findOne(id: number) {
    const translation = await this.prisma.brandTranslation.findFirst({
      where: { 
        id,
        deletedAt: null
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true
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
      throw new NotFoundException(`Brand translation with ID ${id} not found`);
    }

    return translation;
  }

  async findByBrandAndLanguage(brandId: number, languageId: string) {
    const translation = await this.prisma.brandTranslation.findFirst({
      where: { 
        brandId,
        languageId,
        deletedAt: null
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true
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
      throw new NotFoundException(`Brand translation not found for brand ID ${brandId} and language ID ${languageId}`);
    }

    return translation;
  }

  async findTranslationsByBrand(brandId: number) {
    // Check if brand exists
    const brand = await this.prisma.brand.findFirst({
      where: { 
        id: brandId,
        deletedAt: null
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${brandId} not found`);
    }

    const translations = await this.prisma.brandTranslation.findMany({
      where: { 
        brandId,
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

  async update(id: number, updateBrandTranslationDto: UpdateBrandTranslationDto, userId: number) {
    // Check if translation exists
    const existingTranslation = await this.prisma.brandTranslation.findFirst({
      where: { 
        id,
        deletedAt: null
      }
    });

    if (!existingTranslation) {
      throw new NotFoundException(`Brand translation with ID ${id} not found`);
    }

    // Update the translation
    const translation = await this.prisma.brandTranslation.update({
      where: { id },
      data: {
        ...updateBrandTranslationDto,
        updatedById: userId,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true
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

  async updateByBrandAndLanguage(brandId: number, languageId: string, updateBrandTranslationDto: UpdateBrandTranslationDto, userId: number) {
    // Check if translation exists
    const existingTranslation = await this.prisma.brandTranslation.findFirst({
      where: { 
        brandId,
        languageId,
        deletedAt: null
      }
    });

    if (!existingTranslation) {
      throw new NotFoundException(`Brand translation not found for brand ID ${brandId} and language ID ${languageId}`);
    }

    // Update the translation
    const translation = await this.prisma.brandTranslation.update({
      where: { id: existingTranslation.id },
      data: {
        ...updateBrandTranslationDto,
        updatedById: userId,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true
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
    const existingTranslation = await this.prisma.brandTranslation.findFirst({
      where: { 
        id,
        deletedAt: null
      }
    });

    if (!existingTranslation) {
      throw new NotFoundException(`Brand translation with ID ${id} not found`);
    }

    // Soft delete the translation
    const translation = await this.prisma.brandTranslation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true
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

  async removeByBrandAndLanguage(brandId: number, languageId: string, userId: number) {
    // Check if translation exists
    const existingTranslation = await this.prisma.brandTranslation.findFirst({
      where: { 
        brandId,
        languageId,
        deletedAt: null
      }
    });

    if (!existingTranslation) {
      throw new NotFoundException(`Brand translation not found for brand ID ${brandId} and language ID ${languageId}`);
    }

    // Soft delete the translation
    const translation = await this.prisma.brandTranslation.update({
      where: { id: existingTranslation.id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true
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
    // Check if translation exists (including deleted ones)
    const existingTranslation = await this.prisma.brandTranslation.findFirst({
      where: { 
        id,
        deletedAt: { not: null }
      }
    });

    if (!existingTranslation) {
      throw new NotFoundException(`Deleted brand translation with ID ${id} not found`);
    }

    // Check if there's already an active translation for the same brand and language
    const activeTranslation = await this.prisma.brandTranslation.findFirst({
      where: {
        brandId: existingTranslation.brandId,
        languageId: existingTranslation.languageId,
        deletedAt: null
      }
    });

    if (activeTranslation) {
      throw new ConflictException(`An active translation already exists for this brand and language combination`);
    }

    // Restore the translation
    const translation = await this.prisma.brandTranslation.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: userId,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true
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