import { describe, it, expect } from 'vitest';
import { parseIntent } from './parseIntent';
import { TaskPriority } from '../../../types';

describe('parseIntent — prioridade', () => {
  it('detecta urgente', () => {
    const r = parseIntent('arrumar o bug do QR no pesqueiro, urgente');
    expect(r.priority).toBe(TaskPriority.URGENT);
  });

  it('detecta crítico com acento', () => {
    expect(parseIntent('crítico: o site do cliente caiu').priority).toBe(TaskPriority.CRITICAL);
  });

  it('detecta critico sem acento', () => {
    expect(parseIntent('critico: o site do cliente caiu').priority).toBe(TaskPriority.CRITICAL);
  });

  it('detecta baixa prioridade em "quando der"', () => {
    expect(parseIntent('revisar o layout quando der').priority).toBe(TaskPriority.LOW);
  });

  it('detecta baixa prioridade em "sem pressa"', () => {
    expect(parseIntent('trocar o favicon, sem pressa').priority).toBe(TaskPriority.LOW);
  });

  it('usa Normal quando nada indica prioridade', () => {
    expect(parseIntent('atualizar as dependências').priority).toBe(TaskPriority.NORMAL);
  });

  it('crítico vence urgente quando os dois aparecem', () => {
    expect(parseIntent('urgente e crítico: banco fora').priority).toBe(TaskPriority.CRITICAL);
  });
});

describe('parseIntent — tipo', () => {
  it('assume tarefa por padrão', () => {
    expect(parseIntent('corrigir o cálculo do frete').type).toBe('task');
  });

  it('reconhece nota explícita', () => {
    expect(parseIntent('nota: o cliente prefere receber por pix').type).toBe('note');
  });

  it('reconhece ideia como nota', () => {
    expect(parseIntent('ideia: colocar modo escuro no painel').type).toBe('note');
  });

  it('reconhece "lembrar que" como nota', () => {
    expect(parseIntent('lembrar que o contrato vence em março').type).toBe('note');
  });
});

describe('parseIntent — descrição', () => {
  it('remove o marcador de prioridade do fim', () => {
    expect(parseIntent('arrumar o bug do QR, urgente').description).toBe('arrumar o bug do QR');
  });

  it('remove o marcador de prioridade do início', () => {
    expect(parseIntent('crítico: o site caiu').description).toBe('o site caiu');
  });

  it('remove o marcador de tipo', () => {
    expect(parseIntent('nota: o cliente prefere pix').description).toBe('o cliente prefere pix');
  });

  it('preserva acentuação e maiúsculas do texto original', () => {
    expect(parseIntent('corrigir o cálculo do ICMS na NF-e').description).toBe(
      'corrigir o cálculo do ICMS na NF-e'
    );
  });

  it('não deixa pontuação órfã depois de remover o marcador', () => {
    expect(parseIntent('subir o deploy - urgente').description).toBe('subir o deploy');
  });

  it('devolve string vazia quando só havia marcador', () => {
    expect(parseIntent('urgente').description).toBe('');
  });
});
