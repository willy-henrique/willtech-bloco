import { createId } from '../lib/id';
import { UnconfiguredAiProvider } from './providers/base';
import type { AiChatRequest, AiChatResponse, AiProvider } from './types';
import { AI_TOOLS } from './tools/registry';

/**
 * Server-oriented AI orchestration facade.
 * In this SPA build it runs locally with a stub provider until
 * a secure backend endpoint is wired with real API keys.
 */
export class AiService {
  constructor(private readonly provider: AiProvider = new UnconfiguredAiProvider()) {}

  listCapabilities() {
    return AI_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      requiresConfirmation: tool.requiresConfirmation,
    }));
  }

  async chat(request: AiChatRequest): Promise<AiChatResponse & { requestId: string }> {
    if (!request.userId) {
      throw new Error('Usuário não autenticado');
    }
    if (!request.message.trim()) {
      throw new Error('Mensagem vazia');
    }

    const requestId = createId('req');
    const response = await this.provider.chat(request);
    return { ...response, requestId };
  }
}

export const aiService = new AiService();
