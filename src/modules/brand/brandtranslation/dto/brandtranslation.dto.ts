import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

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

// Response DTOs
const BrandTranslationResponseSchema = z.object({
  id: z.number(),
  brandId: z.number(),
  languageId: z.string(),
  name: z.string(),
  description: z.string(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: z.any().nullable(), // Accept any type to avoid transform issues
  createdAt: z.any(),
  updatedAt: z.any(),
});

export class BrandTranslationResponseDto extends createZodDto(BrandTranslationResponseSchema) {}

const BrandTranslationListResponseSchema = z.array(BrandTranslationResponseSchema);

export class BrandTranslationListResponseDto extends createZodDto(BrandTranslationListResponseSchema) {}

const DeleteBrandTranslationResponseSchema = z.object({
  message: z.string(),
});

export class DeleteBrandTranslationResponseDto extends createZodDto(DeleteBrandTranslationResponseSchema) {}