import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

const MASTERY_ORDER = ['unseen', 'weak', 'fuzzy', 'mastered'] as const;

@Injectable()
export class PracticeService {
  constructor(private prisma: PrismaService) {}

  async startSession() {
    return this.prisma.practiceSession.create({ data: {} });
  }

  async endSession(sessionId: number) {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: { _count: true },
    });
    if (!session) throw new NotFoundException(`Session #${sessionId} not found`);

    const stats = await this.prisma.practiceRecord.groupBy({
      by: ['result'],
      where: { sessionId },
      _count: true,
    });

    const counts = Object.fromEntries(stats.map((s) => [s.result, s._count]));

    return this.prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        totalQuestions: session._count.records,
        correctCount: counts['correct'] ?? 0,
        wrongCount: counts['wrong'] ?? 0,
        fuzzyCount: counts['fuzzy'] ?? 0,
      },
    });
  }

  async getRandomQuestion(query: ReviewQueryDto) {
    const where: any = {};
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
      },
    });

    if (!question) throw new NotFoundException('Question not found');

    return {
      ...question,
      tags: question.tags.map((qt) => qt.tag),
    };
  }

  async getReviewQueue(query: ReviewQueryDto) {
    const where: any = {
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

      await tx.question.update({
        where: { id: dto.questionId },
        data: { updatedAt: new Date() },
      });

      return record;
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
