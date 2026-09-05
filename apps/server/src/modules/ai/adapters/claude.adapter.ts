import { Injectable, Logger } from '@nestjs/common';
import { AiAdapter, AiMessage, AiCompletionResponse } from '../ai.types';

@Injectable()
export class ClaudeAdapter implements AiAdapter {
  private readonly logger = new Logger(ClaudeAdapter.name);

  constructor(private apiKey: string) {}

  async chat(
    messages: AiMessage[],
    model = 'claude-3-haiku-20240307',
  ): Promise<AiCompletionResponse> {
    const systemMsg = messages.find((m) => m.role === 'system');
    const otherMsgs = messages.filter((m) => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemMsg?.content,
        messages: otherMsgs.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Claude error: ${error}`);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }
}
