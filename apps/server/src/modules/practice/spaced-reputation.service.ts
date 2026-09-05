import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * SM-2 间隔复习算法
 *
 * 基于 SuperMemo 2 算法实现，核心公式：
 * - quality ∈ {0,1,2,3,4,5} 代表用户掌握程度
 *   0-2: 需要重新学习 (wrong/fuzzy)
 *   3-5: 基本掌握 (correct)
 *
 * - easeFactor: 难度因子，初始 2.5，最小 1.3
 *   EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
 *
 * - intervalDays:
 *   rep=0: 1 day
 *   rep=1: 6 days
 *   rep>=2: interval * EF
 */
@Injectable()
export class SpacedReputationService {
  private readonly logger = new Logger(SpacedReputationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 将 PracticeResult 映射为 SM-2 quality 分数
   */
  private resultToQuality(result: string): number {
    switch (result) {
      case 'correct':
        return 5;
      case 'fuzzy':
        return 3;
      case 'wrong':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * SM-2 核心算法
   */
  private calculate(easeFactor: number, intervalDays: number, repetition: number, quality: number) {
    // 新的 ease factor
    const newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // 最小 ease factor 为 1.3
    const ef = Math.max(newEF, 1.3);

    let newInterval: number;
    let newRepetition: number;

    if (quality < 3) {
      // 未掌握，重置
      newRepetition = 0;
      newInterval = 1;
    } else {
      // 已掌握
      newRepetition = repetition + 1;
      if (newRepetition === 1) {
        newInterval = 1;
      } else if (newRepetition === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(intervalDays * ef);
      }
    }

    return {
      easeFactor: ef,
      intervalDays: newInterval,
      repetition: newRepetition,
    };
  }

  /**
   * 提交复习结果并更新 SM-2 状态
   */
  async submitReview(questionId: number, result: string) {
    const quality = this.resultToQuality(result);
    const now = new Date();

    const existing = await this.prisma.spacedReputation.findUnique({
      where: { questionId },
    });

    if (!existing) {
      // 首次复习
      const calc = this.calculate(2.5, 0, 0, quality);
      const nextReview = new Date(now);
      nextReview.setDate(nextReview.getDate() + calc.intervalDays);

      this.logger.log(
        `创建复习记录: questionId=${questionId}, quality=${quality}, interval=${calc.intervalDays}d`,
      );

      return this.prisma.spacedReputation.create({
        data: {
          questionId,
          easeFactor: calc.easeFactor,
          intervalDays: calc.intervalDays,
          repetition: calc.repetition,
          nextReviewAt: nextReview,
          lastReviewAt: now,
        },
      });
    }

    // 已有记录，更新 SM-2 状态
    const calc = this.calculate(
      existing.easeFactor,
      existing.intervalDays,
      existing.repetition,
      quality,
    );

    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + calc.intervalDays);

    this.logger.log(
      `更新复习记录: questionId=${questionId}, EF=${calc.easeFactor.toFixed(2)}, interval=${calc.intervalDays}d, rep=${calc.repetition}`,
    );

    return this.prisma.spacedReputation.update({
      where: { questionId },
      data: {
        easeFactor: calc.easeFactor,
        intervalDays: calc.intervalDays,
        repetition: calc.repetition,
        nextReviewAt: nextReview,
        lastReviewAt: now,
      },
    });
  }

  /**
   * 获取需要复习的题目列表
   */
  async getReviewQueue(options: {
    knowledgePointId?: number;
    difficulty?: number;
    limit?: number;
  }) {
    const { knowledgePointId, difficulty, limit = 10 } = options;

    const where: any = {
      nextReviewAt: { lte: new Date() },
      question: {
        deletedAt: null,
      },
    };

    if (knowledgePointId) {
      where.question.knowledgePointId = knowledgePointId;
    }
    if (difficulty) {
      where.question.difficulty = difficulty;
    }

    const records = await this.prisma.spacedReputation.findMany({
      where,
      include: {
        question: {
          include: {
            knowledgePoint: { select: { id: true, name: true } },
            tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
            companies: { include: { company: { select: { id: true, name: true } } } },
            practiceRecords: {
              orderBy: { practicedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { nextReviewAt: 'asc' },
      take: limit,
    });

    return records.map((r) => ({
      ...r.question,
      tags: r.question.tags.map((qt) => qt.tag),
      companies: r.question.companies.map((qc) => qc.company),
      spacedReputation: {
        easeFactor: r.easeFactor,
        intervalDays: r.intervalDays,
        repetition: r.repetition,
        nextReviewAt: r.nextReviewAt,
        lastReviewAt: r.lastReviewAt,
      },
      lastResult: r.question.practiceRecords[0]?.result ?? null,
    }));
  }

  /**
   * 获取题目的 SM-2 状态
   */
  async getQuestionStatus(questionId: number) {
    return this.prisma.spacedReputation.findUnique({
      where: { questionId },
    });
  }

  /**
   * 获取全局复习统计
   */
  async getStats() {
    const now = new Date();

    const [total, due, mastered, learning] = await Promise.all([
      this.prisma.spacedReputation.count(),
      this.prisma.spacedReputation.count({
        where: { nextReviewAt: { lte: now } },
      }),
      this.prisma.spacedReputation.count({
        where: { repetition: { gte: 3 } },
      }),
      this.prisma.spacedReputation.count({
        where: { repetition: { gte: 1, lt: 3 } },
      }),
    ]);

    return {
      total,
      due,
      mastered,
      learning,
      newToReview: total - mastered - learning,
    };
  }
}
