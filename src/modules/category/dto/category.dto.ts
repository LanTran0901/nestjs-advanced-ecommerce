import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(500, 'Category name cannot exceed 500 characters'),
  parentCategoryId: z.number().int().positive('Parent category ID must be a positive integer').optional(),
});

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}

const UpdateCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(500, 'Category name cannot exceed 500 characters').optional(),
  logo: z.string().url('Logo must be a valid URL').max(1000, 'Logo URL cannot exceed 1000 characters').optional(),
  parentCategoryId: z.number().int().positive('Parent category ID must be a positive integer').optional().nullable(),
});

export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}