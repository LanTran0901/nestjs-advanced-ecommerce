import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { LanguageService } from './language.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';
import { User } from 'src/common/decorator/user.decorator';
import { CreateLanguageDto, UpdateLanguageDto, LanguageResponseDto, LanguageListResponseDto, DeleteLanguageResponseDto } from './dto/language.dto';
import { type JwtPayload } from 'src/types';
import { ZodResponse } from 'nestjs-zod';

@Controller('language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Post()
  @ZodResponse({ type: LanguageResponseDto })
  async create(
    @Body(ZodValidationPipe) createLanguageDto: CreateLanguageDto,
    @User() user: JwtPayload
  ) {
    return this.languageService.create(createLanguageDto, user.id);
  }

  @Get()
  @ZodResponse({ type: LanguageListResponseDto })
  async findAll(@Query('includeDeleted') includeDeleted?: string) {
    
    const query: { includeDeleted?: boolean } = {};
    if (includeDeleted !== undefined) {
      query.includeDeleted = includeDeleted === 'true';
    }
    
    return this.languageService.findAll(query);
  }

  @Get(':id')
  @ZodResponse({ type: LanguageResponseDto })
  async findOne(@Param('id') id: string) {
    return this.languageService.findOne(id);
  }

  @Patch(':id')
  @ZodResponse({ type: LanguageResponseDto })
  async update(
    @Param('id') id: string, 
    @Body(ZodValidationPipe) updateLanguageDto: UpdateLanguageDto,
    @User() user: JwtPayload
  ) {
    return this.languageService.update(id, updateLanguageDto, user.id);
  }

  @Delete(':id')
  @ZodResponse({ type: DeleteLanguageResponseDto })
  async remove(@Param('id') id: string, @User() user: JwtPayload) {
    return this.languageService.remove(id, user.id);
  }
}