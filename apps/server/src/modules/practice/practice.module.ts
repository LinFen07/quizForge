import { Module } from '@nestjs/common';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { SpacedReputationService } from './spaced-reputation.service';
import { AuditService } from '../common/audit.service';

@Module({
  controllers: [PracticeController],
  providers: [PracticeService, SpacedReputationService, AuditService],
  exports: [PracticeService],
})
export class PracticeModule {}
