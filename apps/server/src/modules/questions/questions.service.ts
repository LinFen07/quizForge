import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionQueryDto } from './dto/question-query.dto';
import { BatchDeleteDto, BatchUpdateDto } from './dto/batch.dto';

@Injectable()
export class QuestionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(query: QuestionQueryDto) {
    const {
      keyword,
      knowledgePointId,
      tagIds,
      companyIds,
      difficulty,
      type,
      page = 1,
      pageSize = 20,
      sort = 'createdAt',
      order = 'desc',
      includeDeleted = false,
    } = query;

    const where: any = {};

    // 软删除过滤
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    // 关键词搜索
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { referenceAnswer: { contains: keyword } },
        { source: { contains: keyword } },
      ];
    }

    // 筛选条件
    if (knowledgePointId) where.knowledgePointId = knowledgePointId;
    if (difficulty) where.difficulty = difficulty;
    if (type) where.type = type;
    if (tagIds?.length) {
      where.tags = { some: { tagId: { in: tagIds } } };
    }
    if (companyIds?.length) {
      where.companies = { some: { companyId: { in: companyIds } } };
    }

    const [items, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: {
          knowledgePoint: { select: { id: true, name: true } },
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
          companies: { include: { company: { select: { id: true, name: true } } } },
          _count: { select: { practiceRecords: true } },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      items: items.map((q) => ({
        ...q,
        tags: q.tags.map((qt) => qt.tag),
        companies: q.companies.map((qc) => qc.company),
        practiceCount: q._count.practiceRecords,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number, includeDeleted = false) {
    const where: any = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const question = await this.prisma.question.findFirst({
      where,
      include: {
        knowledgePoint: true,
        tags: { include: { tag: true } },
        companies: { include: { company: true } },
        practiceRecords: {
          orderBy: { practicedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!question) throw new NotFoundException(`题目 #${id} 不存在`);
    return {
      ...question,
      tags: question.tags.map((qt) => qt.tag),
      companies: question.companies.map((qc) => qc.company),
    };
  }

  async create(dto: CreateQuestionDto) {
    const { tagIds, companyIds, ...data } = dto;

    const question = await this.prisma.question.create({
      data: {
        ...data,
        difficulty: data.difficulty ?? 3,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
        companies: companyIds?.length
          ? { create: companyIds.map((companyId) => ({ companyId })) }
          : undefined,
      },
      include: {
        knowledgePoint: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        companies: { include: { company: true } },
      },
    });

    await this.audit.log({
      entity: 'question',
      entityId: question.id,
      action: 'create',
    });

    return {
      ...question,
      tags: question.tags.map((qt) => qt.tag),
      companies: question.companies.map((qc) => qc.company),
    };
  }

  async update(id: number, dto: UpdateQuestionDto) {
    const old = await this.findOne(id);
    const { tagIds, companyIds, ...data } = dto;

    const question = await this.prisma.$transaction(async (tx) => {
      // 更新标签
      if (tagIds !== undefined) {
        await tx.questionTag.deleteMany({ where: { questionId: id } });
        if (tagIds.length) {
          await tx.questionTag.createMany({
            data: tagIds.map((tagId) => ({ questionId: id, tagId })),
          });
        }
      }

      // 更新公司
      if (companyIds !== undefined) {
        await tx.questionCompany.deleteMany({ where: { questionId: id } });
        if (companyIds.length) {
          await tx.questionCompany.createMany({
            data: companyIds.map((companyId) => ({ questionId: id, companyId })),
          });
        }
      }

      return tx.question.update({
        where: { id },
        data,
        include: {
          knowledgePoint: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          companies: { include: { company: true } },
        },
      });
    });

    // 记录变更
    const changes: Record<string, { old: any; new: any }> = {};
    if (data.title && data.title !== old.title) {
      changes.title = { old: old.title, new: data.title };
    }
    if (data.difficulty && data.difficulty !== old.difficulty) {
      changes.difficulty = { old: old.difficulty, new: data.difficulty };
    }
    if (tagIds) {
      changes.tags = {
        old: old.tags.map((t: any) => t.id),
        new: tagIds,
      };
    }
    if (companyIds !== undefined) {
      changes.companies = {
        old: old.companies.map((c: any) => c.id),
        new: companyIds,
      };
    }

    await this.audit.log({
      entity: 'question',
      entityId: id,
      action: 'update',
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });

    return {
      ...question,
      tags: question.tags.map((qt: any) => qt.tag),
      companies: question.companies.map((qc: any) => qc.company),
    };
  }

  async remove(id: number) {
    const question = await this.findOne(id);

    // 软删除
    await this.prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      entity: 'question',
      entityId: id,
      action: 'delete',
    });

    return { success: true, message: '题目已删除' };
  }

  async restore(id: number) {
    const question = await this.prisma.question.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!question) throw new NotFoundException(`已删除的题目 #${id} 不存在`);

    await this.prisma.question.update({
      where: { id },
      data: { deletedAt: null },
    });

    await this.audit.log({
      entity: 'question',
      entityId: id,
      action: 'restore',
    });

    return { success: true, message: '题目已恢复' };
  }

  async permanentlyDelete(id: number) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException(`题目 #${id} 不存在`);

    await this.prisma.question.delete({ where: { id } });

    await this.audit.log({
      entity: 'question',
      entityId: id,
      action: 'delete',
    });

    return { success: true, message: '题目已永久删除' };
  }

  async batchDelete(dto: BatchDeleteDto) {
    const { ids } = dto;

    // 检查是否存在已删除的
    const questions = await this.prisma.question.findMany({
      where: { id: { in: ids } },
      select: { id: true, deletedAt: true },
    });

    if (questions.length !== ids.length) {
      throw new BadRequestException('部分题目不存在');
    }

    // 批量软删除
    await this.prisma.question.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });

    // 审计日志
    await this.audit.logBatch({
      entity: 'question',
      entityIds: ids,
      action: 'batch_delete',
    });

    return {
      success: true,
      message: `已删除 ${ids.length} 个题目`,
      deletedCount: ids.length,
    };
  }

  async batchUpdate(dto: BatchUpdateDto) {
    const { ids, ...data } = dto;

    // 过滤掉 undefined
    const updateData: any = {};
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.knowledgePointId !== undefined) updateData.knowledgePointId = data.knowledgePointId;

    await this.prisma.$transaction(async (tx) => {
      // 更新题目字段
      if (Object.keys(updateData).length > 0) {
        await tx.question.updateMany({
          where: { id: { in: ids } },
          data: updateData,
        });
      }

      // 更新标签（需要逐个处理）
      if (data.tagIds !== undefined) {
        for (const id of ids) {
          await tx.questionTag.deleteMany({ where: { questionId: id } });
          if (data.tagIds.length) {
            await tx.questionTag.createMany({
              data: data.tagIds.map((tagId) => ({ questionId: id, tagId })),
            });
          }
        }
      }

      // 更新公司（需要逐个处理）
      if (data.companyIds !== undefined) {
        for (const id of ids) {
          await tx.questionCompany.deleteMany({ where: { questionId: id } });
          if (data.companyIds.length) {
            await tx.questionCompany.createMany({
              data: data.companyIds.map((companyId) => ({ questionId: id, companyId })),
            });
          }
        }
      }
    });

    // 审计日志
    await this.audit.logBatch({
      entity: 'question',
      entityIds: ids,
      action: 'batch_update',
    });

    return {
      success: true,
      message: `已更新 ${ids.length} 个题目`,
      updatedCount: ids.length,
    };
  }

  async getAuditLogs(id: number) {
    return this.audit.findByEntity('question', id);
  }
}
