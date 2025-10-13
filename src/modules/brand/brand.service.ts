import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateBrandDto, UpdateBrandDto, CreateBrandTranslationDto, UpdateBrandTranslationDto } from './dto/brand.dto';
import { S3Service } from 'src/common/services/s3.service';

@Injectable()
export class BrandService {
  constructor(
    private prisma: PrismaService, 
    private readonly s3Service: S3Service
  ) {}

  async create(createBrandDto: CreateBrandDto & {logoFile?: Express.Multer.File}, userId: number) {
    // Check if brand with same name already exists
    const existingBrand = await this.prisma.brand.findFirst({
      where: { 
        name: createBrandDto.name,
        deletedAt: null
      },
    });

    if (existingBrand) {
      throw new ConflictException(`Brand with name "${createBrandDto.name}" already exists`);
    }

    // Handle file upload
    let brandLogoUrl = '';
    if (createBrandDto.logoFile) {
      brandLogoUrl = await this.s3Service.uploadImage(createBrandDto.logoFile);
    }

    // Prepare create data
    const { logoFile, ...brandData } = createBrandDto;

    // Create the new brand
    const brand = await this.prisma.brand.create({
      data: {
        ...brandData,
        logo: brandLogoUrl,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            products: true,
            brandTranslations: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    return brand;
  }

  async findAll(query: { 
    includeDeleted?: boolean; 
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { 
      includeDeleted = false, 
      search, 
      page = 1, 
      limit = 10 
    } = query;

    // Build where clause
    const where: any = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Get total count
    const total = await this.prisma.brand.count({ where });

    // Get brands
    const brands = await this.prisma.brand.findMany({
      where,
      include: {
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
        },
        _count: {
          select: {
            products: true,
            brandTranslations: {
              where: { deletedAt: null }
            }
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
      data: brands,
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
    const brand = await this.prisma.brand.findFirst({
      where: { 
        id,
        deletedAt: null
      },
      include: {
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
        },
        brandTranslations: {
          where: { deletedAt: null },
          include: {
            language: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            products: true,
            brandTranslations: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async update(id: number, updateBrandDto: UpdateBrandDto & {logoFile?: Express.Multer.File}, userId: number) {
    // Check if brand exists
    const existingBrand = await this.prisma.brand.findFirst({
      where: { 
        id,
        deletedAt: null
      }
    });

    if (!existingBrand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    // Check if brand with same name already exists (excluding current brand)
    if (updateBrandDto.name) {
      const duplicateBrand = await this.prisma.brand.findFirst({
        where: { 
          name: updateBrandDto.name,
          deletedAt: null,
          NOT: { id }
        },
      });

      if (duplicateBrand) {
        throw new ConflictException(`Brand with name "${updateBrandDto.name}" already exists`);
      }
    }

    // Handle file upload
    let brandLogoUrl = existingBrand.logo;
    if (updateBrandDto.logoFile) {
      brandLogoUrl = await this.s3Service.uploadImage(updateBrandDto.logoFile);
    }

    // Prepare update data
    const { logoFile, ...brandData } = updateBrandDto;

    // Update the brand
    const brand = await this.prisma.brand.update({
      where: { id },
      data: {
        ...brandData,
        logo: brandLogoUrl,
        updatedById: userId,
      },
      include: {
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
        },
        _count: {
          select: {
            products: true,
            brandTranslations: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    return brand;
  }

  async remove(id: number, userId: number) {
    // Check if brand exists
    const existingBrand = await this.prisma.brand.findFirst({
      where: { 
        id,
        deletedAt: null
      }
    });

    if (!existingBrand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    // Soft delete the brand
    const brand = await this.prisma.brand.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
      include: {
        deletedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return brand;
  }

  async restore(id: number, userId: number) {
    // Check if brand exists (including deleted ones)
    const existingBrand = await this.prisma.brand.findFirst({
      where: { 
        id,
        deletedAt: { not: null }
      }
    });

    if (!existingBrand) {
      throw new NotFoundException(`Deleted brand with ID ${id} not found`);
    }

    // Check if there's already an active brand with the same name
    const activeBrand = await this.prisma.brand.findFirst({
      where: {
        name: existingBrand.name,
        deletedAt: null
      }
    });

    if (activeBrand) {
      throw new ConflictException(`An active brand with the same name already exists`);
    }

    // Restore the brand
    const brand = await this.prisma.brand.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: userId,
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return brand;
  }

  // Brand Translation Methods
  async createTranslation(createBrandTranslationDto: CreateBrandTranslationDto, userId: number) {
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

  async findTranslations(brandId: number) {
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

  async updateTranslation(brandId: number, languageId: string, updateBrandTranslationDto: UpdateBrandTranslationDto, userId: number) {
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

  async removeTranslation(brandId: number, languageId: string, userId: number) {
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
}
