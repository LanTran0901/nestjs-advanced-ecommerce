import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language.dto';

@Injectable()
export class LanguageService {
  constructor(private prisma: PrismaService) {}

  async create(createLanguageDto: CreateLanguageDto, userId: number) {
    // Check if language with same id already exists
    const existingLanguage = await this.prisma.language.findUnique({
      where: { id: createLanguageDto.id },
    });

    if (existingLanguage) {
      throw new ConflictException(`Language with code ${createLanguageDto.id} already exists`);
    }

    // Create the new language
    const language = await this.prisma.language.create({
      data: {
        ...createLanguageDto,
        createdById: userId,
      },
    });

    return language;
  }

  async findAll(query: { includeDeleted?: boolean } = {}) {
    const where: any = {};
    
    if (!query.includeDeleted) {
      where.deletedAt = null;
    }
    
    return this.prisma.language.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const language = await this.prisma.language.findFirst({
      where: { 
        id,
        deletedAt: null
      },
    });

    if (!language) {
      throw new NotFoundException(`Language with ID ${id} not found`);
    }

    return language;
  }

  async update(id: string, updateLanguageDto: UpdateLanguageDto, userId: number) {
  
    const language = await this.prisma.language.update({
      where: { id },
      data: {
        ...updateLanguageDto,
        updatedById: userId,
      },
    });

    return language;
  }

  async remove(id: string, userId: number) {
  
    await this.prisma.language.delete({
      where: { id },
    });

    return { message: 'Language deleted successfully' };
  }
}
