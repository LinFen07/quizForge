import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService, AiSettings, GenerateQuestionDto, AnalyzeAnswerDto } from './ai.service';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('settings')
  @ApiOperation({ summary: '获取 AI 设置' })
  getSettings() {
    return this.aiService.getSettings();
  }

  @Post('settings')
  @ApiOperation({ summary: '更新 AI 设置' })
  updateSettings(@Body() settings: AiSettings) {
    return this.aiService.updateSettings(settings);
  }

  @Post('generate')
  @ApiOperation({ summary: 'AI 智能出题' })
  generateQuestions(@Body() dto: GenerateQuestionDto) {
    return this.aiService.generateQuestions(dto);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'AI 答案解析' })
  analyzeAnswer(@Body() dto: AnalyzeAnswerDto) {
    return this.aiService.analyzeAnswer(dto);
  }
}
