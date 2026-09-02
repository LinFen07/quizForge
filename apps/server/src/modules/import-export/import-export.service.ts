import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ImportExportService {
  constructor(private prisma: PrismaService) {}

  async exportAll() {
    const [questions, knowledgePoints, tags, companies, practiceRecords] = await Promise.all([
      this.prisma.question.findMany({
        include: {
          knowledgePoint: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          companies: { include: { company: true } },
        },
      }),
      this.prisma.knowledgePoint.findMany(),
      this.prisma.tag.findMany(),
      this.prisma.company.findMany(),
      this.prisma.practiceRecord.findMany(),
    ]);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: { questions, knowledgePoints, tags, companies, practiceRecords },
    };
  }

  async importQuestions(data: any[]) {
    if (!Array.isArray(data)) {
      throw new BadRequestException('Import data must be an array');
    }

    let imported = 0;
    let skipped = 0;

    for (const item of data) {
      try {
        const { tagIds, companyIds, ...questionData } = item;
        await this.prisma.question.create({
          data: {
            ...questionData,
            tags: tagIds?.length
              ? { create: tagIds.map((tagId: number) => ({ tagId })) }
              : undefined,
            companies: companyIds?.length
              ? { create: companyIds.map((companyId: number) => ({ companyId })) }
              : undefined,
          },
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    return { imported, skipped, total: data.length };
  }
}
