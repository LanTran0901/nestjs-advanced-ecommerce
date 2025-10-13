import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from 'src/db/prisma.service';
import { S3Service } from 'src/common/services/s3.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService, S3Service],
  exports: [CategoryService],
})
export class CategoryModule {}