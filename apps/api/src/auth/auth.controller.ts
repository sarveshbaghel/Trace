import { Controller, Post, Body, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    // Stub
    return { message: 'register stub' };
  }

  @Post('login')
  async login(@Body(new ZodValidationPipe(LoginSchema)) body: any) {
    // Stub
    return { message: 'login stub', ...body };
  }

  @Post('otp/request')
  async requestOtp(@Body() body: any) {
    // Stub
    return { message: 'otp request stub' };
  }

  @Post('otp/verify')
  async verifyOtp(@Body() body: any) {
    // Stub
    return { message: 'otp verify stub' };
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    // Stub
    return { message: 'refresh stub' };
  }

  @Post('logout')
  async logout(@Request() req: any) {
    // Stub
    return { message: 'logout stub' };
  }

  @Post('password/forgot')
  async forgotPassword(@Body() body: any) {
    // Stub
    return { message: 'forgot stub' };
  }

  @Post('password/reset')
  async resetPassword(@Body() body: any) {
    // Stub
    return { message: 'reset stub' };
  }
}
