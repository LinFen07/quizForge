import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prisma: any;
  let audit: any;

  const mockQuestion = {
    id: 1,
    title: 'Test Question',
    type: 'concept',
    difficulty: 3,
    referenceAnswer: 'Answer',
    source: 'Test Source',
    knowledgePointId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    knowledgePoint: null,
    tags: [],
    companies: [],
    _count: { practiceRecords: 0 },
  };

  beforeEach(async () => {
    prisma = {
      question: {
        findMany: jest.fn().mockResolvedValue([mockQuestion]),
        findFirst: jest.fn().mockResolvedValue(mockQuestion),
        findUnique: jest.fn().mockResolvedValue(mockQuestion),
        create: jest.fn().mockResolvedValue(mockQuestion),
        update: jest.fn().mockResolvedValue(mockQuestion),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn().mockResolvedValue(mockQuestion),
        count: jest.fn().mockResolvedValue(1),
      },
      questionTag: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      questionCompany: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(prisma)),
    };

    audit = {
      log: jest.fn(),
      logBatch: jest.fn(),
      findByEntity: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated questions', async () => {
      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should filter by keyword', async () => {
      await service.findAll({ keyword: 'test' });

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([{ title: { contains: 'test' } }]),
          }),
        }),
      );
    });

    it('should filter by difficulty', async () => {
      await service.findAll({ difficulty: 3 });

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ difficulty: 3 }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a question by id', async () => {
      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException for non-existent question', async () => {
      prisma.question.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new question', async () => {
      const dto = { title: 'New Question', type: 'concept' };
      const result = await service.create(dto as any);

      expect(result).toBeDefined();
      expect(prisma.question.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'create' }));
    });

    it('should create question with tags', async () => {
      const dto = { title: 'New Question', type: 'concept', tagIds: [1, 2] };
      await service.create(dto as any);

      expect(prisma.question.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: { create: [{ tagId: 1 }, { tagId: 2 }] },
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a question', async () => {
      const dto = { title: 'Updated Title' };
      const result = await service.update(1, dto as any);

      expect(result).toBeDefined();
      expect(audit.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent question', async () => {
      prisma.question.findFirst.mockResolvedValue(null);

      await expect(service.update(999, { title: 'test' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a question', async () => {
      const result = await service.remove(1);

      expect(result.success).toBe(true);
      expect(prisma.question.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted question', async () => {
      prisma.question.findFirst.mockResolvedValue({
        ...mockQuestion,
        deletedAt: new Date(),
      });

      const result = await service.restore(1);

      expect(result.success).toBe(true);
      expect(prisma.question.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { deletedAt: null },
        }),
      );
    });

    it('should throw NotFoundException for non-deleted question', async () => {
      prisma.question.findFirst.mockResolvedValue(null);

      await expect(service.restore(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('batchDelete', () => {
    it('should batch soft delete questions', async () => {
      prisma.question.findMany.mockResolvedValue([
        { id: 1, deletedAt: null },
        { id: 2, deletedAt: null },
      ]);

      const result = await service.batchDelete({ ids: [1, 2] });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
    });

    it('should throw BadRequestException for non-existent questions', async () => {
      prisma.question.findMany.mockResolvedValue([{ id: 1, deletedAt: null }]);

      await expect(service.batchDelete({ ids: [1, 2] })).rejects.toThrow(BadRequestException);
    });
  });

  describe('permanentlyDelete', () => {
    it('should permanently delete a question', async () => {
      const result = await service.permanentlyDelete(1);

      expect(result.success).toBe(true);
      expect(prisma.question.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException for non-existent question', async () => {
      prisma.question.findUnique.mockResolvedValue(null);

      await expect(service.permanentlyDelete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
