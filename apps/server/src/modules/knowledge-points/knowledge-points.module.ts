import { Module } from '@nestjs/common';
import { KnowledgePointsController } from './knowledge-points.controller';
import { KnowledgePointsService } from './knowledge-points.service';
import { AuditService } from '../common/audit.service';

@Module({
  controllers: [KnowledgePointsController],
  providers: [KnowledgePointsService, AuditService],
  exports: [KnowledgePointsService],
})
export class KnowledgePointsModule {}
