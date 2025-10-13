import { Module } from '@nestjs/common';
import { BrandTranslationService } from './brandtranslation.service';
import { BrandTranslationController } from './brandtranslation.controller';
import { PrismaService } from 'src/db/prisma.service';

@Module({
  controllers: [BrandTranslationController],
  providers: [BrandTranslationService, PrismaService],
  exports: [BrandTranslationService],
})
export class BrandTranslationModule {}