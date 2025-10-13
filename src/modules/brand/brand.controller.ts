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
  Put,
  UseInterceptors,
  Req
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';
import { User } from 'src/common/decorator/user.decorator';
import { CreateBrandDto, UpdateBrandDto, CreateBrandTranslationDto, UpdateBrandTranslationDto } from './dto/brand.dto';
import { type JwtPayload } from 'src/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { configMulter } from 'src/utils/upload';
import { type Request } from 'express';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', configMulter))
  async create(
    @Body(ZodValidationPipe) createBrandDto: CreateBrandDto,
    @User() user: JwtPayload,
    @Req() req: Request
  ) {
    const brand = await this.brandService.create({...createBrandDto,logoFile: req.file}, user.id);
    return {
      message: 'Brand created successfully',
      data: brand
    };
  }

  @Get()
  async findAll(
    @Query('includeDeleted') includeDeleted?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const query: {
      includeDeleted?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    } = {};

    if (includeDeleted !== undefined) {
      query.includeDeleted = includeDeleted === 'true';
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

    const result = await this.brandService.findAll(query);
    return {
      message: 'Brands retrieved successfully',
      data: result.data,
      pagination: result.pagination
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const brand = await this.brandService.findOne(id);
    return {
      message: 'Brand retrieved successfully',
      data: brand
    };
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', configMulter))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ZodValidationPipe) updateBrandDto: UpdateBrandDto,
    @User() user: JwtPayload,
    @Req() req: Request
  ) {
    const brandData = {
      ...updateBrandDto,
      logoFile: req.file
    };
    const brand = await this.brandService.update(id, brandData, user.id);
    return {
      message: 'Brand updated successfully',
      data: brand
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtPayload
  ) {
    const brand = await this.brandService.remove(id, user.id);
    return {
      message: 'Brand deleted successfully',
      data: brand
    };
  }

  @Put(':id/restore')
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtPayload
  ) {
    const brand = await this.brandService.restore(id, user.id);
    return {
      message: 'Brand restored successfully',
      data: brand
    };
  }

  // Brand Translation endpoints
  @Post(':id/translations')
  @HttpCode(HttpStatus.CREATED)
  async createTranslation(
    @Param('id', ParseIntPipe) brandId: number,
    @Body(ZodValidationPipe) createBrandTranslationDto: CreateBrandTranslationDto,
    @User() user: JwtPayload
  ) {
    // Override brandId from param to ensure consistency
    const translationDto = { ...createBrandTranslationDto, brandId };
    const translation = await this.brandService.createTranslation(translationDto, user.id);
    return {
      message: 'Brand translation created successfully',
      data: translation
    };
  }

  @Get(':id/translations')
  async findTranslations(@Param('id', ParseIntPipe) brandId: number) {
    const translations = await this.brandService.findTranslations(brandId);
    return {
      message: 'Brand translations retrieved successfully',
      data: translations
    };
  }

  @Patch(':id/translations/:languageId')
  async updateTranslation(
    @Param('id', ParseIntPipe) brandId: number,
    @Param('languageId') languageId: string,
    @Body(ZodValidationPipe) updateBrandTranslationDto: UpdateBrandTranslationDto,
    @User() user: JwtPayload
  ) {
    const translation = await this.brandService.updateTranslation(brandId, languageId, updateBrandTranslationDto, user.id);
    return {
      message: 'Brand translation updated successfully',
      data: translation
    };
  }

  @Delete(':id/translations/:languageId')
  async removeTranslation(
    @Param('id', ParseIntPipe) brandId: number,
    @Param('languageId') languageId: string,
    @User() user: JwtPayload
  ) {
    const translation = await this.brandService.removeTranslation(brandId, languageId, user.id);
    return {
      message: 'Brand translation deleted successfully',
      data: translation
    };
  }
}