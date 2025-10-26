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

// Response DTOs
const BrandResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: z.any().nullable(), // Accept any type to avoid transform issues
  createdAt: z.any(),
  updatedAt: z.any(),
});

export class BrandResponseDto extends createZodDto(BrandResponseSchema) {}

const BrandListResponseSchema = z.array(BrandResponseSchema);

export class BrandListResponseDto extends createZodDto(BrandListResponseSchema) {}

const DeleteBrandResponseSchema = z.object({
  message: z.string(),
});

export class DeleteBrandResponseDto extends createZodDto(DeleteBrandResponseSchema) {}