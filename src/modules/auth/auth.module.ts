import { Module } from '@nestjs/common';
import { authService } from './auth.service';
import { authController } from './auth.controller';
import { RedisService } from 'src/db/redis.service';
import { JwtService } from '@nestjs/jwt';
import { S3Service } from 'src/common/services/s3.service';
import { PrismaService } from 'src/db/prisma.service';
import { RoleService } from 'src/common/services/role.service';
import { EmailService } from 'src/common/services/ses.service';
import { GoogleService } from './google.service';

@Module({
  controllers: [authController],
  providers: [
    authService,
    PrismaService,
    RedisService,
    JwtService,
    S3Service,
    EmailService,
    RoleService,
    GoogleService
  ],
})
export class authModule {}
