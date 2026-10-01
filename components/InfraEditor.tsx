import React, { useEffect, useState } from 'react';
import {
  Copy,
  Globe,
  Link2,
  Mail,
  Plus,
  Save,
  Server,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../AppContext';
import type { PlatformName, Project, ProjectEndpoint, ProjectPlatform } from '../types';
import { PLATFORMS } from '../types';
import { PLATAFORMA_LABEL } from './InfraHub';

const novaPlataforma = (): ProjectPlatform => ({
  id: '',
  platform: 'github',
  email: '',
  accountName: '',
  projectName: '',
  consoleUrl: '',
  notes: '',
});

const novoEndpoint = (): ProjectEndpoint => ({
  id: '',
  label: '',
  url: '',
  method: '',
  auth: '',
  notes: '',
});

const inputCls =
  'w-full rounded-lg border border-neutral-800 bg-[#0d100f] px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none transition focus:border-emerald-400/30';

const rotuloCls = 'mb-1.5 block text-xs font-semibold text-neutral-400';

interface InfraEditorProps {
  project: Project;
}

/** Editor de contas de plataforma, endpoints, e-mail principal e URL de produção. */
const InfraEditor: React.FC<InfraEditorProps> = ({ project }) => {
  const { updateProject } = useApp();

  const [ownerEmail, setOwnerEmail] = useState(project.ownerEmail ?? '');
  const [deployUrl, setDeployUrl] = useState(project.deployUrl ?? '');
  const [plataformas, setPlataformas] = useState<ProjectPlatform[]>(project.platforms ?? []);
  const [endpoints, setEndpoints] = useState<ProjectEndpoint[]>(project.endpoints ?? []);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    setOwnerEmail(project.ownerEmail ?? '');
    setDeployUrl(project.deployUrl ?? '');
    setPlataformas(project.platforms ?? []);
    setEndpoints(project.endpoints ?? []);
  }, [project.id, project.ownerEmail, project.deployUrl, project.platforms, project.endpoints]);

  const salvar = async () => {
    setSalvando(true);
    setAviso(null);
    try {
      await updateProject(project.id, {
        ownerEmail: ownerEmail.trim() || undefined,
        deployUrl: deployUrl.trim() || undefined,
        platforms: plataformas
          .map((p) => ({
            ...p,
            id: p.id || `plf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            email: p.email.trim(),
            accountName: p.accountName?.trim() || undefined,
            projectName: p.projectName?.trim() || undefined,
            consoleUrl: p.consoleUrl?.trim() || undefined,
            notes: p.notes?.trim() || undefined,
            updatedAt: Date.now(),
          }))
          .filter((p) => p.email),
        endpoints: endpoints
          .map((e) => ({
            ...e,
            id: e.id || `ept_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            label: e.label.trim(),
            url: e.url.trim(),
            method: e.method?.trim() || undefined,
            auth: e.auth?.trim() || undefined,
            notes: e.notes?.trim() || undefined,
            updatedAt: Date.now(),
          }))
          .filter((e) => e.label && e.url),
      });
      setAviso('Infraestrutura salva.');
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : 'Falha ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const copiar = (texto: string, chave: string) => {
    void navigator.clipboard.writeText(texto);
    setCopiado(chave);
    window.setTimeout(() => setCopiado(null), 1600);
  };

  return (
    <div className="space-y-6">
      {/* Identidade */}
      <div className="rounded-2xl border border-neutral-800 bg-[#121614] p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
          <Mail size={15} className="text-emerald-300" /> Identidade e produção
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={rotuloCls}>E-mail principal do projeto</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="ex: willydev01@gmail.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className={rotuloCls}>URL de produção</label>
            <input
              type="url"
              value={deployUrl}
              onChange={(e) => setDeployUrl(e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Plataformas */}
      <div className="rounded-2xl border border-neutral-800 bg-[#121614] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Server size={15} className="text-emerald-300" /> Contas por plataforma
            <span className="text-neutral-600">(GitHub, Vercel, Render, Firebase, Supabase…)</span>
          </h3>
          <button
            type="button"
            onClick={() => setPlataformas([...plataformas, novaPlataforma()])}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-300 px-3 py-1.5 text-xs font-bold text-[#07110c] transition hover:bg-emerald-200"
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {plataformas.length === 0 ? (
          <p className="py-6 text-center text-xs text-neutral-600">
            Nenhuma conta registrada. Adicione a primeira para o Hub saber onde este projeto vive e com qual e-mail.
          </p>
        ) : (
          <div className="space-y-3">
            {plataformas.map((pl, indice) => (
              <div key={pl.id || indice} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={rotuloCls}>Plataforma</label>
                    <select
                      value={pl.platform}
                      onChange={(e) =>
                        setPlataformas(plataformas.map((p, i) => (i === indice ? { ...p, platform: e.target.value as PlatformName } : p)))
                      }
                      className={inputCls}
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {PLATAFORMA_LABEL[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={rotuloCls}>E-mail usado no login *</label>
                    <input
                      type="email"
                      value={pl.email}
                      onChange={(e) => setPlataformas(plataformas.map((p, i) => (i === indice ? { ...p, email: e.target.value } : p)))}
                      placeholder="ex: willydev01@gmail.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={rotuloCls}>Conta / organização</label>
                    <input
                      type="text"
                      value={pl.accountName ?? ''}
                      onChange={(e) => setPlataformas(plataformas.map((p, i) => (i === indice ? { ...p, accountName: e.target.value } : p)))}
                      placeholder="ex: willy-henrique, Mavo Tech"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={rotuloCls}>Nome do app/serviço lá</label>
                    <input
                      type="text"
                      value={pl.projectName ?? ''}
                      onChange={(e) => setPlataformas(plataformas.map((p, i) => (i === indice ? { ...p, projectName: e.target.value } : p)))}
                      placeholder="ex: mavotalk-maisvarejo-api"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={rotuloCls}>Link do console</label>
                    <input
                      type="url"
                      value={pl.consoleUrl ?? ''}
                      onChange={(e) => setPlataformas(plataformas.map((p, i) => (i === indice ? { ...p, consoleUrl: e.target.value } : p)))}
                      placeholder="https://console/vercel.com/..."
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={rotuloCls}>Observações</label>
                    <input
                      type="text"
                      value={pl.notes ?? ''}
                      onChange={(e) => setPlataformas(plataformas.map((p, i) => (i === indice ? { ...p, notes: e.target.value } : p)))}
                      placeholder="ex: plano free, titular X"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPlataformas(plataformas.filter((_, i) => i !== indice))}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-neutral-500 transition hover:text-red-400"
                  >
                    <Trash2 size={13} /> Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Endpoints */}
      <div className="rounded-2xl border border-neutral-800 bg-[#121614] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Link2 size={15} className="text-emerald-300" /> Endpoints conhecidos
            <span className="text-neutral-600">(API, webhooks, painéis)</span>
          </h3>
          <button
            type="button"
            onClick={() => setEndpoints([...endpoints, novoEndpoint()])}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-300 px-3 py-1.5 text-xs font-bold text-[#07110c] transition hover:bg-emerald-200"
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {endpoints.length === 0 ? (
          <p className="py-6 text-center text-xs text-neutral-600">
            Nenhum endpoint registrado. Registre APIs de produção, webhooks e URLs que você usa em integrações.
          </p>
        ) : (
          <div className="space-y-3">
            {endpoints.map((ep, indice) => (
              <div key={ep.id || indice} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className={rotuloCls}>Nome *</label>
                    <input
                      type="text"
                      value={ep.label}
                      onChange={(e) => setEndpoints(endpoints.map((x, i) => (i === indice ? { ...x, label: e.target.value } : x)))}
                      placeholder="ex: API de produção"
                      className={inputCls}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className={rotuloCls}>URL *</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={ep.url}
                        onChange={(e) => setEndpoints(endpoints.map((x, i) => (i === indice ? { ...x, url: e.target.value } : x)))}
                        placeholder="https://..."
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => copiar(ep.url, `url-${indice}`)}
                        title="Copiar URL"
                        className="shrink-0 rounded-lg border border-neutral-800 px-2.5 text-neutral-500 transition hover:text-emerald-300"
                      >
                        {copiado === `url-${indice}` ? '✓' : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={rotuloCls}>Método</label>
                    <input
                      type="text"
                      value={ep.method ?? ''}
                      onChange={(e) => setEndpoints(endpoints.map((x, i) => (i === indice ? { ...x, method: e.target.value } : x)))}
                      placeholder="GET, POST…"
                      className={inputCls}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className={rotuloCls}>Autenticação</label>
                    <input
                      type="text"
                      value={ep.auth ?? ''}
                      onChange={(e) => setEndpoints(endpoints.map((x, i) => (i === indice ? { ...x, auth: e.target.value } : x)))}
                      placeholder="ex: Bearer — chave no Bitwarden"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={rotuloCls}>Observações</label>
                    <input
                      type="text"
                      value={ep.notes ?? ''}
                      onChange={(e) => setEndpoints(endpoints.map((x, i) => (i === indice ? { ...x, notes: e.target.value } : x)))}
                      placeholder="ex: rate limit 10/s"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEndpoints(endpoints.filter((_, i) => i !== indice))}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-neutral-500 transition hover:text-red-400"
                  >
                    <Trash2 size={13} /> Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salvar */}
      <div className="flex items-center justify-end gap-3">
        {aviso && <span className={`text-xs ${aviso.includes('Falha') ? 'text-red-400' : 'text-emerald-300'}`}>{aviso}</span>}
        <button
          type="button"
          onClick={() => void salvar()}
          disabled={salvando}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-2.5 text-sm font-bold text-[#07110c] transition hover:bg-emerald-200 disabled:opacity-50"
        >
          {salvando ? <X size={15} className="animate-spin" /> : <Save size={15} />}
          Salvar infraestrutura
        </button>
      </div>
    </div>
  );
};

export default InfraEditor;
