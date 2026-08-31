import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getMasteryOverview() {
    const grouped = await this.prisma.practiceRecord.groupBy({
      by: ['result'],
      _count: true,
    });

    const total = grouped.reduce((sum, g) => sum + g._count, 0);
    const correct = grouped.find((g) => g.result === 'correct')?._count ?? 0;
    const wrong = grouped.find((g) => g.result === 'wrong')?._count ?? 0;
    const fuzzy = grouped.find((g) => g.result === 'fuzzy')?._count ?? 0;

    return {
      totalRecords: total,
      correct,
      wrong,
      fuzzy,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }

  async getKnowledgeMastery() {
    const points = await this.prisma.knowledgePoint.findMany({
      include: {
        questions: {
          include: {
            practiceRecords: {
              select: { result: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return points.map((p) => {
      const records = p.questions.flatMap((q) => q.practiceRecords);
      const total = records.length;
      const correct = records.filter((r) => r.result === 'correct').length;

      return {
        id: p.id,
        name: p.name,
        questionCount: p.questions.length,
        practiceCount: total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      };
    });
  }

  async getTrend(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const records = await this.prisma.practiceRecord.findMany({
      where: { practicedAt: { gte: since } },
      orderBy: { practicedAt: 'asc' },
    });

    const byDate = new Map<string, { correct: number; wrong: number; fuzzy: number }>();

    for (const r of records) {
      const date = r.practicedAt.toISOString().split('T')[0];
      if (!byDate.has(date)) byDate.set(date, { correct: 0, wrong: 0, fuzzy: 0 });
      const day = byDate.get(date)!;
      if (r.result in day) day[r.result as keyof typeof day]++;
    }

    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split('T')[0];
      const stats = byDate.get(key) ?? { correct: 0, wrong: 0, fuzzy: 0 };
      result.push({ date: key, ...stats });
    }

    return result;
  }
}
