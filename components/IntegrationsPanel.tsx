import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  PlugZap,
  RefreshCw,
  Save,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { systemService } from '../src/services/firestoreService';

type Saude = 'verificando' | 'ok' | 'sem_chave' | 'nao_configurado' | 'indisponivel';

const ENDPOINT_PADRAO = 'https://willydev.tail4a0af0.ts.net';

const ACOES_DOC: Array<{ acao: string; descricao: string }> = [
  { acao: 'upsert_project', descricao: 'Cria/atualiza um projeto: name, repo, stack, deployUrl, ownerEmail, platforms, endpoints.' },
  { acao: 'upsert_platform', descricao: 'Adiciona/atualiza uma conta de plataforma (ex: e-mail usado no Vercel).' },
  { acao: 'upsert_endpoint', descricao: 'Adiciona/atualiza um endpoint conhecido (API, webhook…).' },
  { acao: 'add_note', descricao: 'Registra uma anotação no projeto.' },
  { acao: 'add_task', descricao: 'Cria uma tarefa no projeto.' },
  { acao: 'upsert_credential', descricao: 'Cria/atualiza uma credencial de desenvolvimento.' },
];

const EditIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const IntegrationsPanel: React.FC = () => {
  const [endpointUrl, setEndpointUrl] = useState(ENDPOINT_PADRAO);
  const [urlEditavel, setUrlEditavel] = useState('');
  const [editandoUrl, setEditandoUrl] = useState(false);
  const [saude, setSaude] = useState<Saude>('verificando');
  const [chave, setChave] = useState<string | null>(null);
  const [mostrarChave, setMostrarChave] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [salvandoUrl, setSalvandoUrl] = useState(false);

  const verificar = useCallback(async () => {
    setSaude('verificando');
    try {
      const resposta = await fetch(endpointUrl, { headers: { Accept: 'application/json' } });
      const info = (await resposta.json()) as { configurado?: boolean; chaveConfigurada?: boolean };
      if (typeof info.configurado !== 'boolean') {
        setSaude('indisponivel');
        return;
      }
      if (!info.configurado) {
        setSaude('nao_configurado');
        return;
      }
      setSaude(info.chaveConfigurada ? 'ok' : 'sem_chave');
    } catch {
      setSaude('indisponivel');
    }
  }, [endpointUrl]);

  useEffect(() => {
    void systemService
      .getIngestConfig()
      .then((cfg) => {
        if (cfg?.apiKey) setChave(cfg.apiKey);
        if (cfg?.endpointUrl) {
          setEndpointUrl(cfg.endpointUrl);
          setUrlEditavel(cfg.endpointUrl);
        } else {
          setUrlEditavel(ENDPOINT_PADRAO);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void verificar();
  }, [verificar]);

  const gerarChave = async () => {
    setGerando(true);
    try {
      const nova = await systemService.rotateIngestKey();
      setChave(nova);
      setMostrarChave(true);
      void verificar();
    } catch (erro) {
      console.error('Falha ao gerar chave:', erro);
    } finally {
      setGerando(false);
    }
  };

  const salvarUrl = async () => {
    setSalvandoUrl(true);
    try {
      const url = urlEditavel.trim() || ENDPOINT_PADRAO;
      await systemService.saveEndpointUrl(url);
      setEndpointUrl(url);
      setEditandoUrl(false);
    } catch (erro) {
      console.error('Falha ao salvar URL:', erro);
    } finally {
      setSalvandoUrl(false);
    }
  };

  const copiar = (texto: string, rotulo: string) => {
    void navigator.clipboard.writeText(texto);
    setCopiado(rotulo);
    window.setTimeout(() => setCopiado(null), 1600);
  };

  const mascaraChave = (k: string) => (mostrarChave ? k : `${k.slice(0, 7)}••••••••••••••••${k.slice(-4)}`);

  const curlExemplo = chave
    ? `curl -X POST ${endpointUrl} \\
  -H "Authorization: Bearer ${chave}" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"upsert_project","data":{"name":"Meu App","repo":"willy-henrique/meu-app","deployUrl":"https://meu-app.vercel.app","ownerEmail":"willydev01@gmail.com","platforms":[{"platform":"vercel","email":"willydev01@gmail.com","projectName":"meu-app"}],"endpoints":[{"label":"API","url":"https://api.meu-app.com","method":"GET"}]}}'`
    : null;

  const nodeExemplo = chave
    ? `const resposta = await fetch('${endpointUrl}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${chave}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'add_note',
    data: { projectId: 'meu-app', title: 'Deploy', content: 'Versão 2 no ar.' },
  }),
});
console.log(await resposta.json());`
    : null;

  const cardCls = 'surface-panel rounded-[22px] border border-white/[0.07] p-5 md:p-6';

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6 md:mb-8">
        <p className="text-[9px] font-bold uppercase tracking-[0.21em] text-emerald-300/65">Integrações</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white md:text-[30px]">Endpoint de ingestão</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
          O WillTech Bloco recebe dados de projetos, contas, endpoints, notas e tarefas por HTTP. Conecte o Hermes,
          scripts, n8n ou qualquer app — tudo desemboca aqui e aparece no painel.
        </p>
      </div>

      <div className="space-y-5">
        {/* Status */}
        <div className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PlugZap size={18} className="text-emerald-300" />
              <div>
                <h3 className="text-sm font-bold text-white">Status do endpoint</h3>
                {editandoUrl ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="url"
                      value={urlEditavel}
                      onChange={(e) => setUrlEditavel(e.target.value)}
                      className="h-8 w-72 max-w-full rounded-lg border border-neutral-800 bg-[#0d100f] px-3 text-xs text-neutral-200 outline-none focus:border-emerald-400/30"
                      placeholder={ENDPOINT_PADRAO}
                    />
                    <button
                      type="button"
                      onClick={() => void salvarUrl()}
                      disabled={salvandoUrl}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-300 px-2.5 py-1.5 text-[11px] font-bold text-[#07110c] disabled:opacity-50"
                    >
                      <Save size={12} /> {salvandoUrl ? 'Salvando…' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoUrl(false)}
                      className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-neutral-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                    <code className="text-neutral-400">{endpointUrl}</code>
                    <button
                      type="button"
                      onClick={() => setEditandoUrl(true)}
                      title="Trocar URL do endpoint"
                      className="text-neutral-600 transition hover:text-emerald-300"
                    >
                      <EditIcon />
                    </button>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saude === 'ok' && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 size={13} /> Pronto para receber dados
                </span>
              )}
              {saude === 'sem_chave' && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                  <AlertTriangle size={13} /> Falta gerar a chave de API
                </span>
              )}
              {saude === 'nao_configurado' && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                  <AlertTriangle size={13} /> Servidor sem chave de serviço
                </span>
              )}
              {saude === 'indisponivel' && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300">
                  <AlertTriangle size={13} /> Endpoint fora do ar
                </span>
              )}
              {saude === 'verificando' && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-neutral-400">
                  <RefreshCw size={13} className="animate-spin" /> Verificando…
                </span>
              )}
              <button
                type="button"
                onClick={() => void verificar()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-neutral-400 transition hover:text-white"
              >
                <RefreshCw size={12} /> Verificar de novo
              </button>
            </div>
          </div>

          {saude === 'nao_configurado' && (
            <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4 text-xs leading-5 text-amber-100/80">
              O endpoint roda no seu servidor pessoal (Tailscale), mas a chave de serviço do Firebase ainda não foi
              conectada lá. Peça ao Hermes: <span className="font-semibold text-amber-200">"conecta a chave de serviço do WillTech Bloco"</span>.
            </div>
          )}

          {saude === 'indisponivel' && (
            <div className="mt-5 rounded-xl border border-red-400/15 bg-red-400/[0.04] p-4 text-xs leading-5 text-red-200">
              O endpoint não respondeu. Confira se esta máquina está na rede Tailscale (o endpoint vive em{' '}
              <span className="font-semibold">willydev.tail4a0af0.ts.net</span>) e se o servidor pessoal está ligado.
            </div>
          )}
        </div>

        {/* Chave */}
        <div className={cardCls}>
          <div className="flex items-center gap-3">
            <KeyRound size={18} className="text-emerald-300" />
            <div>
              <h3 className="text-sm font-bold text-white">Chave de API</h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                Exigida em todo POST (Authorization: Bearer). Fica no Firestore, protegida pelas regras do painel.
              </p>
            </div>
          </div>

          {chave ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <code className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-neutral-200">
                {mascaraChave(chave)}
              </code>
              <button
                type="button"
                onClick={() => setMostrarChave(!mostrarChave)}
                title={mostrarChave ? 'Ocultar' : 'Mostrar'}
                className="rounded-lg border border-white/[0.08] px-2.5 py-2 text-neutral-400 transition hover:text-white"
              >
                {mostrarChave ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button
                type="button"
                onClick={() => copiar(chave, 'chave')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-neutral-400 transition hover:text-white"
              >
                {copiado === 'chave' ? <CheckCircle2 size={13} className="text-emerald-300" /> : <Copy size={13} />}
                Copiar
              </button>
              <button
                type="button"
                onClick={() => void gerarChave()}
                disabled={gerando}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/25 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
              >
                <ShieldCheck size={13} />
                {gerando ? 'Gerando…' : 'Rotacionar chave'}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void gerarChave()}
                disabled={gerando}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-bold text-[#07110c] transition hover:bg-emerald-200 disabled:opacity-50"
              >
                <KeyRound size={14} />
                {gerando ? 'Gerando…' : 'Gerar chave de API'}
              </button>
              <p className="text-[11px] text-neutral-600">Nenhuma chave configurada ainda.</p>
            </div>
          )}
          {saude === 'sem_chave' && chave && (
            <p className="mt-3 text-[11px] text-amber-300/80">
              A chave existe no painel mas o servidor ainda não a viu — atualize em alguns segundos.
            </p>
          )}
        </div>

        {/* Documentação */}
        <div className={cardCls}>
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Terminal size={15} className="text-emerald-300" /> Como enviar dados
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            POST com cabeçalho <code className="text-neutral-400">Authorization: Bearer &lt;chave&gt;</code> e corpo{' '}
            <code className="text-neutral-400">{'{ action, data }'}</code>.
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-2.5 font-bold text-neutral-300">action</th>
                  <th className="px-4 py-2.5 font-bold text-neutral-300">O que faz</th>
                </tr>
              </thead>
              <tbody>
                {ACOES_DOC.map((a) => (
                  <tr key={a.acao} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-2.5">
                      <code className="text-emerald-300">{a.acao}</code>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-400">{a.descricao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {curlExemplo && (
            <>
              <p className="mt-5 mb-2 text-xs font-bold text-neutral-300">Exemplo — registrar projeto (curl)</p>
              <div className="relative">
                <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#0a0d0b] p-4 text-[11px] leading-5 text-neutral-300">{curlExemplo}</pre>
                <button
                  type="button"
                  onClick={() => copiar(curlExemplo, 'curl')}
                  className="absolute right-2 top-2 rounded-lg border border-white/[0.08] bg-[#0d100f]/90 px-2 py-1 text-[10px] text-neutral-400 transition hover:text-white"
                >
                  {copiado === 'curl' ? 'Copiado ✓' : 'Copiar'}
                </button>
              </div>
            </>
          )}

          {nodeExemplo && (
            <>
              <p className="mt-5 mb-2 text-xs font-bold text-neutral-300">Exemplo — Node.js / TypeScript</p>
              <div className="relative">
                <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#0a0d0b] p-4 text-[11px] leading-5 text-neutral-300">{nodeExemplo}</pre>
                <button
                  type="button"
                  onClick={() => copiar(nodeExemplo, 'node')}
                  className="absolute right-2 top-2 rounded-lg border border-white/[0.08] bg-[#0d100f]/90 px-2 py-1 text-[10px] text-neutral-400 transition hover:text-white"
                >
                  {copiado === 'node' ? 'Copiado ✓' : 'Copiar'}
                </button>
              </div>
            </>
          )}

          <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-[11px] leading-5 text-neutral-500">
            <p className="font-bold text-neutral-300">n8n</p>
            <p className="mt-1">
              Nó <span className="text-neutral-300">HTTP Request</span>: Method <span className="text-neutral-300">POST</span>, URL{' '}
              <code className="text-neutral-400">{endpointUrl}</code>, Header{' '}
              <span className="text-neutral-300">Authorization = Bearer &lt;chave&gt;</span>, Body = JSON com{' '}
              <span className="text-neutral-300">{'{ action, data }'}</span>.
            </p>
            <p className="mt-3 text-neutral-600">
              O endpoint também aceita GET para checar o status:{' '}
              <a
                href={endpointUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 underline-offset-2 hover:underline"
              >
                {endpointUrl} <ExternalLink size={10} className="inline" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsPanel;
