import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateProductTranslationSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  languageId: z.string().min(1, 'Language ID is required'),
  name: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(500, 'Product name cannot exceed 500 characters'),
  description: z.string().min(1, 'Description is required'),
});

export class CreateProductTranslationDto extends createZodDto(CreateProductTranslationSchema) {}

const UpdateProductTranslationSchema = z.object({
  name: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(500, 'Product name cannot exceed 500 characters')
    .optional(),
  description: z.string().optional(),
});

export class UpdateProductTranslationDto extends createZodDto(UpdateProductTranslationSchema) {}