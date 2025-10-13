import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCartItemSchema = z.object({
  skuId: z.number().int().positive('SKU ID must be a positive integer'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export class CreateCartItemDto extends createZodDto(CreateCartItemSchema) {}

const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export class UpdateCartItemDto extends createZodDto(UpdateCartItemSchema) {}

const AddToCartSchema = z.object({
  skuId: z.number().int().positive('SKU ID must be a positive integer'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

export class AddToCartDto extends createZodDto(AddToCartSchema) {}

const RemoveMultipleItemsSchema = z.object({
  productIds: z.array(z.number().int().positive('Product ID must be a positive integer')).min(1, 'At least one product ID is required'),
});

export class RemoveMultipleItemsDto extends createZodDto(RemoveMultipleItemsSchema) {}