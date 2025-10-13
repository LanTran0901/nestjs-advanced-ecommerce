import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import { env } from 'src/utils/config';
import { PrismaService } from 'src/db/prisma.service';
import { authService } from './auth.service';
import { Response } from 'express';

@Injectable()
export class GoogleService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly authService:authService,
  ) {}

  getGoogleAuthUrl(): string {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
    };

    const queryParams = new URLSearchParams(options).toString();
    return `${rootUrl}?${queryParams}`;
  }

  async getTokens(code: string) {
     console.log(code);
    const url = 'https://oauth2.googleapis.com/token';

    const values = {
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    };

    const res = await axios.post(url,null, {
      params: values
    });

    return res.data;
  }

  async getGoogleUser(accessToken: string) {
   
    const res = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return res.data;
  }
  async handleLogin(code: string,ip: string,agent: string,res: Response) {
    const tokens = await this.getTokens(code);
    const googleUser = await this.getGoogleUser(tokens.access_token);
    let existingUser=await this.prisma.user.findUnique({
        where: {email: googleUser.email},
        include: {role: true}
    })
    if (!existingUser) {
        existingUser=await this.prisma.user.create({
        data: {
            email: googleUser.email,
            avatar: googleUser.picture,
            name: googleUser.name,
            roleId: 3
        },
        include: {role: true}
    })
    }
     let session= await this.prisma.session.create({
      data: {
        ip,
        userAgent: agent,
        refreshToken:' refreshToken',
        userId: existingUser.id,
      },
    });
    const { accessToken, refreshToken } = await this.authService.generateToken({
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
}
