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
  UseInterceptors,
  Req
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';
import { User } from 'src/common/decorator/user.decorator';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto, CategoryListResponseDto, DeleteCategoryResponseDto } from './dto/category.dto';
import { type JwtPayload } from 'src/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { configMulter } from 'src/utils/upload';
import { type Request } from 'express';
import { ZodResponse } from 'nestjs-zod';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodResponse({ type: CategoryResponseDto })
  @UseInterceptors(FileInterceptor('file', configMulter))
  async create(
    @Body(ZodValidationPipe) createCategoryDto: CreateCategoryDto,
    @User() user: JwtPayload,
    @Req() req: Request
  ) {
    const category = await this.categoryService.create({...createCategoryDto, logoFile: req.file}, user.id);
    return category;
  }

  @Get()
  @ZodResponse({ type: CategoryListResponseDto })
  async findAll(
    @Query('includeDeleted') includeDeleted?: string,
    @Query('parentId') parentId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const query: {
      includeDeleted?: boolean;
      parentId?: number;
      search?: string;
      page?: number;
      limit?: number;
    } = {};

    if (includeDeleted !== undefined) {
      query.includeDeleted = includeDeleted === 'true';
    }

    if (parentId) {
      query.parentId = parseInt(parentId, 10);
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

    const result = await this.categoryService.findAll(query);
    return result.data;
  }

  @Get('tree')
  async getTree() {
    const tree = await this.categoryService.getTree();
    return {
      message: 'Category tree retrieved successfully',
      data: tree
    };
  }

  @Get(':id')
  @ZodResponse({ type: CategoryResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoryService.findOne(id);
    return category;
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', configMulter))
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body(ZodValidationPipe) updateCategoryDto: UpdateCategoryDto,
    @User() user: JwtPayload,
    @Req() req: Request
  ) {
    const categoryData = {
      ...updateCategoryDto,
      logoFile: req.file
    };
    const category = await this.categoryService.update(id, categoryData, user.id);
    return category;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ZodResponse({ type: DeleteCategoryResponseDto })
  async remove(@Param('id', ParseIntPipe) id: number, @User() user: JwtPayload) {
    await this.categoryService.remove(id, user.id);
    return { message: 'Category deleted successfully' };
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ZodResponse({ type: DeleteCategoryResponseDto })
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.permanentDelete(id);
    return { message: 'Category permanently deleted successfully' };
  }

  @Post(':id/restore')
  @ZodResponse({ type: CategoryResponseDto })
  async restore(@Param('id', ParseIntPipe) id: number, @User() user: JwtPayload) {
    const category = await this.categoryService.restore(id, user.id);
    return category;
  }

  @Get('parents')
  async getParentCategories() {
    const parents = await this.categoryService.getParentCategories();
    return {
      message: 'Parent categories retrieved successfully',
      data: parents
    };
  }

  @Get(':parentId/children')
  async getChildCategories(@Param('parentId', ParseIntPipe) parentId: number) {
    const children = await this.categoryService.getChildCategories(parentId);
    return {
      message: 'Child categories retrieved successfully',
      data: children
    };
  }
}