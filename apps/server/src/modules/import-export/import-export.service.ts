import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ImportError {
  index: number;
  title?: string;
  error: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
  errors: ImportError[];
}

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

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

  async importQuestions(data: any[]): Promise<ImportResult> {
    if (!Array.isArray(data)) {
      throw new BadRequestException('Import data must be an array');
    }

    let imported = 0;
    let skipped = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        const { tagIds, companyIds, ...questionData } = item;

        if (!questionData.title || !questionData.type) {
          throw new BadRequestException('title 和 type 为必填字段');
        }

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
      } catch (error) {
        skipped++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({
          index: i,
          title: item?.title,
          error: errorMsg,
        });
        this.logger.warn(`Import failed at index ${i}: ${errorMsg}`);
      }
    }

    this.logger.log(
      `Import completed: ${imported} imported, ${skipped} skipped, ${data.length} total`,
    );

    return { imported, skipped, total: data.length, errors };
  }
}
