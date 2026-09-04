import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionQueryDto } from './dto/question-query.dto';
import { BatchDeleteDto, BatchUpdateDto } from './dto/batch.dto';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: '分页查询题目列表' })
  findAll(@Query() query: QuestionQueryDto) {
    return this.questionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询题目详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建题目' })
  create(@Body() dto: CreateQuestionDto) {
    return this.questionsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新题目' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除题目（软删除）' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: '恢复已删除的题目' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.restore(id);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: '永久删除题目' })
  permanentlyDelete(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.permanentlyDelete(id);
  }

  @Post('batch/delete')
  @ApiOperation({ summary: '批量删除题目' })
  batchDelete(@Body() dto: BatchDeleteDto) {
    return this.questionsService.batchDelete(dto);
  }

  @Post('batch/update')
  @ApiOperation({ summary: '批量更新题目' })
  batchUpdate(@Body() dto: BatchUpdateDto) {
    return this.questionsService.batchUpdate(dto);
  }

  @Get(':id/audit-logs')
  @ApiOperation({ summary: '获取题目审计日志' })
  getAuditLogs(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.getAuditLogs(id);
  }
}
