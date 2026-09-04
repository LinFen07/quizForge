import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../decorators/public.decorator';

const DB_TIMEOUT_MS = 3000;

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), DB_TIMEOUT_MS),
        ),
      ]);
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      });
    }
  }

  @Public()
  @Get('live')
  liveness() {
    return { status: 'ok' };
  }
}
