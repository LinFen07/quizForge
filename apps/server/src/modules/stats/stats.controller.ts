import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('mastery-overview')
  @ApiOperation({ summary: '掌握度总览' })
  getMasteryOverview() {
    return this.service.getMasteryOverview();
  }

  @Get('knowledge-mastery')
  @ApiOperation({ summary: '知识点掌握情况' })
  getKnowledgeMastery() {
    return this.service.getKnowledgeMastery();
  }

  @Get('trend')
  @ApiOperation({ summary: '刷题趋势' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getTrend(@Query('days') days?: number) {
    return this.service.getTrend(days ?? 30);
  }
}
