import { describe, it, expect } from 'vitest';
import {
  classificarCommit,
  semPrefixo,
  repararEncoding,
  primeiraLinha,
} from './classificarCommit';

describe('classificarCommit', () => {
  it.each([
    ['feat: presenca da equipe', 'evoluiu'],
    ['feat(auth): login novo', 'evoluiu'],
    ['fix: corrige o QR', 'corrigiu'],
    ['hotfix: banco fora', 'corrigiu'],
    ['refactor: quebra o componente', 'melhorou'],
    ['perf: menos queries', 'melhorou'],
    ['docs: atualiza readme', 'manutencao'],
    ['chore: bump de versao', 'manutencao'],
    ['ci: adiciona workflow', 'manutencao'],
    ['mexi em umas coisas', 'outro'],
  ])('classifica "%s" como %s', (assunto, esperado) => {
    expect(classificarCommit(assunto)).toBe(esperado);
  });

  it('não confunde palavra que apenas começa igual', () => {
    expect(classificarCommit('features do cliente foram revisadas')).toBe('evoluiu');
  });
});

describe('semPrefixo', () => {
  it('tira o prefixo simples', () => {
    expect(semPrefixo('feat: presenca da equipe')).toBe('presenca da equipe');
  });

  it('tira o prefixo com escopo', () => {
    expect(semPrefixo('fix(auth): revoga sessao')).toBe('revoga sessao');
  });

  it('tira o prefixo com breaking change', () => {
    expect(semPrefixo('feat(api)!: muda o contrato')).toBe('muda o contrato');
  });

  it('deixa intacto o que não tem prefixo', () => {
    expect(semPrefixo('mexi em umas coisas')).toBe('mexi em umas coisas');
  });
});

describe('repararEncoding', () => {
  it('conserta UTF-8 lido como latin-1', () => {
    // "validação" gravado em UTF-8 e lido como latin-1
    const quebrado = 'corrige validaÃ§Ã£o dos campos';
    expect(repararEncoding(quebrado)).toBe('corrige validação dos campos');
  });

  it('conserta acentuação variada', () => {
    expect(repararEncoding('anotaÃ§Ãµes e configuraÃ§Ã£o')).toBe('anotações e configuração');
  });

  it('deixa intacto o texto que já está correto', () => {
    expect(repararEncoding('corrige validação dos campos')).toBe('corrige validação dos campos');
  });

  it('deixa intacto o texto sem acento nenhum', () => {
    expect(repararEncoding('fix the login bug')).toBe('fix the login bug');
  });

  it('devolve o original quando a sequência não é UTF-8 válido', () => {
    const invalido = 'Ãÿ';
    expect(() => repararEncoding(invalido)).not.toThrow();
  });
});

describe('primeiraLinha', () => {
  it('pega só o assunto de uma mensagem com corpo', () => {
    expect(primeiraLinha('feat: novo login\n\nDetalhes longos aqui.')).toBe('feat: novo login');
  });

  it('aguenta mensagem de uma linha só', () => {
    expect(primeiraLinha('feat: novo login')).toBe('feat: novo login');
  });
});
