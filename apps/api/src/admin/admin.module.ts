import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplaintsModule } from '../complaints/complaints.module';

import { TruforModule } from '../common/trufor/trufor.module';

@Module({
  imports: [
    PrismaModule,
    ComplaintsModule,
    TruforModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'local_development_secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}