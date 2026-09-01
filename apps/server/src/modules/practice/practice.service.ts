import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

@Injectable()
export class PracticeService {
  constructor(private prisma: PrismaService) {}

  async startSession(dto: StartSessionDto = {}) {
    const { count = 10, knowledgePointId, difficulty, type, tagIds, companyIds } = dto;

    const where: any = { deletedAt: null };
    if (knowledgePointId) where.knowledgePointId = knowledgePointId;
    if (difficulty) where.difficulty = difficulty;
    if (type) where.type = type;
    if (tagIds?.length) where.tags = { some: { tagId: { in: tagIds } } };
    if (companyIds?.length) where.companies = { some: { companyId: { in: companyIds } } };

    const total = await this.prisma.question.count({ where });
    if (total === 0) throw new NotFoundException('没有匹配的题目');

    const actualCount = Math.min(count, total);
    const allIds = await this.prisma.question.findMany({
      where,
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    const shuffled = allIds.sort(() => Math.random() - 0.5).slice(0, actualCount);

    const session = await this.prisma.$transaction(async (tx) => {
      const s = await tx.practiceSession.create({ data: {} });

      await tx.sessionQuestion.createMany({
        data: shuffled.map((q, idx) => ({
          sessionId: s.id,
          questionId: q.id,
          orderIndex: idx + 1,
          status: 'pending',
        })),
      });

      return tx.practiceSession.findUnique({
        where: { id: s.id },
        include: {
          questions: {
            include: {
              question: {
                include: {
                  knowledgePoint: { select: { id: true, name: true } },
                  tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
                  companies: { include: { company: { select: { id: true, name: true } } } },
                },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });
    });

    if (!session) throw new NotFoundException('Session 创建失败');

    return {
      ...session,
      questions: session.questions.map((sq) => ({
        orderIndex: sq.orderIndex,
        status: sq.status,
        result: sq.result,
        ...sq.question,
        tags: sq.question.tags.map((qt) => qt.tag),
        companies: sq.question.companies.map((qc) => qc.company),
      })),
    };
  }

  async getSession(sessionId: number) {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          include: {
            question: {
              include: {
                knowledgePoint: { select: { id: true, name: true } },
                tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
                companies: { include: { company: { select: { id: true, name: true } } } },
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: { select: { records: true } },
      },
    });

    if (!session) throw new NotFoundException(`Session #${sessionId} not found`);

    const answered = session.questions.filter((sq) => sq.status === 'answered');
    const skipped = session.questions.filter((sq) => sq.status === 'skipped');
    const pending = session.questions.filter((sq) => sq.status === 'pending');
    const correct = answered.filter((sq) => sq.result === 'correct').length;
    const wrong = answered.filter((sq) => sq.result === 'wrong').length;
    const fuzzy = answered.filter((sq) => sq.result === 'fuzzy').length;

    return {
      ...session,
      stats: {
        total: session.questions.length,
        answered: answered.length,
        skipped: skipped.length,
        pending: pending.length,
        correct,
        wrong,
        fuzzy,
        accuracy: answered.length > 0 ? Math.round((correct / answered.length) * 100) : 0,
      },
      questions: session.questions.map((sq) => ({
        orderIndex: sq.orderIndex,
        status: sq.status,
        result: sq.result,
        ...sq.question,
        tags: sq.question.tags.map((qt) => qt.tag),
        companies: sq.question.companies.map((qc) => qc.company),
      })),
    };
  }

  async getNextQuestion(sessionId: number) {
    const sq = await this.prisma.sessionQuestion.findFirst({
      where: { sessionId, status: 'pending' },
      include: {
        question: {
          include: {
            knowledgePoint: { select: { id: true, name: true } },
            tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
            companies: { include: { company: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (!sq) return null;

    return {
      orderIndex: sq.orderIndex,
      ...sq.question,
      tags: sq.question.tags.map((qt) => qt.tag),
      companies: sq.question.companies.map((qc) => qc.company),
    };
  }

  async endSession(sessionId: number) {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: { _count: true },
    });
    if (!session) throw new NotFoundException(`Session #${sessionId} not found`);

    const stats = await this.prisma.sessionQuestion.groupBy({
      by: ['result'],
      where: { sessionId, status: 'answered', result: { not: null } },
      _count: true,
    });

    const counts = Object.fromEntries(stats.map((s) => [s.result, s._count]));

    return this.prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        totalQuestions: session._count.questions,
        correctCount: counts['correct'] ?? 0,
        wrongCount: counts['wrong'] ?? 0,
        fuzzyCount: counts['fuzzy'] ?? 0,
      },
    });
  }

  async getRandomQuestion(query: ReviewQueryDto) {
    const where: any = { deletedAt: null };
    if (query.knowledgePointId) where.knowledgePointId = query.knowledgePointId;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.type) where.type = query.type;

    const count = await this.prisma.question.count({ where });
    if (count === 0) throw new NotFoundException('No questions match criteria');

    const skip = Math.floor(Math.random() * count);
    const question = await this.prisma.question.findFirst({
      where,
      skip,
      include: {
        knowledgePoint: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
        companies: { include: { company: { select: { id: true, name: true } } } },
      },
    });

    if (!question) throw new NotFoundException('Question not found');

    return {
      ...question,
      tags: question.tags.map((qt) => qt.tag),
      companies: question.companies.map((qc) => qc.company),
    };
  }

  async getReviewQueue(query: ReviewQueryDto) {
    const where: any = {
      deletedAt: null,
      practiceRecords: { some: {} },
      NOT: { practiceRecords: { every: { result: 'correct' } } },
    };

    if (query.knowledgePointId) where.knowledgePointId = query.knowledgePointId;
    if (query.difficulty) where.difficulty = query.difficulty;

    const questions = await this.prisma.question.findMany({
      where,
      include: {
        knowledgePoint: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
        companies: { include: { company: { select: { id: true, name: true } } } },
        practiceRecords: {
          orderBy: { practicedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'asc' },
      take: query.limit ?? 10,
    });

    return questions.map((q) => ({
      ...q,
      tags: q.tags.map((qt) => qt.tag),
      companies: q.companies.map((qc) => qc.company),
      lastResult: q.practiceRecords[0]?.result ?? null,
      lastPracticedAt: q.practiceRecords[0]?.practicedAt ?? null,
    }));
  }

  async submitAnswer(dto: SubmitAnswerDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
    });
    if (!question) throw new NotFoundException(`Question #${dto.questionId} not found`);

    if (!['correct', 'wrong', 'fuzzy'].includes(dto.result)) {
      throw new BadRequestException('result must be correct, wrong, or fuzzy');
    }

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.practiceRecord.create({
        data: {
          questionId: dto.questionId,
          sessionId: dto.sessionId,
          result: dto.result,
          myAnswer: dto.myAnswer,
          durationMs: dto.durationMs,
        },
      });

      if (dto.sessionId) {
        await tx.sessionQuestion.updateMany({
          where: { sessionId: dto.sessionId, questionId: dto.questionId },
          data: { status: 'answered', result: dto.result },
        });
      }

      await tx.question.update({
        where: { id: dto.questionId },
        data: { updatedAt: new Date() },
      });

      return record;
    });
  }

  async skipQuestion(sessionId: number, questionId: number) {
    const sq = await this.prisma.sessionQuestion.findUnique({
      where: { sessionId_questionId: { sessionId, questionId } },
    });
    if (!sq) throw new NotFoundException('SessionQuestion not found');

    return this.prisma.sessionQuestion.update({
      where: { sessionId_questionId: { sessionId, questionId } },
      data: { status: 'skipped' },
    });
  }

  async getQuestionStats(questionId: number) {
    const records = await this.prisma.practiceRecord.groupBy({
      by: ['result'],
      where: { questionId },
      _count: true,
    });

    const total = records.reduce((sum, r) => sum + r._count, 0);
    const correct = records.find((r) => r.result === 'correct')?._count ?? 0;
    const wrong = records.find((r) => r.result === 'wrong')?._count ?? 0;
    const fuzzy = records.find((r) => r.result === 'fuzzy')?._count ?? 0;

    return {
      total,
      correct,
      wrong,
      fuzzy,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }
}
