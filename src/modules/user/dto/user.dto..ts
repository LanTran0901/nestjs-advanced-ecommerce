import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .optional(),
  email: z
    .string()
    .email('Invalid email format')
    .optional(),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(50, 'Phone number must be at most 50 characters')
    .optional()
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}

// Response DTOs
const UserResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  avatar: z.string().nullable(),
  roleId: z.number(),
  createdAt: z.any(),
  updatedAt: z.any(),
  role: z.object({
    name: z.string(),
    permissions: z.array(z.object({
      method: z.string(),
      module: z.string(),
      path: z.string(),
    })).optional(),
  }).optional(),
});

export class UserResponseDto extends createZodDto(UserResponseSchema) {}

const UpdateUserResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  avatar: z.string().nullable(),
  updatedAt: z.any(),
  role: z.object({
    name: z.string(),
  }).optional(),
});

export class UpdateUserResponseDto extends createZodDto(UpdateUserResponseSchema) {}

const ChangePasswordResponseSchema = z.object({
  message: z.string(),
});

export class ChangePasswordResponseDto extends createZodDto(ChangePasswordResponseSchema) {}