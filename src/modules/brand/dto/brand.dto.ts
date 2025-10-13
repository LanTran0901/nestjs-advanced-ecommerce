import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateBrandSchema = z.object({
  name: z
    .string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(500, 'Brand name cannot exceed 500 characters')
});

export class CreateBrandDto extends createZodDto(CreateBrandSchema) {}

const UpdateBrandSchema = z.object({
  name: z
    .string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(500, 'Brand name cannot exceed 500 characters')
    .optional()
});

export class UpdateBrandDto extends createZodDto(UpdateBrandSchema) {}

const CreateBrandTranslationSchema = z.object({
  brandId: z.number().int().positive('Brand ID must be a positive integer'),
  languageId: z.string().min(1, 'Language ID is required'),
  name: z
    .string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(500, 'Brand name cannot exceed 500 characters'),
  description: z.string().min(1, 'Description is required'),
});

export class CreateBrandTranslationDto extends createZodDto(CreateBrandTranslationSchema) {}

const UpdateBrandTranslationSchema = z.object({
  name: z
    .string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(500, 'Brand name cannot exceed 500 characters')
    .optional(),
  description: z.string().optional(),
});

export class UpdateBrandTranslationDto extends createZodDto(UpdateBrandTranslationSchema) {}