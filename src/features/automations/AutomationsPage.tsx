import { Workflow } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';

const UPCOMING = [
  'Lembrete automático de tarefas atrasadas',
  'Resumo diário matinal',
  'Alerta de contas a vencer',
  'Sugestão semanal de prioridades via Will AI',
];

export function AutomationsPage() {
  return (
    <div className="space-y-4 px-4 py-4 md:px-6">
      <div>
        <h2 className="text-lg font-semibold">Automações</h2>
        <p className="text-sm text-text-muted">Fluxos determinísticos preparados para a Will AI</p>
      </div>

      <EmptyState
        title="Em breve"
        description="As automações serão conectadas a ferramentas validadas no servidor, com confirmação para ações sensíveis."
        icon={<Workflow className="h-6 w-6" />}
      />

      <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <h3 className="font-semibold">Roadmap</h3>
        <ul className="mt-3 space-y-2">
          {UPCOMING.map((item) => (
            <li key={item} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
              <span>{item}</span>
              <Badge>Em breve</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
