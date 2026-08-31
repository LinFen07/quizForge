import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PracticeService } from './practice.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

@ApiTags('practice')
@Controller('practice')
export class PracticeController {
  constructor(private readonly service: PracticeService) {}

  @Post('sessions')
  @ApiOperation({ summary: '开始刷题会话' })
  startSession() {
    return this.service.startSession();
  }

  @Post('sessions/:id/end')
  @ApiOperation({ summary: '结束刷题会话' })
  endSession(@Query('id') id: number) {
    return this.service.endSession(id);
  }

  @Get('random')
  @ApiOperation({ summary: '获取随机题目' })
  getRandomQuestion(@Query() query: ReviewQueryDto) {
    return this.service.getRandomQuestion(query);
  }

  @Get('review-queue')
  @ApiOperation({ summary: '获取复习队列' })
  getReviewQueue(@Query() query: ReviewQueryDto) {
    return this.service.getReviewQueue(query);
  }

  @Post('records')
  @ApiOperation({ summary: '提交刷题记录' })
  submitAnswer(@Body() dto: SubmitAnswerDto) {
    return this.service.submitAnswer(dto);
  }

  @Get('stats/:questionId')
  @ApiOperation({ summary: '获取题目刷题统计' })
  getQuestionStats(@Query('questionId') questionId: number) {
    return this.service.getQuestionStats(questionId);
  }
}
