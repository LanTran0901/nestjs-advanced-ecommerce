import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const VariantSchema = z.object({
  name: z.string(),
  options: z.array(z.string())
});

const SKUSchema = z.object({
  value: z.string().max(500, 'SKU value cannot exceed 500 characters'),
  price: z.number().positive('SKU price must be a positive number'),
  stock: z.number().int().nonnegative('SKU stock must be a non-negative integer'),
  image: z.string()
});

const CreateProductSchema = z.object({
  name: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(500, 'Product name cannot exceed 500 characters'),
  basePrice: z
    .number()
    .positive('Base price must be a positive number'),
  virtualPrice: z
    .number()
    .positive('Virtual price must be a positive number'),
  brandId: z
    .number()
    .int()
    .positive('Brand ID must be a positive integer'),
  categoryIds: z
    .array(z.number().int().positive('Category ID must be a positive integer'))
    .optional()
    .default([]),
  variants: z
    .array(VariantSchema)
    .optional()
    .default([]),
  skus: z
    .array(SKUSchema)
    .optional()
    .default([]),
  publishedAt: z
    .string()
    .optional(),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}

const UpdateProductSchema = z.object({
  name: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(500, 'Product name cannot exceed 500 characters')
    .optional(),
  basePrice: z
    .number()
    .positive('Base price must be a positive number')
    .optional(),
  virtualPrice: z
    .number()
    .positive('Virtual price must be a positive number')
    .optional(),
  brandId: z
    .number()
    .int()
    .positive('Brand ID must be a positive integer')
    .optional(),
  images: z
    .array(z.string())
    .optional(),
  categoryIds: z
    .array(z.number().int().positive('Category ID must be a positive integer'))
    .optional(),
  variants: z
    .array(VariantSchema)
    .optional(),
  skus: z
    .array(SKUSchema)
    .optional(),
  publishedAt: z
    .string()
    .optional(),
});

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {} 

const FilterProductsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').optional().default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional().default(10),
  minPrice: z.number().positive('Min price must be a positive number').optional(),
  maxPrice: z.number().positive('Max price must be a positive number').optional(),
  brandIds: z.array(z.number().int().positive('Brand ID must be a positive integer')).optional(),
  categoryIds: z.array(z.number().int().positive('Category ID must be a positive integer')).optional(),
  search: z.string().optional(),
}).refine(
  (data) => {
    if (data.minPrice && data.maxPrice) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  {
    message: 'Min price must be less than or equal to max price',
    path: ['minPrice'],
  }
);

export class FilterProductsDto extends createZodDto(FilterProductsSchema) {} 