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
import { CreateBrandDto, UpdateBrandDto, BrandResponseDto, BrandListResponseDto, DeleteBrandResponseDto } from './dto/brand.dto';
import { type JwtPayload } from 'src/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { configMulter } from 'src/utils/upload';
import { type Request } from 'express';
import { ZodResponse } from 'nestjs-zod';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodResponse({ type: BrandResponseDto })
  @UseInterceptors(FileInterceptor('file', configMulter))
  async create(
    @Body(ZodValidationPipe) createBrandDto: CreateBrandDto,
    @User() user: JwtPayload,
    @Req() req: Request
  ) {
    const brand = await this.brandService.create({...createBrandDto,logoFile: req.file}, user.id);
    return brand;
  }

  @Get()
  @ZodResponse({ type: BrandListResponseDto })
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
    // Return the data array directly to match Zod response DTO
    return result.data;
  }

  @Get(':id')
  @ZodResponse({ type: BrandResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const brand = await this.brandService.findOne(id);
    return brand;
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
    return brand;
  }

  @Delete(':id')
  @ZodResponse({ type: DeleteBrandResponseDto })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtPayload
  ) {
    const brand = await this.brandService.remove(id, user.id);
    return { message: 'Brand deleted successfully' };
  }

  @Put(':id/restore')
  @ZodResponse({ type: BrandResponseDto })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtPayload
  ) {
    const brand = await this.brandService.restore(id, user.id);
    return brand;
  }

}