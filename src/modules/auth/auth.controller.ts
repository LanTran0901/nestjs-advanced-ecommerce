import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { authService } from './auth.service';
import { LoginDto, RegisterDto, SendOtpDto, RegisterResponseDto, LoginResponseDto, RefreshTokenResponseDto, LogoutResponseDto, SendOtpResponseDto, Setup2FAResponseDto, Verify2FAResponseDto, Disable2FAResponseDto } from './dto/auth.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodResponse } from 'nestjs-zod';
import { configMulter } from 'src/utils/upload';
import { type JwtPayload } from 'src/types';
import { RefreshTokenGuard } from './guard/jwt-auth.guard';
import { type Request, type Response } from 'express';
import { GoogleService } from './google.service';
import { Public } from 'src/common/decorator/public.decorator';
import { User, UserAgent } from 'src/common/decorator/user.decorator';

@Controller('auth')
export class authController {
  constructor(
    private authService: authService,
    private googleService: GoogleService,
  ) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('file', configMulter))
  @Public()
  @ZodResponse({ type: RegisterResponseDto })
  async register(
    @Body() body: RegisterDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let response = await this.authService.registerUser(body, file);
    return response;
  }

  @Post('login')
  @Public()
  async login(
    @Body() body: LoginDto,
    @Res() res: Response,
    @Ip() ip: string,
    @Req() req: Request,
    @UserAgent() agent: string,
  ) {
    let { accessToken } = await this.authService.loginUser(
      body,
      res,
      ip,
      agent as string,
    );

    return res.json({ message: 'login successfully', accessToken });
  }

  @Get('refreshToken')
  @Public()
  @UseGuards(RefreshTokenGuard)
  async refreshToken(@User() user: JwtPayload, @Res() res: Response) {
    console.log(user);
    let { accessToken } = await this.authService.handleRefreshToken(user, res);

    return res.json({ message: 'refresh token successfully', accessToken });
  }

  @Get('logout')
  async logout(@User() user: JwtPayload, @Res() res: Response) {
    await this.authService.handleLogout(user, res);
    return res.json({ message: 'logout successfully' });
  }

  @Post('send-otp')
  @ZodResponse({ type: SendOtpResponseDto })
  async sendOtp(@Body() body: SendOtpDto) {
    const { email } = body;
    await this.authService.sendOTPCode(email);
    return { message: 'otp sent' };
  }

  @Post('setup-2fa')
  @ZodResponse({ type: Setup2FAResponseDto })
  async setup(@User() user: JwtPayload) {
    return this.authService.setup2FA(user.id);
  }

  @Post('verify-2fa')
  @ZodResponse({ type: Verify2FAResponseDto })
  async confirm(@User() user: JwtPayload, @Body('code') code: string) {
    return this.authService.confirm2FA(user.id, code);
  }

  @Post('disable-2fa')
  @ZodResponse({ type: Disable2FAResponseDto })
  async disable(@User() user: JwtPayload) {
    return this.authService.disable2FA(user.id);
  }
  @Get('google')
  @Public()
  redirectToGoogle(@Res() res: Response) {
    const url = this.googleService.getGoogleAuthUrl();
    return res.redirect(url);
  }
  @Get('google/callback')
  @Public()
  async googleCallback(
    @Query('code') code: string,
    @UserAgent() agent: string,
    @Res() res: Response,
    @Ip() ip: string,
  ) {
    await this.googleService.handleLogin(code, ip, agent,res);
    return res.redirect('http://localhost:3000/dashboard');
  }
}
