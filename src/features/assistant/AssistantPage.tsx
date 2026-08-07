import { useMemo, useState } from 'react';
import { Loader2, Plus, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { aiService } from '../../ai/service';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { isOverdue, toDateKey } from '../../lib/dates';
import type { AiSuggestedAction } from '../../types';

const SUGGESTIONS = [
  'Resumir meu dia',
  'Quais tarefas estão atrasadas?',
  'Criar uma tarefa para revisar o projeto',
  'Sugerir prioridades da semana',
];

export function AssistantPage() {
  const { user } = useAuth();
  const toast = useToast();
  const {
    tasks,
    events,
    aiConversations,
    aiMessages,
    createAiConversation,
    addAiMessage,
    proposeToolExecution,
    confirmToolExecution,
    rejectToolExecution,
    createTask,
  } = useData();

  const [conversationId, setConversationId] = useState<string | null>(aiConversations[0]?.id || null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingAction, setPendingAction] = useState<AiSuggestedAction | null>(null);

  const messages = useMemo(
    () =>
      aiMessages
        .filter((message) => message.conversationId === conversationId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [aiMessages, conversationId],
  );

  const ensureConversation = () => {
    if (conversationId) return conversationId;
    const conversation = createAiConversation('Conversa Will AI');
    setConversationId(conversation.id);
    return conversation.id;
  };

  const runLocalInsight = (text: string) => {
    const today = toDateKey();
    const overdue = tasks.filter((task) => isOverdue(task.dueDate || task.date, task.status === 'done'));
    const todayTasks = tasks.filter(
      (task) => (task.date === today || task.dueDate === today) && task.status !== 'done',
    );
    const todayEvents = events.filter((event) => event.date === today);

    if (/atrasad/i.test(text)) {
      return {
        message:
          overdue.length === 0
            ? 'Você não tem tarefas atrasadas no momento.'
            : `Encontrei ${overdue.length} tarefa(s) atrasada(s):\n${overdue
                .slice(0, 8)
                .map((task) => `• ${task.title}`)
                .join('\n')}`,
        suggestedActions: overdue.slice(0, 3).map((task) => ({
          id: `focus-${task.id}`,
          label: `Priorizar: ${task.title}`,
          toolName: 'create_task',
          params: { title: `Focar em: ${task.title}`, dueDate: today, priority: 'high' },
          requiresConfirmation: true,
        })),
      };
    }

    return {
      message: [
        'Resumo local do seu dia (sem provedor de IA externo):',
        `• ${todayTasks.length} tarefa(s) para hoje`,
        `• ${todayEvents.length} compromisso(s) hoje`,
        `• ${overdue.length} tarefa(s) atrasada(s)`,
        '',
        'Quando a Will AI estiver conectada no servidor, ela poderá executar ferramentas validadas com confirmação.',
      ].join('\n'),
      suggestedActions: [
        {
          id: 'create-followup',
          label: 'Criar tarefa de acompanhamento',
          toolName: 'create_task',
          params: { title: 'Acompanhamento do dia', dueDate: today, priority: 'medium' },
          requiresConfirmation: true,
        },
      ],
    };
  };

  const send = async (text = input) => {
    if (!text.trim() || !user) return;
    const activeId = ensureConversation();
    setSending(true);
    setInput('');
    addAiMessage({
      conversationId: activeId,
      role: 'user',
      content: text.trim(),
      status: 'completed',
    });

    try {
      const remote = await aiService.chat({
        conversationId: activeId,
        message: text.trim(),
        userId: user.id,
      });
      const local = runLocalInsight(text.trim());
      addAiMessage({
        conversationId: activeId,
        role: 'assistant',
        content: `${remote.message}\n\n${local.message}`,
        status: 'completed',
        suggestedActions: local.suggestedActions || remote.suggestedActions,
      });
    } catch (error) {
      addAiMessage({
        conversationId: activeId,
        role: 'assistant',
        content: 'Não foi possível processar a mensagem.',
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      toast.error('Falha ao consultar a assistente');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid min-h-[70dvh] lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-border p-4 lg:border-b-0 lg:border-r">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Will AI</h2>
            <p className="text-xs text-text-subtle">Arquitetura pronta · provider desacoplado</p>
          </div>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Nova conversa"
            onClick={() => {
              const conversation = createAiConversation();
              setConversationId(conversation.id);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-1">
          {aiConversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => setConversationId(conversation.id)}
                className={`w-full rounded-[var(--radius-md)] px-3 py-2 text-left text-sm ${
                  conversationId === conversation.id ? 'bg-accent-soft text-accent' : 'hover:bg-surface-hover'
                }`}
              >
                {conversation.title}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">Capacidades</p>
          {aiService.listCapabilities().slice(0, 6).map((tool) => (
            <div key={tool.name} className="rounded-md border border-border px-2 py-2 text-xs">
              <p className="font-medium">{tool.name}</p>
              <p className="text-text-subtle">{tool.description}</p>
              {tool.requiresConfirmation ? <Badge tone="warning">Confirmação</Badge> : null}
            </div>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[70dvh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar md:p-6">
          {messages.length === 0 ? (
            <EmptyState
              title="Converse com a Will AI"
              description="A interface e os contratos de ferramentas já estão prontos. Nenhuma chave de API é usada no frontend."
              icon={<Sparkles className="h-6 w-6" />}
            />
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-3xl rounded-[var(--radius-lg)] border px-4 py-3 whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'ml-auto border-accent/30 bg-accent-soft'
                    : 'border-border bg-bg-elevated/80'
                }`}
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle">
                  {message.role === 'user' ? 'Você' : 'Will AI'}
                  {message.status === 'error' ? ' · erro' : ''}
                </p>
                <p className="text-sm">{message.content}</p>
                {message.suggestedActions && message.suggestedActions.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestedActions.map((action) => (
                      <Button
                        key={action.id}
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (action.requiresConfirmation) {
                            setPendingAction(action);
                          } else {
                            toast.info('Ação informativa', action.label);
                          }
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
          {sending ? (
            <div className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Processando…
            </div>
          ) : null}
        </div>

        <div className="border-t border-border p-4 safe-pb">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-surface-hover"
                onClick={() => void send(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              label="Mensagem"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-[72px]"
              placeholder="Pergunte sobre seu dia, tarefas, projetos…"
            />
            <Button
              size="icon"
              className="mb-1"
              aria-label="Enviar"
              loading={sending}
              onClick={() => void send()}
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title="Confirmar ação da Will AI?"
        description={pendingAction?.label || ''}
        tone="primary"
        confirmLabel="Executar"
        onCancel={() => {
          if (pendingAction && conversationId) {
            const execution = proposeToolExecution({
              conversationId,
              toolName: pendingAction.toolName,
              params: pendingAction.params,
              status: 'proposed',
            });
            rejectToolExecution(execution.id);
          }
          setPendingAction(null);
        }}
        onConfirm={() => {
          if (!pendingAction || !conversationId || !user) return;
          const execution = proposeToolExecution({
            conversationId,
            toolName: pendingAction.toolName,
            params: pendingAction.params,
            status: 'proposed',
          });
          confirmToolExecution(execution.id);
          if (pendingAction.toolName === 'create_task') {
            createTask({
              title: String(pendingAction.params.title || 'Tarefa da Will AI'),
              dueDate: String(pendingAction.params.dueDate || toDateKey()),
              priority: (pendingAction.params.priority as 'medium') || 'medium',
            });
            toast.success('Ferramenta executada com confirmação');
          }
          setPendingAction(null);
        }}
      />
    </div>
  );
}
