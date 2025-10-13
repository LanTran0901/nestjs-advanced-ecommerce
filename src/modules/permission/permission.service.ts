import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import { JwtPayload, UserRole } from 'src/types';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto, userId: number) {
    // Check if permission with same path and method already exists
    const existingPermission = await this.prisma.permission.findUnique({
      where: { 
        path_method: {
          path: createPermissionDto.path,
          method: createPermissionDto.method
        }
      },
    });

    if (existingPermission) {
      throw new ConflictException(`Permission with path ${createPermissionDto.path} and method ${createPermissionDto.method} already exists`);
    }

    // Prepare the data for creation
    const { roleIds, ...permissionData } = createPermissionDto;
    
    // Create the new permission
    const permission = await this.prisma.permission.create({
      data: {
        ...permissionData,
        createdById: userId,
        ...(roleIds && roleIds.length > 0 && {
          roles: {
            connect: roleIds.map(id => ({ id }))
          }
        })
      },
      include: {
        roles: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return permission;
  }

  async findAll(query: { 
    includeDeleted?: boolean; 
    module?: string; 
    method?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { includeDeleted = false, module, method, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    
    if (module) {
      where.module = {
        contains: module,
        mode: 'insensitive'
      };
    }
    
    if (method) {
      where.method = method;
    }

    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        include: {
          roles: true,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.permission.count({ where })
    ]);

    return {
      data: permissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: number) {
    const permission = await this.prisma.permission.findFirst({
      where: { 
        id,
        deletedAt: null
      },
      include: {
        roles: true,
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

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    
    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto, userId: number) {
    // Check if permission exists
    const existingPermission = await this.findOne(id);
    
    // If path or method is being updated, check for conflicts
    if (updatePermissionDto.path || updatePermissionDto.method) {
      const path = updatePermissionDto.path || existingPermission.path;
      const method = updatePermissionDto.method || existingPermission.method;
      
      const conflictingPermission = await this.prisma.permission.findUnique({
        where: { 
          path_method: { path, method }
        },
      });

      if (conflictingPermission && conflictingPermission.id !== id) {
        throw new ConflictException(`Permission with path ${path} and method ${method} already exists`);
      }
    }

    const { roleIds, ...permissionData } = updatePermissionDto;
    
    // Update the permission
    const permission = await this.prisma.permission.update({
      where: { id },
      data: {
        ...permissionData,
        updatedById: userId,
        ...(roleIds !== undefined && {
          roles: {
            set: roleIds.map(id => ({ id }))
          }
        })
      },
      include: {
        roles: true,
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

    return permission;
  }

  async remove(id: number, userId: number) {
    // Check if permission exists
    await this.findOne(id);
  
    await this.prisma.permission.update({
      where: { id },
      data: {
        deletedById: userId,
        deletedAt: new Date(),
      }
    });

    return { message: 'Permission deleted successfully' };
  }

  async permanentDelete(id: number) {
   
    // Check if permission exists
    await this.findOne(id);
    
    await this.prisma.permission.delete({
      where: { id },
    });

    return { message: 'Permission permanently deleted successfully' };
  }

  async restore(id: number, userId: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id }
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    if (!permission.deletedAt) {
      throw new ConflictException(`Permission with ID ${id} is not deleted`);
    }

    const restoredPermission = await this.prisma.permission.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: userId,
      },
      include: {
        roles: true,
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

    return restoredPermission;
  }
}