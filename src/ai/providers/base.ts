import type { AiProvider, AiProviderConfig, AiChatResponse } from '../types';

/**
 * Provider-agnostic contract. Concrete providers must run on the server
 * and read secrets from environment variables only.
 */
export type { AiProvider };

export class UnconfiguredAiProvider implements AiProvider {
  readonly config: AiProviderConfig = {
    id: 'local',
    model: 'unconfigured',
    apiKeyEnvVar: 'WILL_AI_API_KEY',
  };

  async chat(): Promise<AiChatResponse> {
    return {
      message:
        'Will AI ainda não está conectada a um provedor. Configure as variáveis de ambiente no servidor e selecione um provider (OpenAI, Anthropic, Google ou local).',
      suggestedActions: [
        {
          id: 'summarize-day',
          label: 'Resumir meu dia',
          toolName: 'summarize_day',
          params: {},
          requiresConfirmation: false,
        },
        {
          id: 'list-overdue',
          label: 'Encontrar tarefas atrasadas',
          toolName: 'list_overdue_tasks',
          params: {},
          requiresConfirmation: false,
        },
      ],
    };
  }
}
