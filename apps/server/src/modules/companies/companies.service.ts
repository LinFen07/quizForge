import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.company.create({ data: dto });
  }

  async update(id: number, dto: UpdateCompanyDto) {
    await this.findById(id);

    if (dto.name) {
      const existing = await this.prisma.company.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException(`公司 "${dto.name}" 已存在`);
    }

    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.company.delete({ where: { id } });
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
