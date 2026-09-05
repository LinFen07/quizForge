import { Injectable, Logger } from '@nestjs/common';
import { AiAdapter, AiMessage, AiCompletionResponse } from '../ai.types';

@Injectable()
export class OllamaAdapter implements AiAdapter {
  private readonly logger = new Logger(OllamaAdapter.name);

  constructor(private baseUrl = 'http://localhost:11434') {}

  async chat(messages: AiMessage[], model = 'llama3'): Promise<AiCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Ollama error: ${error}`);
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.message.content,
      usage: data.prompt_eval_count
        ? {
            promptTokens: data.prompt_eval_count,
            completionTokens: data.eval_count,
            totalTokens: data.prompt_eval_count + data.eval_count,
          }
        : undefined,
    };
  }
}
