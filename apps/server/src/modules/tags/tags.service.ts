import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(withCount = false) {
    const tags = await this.prisma.tag.findMany({
      include: {
        _count: withCount ? { select: { questions: true } } : undefined,
      },
      orderBy: { name: 'asc' },
    });
    return tags;
  }

  async create(dto: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Tag "${dto.name}" already exists`);

    const tag = await this.prisma.tag.create({ data: dto });

    await this.audit.log({
      entity: 'tag',
      entityId: tag.id,
      action: 'create',
    });

    return tag;
  }

  async update(id: number, dto: UpdateTagDto) {
    const old = await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.tag.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException(`Tag "${dto.name}" already exists`);
    }

    const tag = await this.prisma.tag.update({ where: { id }, data: dto });

    const changes: Record<string, { old: any; new: any }> = {};
    if (dto.name && dto.name !== old.name) {
      changes.name = { old: old.name, new: dto.name };
    }
    if (dto.color !== undefined && dto.color !== old.color) {
      changes.color = { old: old.color, new: dto.color };
    }

    await this.audit.log({
      entity: 'tag',
      entityId: id,
      action: 'update',
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });

    return tag;
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.tag.delete({ where: { id } });

    await this.audit.log({
      entity: 'tag',
      entityId: id,
      action: 'delete',
    });

    return { success: true, message: '标签已删除' };
  }

  private async findOne(id: number) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException(`Tag #${id} not found`);
    return tag;
  }
}
