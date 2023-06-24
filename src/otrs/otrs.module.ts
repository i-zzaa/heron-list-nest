import { Module } from '@nestjs/common';
import { OtrsService } from './otrs.service';

@Module({
  providers: [OtrsService],
  exports: [OtrsService],
})
export class OtrsModule {}
