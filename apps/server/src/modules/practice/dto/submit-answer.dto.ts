import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty()
  @IsNumber()
  questionId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sessionId?: number;

  @ApiProperty({ enum: ['correct', 'wrong', 'fuzzy'] })
  @IsString()
  result: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  myAnswer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMs?: number;
}
