import { OrderStatus } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import { CreateCartItemSchema } from 'src/modules/cart/dto/cart.dto';
import { number, z } from 'zod';
import { object } from 'zod/v3';

// Re-export OrderStatus for convenience
export { OrderStatus } from 'generated/prisma';


export class CartItemDto extends createZodDto(CreateCartItemSchema) {}

const CreateOrderSchema = z.array(z.object({
  status: z.nativeEnum(OrderStatus).default(OrderStatus.PENDING_PAYMENT),
  receiver: z.object({
    name: z.string().min(1, 'Receiver name is required'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    address: z.string().min(1, 'Address is required'),
  }),
  shopId: z.number().int().positive().optional(),
  items: z.array(number()).min(1, 'At least one item is required')
})).min(1);

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}

const UpdateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional()
});

export class UpdateOrderDto extends createZodDto(UpdateOrderSchema) {}

const QueryOrderSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.nativeEnum(OrderStatus).optional(),
});

export class QueryOrderDto extends createZodDto(QueryOrderSchema) {}