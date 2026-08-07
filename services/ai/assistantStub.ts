import type { AssistantContext, AssistantPort, AssistantResponse } from './types';
import { searchItems } from '../../lib/search';

/** Local stub — no network. Ready to swap for a real LLM + tools backend. */
export const assistantStub: AssistantPort = {
  async retrieveContext(_query: string) {
    return [];
  },

  async ask(context: AssistantContext): Promise<AssistantResponse> {
    const matches = searchItems(context.items, { query: context.query });
    if (matches.length === 0) {
      return {
        message:
          'Ainda não há um modelo conectado. Quando a IA estiver ativa, ela consultará seus dados reais.',
      };
    }
    const preview = matches
      .slice(0, 5)
      .map((m) => `• [${m.type}] ${m.title}`)
      .join('\n');
    return {
      message: `Encontrei ${matches.length} item(ns) relacionados (busca local):\n${preview}`,
      structured: { matchIds: matches.map((m) => m.id) },
    };
  },
};
