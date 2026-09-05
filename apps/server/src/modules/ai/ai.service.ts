import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AiAdapter,
  AiMessage,
  OpenAiAdapter,
  ClaudeAdapter,
  DeepSeekAdapter,
  OllamaAdapter,
} from './adapters';

export type AiProvider = 'openai' | 'claude' | 'deepseek' | 'ollama';

export interface AiSettings {
  provider: AiProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface GenerateQuestionDto {
  knowledgePointId?: number;
  type?: string;
  difficulty?: number;
  count?: number;
}

export interface AnalyzeAnswerDto {
  questionId: number;
  userAnswer: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private adapter: AiAdapter | null = null;
  private currentSettings: AiSettings | null = null;

  constructor(private prisma: PrismaService) {}

  private async getAdapter(): Promise<AiAdapter> {
    const settings = await this.getSettings();

    if (!this.adapter || this.settingsChanged(settings)) {
      this.adapter = this.createAdapter(settings);
      this.currentSettings = settings;
    }

    return this.adapter;
  }

  private settingsChanged(newSettings: AiSettings): boolean {
    if (!this.currentSettings) return true;
    return (
      this.currentSettings.provider !== newSettings.provider ||
      this.currentSettings.apiKey !== newSettings.apiKey ||
      this.currentSettings.baseUrl !== newSettings.baseUrl
    );
  }

  private createAdapter(settings: AiSettings): AiAdapter {
    switch (settings.provider) {
      case 'openai':
        if (!settings.apiKey) throw new BadRequestException('OpenAI 需要 API Key');
        return new OpenAiAdapter(settings.apiKey);
      case 'claude':
        if (!settings.apiKey) throw new BadRequestException('Claude 需要 API Key');
        return new ClaudeAdapter(settings.apiKey);
      case 'deepseek':
        if (!settings.apiKey) throw new BadRequestException('DeepSeek 需要 API Key');
        return new DeepSeekAdapter(settings.apiKey);
      case 'ollama':
        return new OllamaAdapter(settings.baseUrl);
      default:
        throw new BadRequestException(`不支持的 AI 服务商: ${settings.provider}`);
    }
  }

  async getSettings(): Promise<AiSettings> {
    const configs = await this.prisma.systemConfig.findMany({
      where: { key: { in: ['ai_provider', 'ai_api_key', 'ai_base_url', 'ai_model'] } },
    });

    const configMap = new Map(configs.map((c) => [c.key, c.value]));

    return {
      provider: (configMap.get('ai_provider') as AiProvider) || 'openai',
      apiKey: configMap.get('ai_api_key'),
      baseUrl: configMap.get('ai_base_url'),
      model: configMap.get('ai_model'),
    };
  }

  async updateSettings(settings: AiSettings): Promise<{ success: boolean }> {
    const updates = [
      { key: 'ai_provider', value: settings.provider },
      { key: 'ai_api_key', value: settings.apiKey || '' },
      { key: 'ai_base_url', value: settings.baseUrl || '' },
      { key: 'ai_model', value: settings.model || '' },
    ];

    for (const { key, value } of updates) {
      await this.prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    this.adapter = null;
    this.currentSettings = null;

    this.logger.log(`AI 设置已更新: provider=${settings.provider}`);
    return { success: true };
  }

  async generateQuestions(dto: GenerateQuestionDto) {
    const { knowledgePointId, type = 'concept', difficulty = 3, count = 1 } = dto;

    if (count < 1 || count > 10) {
      throw new BadRequestException('生成数量必须在 1-10 之间');
    }

    const knowledgePoint = knowledgePointId
      ? await this.prisma.knowledgePoint.findUnique({ where: { id: knowledgePointId } })
      : null;

    const adapter = await this.getAdapter();
    const settings = await this.getSettings();

    const messages: AiMessage[] = [
      {
        role: 'system',
        content: `你是一个面试题生成专家。根据要求生成高质量的面试题。
输出格式为 JSON 数组，每道题包含 title 和 referenceAnswer 字段。
题目类型: ${type}
难度: ${difficulty}/5
知识点: ${knowledgePoint?.name || '通用'}`,
      },
      {
        role: 'user',
        content: `请生成 ${count} 道${type}类型的面试题，难度为 ${difficulty}。要求：
1. 题目要具体、有深度
2. 参考答案要详细、包含代码示例（如适用）
3. 适合面试场景`,
      },
    ];

    try {
      const response = await adapter.chat(messages, settings.model);
      const questions = this.parseQuestionsResponse(response.content);

      const created = [];
      for (const q of questions) {
        const question = await this.prisma.question.create({
          data: {
            title: q.title,
            type,
            difficulty,
            knowledgePointId,
            referenceAnswer: q.referenceAnswer,
            source: `AI 生成 (${settings.provider})`,
          },
          include: {
            knowledgePoint: { select: { id: true, name: true } },
          },
        });
        created.push(question);
      }

      this.logger.log(`AI 生成 ${created.length} 道题目`);
      return created;
    } catch (error) {
      this.logger.error(`AI 出题失败: ${error.message}`);
      throw new BadRequestException(`AI 出题失败: ${error.message}`);
    }
  }

  private parseQuestionsResponse(content: string): { title: string; referenceAnswer: string }[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [{ title: content, referenceAnswer: '待补充' }];
    } catch {
      return [{ title: content, referenceAnswer: '待补充' }];
    }
  }

  async analyzeAnswer(dto: AnalyzeAnswerDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      include: {
        knowledgePoint: { select: { id: true, name: true } },
      },
    });

    if (!question) {
      throw new BadRequestException(`题目 #${dto.questionId} 不存在`);
    }

    const adapter = await this.getAdapter();
    const settings = await this.getSettings();

    const messages: AiMessage[] = [
      {
        role: 'system',
        content: `你是一个面试评分专家。分析用户的答案并给出评分和反馈。
输出格式为 JSON，包含 score (0-100), feedback (字符串), suggestions (字符串数组) 字段。`,
      },
      {
        role: 'user',
        content: `题目: ${question.title}
参考答案: ${question.referenceAnswer || '无'}
用户答案: ${dto.userAnswer}

请分析用户的答案，给出评分和改进建议。`,
      },
    ];

    try {
      const response = await adapter.chat(messages, settings.model);
      const analysis = this.parseAnalysisResponse(response.content);

      return {
        questionId: dto.questionId,
        userAnswer: dto.userAnswer,
        score: analysis.score,
        feedback: analysis.feedback,
        suggestions: analysis.suggestions,
      };
    } catch (error) {
      this.logger.error(`AI 分析失败: ${error.message}`);
      throw new BadRequestException(`AI 分析失败: ${error.message}`);
    }
  }

  private parseAnalysisResponse(content: string): {
    score: number;
    feedback: string;
    suggestions: string[];
  } {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // fallback
    }

    return {
      score: 50,
      feedback: content,
      suggestions: ['建议重新复习相关知识点'],
    };
  }
}
