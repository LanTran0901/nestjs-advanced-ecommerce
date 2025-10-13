import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  email: z
    .string()
    .email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be at most 100 characters'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(50, 'Phone number must be at most 50 characters'),
    otpCode: z.string()
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
const LoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
    otp: z.string().optional()
});

export class LoginDto extends createZodDto(LoginSchema) {}

const SendOtpSchema = z.object({
  email: z.string()
    .email('Invalid email format')
});

export class SendOtpDto extends createZodDto(SendOtpSchema) {}

