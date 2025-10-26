import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Put,
  Post
} from '@nestjs/common';
import { UserService } from './user.service';
import { type JwtPayload} from 'src/types';
import { ChangePasswordDto, UpdateUserDto, UserResponseDto, UpdateUserResponseDto, ChangePasswordResponseDto } from './dto/user.dto.';
import { User } from 'src/common/decorator/user.decorator';
import { ZodResponse } from 'nestjs-zod';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  @Get('me')
  @ZodResponse({ type: UserResponseDto })
  async getMe(@User() user: JwtPayload) {
    let id = user?.id;
    if (!id) {
      throw new HttpException('not found id', HttpStatus.NOT_ACCEPTABLE);
    }
    let foundUser = await this.userService.handleGet(id);
    return foundUser
  }
  
  @Put('update')
  @ZodResponse({ type: UpdateUserResponseDto })
  async updateUser(
    @User() user: JwtPayload, 
    @Body() updateUserDto: UpdateUserDto
  ) {
    let id = user?.id;
    if (!id) {
      throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
    }
    
    const updatedUser = await this.userService.updateUser(id, updateUserDto);
    return updatedUser;
  }
  @Post('change-password')
  @ZodResponse({ type: ChangePasswordResponseDto })
  async changePassword(
    @User() user: JwtPayload,
    @Body() dto: ChangePasswordDto
  ) {
    return this.userService.changePassword(user.id, dto);
  }
}
