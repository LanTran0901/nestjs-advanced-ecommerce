import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto/role.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto, userId: number) {
    // Check if role with same name already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException(`Role with name '${createRoleDto.name}' already exists`);
    }

    // Prepare the data for creation
    const { permissionIds, ...roleData } = createRoleDto;
    
    // Create the new role
    const role = await this.prisma.role.create({
      data: {
        ...roleData,
        createdById: userId,
        ...(permissionIds && permissionIds.length > 0 && {
          permissions: {
            connect: permissionIds.map(id => ({ id }))
          }
        })
      },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
            module: true
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
            users: true
          }
        }
      }
    });

    return role;
  }

  async findAll(query: {
    includeDeleted?: boolean;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const {
      includeDeleted = false,
      isActive,
      search,
      page = 1,
      limit = 10
    } = query;

    const where: any = {};
    
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        include: {
          permissions: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              description: true,
              path: true,
              method: true,
              module: true
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
              users: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.role.count({ where })
    ]);

    return {
      data: roles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
            module: true
          }
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            status: true
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
            users: true
          }
        }
      }
    });

    if (!role || role.deletedAt) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto, userId: number) {
    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole || existingRole.deletedAt) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // If name is being updated, check if new name already exists
    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      const roleWithSameName = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name }
      });

      if (roleWithSameName && roleWithSameName.id !== id) {
        throw new ConflictException(`Role with name '${updateRoleDto.name}' already exists`);
      }
    }

    const { permissionIds, ...roleData } = updateRoleDto;

    // Update the role
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        updatedById: userId,
        ...(permissionIds !== undefined && {
          permissions: {
            set: permissionIds.map(id => ({ id }))
          }
        })
      },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
            module: true
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
            users: true
          }
        }
      }
    });

    return role;
  }

  async remove(id: number, userId: number) {
    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    if (!existingRole || existingRole.deletedAt) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if role has active users
    if (existingRole._count.users > 0) {
      throw new ConflictException(`Cannot delete role '${existingRole.name}' because it has ${existingRole._count.users} active user(s) assigned`);
    }

    // Soft delete the role
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
        isActive: false
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

    return role;
  }

  async restore(id: number, userId: number) {
    // Check if role exists and is deleted
    const existingRole = await this.prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    if (!existingRole.deletedAt) {
      throw new ConflictException(`Role with ID ${id} is not deleted`);
    }

    // Check if role name would conflict after restoration
    const roleWithSameName = await this.prisma.role.findFirst({
      where: { 
        name: existingRole.name,
        deletedAt: null,
        id: { not: id }
      }
    });

    if (roleWithSameName) {
      throw new ConflictException(`Cannot restore role because a role with name '${existingRole.name}' already exists`);
    }

    // Restore the role
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: userId
      },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
            module: true
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

    return role;
  }

  async assignPermissions(id: number, assignPermissionsDto: AssignPermissionsDto, userId: number) {
    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole || existingRole.deletedAt) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Verify all permissions exist and are not deleted
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: assignPermissionsDto.permissionIds },
        deletedAt: null
      }
    });

    if (permissions.length !== assignPermissionsDto.permissionIds.length) {
      const foundIds = permissions.map(p => p.id);
      const missingIds = assignPermissionsDto.permissionIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Permissions not found: ${missingIds.join(', ')}`);
    }

    // Assign permissions to role
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        permissions: {
          set: assignPermissionsDto.permissionIds.map(id => ({ id }))
        },
        updatedById: userId
      },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
            module: true
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

    return role;
  }

  async removePermissions(id: number, permissionIds: number[], userId: number) {
    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          select: { id: true }
        }
      }
    });

    if (!existingRole || existingRole.deletedAt) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check which permissions are currently assigned to the role
    const currentPermissionIds = existingRole.permissions.map(p => p.id);
    const permissionsToRemove = permissionIds.filter(id => currentPermissionIds.includes(id));

    if (permissionsToRemove.length === 0) {
      throw new ConflictException('None of the specified permissions are assigned to this role');
    }

    // Remove permissions from role
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        permissions: {
          disconnect: permissionsToRemove.map(id => ({ id }))
        },
        updatedById: userId
      },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
            module: true
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

    return role;
  }

  async toggleStatus(id: number, userId: number) {
    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole || existingRole.deletedAt) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Toggle the isActive status
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        isActive: !existingRole.isActive,
        updatedById: userId
      },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
            module: true
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
            users: true
          }
        }
      }
    });

    return role;
  }
}