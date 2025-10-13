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
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';
import { User } from 'src/common/decorator/user.decorator';
import { CreateProductTranslationDto, UpdateProductTranslationDto } from './dto/producttranslation.dto';
import { type JwtPayload } from 'src/types';
import { ProductTranslationService } from './producttranslation.service';

@Controller('product-translation')
export class ProductTranslationController {
  constructor(private readonly productTranslationService: ProductTranslationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ZodValidationPipe) createProductTranslationDto: CreateProductTranslationDto,
    @User() user: JwtPayload
  ) {
    const translation = await this.productTranslationService.create(createProductTranslationDto, user.id);
    return {
      message: 'Product translation created successfully',
      data: translation
    };
  }

  @Get()
  async findAll(
    @Query('includeDeleted') includeDeleted?: string,
    @Query('productId') productId?: string,
    @Query('languageId') languageId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const query: {
      includeDeleted?: boolean;
      productId?: number;
      languageId?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {};

    if (includeDeleted !== undefined) {
      query.includeDeleted = includeDeleted === 'true';
    }

    if (productId) {
      query.productId = parseInt(productId, 10);
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

    const result = await this.productTranslationService.findAll(query);
    return {
      message: 'Product translations retrieved successfully',
      data: result.data,
      pagination: result.pagination
    };
  }

  @Get('product/:productId')
  async findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    const translations = await this.productTranslationService.findTranslationsByProduct(productId);
    return {
      message: 'Product translations retrieved successfully',
      data: translations
    };
  }

  @Get('product/:productId/language/:languageId')
  async findByProductAndLanguage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('languageId') languageId: string
  ) {
    const translation = await this.productTranslationService.findByProductAndLanguage(productId, languageId);
    return {
      message: 'Product translation retrieved successfully',
      data: translation
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const translation = await this.productTranslationService.findOne(id);
    return {
      message: 'Product translation retrieved successfully',
      data: translation
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ZodValidationPipe) updateProductTranslationDto: UpdateProductTranslationDto,
    @User() user: JwtPayload
  ) {
    const translation = await this.productTranslationService.update(id, updateProductTranslationDto, user.id);
    return {
      message: 'Product translation updated successfully',
      data: translation
    };
  }

  @Put('product/:productId/language/:languageId')
  async updateByProductAndLanguage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('languageId') languageId: string,
    @Body(ZodValidationPipe) updateProductTranslationDto: UpdateProductTranslationDto,
    @User() user: JwtPayload
  ) {
    const translation = await this.productTranslationService.updateByProductAndLanguage(
      productId, 
      languageId, 
      updateProductTranslationDto, 
      user.id
    );
    return {
      message: 'Product translation updated successfully',
      data: translation
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number, @User() user: JwtPayload) {
    const translation = await this.productTranslationService.remove(id, user.id);
    return {
      message: 'Product translation deleted successfully',
      data: translation
    };
  }

  @Delete('product/:productId/language/:languageId')
  @HttpCode(HttpStatus.OK)
  async removeByProductAndLanguage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('languageId') languageId: string,
    @User() user: JwtPayload
  ) {
    const translation = await this.productTranslationService.removeByProductAndLanguage(productId, languageId, user.id);
    return {
      message: 'Product translation deleted successfully',
      data: translation
    };
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number, @User() user: JwtPayload) {
    const translation = await this.productTranslationService.restore(id, user.id);
    return {
      message: 'Product translation restored successfully',
      data: translation
    };
  }
}