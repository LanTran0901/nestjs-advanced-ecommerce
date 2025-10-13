import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { BrandTranslationModule } from './brandtranslation/brandtranslation.module';
import { PrismaService } from 'src/db/prisma.service';
import { S3Service } from 'src/common/services/s3.service';

@Module({
  imports: [BrandTranslationModule],
  controllers: [BrandController],
  providers: [BrandService, PrismaService, S3Service],
  exports: [BrandService],
})
export class BrandModule {}