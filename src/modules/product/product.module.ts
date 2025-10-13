import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from 'src/db/prisma.service';
import { S3Service } from 'src/common/services/s3.service';
import { ProductTranslationModule } from './producttranslation/producttranslation.module';

@Module({
  imports: [ProductTranslationModule],
  controllers: [ProductController],
  providers: [ProductService, PrismaService, S3Service],
  exports: [ProductService],
})
export class ProductModule {}