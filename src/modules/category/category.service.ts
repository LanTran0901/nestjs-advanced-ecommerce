import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { S3Service } from 'src/common/services/s3.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService, private readonly s3Service: S3Service) {}

  async create(createCategoryDto: CreateCategoryDto & {logoFile?: Express.Multer.File}, userId: number) {
    // Check if parent category exists (if provided)
    if (createCategoryDto.parentCategoryId) {
      const parentCategory = await this.prisma.category.findFirst({
        where: { 
          id: createCategoryDto.parentCategoryId,
          deletedAt: null
        },
      });

      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${createCategoryDto.parentCategoryId} not found`);
      }

      // Check if parent category is already a child (only 2 levels allowed)
      if (parentCategory.parentCategoryId !== null) {
        throw new BadRequestException('Cannot create more than 2 levels of categories. The selected parent is already a child category.');
      }
    }

    // Check if category with same name already exists at the same level
    const existingCategory = await this.prisma.category.findFirst({
      where: { 
        name: createCategoryDto.name,
        parentCategoryId: createCategoryDto.parentCategoryId || null,
        deletedAt: null
      },
    });

    if (existingCategory) {
      throw new ConflictException(`Category with name "${createCategoryDto.name}" already exists at this level`);
    }

    // Handle file upload
    let categoryImageUrl = '';
    if (createCategoryDto.logoFile) {
      categoryImageUrl = await this.s3Service.uploadImage(createCategoryDto.logoFile);
    }

    // Prepare create data
    const { logoFile, ...categoryData } = createCategoryDto;

    // Create the new category
    const category = await this.prisma.category.create({
      data: {
        ...categoryData,
        logo: categoryImageUrl,
        createdById: userId,
      },
      include: {
        parentCategory: {
          select: {
            id: true,
            name: true
          }
        },
        childrenCategories: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
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
            childrenCategories: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    return category;
  }

  async findAll(query: { 
    includeDeleted?: boolean; 
    parentId?: number;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { includeDeleted = false, parentId, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    
    if (parentId !== undefined) {
      where.parentCategoryId = parentId;
    }
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: {
          parentCategory: {
            select: {
              id: true,
              name: true
            }
          },
          childrenCategories: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              logo: true
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
          },
          _count: {
            select: {
              products: true,
              childrenCategories: {
                where: { deletedAt: null }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.category.count({ where })
    ]);

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findFirst({
      where: { 
        id,
        deletedAt: null
      },
      include: {
        parentCategory: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        childrenCategories: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            logo: true,
            _count: {
              select: {
                products: true,
                childrenCategories: {
                  where: { deletedAt: null }
                }
              }
            }
          }
        },
        products: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            basePrice: true
          },
          take: 5 // Limit to first 5 products
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
        },
        _count: {
          select: {
            products: true,
            childrenCategories: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto & {logoFile?: Express.Multer.File}, userId: number) {
    // Check if category exists
    const existingCategory = await this.findOne(id);
    
    // Prevent setting self as parent
    if (updateCategoryDto.parentCategoryId === id) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    // Check if parent category exists (if provided)
    if (updateCategoryDto.parentCategoryId) {
      const parentCategory = await this.prisma.category.findFirst({
        where: { 
          id: updateCategoryDto.parentCategoryId,
          deletedAt: null
        },
      });

      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${updateCategoryDto.parentCategoryId} not found`);
      }

     
      // If the current category has children, prevent making it a child
      const childrenCount = await this.prisma.category.count({
        where: {
          parentCategoryId: id,
          deletedAt: null
        }
      });

      if (childrenCount > 0) {
        throw new BadRequestException('Cannot make a parent category into a child category. This category has child categories that need to be handled first.');
      }
    }

    
    // Handle file upload
    let categoryImageUrl = existingCategory.logo;
    if (updateCategoryDto.logoFile) {
      categoryImageUrl = await this.s3Service.uploadImage(updateCategoryDto.logoFile);
    }

    // Prepare update data
    const { logoFile, ...updateData } = updateCategoryDto;
    
    // Update the category
    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...updateData,
        logo: categoryImageUrl,
        updatedById: userId,
      },
      include: {
        parentCategory: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        childrenCategories: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            logo: true
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
        },
        _count: {
          select: {
            products: true,
            childrenCategories: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    return category;
  }

  async remove(id: number, userId: number) {
    // Check if category exists
    const category = await this.findOne(id);
    
    // Check if category has products
    const productsCount = await this.prisma.product.count({
      where: { 
        categories: {
          some: {
            id: id
          }
        },
        deletedAt: null
      }
    });

    if (productsCount > 0) {
      throw new ConflictException(`Cannot delete category with ${productsCount} active products. Please move or delete the products first.`);
    }

    // Get all children categories to check for products
    const childrenCategories = await this.prisma.category.findMany({
      where: {
        parentCategoryId: id,
        deletedAt: null
      }
    });

    

    // Delete all children categories first
    if (childrenCategories.length > 0) {
      await this.prisma.category.updateMany({
        where: {
          parentCategoryId: id,
          deletedAt: null
        },
        data: {
          deletedById: userId,
          deletedAt: new Date(),
        }
      });
    }

    // Delete the parent category
    await this.prisma.category.update({
      where: { id },
      data: {
        deletedById: userId,
        deletedAt: new Date(),
      }
    });

    const deletedCount = childrenCategories.length + 1;
    return { 
      message: `Category deleted successfully. ${deletedCount} categories were deleted (1 parent + ${childrenCategories.length} children).`
    };
  }

  async permanentDelete(id: number) {
    // Check if category exists
    const category = await this.findOne(id);
    
    // Get all children categories
    const childrenCategories = await this.prisma.category.findMany({
      where: {
        parentCategoryId: id
      },
      select: {
        id: true,
        name: true
      }
    });

    // Delete all children categories first (permanent deletion)
    if (childrenCategories.length > 0) {
      await this.prisma.category.deleteMany({
        where: {
          parentCategoryId: id
        }
      });
    }

    // Delete the parent category
    await this.prisma.category.delete({
      where: { id },
    });

    const deletedCount = childrenCategories.length + 1;
    return { 
      message: `Category permanently deleted successfully. ${deletedCount} categories were permanently deleted (1 parent + ${childrenCategories.length} children).`
    };
  }

  async restore(id: number, userId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (!category.deletedAt) {
      throw new ConflictException(`Category with ID ${id} is not deleted`);
    }

    const restoredCategory = await this.prisma.category.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: userId,
      },
      include: {
        parentCategory: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        childrenCategories: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            logo: true
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
        },
        _count: {
          select: {
            products: true,
            childrenCategories: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    return restoredCategory;
  }

  async getTree() {
    // Get all root categories (no parent) with their children (2 levels only)
    const rootCategories = await this.prisma.category.findMany({
      where: { 
        parentCategoryId: null,
        deletedAt: null
      },
      include: {
        childrenCategories: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            logo: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                products: true
              }
            }
          },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: {
            products: true,
            childrenCategories: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return rootCategories;
  }

  
  async getParentCategories() {
    const parentCategories = await this.prisma.category.findMany({
      where: {
        parentCategoryId: null,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        logo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            childrenCategories: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return parentCategories;
  }

  
  async getChildCategories(parentId: number) {
    // Verify parent exists
    const parent = await this.prisma.category.findFirst({
      where: {
        id: parentId,
        parentCategoryId: null, // Ensure it's a parent category
        deletedAt: null
      }
    });

    if (!parent) {
      throw new NotFoundException(`Parent category with ID ${parentId} not found`);
    }

    const childCategories = await this.prisma.category.findMany({
      where: {
        parentCategoryId: parentId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        logo: true,
        createdAt: true,
        updatedAt: true,
        parentCategory: {
          select: {
            id: true,
            name: true
          }
        },
         _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return childCategories;
  }
}