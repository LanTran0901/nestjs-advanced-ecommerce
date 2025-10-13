import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Put
} from '@nestjs/common';
import { RoleService } from './role.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';
import { User } from 'src/common/decorator/user.decorator';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto/role.dto';
import { type JwtPayload } from 'src/types';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ZodValidationPipe) createRoleDto: CreateRoleDto,
    @User() user: JwtPayload
  ) {
    const role = await this.roleService.create(createRoleDto, user.id);
    return {
      message: 'Role created successfully',
      data: role
    };
  }

  @Get()
  async findAll(
    @Query('includeDeleted') includeDeleted?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const query: {
      includeDeleted?: boolean;
      isActive?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    } = {};

    if (includeDeleted !== undefined) {
      query.includeDeleted = includeDeleted === 'true';
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.search = search;
    }

    if (page) {
      query.page = parseInt(page, 10);
    }

    if (limit) {
      query.limit = parseInt(limit, 10);
    }

    const result = await this.roleService.findAll(query);
    return {
      message: 'Roles retrieved successfully',
      data: result.data,
      pagination: result.pagination
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const role = await this.roleService.findOne(id);
    return {
      message: 'Role retrieved successfully',
      data: role
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ZodValidationPipe) updateRoleDto: UpdateRoleDto,
    @User() user: JwtPayload
  ) {
    const role = await this.roleService.update(id, updateRoleDto, user.id);
    return {
      message: 'Role updated successfully',
      data: role
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtPayload
  ) {
    const role = await this.roleService.remove(id, user.id);
    return {
      message: 'Role deleted successfully',
      data: role
    };
  }

  @Put(':id/restore')
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtPayload
  ) {
    const role = await this.roleService.restore(id, user.id);
    return {
      message: 'Role restored successfully',
      data: role
    };
  }

  @Put(':id/permissions')
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body(ZodValidationPipe) assignPermissionsDto: AssignPermissionsDto,
    @User() user: JwtPayload
  ) {
    const role = await this.roleService.assignPermissions(id, assignPermissionsDto, user.id);
    return {
      message: 'Permissions assigned successfully',
      data: role
    };
  }

  @Delete(':id/permissions')
  async removePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body('permissionIds') permissionIds: number[],
    @User() user: JwtPayload
  ) {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return {
        message: 'Permission IDs are required',
        statusCode: HttpStatus.BAD_REQUEST
      };
    }

    const role = await this.roleService.removePermissions(id, permissionIds, user.id);
    return {
      message: 'Permissions removed successfully',
      data: role
    };
  }

  @Put(':id/toggle-status')
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtPayload
  ) {
    const role = await this.roleService.toggleStatus(id, user.id);
    return {
      message: `Role ${role.isActive ? 'activated' : 'deactivated'} successfully`,
      data: role
    };
  }
}