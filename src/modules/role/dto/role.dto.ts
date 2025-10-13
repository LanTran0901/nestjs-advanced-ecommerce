import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Role name must be at least 2 characters')
    .max(500, 'Role name cannot exceed 500 characters'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .default(''),
  isActive: z
    .boolean()
    .optional()
    .default(true),
  permissionIds: z
    .array(z.number().int().positive('Permission ID must be a positive integer'))
    .optional(),
});

export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}

const UpdateRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Role name must be at least 2 characters')
    .max(500, 'Role name cannot exceed 500 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  isActive: z
    .boolean()
    .optional(),
  permissionIds: z
    .array(z.number().int().positive('Permission ID must be a positive integer'))
    .optional(),
});

export class UpdateRoleDto extends createZodDto(UpdateRoleSchema) {}

const AssignPermissionsSchema = z.object({
  permissionIds: z
    .array(z.number().int().positive('Permission ID must be a positive integer'))
    .min(1, 'At least one permission ID is required'),
});

export class AssignPermissionsDto extends createZodDto(AssignPermissionsSchema) {}