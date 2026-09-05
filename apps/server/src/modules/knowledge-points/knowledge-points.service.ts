import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { CreateKnowledgePointDto } from './dto/create-knowledge-point.dto';
import { UpdateKnowledgePointDto } from './dto/update-knowledge-point.dto';

@Injectable()
export class KnowledgePointsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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

    const point = await this.prisma.knowledgePoint.create({ data: dto });

    await this.audit.log({
      entity: 'knowledge_point',
      entityId: point.id,
      action: 'create',
    });

    return point;
  }

  async update(id: number, dto: UpdateKnowledgePointDto) {
    const old = await this.findById(id);

    const point = await this.prisma.knowledgePoint.update({ where: { id }, data: dto });

    const changes: Record<string, { old: any; new: any }> = {};
    if (dto.name && dto.name !== old.name) {
      changes.name = { old: old.name, new: dto.name };
    }
    if (dto.sortOrder !== undefined && dto.sortOrder !== old.sortOrder) {
      changes.sortOrder = { old: old.sortOrder, new: dto.sortOrder };
    }

    await this.audit.log({
      entity: 'knowledge_point',
      entityId: id,
      action: 'update',
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });

    return point;
  }

  async remove(id: number) {
    await this.findById(id);
    const children = await this.prisma.knowledgePoint.count({
      where: { parentId: id },
    });
    if (children > 0) {
      throw new BadRequestException('无法删除：存在子知识点，请先删除子知识点');
    }

    await this.prisma.knowledgePoint.delete({ where: { id } });

    await this.audit.log({
      entity: 'knowledge_point',
      entityId: id,
      action: 'delete',
    });

    return { success: true, message: '知识点已删除' };
  }

  private async findById(id: number) {
    const point = await this.prisma.knowledgePoint.findUnique({ where: { id } });
    if (!point) throw new NotFoundException(`KnowledgePoint #${id} not found`);
    return point;
  }
}
