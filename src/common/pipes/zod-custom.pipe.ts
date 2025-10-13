
import { HttpException, PipeTransform } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';


export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: ZodError) => {
    const firstError = error.issues[0]?.message;
    const message = firstError || 'Validation failed';
    return new HttpException(message,400);
  },
}) as new () => PipeTransform; 


