import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { AdminModule } from './admin/admin.module';
import { AuthoritiesModule } from './authorities/authorities.module';
import { InternalModule } from './internal/internal.module';
import { PrismaModule } from './prisma/prisma.module';
import { FirebaseModule } from './common/firebase/firebase.module';

@Module({
  imports: [AuthModule, UsersModule, ComplaintsModule, AdminModule, AuthoritiesModule, InternalModule, PrismaModule, FirebaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
