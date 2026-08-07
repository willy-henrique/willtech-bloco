import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { searchItems } from '../../lib/search';
import type { ItemType } from '../../types/item';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/EmptyState';

export const SearchPage: React.FC = () => {
  const { items, projects } = useApp();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ItemType | 'all'>('all');
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState('');
  const navigate = useNavigate();

  const results = useMemo(
    () =>
      searchItems(items, {
        query,
        type,
        projectId: projectId || null,
        date: date || null,
      }),
    [items, query, type, projectId, date]
  );

  return (
    <div>
      <PageHeader title="Tudo" subtitle="Busca global em tempo real" />
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Pesquisar em tudo…"
        autoFocus
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          aria-label="Tipo"
          value={type}
          onChange={(e) => setType(e.target.value as ItemType | 'all')}
          className="min-h-11 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
        >
          <option value="all">Tipo</option>
          <option value="task">Tarefa</option>
          <option value="note">Nota</option>
          <option value="event">Evento</option>
          <option value="reminder">Lembrete</option>
          <option value="idea">Projeto</option>
        </select>
        <select
          aria-label="Projeto"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="min-h-11 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
        >
          <option value="">Projeto</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Data"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="min-h-11 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
        />
      </div>

      <div className="mt-6">
        {results.length === 0 ? (
          <EmptyState
            title={query ? 'Nada encontrado' : 'Comece a digitar'}
            description="Busque notas, tarefas, projetos, eventos e lembretes."
          />
        ) : (
          <ul className="space-y-2">
            {results.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <button
                  type="button"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left"
                  onClick={() => {
                    if (item.type === 'note') navigate('/notas');
                    else if (item.type === 'idea') navigate('/projetos');
                    else if (item.type === 'event' || item.type === 'reminder') navigate('/agenda');
                    else if (item.status === 'inbox') navigate('/inbox');
                    else navigate('/');
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.title}</p>
                    <span className="meta-text capitalize">{item.type}</span>
                  </div>
                  {item.content && (
                    <p className="meta-text mt-1 line-clamp-2">{item.content}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
