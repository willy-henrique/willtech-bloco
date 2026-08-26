// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buscarAtividadeDoRepo, buscarAtividade } from './_atividade';

const fetchFalso = vi.fn();

beforeEach(() => {
  fetchFalso.mockReset();
  vi.stubGlobal('fetch', fetchFalso);
});

afterEach(() => vi.unstubAllGlobals());

function commit(mensagem: string, data = '2026-08-25T10:00:00Z') {
  return { sha: 'abc', commit: { message: mensagem, committer: { date: data } } };
}

const respostaOk = (corpo: unknown) => ({ ok: true, status: 200, json: async () => corpo });
const respostaErro = (status: number) => ({ ok: false, status, json: async () => ({}) });

describe('buscarAtividadeDoRepo — sucesso', () => {
  it('conta evoluções e correções separadamente', async () => {
    fetchFalso.mockResolvedValue(
      respostaOk([
        commit('feat: presenca da equipe'),
        commit('feat: audio no atendimento'),
        commit('fix: revoga sessao'),
        commit('chore: bump'),
      ])
    );

    const r = await buscarAtividadeDoRepo('dono/repo');
    expect(r.ok).toBe(true);
    expect(r.evolucoes30d).toBe(2);
    expect(r.correcoes30d).toBe(1);
  });

  it('usa a data do commit mais recente', async () => {
    fetchFalso.mockResolvedValue(
      respostaOk([
        commit('feat: novo', '2026-08-25T10:00:00Z'),
        commit('fix: antigo', '2026-08-20T10:00:00Z'),
      ])
    );

    expect((await buscarAtividadeDoRepo('dono/repo')).ultimoCommit).toBe('2026-08-25');
  });

  it('tira o prefixo do assunto no histórico', async () => {
    fetchFalso.mockResolvedValue(respostaOk([commit('feat(auth): login novo')]));
    expect((await buscarAtividadeDoRepo('dono/repo')).historico![0].assunto).toBe('login novo');
  });

  it('guarda só a primeira linha da mensagem', async () => {
    fetchFalso.mockResolvedValue(respostaOk([commit('feat: login novo\n\nCorpo longo aqui.')]));
    expect((await buscarAtividadeDoRepo('dono/repo')).historico![0].assunto).toBe('login novo');
  });

  it('conserta acentuação corrompida vinda do GitHub', async () => {
    fetchFalso.mockResolvedValue(respostaOk([commit('fix: corrige validaÃ§Ã£o')]));
    expect((await buscarAtividadeDoRepo('dono/repo')).historico![0].assunto).toBe(
      'corrige validação'
    );
  });

  it('limita o histórico a 20 commits', async () => {
    fetchFalso.mockResolvedValue(
      respostaOk(Array.from({ length: 50 }, (_, i) => commit(`feat: item ${i}`)))
    );
    const r = await buscarAtividadeDoRepo('dono/repo');
    expect(r.historico).toHaveLength(20);
    // a contagem NÃO é limitada pelo histórico
    expect(r.evolucoes30d).toBe(50);
  });

  it('trata repositório sem commits na janela como parado, não como erro', async () => {
    fetchFalso.mockResolvedValue(respostaOk([]));
    const r = await buscarAtividadeDoRepo('dono/repo');
    expect(r.ok).toBe(true);
    expect(r.evolucoes30d).toBe(0);
    expect(r.historico).toEqual([]);
  });
});

describe('buscarAtividadeDoRepo — falhas', () => {
  it('explica que 404 provavelmente é repositório privado', async () => {
    fetchFalso.mockResolvedValue(respostaErro(404));
    const r = await buscarAtividadeDoRepo('dono/privado');
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/privado/i);
    expect(r.erro).toMatch(/token/i);
  });

  it('explica 401 como token inválido', async () => {
    fetchFalso.mockResolvedValue(respostaErro(401));
    expect((await buscarAtividadeDoRepo('dono/repo')).erro).toMatch(/token.*inv[áa]lido/i);
  });

  it('explica 403 como limite da API', async () => {
    fetchFalso.mockResolvedValue(respostaErro(403));
    expect((await buscarAtividadeDoRepo('dono/repo')).erro).toMatch(/limite/i);
  });

  it('não lança quando a rede falha', async () => {
    fetchFalso.mockRejectedValue(new Error('ECONNREFUSED'));
    const r = await buscarAtividadeDoRepo('dono/repo');
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/alcan[çc]ar/i);
  });
});

describe('buscarAtividadeDoRepo — token', () => {
  it('não envia Authorization quando não há token', async () => {
    fetchFalso.mockResolvedValue(respostaOk([]));
    await buscarAtividadeDoRepo('dono/repo');
    const [, opcoes] = fetchFalso.mock.calls[0];
    expect(opcoes.headers.Authorization).toBeUndefined();
  });

  it('envia o token como Bearer quando existe', async () => {
    fetchFalso.mockResolvedValue(respostaOk([]));
    await buscarAtividadeDoRepo('dono/repo', 'ghp_segredo');
    const [, opcoes] = fetchFalso.mock.calls[0];
    expect(opcoes.headers.Authorization).toBe('Bearer ghp_segredo');
  });
});

describe('buscarAtividade — lote', () => {
  it('uma falha não derruba os outros repositórios', async () => {
    fetchFalso
      .mockResolvedValueOnce(respostaOk([commit('feat: ok')]))
      .mockResolvedValueOnce(respostaErro(404))
      .mockResolvedValueOnce(respostaOk([commit('fix: tambem ok')]));

    const r = await buscarAtividade(['a/1', 'b/2', 'c/3']);
    expect(r.map((x) => x.ok)).toEqual([true, false, true]);
  });

  it('devolve um resultado por repositório, na mesma ordem', async () => {
    fetchFalso.mockResolvedValue(respostaOk([]));
    const r = await buscarAtividade(['a/1', 'b/2']);
    expect(r.map((x) => x.repo)).toEqual(['a/1', 'b/2']);
  });
});
