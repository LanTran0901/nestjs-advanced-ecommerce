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
import { BrandTranslationService } from './brandtranslation.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';
import { User } from 'src/common/decorator/user.decorator';
import { CreateBrandTranslationDto, UpdateBrandTranslationDto } from './dto/brandtranslation.dto';
import { type JwtPayload } from 'src/types';

@Controller('brand-translation')
export class BrandTranslationController {
  constructor(private readonly brandTranslationService: BrandTranslationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ZodValidationPipe) createBrandTranslationDto: CreateBrandTranslationDto,
    @User() user: JwtPayload
  ) {
    const translation = await this.brandTranslationService.create(createBrandTranslationDto, user.id);
    return {
      message: 'Brand translation created successfully',
      data: translation
    };
  }

  @Get()
  async findAll(
    @Query('includeDeleted') includeDeleted?: string,
    @Query('brandId') brandId?: string,
    @Query('languageId') languageId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const query: {
      includeDeleted?: boolean;
      brandId?: number;
      languageId?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {};

    if (includeDeleted !== undefined) {
      query.includeDeleted = includeDeleted === 'true';
    }

    if (brandId) {
      query.brandId = parseInt(brandId, 10);
    }

    if (languageId) {
      query.languageId = languageId;
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

    const result = await this.brandTranslationService.findAll(query);
    return {
      message: 'Brand translations retrieved successfully',
      data: result.data,
      pagination: result.pagination
    };
  }

  @Get('brand/:brandId')
  async findByBrand(@Param('brandId', ParseIntPipe) brandId: number) {
    const translations = await this.brandTranslationService.findTranslationsByBrand(brandId);
    return {
      message: 'Brand translations retrieved successfully',
      data: translations
    };
  }

  @Get('brand/:brandId/language/:languageId')
  async findByBrandAndLanguage(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('languageId') languageId: string
  ) {
    const translation = await this.brandTranslationService.findByBrandAndLanguage(brandId, languageId);
    return {
      message: 'Brand translation retrieved successfully',
      data: translation
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const translation = await this.brandTranslationService.findOne(id);
    return {
      message: 'Brand translation retrieved successfully',
      data: translation
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ZodValidationPipe) updateBrandTranslationDto: UpdateBrandTranslationDto,
    @User() user: JwtPayload
  ) {
    const translation = await this.brandTranslationService.update(id, updateBrandTranslationDto, user.id);
    return {
      message: 'Brand translation updated successfully',
      data: translation
    };
  }

  @Patch('brand/:brandId/language/:languageId')
  async updateByBrandAndLanguage(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('languageId') languageId: string,
    @Body(ZodValidationPipe) updateBrandTranslationDto: UpdateBrandTranslationDto,
    @User() user: JwtPayload
  ) {
    const translation = await this.brandTranslationService.updateByBrandAndLanguage(brandId, languageId, updateBrandTranslationDto, user.id);
    return {
      message: 'Brand translation updated successfully',
      data: translation
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtPayload
  ) {
    const translation = await this.brandTranslationService.remove(id, user.id);
    return {
      message: 'Brand translation deleted successfully',
      data: translation
    };
  }

  @Delete('brand/:brandId/language/:languageId')
  async removeByBrandAndLanguage(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('languageId') languageId: string,
    @User() user: JwtPayload
  ) {
    const translation = await this.brandTranslationService.removeByBrandAndLanguage(brandId, languageId, user.id);
    return {
      message: 'Brand translation deleted successfully',
      data: translation
    };
  }

  @Put(':id/restore')
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtPayload
  ) {
    const translation = await this.brandTranslationService.restore(id, user.id);
    return {
      message: 'Brand translation restored successfully',
      data: translation
    };
  }
}