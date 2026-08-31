import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionQueryDto } from './dto/question-query.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QuestionQueryDto) {
    const { keyword, knowledgePointId, tagIds, difficulty, type, page = 1, pageSize = 20, sort = 'createdAt' } = query;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { referenceAnswer: { contains: keyword } },
      ];
    }
    if (knowledgePointId) where.knowledgePointId = knowledgePointId;
    if (difficulty) where.difficulty = difficulty;
    if (type) where.type = type;
    if (tagIds?.length) {
      where.tags = { some: { tagId: { in: tagIds } } };
    }

    const [items, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: {
          knowledgePoint: { select: { id: true, name: true } },
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
          _count: { select: { practiceRecords: true } },
        },
        orderBy: { [sort]: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      items: items.map((q) => ({
        ...q,
        tags: q.tags.map((qt) => qt.tag),
        practiceCount: q._count.practiceRecords,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        knowledgePoint: true,
        tags: { include: { tag: true } },
        practiceRecords: {
          orderBy: { practicedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!question) throw new NotFoundException(`Question #${id} not found`);
    return {
      ...question,
      tags: question.tags.map((qt) => qt.tag),
    };
  }

  async create(dto: CreateQuestionDto) {
    const { tagIds, ...data } = dto;
    return this.prisma.question.create({
      data: {
        ...data,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: {
        knowledgePoint: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
      },
    });
  }

  async update(id: number, dto: UpdateQuestionDto) {
    await this.findOne(id);
    const { tagIds, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.questionTag.deleteMany({ where: { questionId: id } });
        if (tagIds.length) {
          await tx.questionTag.createMany({
            data: tagIds.map((tagId) => ({ questionId: id, tagId })),
          });
        }
      }

      return tx.question.update({
        where: { id },
        data,
        include: {
          knowledgePoint: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.question.delete({ where: { id } });
  }
}
