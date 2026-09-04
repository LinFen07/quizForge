import { Test, TestingModule } from '@nestjs/testing';
import { ImportExportService } from './import-export.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ImportExportService', () => {
  let service: ImportExportService;
  let prisma: { question: { create: jest.Mock; findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      question: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportExportService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ImportExportService>(ImportExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('importQuestions', () => {
    it('should throw BadRequestException for non-array input', async () => {
      await expect(service.importQuestions('not-an-array' as any)).rejects.toThrow(
        'Import data must be an array',
      );
    });

    it('should import valid questions', async () => {
      prisma.question.create.mockResolvedValue({ id: 1 });
      const data = [{ title: 'Test', type: 'concept' }];

      const result = await service.importQuestions(data);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect errors for invalid questions', async () => {
      prisma.question.create.mockRejectedValue(new Error('DB error'));
      const data = [{ title: 'Test', type: 'concept' }];

      const result = await service.importQuestions(data);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('DB error');
    });

    it('should skip items missing required fields', async () => {
      const data = [{ title: 'No type' }, { type: 'concept' }];

      const result = await service.importQuestions(data);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(2);
    });
  });
});
