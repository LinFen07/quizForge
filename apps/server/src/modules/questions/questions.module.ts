import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { AuditService } from '../common/audit.service';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, AuditService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
