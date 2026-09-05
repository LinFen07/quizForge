import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('recent')
  @ApiOperation({ summary: '获取最近审计日志' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findRecent(@Query('limit') limit?: number) {
    return this.audit.findRecent(limit ?? 100);
  }

  @Get(':entity/:entityId')
  @ApiOperation({ summary: '获取指定实体的审计日志' })
  findByEntity(@Param('entity') entity: string, @Param('entityId', ParseIntPipe) entityId: number) {
    return this.audit.findByEntity(entity as any, entityId);
  }
}
