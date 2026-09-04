import { IsArray, IsNumber, IsString, IsOptional, IsIn, Min, Max, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BatchDeleteDto {
  @ApiProperty({ type: [Number], description: '要删除的题目 ID 列表', example: [1, 2, 3] })
  @IsArray({ message: 'IDs 必须是数组' })
  @IsNumber({}, { each: true, message: 'ID 必须是数字' })
  @ArrayMinSize(1, { message: '至少选择一个题目' })
  @ArrayMaxSize(100, { message: '单次最多删除 100 个题目' })
  ids: number[];
}

export class BatchUpdateDto {
  @ApiProperty({ type: [Number], description: '要更新的题目 ID 列表', example: [1, 2, 3] })
  @IsArray({ message: 'IDs 必须是数组' })
  @IsNumber({}, { each: true, message: 'ID 必须是数字' })
  @ArrayMinSize(1, { message: '至少选择一个题目' })
  @ArrayMaxSize(100, { message: '单次最多更新 100 个题目' })
  ids: number[];

  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: '新难度' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ description: '新知识点 ID' })
  @IsOptional()
  @IsNumber()
  knowledgePointId?: number;

  @ApiPropertyOptional({ type: [Number], description: '替换标签列表（全量替换）' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds?: number[];

  @ApiPropertyOptional({ type: [Number], description: '替换公司列表（全量替换）' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  companyIds?: number[];
}
