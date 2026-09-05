import { Injectable, Logger } from '@nestjs/common';
import { AiAdapter, AiMessage, AiCompletionResponse } from '../ai.types';

@Injectable()
export class DeepSeekAdapter implements AiAdapter {
  private readonly logger = new Logger(DeepSeekAdapter.name);

  constructor(private apiKey: string) {}

  async chat(messages: AiMessage[], model = 'deepseek-chat'): Promise<AiCompletionResponse> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.7 }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`DeepSeek error: ${error}`);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}
