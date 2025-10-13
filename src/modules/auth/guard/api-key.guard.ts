import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { env } from 'src/utils/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] || request.headers['api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    if (apiKey !== env.API_KEY) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}