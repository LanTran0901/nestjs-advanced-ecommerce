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

// Response DTOs
const RegisterResponseSchema = z.object({
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  totpSecret: z.string().nullable(),
  status: z.any(),
  deletedAt: z.any().nullable(),
  createdAt: z.any(),
  updatedAt: z.any(),
  roleId: z.number(),
  deletedById: z.number().nullable(),
});

export class RegisterResponseDto extends createZodDto(RegisterResponseSchema) {}

const LoginResponseSchema = z.object({
  message: z.string(),
  accessToken: z.string(),
});

export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}

const RefreshTokenResponseSchema = z.object({
  message: z.string(),
  accessToken: z.string(),
});

export class RefreshTokenResponseDto extends createZodDto(RefreshTokenResponseSchema) {}

const LogoutResponseSchema = z.object({
  message: z.string(),
});

export class LogoutResponseDto extends createZodDto(LogoutResponseSchema) {}

const SendOtpResponseSchema = z.object({
  message: z.string(),
});

export class SendOtpResponseDto extends createZodDto(SendOtpResponseSchema) {}

const Setup2FAResponseSchema = z.object({
  secret: z.string(),
  url: z.string().optional(),
});

export class Setup2FAResponseDto extends createZodDto(Setup2FAResponseSchema) {}

const Verify2FAResponseSchema = z.object({
  message: z.string(),
});

export class Verify2FAResponseDto extends createZodDto(Verify2FAResponseSchema) {}

const Disable2FAResponseSchema = z.object({
  message: z.string(),
});

export class Disable2FAResponseDto extends createZodDto(Disable2FAResponseSchema) {}

