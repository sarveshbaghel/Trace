import { Controller, Post, Get, Put, Body, Request, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';

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
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body(new ZodValidationPipe(SignupSchema)) body: any) {
    this.logger.log(`POST /api/v1/auth/signup — email: ${body.email}`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(body.password, salt);
    return this.authService.signup(body.email, passwordHash, body.name);
  }

  @Post('login')
  async login(@Body(new ZodValidationPipe(LoginSchema)) body: any) {
    this.logger.log(`POST /api/v1/auth/login — email: ${body.email}`);
    return this.authService.login(body.email, body.password);
  }

  @Post('google')
  async googleLogin(@Body() body: any) {
    this.logger.log(`POST /api/v1/auth/google`);
    if (!body.token) {
      throw new UnauthorizedException('Token is required');
    }
    return this.authService.googleLogin(body.token);
  }

  private extractUserId(req: any): string {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const jwtService = new JwtService();
        const decoded = jwtService.decode(token) as any;
        if (decoded && decoded.sub) {
          return decoded.sub;
        }
      } catch (err) {}
    }
    throw new UnauthorizedException('Invalid or missing token');
  }

  @Get('me')
  async getMe(@Request() req: any) {
    this.logger.log('GET /api/v1/auth/me');
    const userId = this.extractUserId(req);
    return this.authService.getMe(userId);
  }

  @Put('me')
  async updateMe(@Request() req: any, @Body() body: any) {
    this.logger.log('PUT /api/v1/auth/me');
    const userId = this.extractUserId(req);
    return this.authService.updateProfile(userId, {
      name: body.name,
      phone: body.phone,
      home_city_id: body.home_city_id
    });
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
