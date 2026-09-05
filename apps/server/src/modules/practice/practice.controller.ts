import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PracticeService } from './practice.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

@ApiTags('practice')
@Controller('practice')
export class PracticeController {
  constructor(private readonly service: PracticeService) {}

  @Post('sessions')
  @ApiOperation({ summary: '开始刷题会话（自动出题）' })
  startSession(@Body() dto: StartSessionDto) {
    return this.service.startSession(dto);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '获取会话详情（含快照统计）' })
  getSession(@Param('id', ParseIntPipe) id: number) {
    return this.service.getSession(id);
  }

  @Get('sessions/:id/next')
  @ApiOperation({ summary: '获取下一题' })
  getNextQuestion(@Param('id', ParseIntPipe) id: number) {
    return this.service.getNextQuestion(id);
  }

  @Post('sessions/:id/end')
  @ApiOperation({ summary: '结束刷题会话' })
  endSession(@Param('id', ParseIntPipe) id: number) {
    return this.service.endSession(id);
  }

  @Post('sessions/:sessionId/skip/:questionId')
  @ApiOperation({ summary: '跳过题目' })
  skipQuestion(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    return this.service.skipQuestion(sessionId, questionId);
  }

  @Get('random')
  @ApiOperation({ summary: '获取随机题目' })
  getRandomQuestion(@Query() query: ReviewQueryDto) {
    return this.service.getRandomQuestion(query);
  }

  @Get('review')
  @ApiOperation({ summary: 'SM-2 间隔复习队列（到期题目）' })
  getReviewQueue(@Query() query: ReviewQueryDto) {
    return this.service.getReviewQueue(query);
  }

  @Get('review-queue')
  @ApiOperation({ summary: '获取复习队列（旧版兼容）' })
  getReviewQueueLegacy(@Query() query: ReviewQueryDto) {
    return this.service.getReviewQueue(query);
  }

  @Post('records')
  @ApiOperation({ summary: '提交刷题记录' })
  submitAnswer(@Body() dto: SubmitAnswerDto) {
    return this.service.submitAnswer(dto);
  }

  @Get('stats/:questionId')
  @ApiOperation({ summary: '获取题目刷题统计' })
  getQuestionStats(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.service.getQuestionStats(questionId);
  }
}
