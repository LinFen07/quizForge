import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKnowledgePointDto } from './dto/create-knowledge-point.dto';
import { UpdateKnowledgePointDto } from './dto/update-knowledge-point.dto';

@Injectable()
export class KnowledgePointsService {
  constructor(private prisma: PrismaService) {}

  async getTree() {
    const points = await this.prisma.knowledgePoint.findMany({
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return this.buildTree(points);
  }

  private buildTree(items: any[], parentId: number | null = null): any[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        questionCount: item._count.questions,
        children: this.buildTree(items, item.id),
      }));
  }

  async create(dto: CreateKnowledgePointDto) {
    if (dto.parentId) {
      const parent = await this.prisma.knowledgePoint.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException(`Parent #${dto.parentId} not found`);
    }

    return this.prisma.knowledgePoint.create({ data: dto });
  }

  async update(id: number, dto: UpdateKnowledgePointDto) {
    await this.findById(id);
    return this.prisma.knowledgePoint.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findById(id);
    const children = await this.prisma.knowledgePoint.count({
      where: { parentId: id },
    });
    if (children > 0) {
      throw new Error('Cannot delete: has children. Delete children first.');
    }
    return this.prisma.knowledgePoint.delete({ where: { id } });
  }

  private async findById(id: number) {
    const point = await this.prisma.knowledgePoint.findUnique({ where: { id } });
    if (!point) throw new NotFoundException(`KnowledgePoint #${id} not found`);
    return point;
  }
}
