import { IsOptional, IsNumber, IsString, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50, description: '本次出题数量' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  count?: number;

  @ApiPropertyOptional({ description: '知识点 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  knowledgePointId?: number;

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
  type?: string;

  @ApiPropertyOptional({ type: [Number], description: '标签 ID 列表' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  tagIds?: number[];

  @ApiPropertyOptional({ type: [Number], description: '公司 ID 列表' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  companyIds?: number[];
}
