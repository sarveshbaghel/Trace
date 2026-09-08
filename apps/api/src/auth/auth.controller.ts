import { Controller, Post, Get, Body, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body(new ZodValidationPipe(SignupSchema)) body: any) {
    // Basic mock implementation for now
    return { accessToken: 'mock-jwt-token-for-' + body.email };
  }

  @Post('login')
  async login(@Body(new ZodValidationPipe(LoginSchema)) body: any) {
    // Basic mock implementation for now
    return { accessToken: 'mock-jwt-token-for-' + body.email };
  }

  @Get('me')
  async getMe(@Request() req: any) {
    // Mock user response
    return {
      id: 'mock-user-id',
      email: 'user@example.com',
      name: 'Test User'
    };
  }

  @Post('otp/request')
  async requestOtp(@Body() body: any) {
    return { message: 'otp request stub' };
  }

  @Post('otp/verify')
  async verifyOtp(@Body() body: any) {
    return { message: 'otp verify stub' };
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    return { message: 'refresh stub' };
  }

  @Post('logout')
  async logout(@Request() req: any) {
    return { message: 'logout stub' };
  }
}
