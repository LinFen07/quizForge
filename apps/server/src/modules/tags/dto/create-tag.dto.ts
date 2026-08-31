import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: '高频' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '#e74c3c' })
  @IsOptional()
  @IsString()
  color?: string;
}
