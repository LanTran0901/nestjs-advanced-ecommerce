import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { HTTPMethod } from 'generated/prisma';

const CreatePermissionSchema = z.object({
  name: z
    .string()
    .min(2, 'Permission name must be at least 2 characters')
    .max(500, 'Permission name cannot exceed 500 characters'),
  description: z.string().optional().default(''),
  path: z
    .string()
    .min(1, 'Path is required')
    .max(1000, 'Path cannot exceed 1000 characters'),
  method: z.nativeEnum(HTTPMethod),
  module: z
    .string()
    .max(500, 'Module name cannot exceed 500 characters')
    .optional()
    .default(''),
  roleIds: z
    .array(z.number().int().positive('Role ID must be a positive integer'))
    .optional(),
});

export class CreatePermissionDto extends createZodDto(CreatePermissionSchema) {}

const UpdatePermissionSchema = z.object({
  name: z
    .string()
    .min(2, 'Permission name must be at least 2 characters')
    .max(500, 'Permission name cannot exceed 500 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  path: z
    .string()
    .min(1, 'Path is required')
    .max(1000, 'Path cannot exceed 1000 characters')
    .optional(),
  method: z.nativeEnum(HTTPMethod).optional(),
  module: z
    .string()
    .max(500, 'Module name cannot exceed 500 characters')
    .optional(),
  roleIds: z
    .array(z.number().int().positive('Role ID must be a positive integer'))
    .optional(),
});

export class UpdatePermissionDto extends createZodDto(UpdatePermissionSchema) {}
