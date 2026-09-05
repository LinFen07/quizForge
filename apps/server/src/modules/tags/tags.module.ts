import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { AuditService } from '../common/audit.service';

@Module({
  controllers: [TagsController],
  providers: [TagsService, AuditService],
  exports: [TagsService],
})
export class TagsModule {}
