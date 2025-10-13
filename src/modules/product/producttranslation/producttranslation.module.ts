import { Module } from '@nestjs/common';
import { ProductTranslationService } from './producttranslation.service';
import { ProductTranslationController } from './producttranslation.controller';
import { PrismaService } from 'src/db/prisma.service';

@Module({
  controllers: [ProductTranslationController],
  providers: [ProductTranslationService, PrismaService],
  exports: [ProductTranslationService],
})
export class ProductTranslationModule {}