import { useMemo, useState } from 'react';
import { Copy, ExternalLink, LayoutGrid, List, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatDate } from '../../lib/dates';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import type { FileKind, SavedLink } from '../../types';

export function FilesPage() {
  const toast = useToast();
  const { savedLinks, projects, createSavedLink, updateSavedLink, deleteSavedLink } = useData();
  const [mode, setMode] = useState<'list' | 'grid'>('list');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | FileKind>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SavedLink | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    url: '',
    description: '',
    kind: 'link' as FileKind,
    category: '',
    projectId: '',
  });

  const items = useMemo(
    () =>
      savedLinks
        .filter((item) => !item.archived)
        .filter((item) => (kind === 'all' ? true : item.kind === kind))
        .filter((item) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;
          return (
            item.title.toLowerCase().includes(q) ||
            item.url.toLowerCase().includes(q) ||
            item.tags.some((tag) => tag.toLowerCase().includes(q))
          );
        }),
    [savedLinks, query, kind],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      url: '',
      description: '',
      kind: 'link',
      category: '',
      projectId: '',
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error('Informe título e URL');
      return;
    }
    try {
      const parsedUrl = new URL(form.url);
      if (!parsedUrl.protocol.startsWith('http')) {
        throw new Error('invalid');
      }
    } catch {
      toast.error('URL inválida');
      return;
    }

    if (editing) {
      updateSavedLink(editing.id, {
        ...form,
        projectId: form.projectId || null,
      });
      toast.success('Item atualizado');
    } else {
      createSavedLink({
        ...form,
        projectId: form.projectId || null,
        tags: [],
      });
      toast.success('Item salvo');
    }
    setOpen(false);
  };

  return (
    <div className="space-y-4 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Arquivos e links</h2>
          <p className="text-sm text-text-muted">Referências prontas para Storage futuro</p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === 'list' ? 'secondary' : 'ghost'} size="icon" aria-label="Lista" onClick={() => setMode('list')}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant={mode === 'grid' ? 'secondary' : 'ghost'} size="icon" aria-label="Grade" onClick={() => setMode('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo item
          </Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_220px]">
        <Input label="Pesquisar" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Título, URL ou tag…" />
        <Select
          label="Tipo"
          value={kind}
          onChange={(e) => setKind(e.target.value as 'all' | FileKind)}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'link', label: 'Links' },
            { value: 'document', label: 'Documentos' },
            { value: 'image', label: 'Imagens' },
            { value: 'reference', label: 'Referências' },
          ]}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nada salvo ainda"
          description="Guarde links, documentos e referências importantes."
          actionLabel="Adicionar"
          onAction={openCreate}
        />
      ) : mode === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
              <Badge>{item.kind}</Badge>
              <h3 className="mt-2 font-semibold">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-text-muted">{item.description || item.url}</p>
              <p className="mt-2 text-xs text-text-subtle">{formatDate(item.createdAt)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}>
                  <ExternalLink className="h-4 w-4" /> Abrir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await navigator.clipboard.writeText(item.url);
                    toast.success('Link copiado');
                  }}
                >
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border bg-bg-elevated/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  setEditing(item);
                  setForm({
                    title: item.title,
                    url: item.url,
                    description: item.description || '',
                    kind: item.kind,
                    category: item.category || '',
                    projectId: item.projectId || '',
                  });
                  setOpen(true);
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge>{item.kind}</Badge>
                  {item.favorite ? <Badge tone="warning">Favorito</Badge> : null}
                </div>
                <p className="truncate text-xs text-text-subtle">{item.url}</p>
              </button>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await navigator.clipboard.writeText(item.url);
                    toast.success('Link copiado');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => updateSavedLink(item.id, { archived: true })}>
                  Arquivar
                </Button>
                <Button size="sm" variant="ghost" aria-label="Excluir" onClick={() => setDeleteId(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar item' : 'Novo item'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Título" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <Input label="URL" type="url" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} required />
          <Textarea label="Descrição" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Tipo"
              value={form.kind}
              onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value as FileKind }))}
              options={[
                { value: 'link', label: 'Link' },
                { value: 'document', label: 'Documento' },
                { value: 'image', label: 'Imagem' },
                { value: 'reference', label: 'Referência' },
              ]}
            />
            <Select
              label="Projeto"
              value={form.projectId}
              onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
              options={[{ value: '', label: 'Nenhum' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
            />
          </div>
          <Input label="Categoria" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
          <p className="text-xs text-text-subtle">
            O campo <code>storagePath</code> está preparado para uploads futuros via Supabase Storage ou Firebase Storage.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir item?"
        description="O link/arquivo será removido da sua biblioteca."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteSavedLink(deleteId);
            toast.success('Item excluído');
          }
          setDeleteId(null);
        }}
      />
    </div>
  );
}
