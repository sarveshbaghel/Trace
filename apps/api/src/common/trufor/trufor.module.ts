import { Module } from '@nestjs/common';
import { TruforService } from './trufor.service';

@Module({
  providers: [TruforService],
  exports: [TruforService],
})
export class TruforModule {}
