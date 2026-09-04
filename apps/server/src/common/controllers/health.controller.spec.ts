import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return ok status when database is connected', async () => {
      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
    });

    it('should return error status when database is disconnected', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
    });
  });
});
