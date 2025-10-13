import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { RedisService } from 'src/db/redis.service';
import { JwtPayload, requestWithUserType } from 'src/types';
import { PrismaService } from 'src/db/prisma.service';
import { IS_PUBLIC_KEY } from 'src/common/decorator/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
   constructor(private reflector: Reflector,private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
     if (isPublic) return true;
    const req = context.switchToHttp().getRequest<requestWithUserType>();
     const method = req.method; 
    const path = req.route?.path || req.url; 
    const authHeader = req.headers['authorization'];
    const token = (authHeader as string)?.split(' ')[1];
    if (!token) {
      throw new HttpException('unauthenticated',HttpStatus.UNAUTHORIZED);
    }
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret-key') as JwtPayload;
      let roledata=await this.prisma.role.findUnique({
        where: {id: payload.roleId},
        include: {permissions: true}
      })
      let isAllow=roledata?.permissions.some(item=>{
         return item.method==method && item.path==path;
      })
      if (!isAllow) {
          throw new HttpException('you are not allowed to access this',HttpStatus.UNAUTHORIZED);
      }
      req.user = {id: payload.id,session: payload.session,role: payload.role,roleId: payload.roleId}; 
      let sessionData=await this.prisma.session.findUnique({
        where: {id: payload.session}
      })
      return Boolean(sessionData);
    } 
}

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<requestWithUserType>();

    const refreshToken = request.cookies['refreshToken']; 
    if (!refreshToken) {
      throw new HttpException('Refresh token not found',HttpStatus.UNAUTHORIZED);
    }

    try {
    
      const payload = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as JwtPayload;
      let rf=await this.prisma.session.findFirst({
        where: {refreshToken}
      })
      if (rf?.userId!=payload.id) {
         throw new HttpException('Refresh token not match',HttpStatus.UNAUTHORIZED);
      }
      request.user = {id: payload.id,session: payload.session,role: payload.role,roleId: payload.roleId};

      return true;
    } catch (error) {
      throw new HttpException('Invalid or expired refresh token',HttpStatus.UNAUTHORIZED);
    }
  }
}
