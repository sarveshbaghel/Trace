import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ComplaintsModule } from '../complaints/complaints.module';

@Module({
  imports: [
    ComplaintsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'local_development_secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
