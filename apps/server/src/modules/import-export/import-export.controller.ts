import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ImportExportService } from './import-export.service';

@ApiTags('import-export')
@Controller('import-export')
export class ImportExportController {
  constructor(private readonly service: ImportExportService) {}

  @Get('export')
  @ApiOperation({ summary: '全量导出' })
  exportAll() {
    return this.service.exportAll();
  }

  @Post('import')
  @ApiOperation({ summary: '批量导入题目' })
  importQuestions(@Body() data: any[]) {
    return this.service.importQuestions(data);
  }
}
