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
  UploadedFiles,
  Req
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';
import { User } from 'src/common/decorator/user.decorator';
import { CreateProductDto, UpdateProductDto, FilterProductsDto } from './dto/product.dto';
import { ProductService } from './product.service';
import { type JwtPayload } from 'src/types';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10))
  create(
    @Body(new ZodValidationPipe()) createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: JwtPayload,
  ) {
    return this.productService.create(createProductDto, files,user.id);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('brandIds') brandIds?: string,
    @Query('categoryIds') categoryIds?: string,
    @Query('search') search?: string,
  ) {
    const filterDto: FilterProductsDto = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      brandIds: brandIds ? brandIds.split(',').map(id => Number(id)) : undefined,
      categoryIds: categoryIds ? categoryIds.split(',').map(id => Number(id)) : undefined,
      search: search || undefined,
    };

    return this.productService.findAll(filterDto);
  }

  @Get('filters/options')
  getFilterOptions() {
    return this.productService.getFilterOptions();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('languageId') languageId?: string
  ) {
    return this.productService.findOne(id, languageId);
  }

  @Put(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: JwtPayload,
  ) {
    return this.productService.update(id, updateProductDto, files, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @User() userId: number) {
    return this.productService.remove(id, userId);
  }
}