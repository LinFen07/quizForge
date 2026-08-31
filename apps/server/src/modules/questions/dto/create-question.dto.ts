import { IsString, IsOptional, IsNumber, IsArray, Min, Max, IsIn, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const QUESTION_TYPES = ['concept', 'coding', 'scene', 'algorithm'] as const;

export class CreateQuestionDto {
  @ApiProperty({ example: '手写一个防抖函数', description: '题干内容' })
  @IsString({ message: '题干不能为空' })
  title: string;

  @ApiProperty({ enum: QUESTION_TYPES, description: '题型' })
  @IsString({ message: '题型不能为空' })
  @IsIn(QUESTION_TYPES, { message: `题型必须是 ${QUESTION_TYPES.join(' | ')} 之一` })
  type: string;

  @ApiPropertyOptional({ default: 3, minimum: 1, maximum: 5, description: '难度 1-5' })
  @IsOptional()
  @IsNumber({}, { message: '难度必须是数字' })
  @Min(1, { message: '难度最小为 1' })
  @Max(5, { message: '难度最大为 5' })
  difficulty?: number;

  @ApiPropertyOptional({ description: '关联知识点 ID' })
  @IsOptional()
  @IsNumber({}, { message: '知识点 ID 必须是数字' })
  knowledgePointId?: number;

  @ApiPropertyOptional({ description: '参考解答（Markdown）' })
  @IsOptional()
  @IsString()
  referenceAnswer?: string;

  @ApiPropertyOptional({ example: '字节 2024 二面', description: '题目来源' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ type: [Number], description: '关联标签 ID 列表' })
  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  @IsNumber({}, { each: true, message: '标签 ID 必须是数字' })
  @ArrayMaxSize(20, { message: '最多关联 20 个标签' })
  tagIds?: number[];
}
