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
  HttpCode
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';
import { User } from 'src/common/decorator/user.decorator';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import { type JwtPayload } from 'src/types';
import { HTTPMethod } from 'generated/prisma';

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ZodValidationPipe) createPermissionDto: CreatePermissionDto,
    @User() user: JwtPayload
  ) {
    const permission = await this.permissionService.create(createPermissionDto, user.id);
    return {
      message: 'Permission created successfully',
      data: permission
    };
  }

  @Get()
  async findAll(
    @Query('includeDeleted') includeDeleted?: string,
    @Query('module') module?: string,
    @Query('method') method?: HTTPMethod,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const query: {
      includeDeleted?: boolean;
      module?: string;
      method?: HTTPMethod;
      page?: number;
      limit?: number;
    } = {};

    if (includeDeleted !== undefined) {
      query.includeDeleted = includeDeleted === 'true';
    }

    if (module) {
      query.module = module;
    }

    if (method) {
      query.method = method;
    }

    if (page) {
      query.page = parseInt(page, 10);
    }

    if (limit) {
      query.limit = parseInt(limit, 10);
    }

    const result = await this.permissionService.findAll(query);
    return {
      message: 'Permissions retrieved successfully',
      ...result
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionService.findOne(id);
    return {
      message: 'Permission retrieved successfully',
      data: permission
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body(ZodValidationPipe) updatePermissionDto: UpdatePermissionDto,
    @User() user: JwtPayload
  ) {
    const permission = await this.permissionService.update(id, updatePermissionDto, user.id);
    return {
      message: 'Permission updated successfully',
      data: permission
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number, @User() user: JwtPayload) {
    return this.permissionService.remove(id, user.id);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.permanentDelete(id);
  }

  @Post(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number, @User() user: JwtPayload) {
    const permission = await this.permissionService.restore(id, user.id);
    return {
      message: 'Permission restored successfully',
      data: permission
    };
  }
}