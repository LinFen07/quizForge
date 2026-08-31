import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KnowledgePointsService } from './knowledge-points.service';
import { CreateKnowledgePointDto } from './dto/create-knowledge-point.dto';
import { UpdateKnowledgePointDto } from './dto/update-knowledge-point.dto';

@ApiTags('knowledge-points')
@Controller('knowledge-points')
export class KnowledgePointsController {
  constructor(private readonly service: KnowledgePointsService) {}

  @Get('tree')
  @ApiOperation({ summary: '获取知识点树' })
  getTree() {
    return this.service.getTree();
  }

  @Post()
  @ApiOperation({ summary: '创建知识点' })
  create(@Body() dto: CreateKnowledgePointDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新知识点' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKnowledgePointDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除知识点' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
