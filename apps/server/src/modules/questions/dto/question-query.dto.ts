import { IsOptional, IsString, IsNumber, IsArray, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const SORT_FIELDS = ['createdAt', 'updatedAt', 'difficulty', 'title'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;

export class QuestionQueryDto {
  @ApiPropertyOptional({ description: '关键词搜索（标题+解答）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '知识点 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '知识点 ID 必须是数字' })
  knowledgePointId?: number;

  @ApiPropertyOptional({ type: [Number], description: '标签 ID 列表（AND 逻辑）' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  tagIds?: number[];

  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: '难度筛选' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ enum: ['concept', 'coding', 'scene', 'algorithm'], description: '题型筛选' })
  @IsOptional()
  @IsString()
  @IsIn(['concept', 'coding', 'scene', 'algorithm'], { message: '题型无效' })
  type?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, description: '页码' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 200, description: '每页数量' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  pageSize?: number;

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: 'createdAt', description: '排序字段' })
  @IsOptional()
  @IsString()
  @IsIn(SORT_FIELDS as unknown as string[], { message: `排序字段必须是 ${SORT_FIELDS.join(' | ')} 之一` })
  sort?: string;

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'desc', description: '排序方向' })
  @IsOptional()
  @IsString()
  @IsIn(SORT_ORDERS as unknown as string[], { message: '排序方向必须是 asc 或 desc' })
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: '是否包含已删除的题目' })
  @IsOptional()
  @Type(() => Boolean)
  includeDeleted?: boolean;

  @ApiPropertyOptional({ type: [Number], description: '公司 ID 列表（AND 逻辑）' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  companyIds?: number[];
}
