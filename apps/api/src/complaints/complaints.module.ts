import { Module } from '@nestjs/common';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TwitterModule } from '../common/twitter/twitter.module';
import { FirebaseModule } from '../common/firebase/firebase.module';

@Module({
  imports: [PrismaModule, TwitterModule, FirebaseModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
})
export class ComplaintsModule {}
