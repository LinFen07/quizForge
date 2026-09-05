import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { KnowledgePointsModule } from './modules/knowledge-points/knowledge-points.module';
import { TagsModule } from './modules/tags/tags.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { PracticeModule } from './modules/practice/practice.module';
import { StatsModule } from './modules/stats/stats.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { CommonModule } from './modules/common/common.module';
import { AiModule } from './modules/ai/ai.module';
// import { AuthModule } from './modules/auth/auth.module';
import { HealthController } from './common/controllers/health.controller';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'web', 'dist'),
      exclude: ['/api/(.*)'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    PrismaModule,
    // AuthModule,
    QuestionsModule,
    KnowledgePointsModule,
    TagsModule,
    CompaniesModule,
    PracticeModule,
    StatsModule,
    ImportExportModule,
    CommonModule,
    AiModule,
  ],
  controllers: [HealthController],
  providers: [CustomThrottlerGuard],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
