import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { KnowledgePointsModule } from './modules/knowledge-points/knowledge-points.module';
import { TagsModule } from './modules/tags/tags.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { PracticeModule } from './modules/practice/practice.module';
import { StatsModule } from './modules/stats/stats.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';

@Module({
  imports: [
    // 生产环境托管前端静态文件
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'web', 'dist'),
      exclude: ['/api/(.*)'],
    }),
    PrismaModule,
    QuestionsModule,
    KnowledgePointsModule,
    TagsModule,
    CompaniesModule,
    PracticeModule,
    StatsModule,
    ImportExportModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
