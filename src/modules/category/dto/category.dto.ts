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

// Response DTOs
const CategoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string().nullable(),
  parentCategoryId: z.number().nullable(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: z.any().nullable(), // Accept any type to avoid transform issues
  createdAt: z.any(),
  updatedAt: z.any(),
});

export class CategoryResponseDto extends createZodDto(CategoryResponseSchema) {}

const CategoryListResponseSchema = z.array(CategoryResponseSchema);

export class CategoryListResponseDto extends createZodDto(CategoryListResponseSchema) {}

const DeleteCategoryResponseSchema = z.object({
  message: z.string(),
});

export class DeleteCategoryResponseDto extends createZodDto(DeleteCategoryResponseSchema) {}