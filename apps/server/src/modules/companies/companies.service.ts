import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(withCount = false) {
    return this.prisma.company.findMany({
      include: {
        _count: withCount ? { select: { questions: true } } : undefined,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            question: {
              include: {
                knowledgePoint: { select: { id: true, name: true } },
                tags: { include: { tag: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) throw new NotFoundException(`公司 #${id} 不存在`);

    return {
      ...company,
      questions: company.questions.map((qc) => ({
        ...qc.question,
        tags: qc.question.tags.map((qt) => qt.tag),
      })),
    };
  }

  async create(dto: CreateCompanyDto) {
    const existing = await this.prisma.company.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException(`公司 "${dto.name}" 已存在`);

    const company = await this.prisma.company.create({ data: dto });

    await this.audit.log({
      entity: 'question',
      entityId: company.id,
      action: 'create',
    });

    return company;
  }

  async update(id: number, dto: UpdateCompanyDto) {
    const old = await this.findById(id);

    if (dto.name) {
      const existing = await this.prisma.company.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException(`公司 "${dto.name}" 已存在`);
    }

    const company = await this.prisma.company.update({ where: { id }, data: dto });

    const changes: Record<string, { old: any; new: any }> = {};
    if (dto.name && dto.name !== old.name) {
      changes.name = { old: old.name, new: dto.name };
    }
    if (dto.alias !== undefined && dto.alias !== old.alias) {
      changes.alias = { old: old.alias, new: dto.alias };
    }

    await this.audit.log({
      entity: 'question',
      entityId: id,
      action: 'update',
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });

    return company;
  }

  async remove(id: number) {
    await this.findById(id);

    await this.prisma.company.delete({ where: { id } });

    await this.audit.log({
      entity: 'question',
      entityId: id,
      action: 'delete',
    });

    return { success: true, message: '公司已删除' };
  }

  async findByQuestionIds(questionIds: number[]) {
    const relations = await this.prisma.questionCompany.findMany({
      where: { questionId: { in: questionIds } },
      include: { company: true },
    });

    const map = new Map<number, any[]>();
    for (const r of relations) {
      if (!map.has(r.questionId)) map.set(r.questionId, []);
      map.get(r.questionId)!.push(r.company);
    }

    return map;
  }

  private async findById(id: number) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException(`公司 #${id} 不存在`);
    return company;
  }
}
