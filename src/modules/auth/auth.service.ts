import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Request, Response } from 'express';
import { JwtPayload } from 'src/types';
import { JwtService } from '@nestjs/jwt';
import { env } from 'src/utils/config';
import { S3Service } from 'src/common/services/s3.service';
import { PrismaService } from 'src/db/prisma.service';
import { RoleService } from 'src/common/services/role.service';
import { EmailService } from 'src/common/services/ses.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class authService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly s3Service: S3Service,
    private readonly sesService: EmailService,
  ) {}
  async generateToken(payload: JwtPayload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: env.JWT_SECRET,
      expiresIn: '1d',
    });

    const refreshToken = await this.jwtService.signAsync(
      payload,
      {
        secret: env.JWT_SECRET,
        expiresIn: '7d',
      },
    );
    return {
      accessToken,
      refreshToken,
    };
  }
  async registerUser(info: RegisterDto, file: Express.Multer.File) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: info.email },
    });

    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }
    const hashedPassword = await bcrypt.hash(info.password, 10);
    if (!file) {
      throw new HttpException('no avatar uploaded', HttpStatus.BAD_REQUEST);
    }
    let codeOtp = await this.prisma.verificationCode.findUnique({
      where: {
        email: info.email,
        expiresAt: { gt: new Date() },
      },
    });
    if (!codeOtp) {
      throw new HttpException('otp expired', HttpStatus.BAD_REQUEST);
    }
    let avatarUrl = await this.s3Service.uploadImage(file);
    const newUser = await this.prisma.user.create({
      data: {
        name: info.name,
        email: info.email,
        password: hashedPassword,
        avatar: avatarUrl,
        phoneNumber: info.phoneNumber,
        roleId: 3,
      },
      omit: {
        id: true,
        password: true,
      },
    });

    return newUser;
  }
  async loginUser(info: LoginDto, res: Response, ip: string, agent: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: info.email },
      include: { role: true },
    });
    if (!existingUser) {
      throw new HttpException('user not found', HttpStatus.CONFLICT);
    }
    let verify = await bcrypt.compare(info.password, existingUser.password || '');
    if (!verify) {
      throw new HttpException('wrong password', HttpStatus.UNAUTHORIZED);
    }
    if (existingUser.totpSecret) {
      const isValid = speakeasy.totp.verify({
        secret: existingUser.totpSecret,
        encoding: 'base32',
        token: info.otp || '',
        window: 1,
      });

      if (!isValid) { throw new UnauthorizedException('Invalid 2FA code');}
    }
    let session= await this.prisma.session.create({
      data: {
        ip,
        userAgent: agent,
        refreshToken:' refreshToken',
        userId: existingUser.id,
      },
    });
    const { accessToken, refreshToken } = await this.generateToken({
      id: existingUser.id,
      session: session.id,
      role: existingUser.role.name,
      roleId: existingUser.roleId
    });
    await this.prisma.session.update({
      where: {id: session.id},
      data: {refreshToken}
    })
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, 
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken };
  }
  async handleRefreshToken(user: JwtPayload,res: Response) {
    const { accessToken, refreshToken } = await this.generateToken(user);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, 
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    await this.prisma.session.update({
      where: {id: user.session},
      data: {refreshToken}
    });
    return { accessToken };
  }
  async handleLogout(user: JwtPayload,res: Response) {
    const sessionId = user.session; 
    
    await this.prisma.session.delete({
      where: {id: sessionId},
    })
    res.clearCookie('refreshToken');
  }
  async sendOTPCode(email: string) {
    let existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existingUser) {
      throw new HttpException('email used', HttpStatus.UNAUTHORIZED);
    }
    let randomOTP = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.verificationCode.create({
      data: {
        code: randomOTP,
        type: 'REGISTER',
        expiresAt: new Date(Date.now() + 60 * 1000),
        email,
      },
    });
    await this.sesService.sendEmail(
      email,
      'please verify your mail',
      undefined,
      randomOTP,
    );
  }
  async setup2FA(userId: number, appName = 'MyApp') {
    const secret = speakeasy.generateSecret({
      name: `${appName} (User ${userId})`, // this will show nicely in Authenticator app
      length: 20,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret.base32 },
    });
    //for frontend
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');
    return {
      secret: secret.base32,
      url: secret.otpauth_url
    };
  }
  async disable2FA(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: null },
    });
    return { message: 'disable 2fa done' };
  }

  async confirm2FA(userId: number, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) throw new UnauthorizedException('2FA not setup');

    const isValid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) throw new UnauthorizedException('Invalid 2FA code');

    return { message: '2fa enabled' };
  }
}
