import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: '字节跳动', description: '公司名称' })
  @IsString({ message: '公司名称不能为空' })
  name: string;

  @ApiPropertyOptional({ example: '["ByteDance", "字节"]', description: '别名 JSON 数组' })
  @IsOptional()
  @IsString()
  alias?: string;
}
