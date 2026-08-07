import type { AiToolContext, AiToolDefinition, AiToolResult } from '../types';

export const AI_TOOLS: AiToolDefinition[] = [
  {
    name: 'summarize_day',
    description: 'Resume tarefas, eventos e pendências do dia atual.',
    requiresConfirmation: false,
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_task',
    description: 'Cria uma tarefa para o usuário autenticado.',
    requiresConfirmation: true,
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        dueDate: { type: 'string' },
        priority: { type: 'string' },
      },
    },
  },
  {
    name: 'reschedule_event',
    description: 'Reagenda um compromisso existente.',
    requiresConfirmation: true,
    inputSchema: {
      type: 'object',
      required: ['eventId', 'date'],
      properties: {
        eventId: { type: 'string' },
        date: { type: 'string' },
        startTime: { type: 'string' },
      },
    },
  },
  {
    name: 'list_overdue_tasks',
    description: 'Lista tarefas atrasadas do usuário.',
    requiresConfirmation: false,
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_reminder',
    description: 'Cria um lembrete.',
    requiresConfirmation: true,
    inputSchema: {
      type: 'object',
      required: ['title', 'dueAt'],
      properties: {
        title: { type: 'string' },
        dueAt: { type: 'number' },
      },
    },
  },
  {
    name: 'register_expense',
    description: 'Registra uma despesa.',
    requiresConfirmation: true,
    inputSchema: {
      type: 'object',
      required: ['description', 'amount', 'dueDate'],
      properties: {
        description: { type: 'string' },
        amount: { type: 'number' },
        dueDate: { type: 'string' },
      },
    },
  },
];

/**
 * Tools never touch the database directly from the model output.
 * They validate authorization + params, then return a deterministic result
 * for the application layer to persist after confirmation when needed.
 */
export async function executeAiTool(
  toolName: string,
  params: Record<string, unknown>,
  context: AiToolContext,
  handlers: Record<string, (params: Record<string, unknown>, ctx: AiToolContext) => Promise<AiToolResult>>,
): Promise<AiToolResult> {
  const definition = AI_TOOLS.find((tool) => tool.name === toolName);
  if (!definition) {
    return { ok: false, error: `Ferramenta desconhecida: ${toolName}` };
  }
  if (!context.userId) {
    return { ok: false, error: 'Usuário não autorizado' };
  }
  const handler = handlers[toolName];
  if (!handler) {
    return { ok: false, error: `Handler não registrado para ${toolName}` };
  }
  return handler(params, context);
}
