import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';


const CreateLanguageSchema = z.object({
  id: z.string().min(2, 'Language code must be at least 2 characters').max(10, 'Language code cannot exceed 10 characters'),
  name: z.string().min(2, 'Language name must be at least 2 characters').max(500, 'Language name cannot exceed 500 characters'),
});

export class CreateLanguageDto extends createZodDto(CreateLanguageSchema) {}


const UpdateLanguageSchema = z.object({
  name: z.string().min(2, 'Language name must be at least 2 characters').max(500, 'Language name cannot exceed 500 characters'),
});

export class UpdateLanguageDto extends createZodDto(UpdateLanguageSchema) {}

// Response DTOs
const LanguageResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: z.any().nullable(), // Accept any type to avoid transform issues
  createdAt: z.any(),
  updatedAt: z.any(),
});

export class LanguageResponseDto extends createZodDto(LanguageResponseSchema) {}

const LanguageListResponseSchema = z.array(LanguageResponseSchema);

export class LanguageListResponseDto extends createZodDto(LanguageListResponseSchema) {}

const DeleteLanguageResponseSchema = z.object({
  message: z.string(),
});

export class DeleteLanguageResponseDto extends createZodDto(DeleteLanguageResponseSchema) {}