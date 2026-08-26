import { describe, it, expect } from 'vitest';
import { estaPendente } from './estaPendente';
import type { ProjectPayment } from '../../../types';

const HOJE = new Date('2026-08-26T12:00:00');

function pagamento(over: Partial<ProjectPayment> = {}): ProjectPayment {
  return {
    id: 'x',
    projectId: 'p1',
    title: 'Mensalidade',
    dueDate: '2026-08-10',
    status: 'pending',
    createdAt: 0,
    ...over,
  };
}

describe('estaPendente — pagamento avulso', () => {
  it('está pendente quando o vencimento já passou', () => {
    expect(estaPendente(pagamento({ dueDate: '2026-08-10' }), HOJE)).toBe(true);
  });

  it('está pendente quando vence hoje', () => {
    expect(estaPendente(pagamento({ dueDate: '2026-08-26' }), HOJE)).toBe(true);
  });

  it('não está pendente quando ainda vai vencer', () => {
    expect(estaPendente(pagamento({ dueDate: '2026-09-15' }), HOJE)).toBe(false);
  });

  it('não está pendente depois de pago', () => {
    expect(estaPendente(pagamento({ dueDate: '2026-08-10', status: 'paid' }), HOJE)).toBe(false);
  });
});

describe('estaPendente — recorrente', () => {
  it('está pendente quando o dia da recorrência já chegou', () => {
    expect(
      estaPendente(pagamento({ isRecurring: true, recurringDay: 4 }), HOJE)
    ).toBe(true);
  });

  it('não está pendente antes do dia da recorrência', () => {
    expect(
      estaPendente(pagamento({ isRecurring: true, recurringDay: 28 }), HOJE)
    ).toBe(false);
  });

  it('volta a ficar pendente no mês seguinte ao pagamento', () => {
    // pago em julho, hoje é 26 de agosto e a recorrência é dia 4
    const pagoEmJulho = pagamento({
      status: 'paid',
      isRecurring: true,
      recurringDay: 4,
      paidAt: new Date('2026-07-04T10:00:00').getTime(),
    });
    expect(estaPendente(pagoEmJulho, HOJE)).toBe(true);
  });

  it('continua quitado quando foi pago neste mês', () => {
    const pagoEmAgosto = pagamento({
      status: 'paid',
      isRecurring: true,
      recurringDay: 4,
      paidAt: new Date('2026-08-04T10:00:00').getTime(),
    });
    expect(estaPendente(pagoEmAgosto, HOJE)).toBe(false);
  });

  it('continua quitado antes de o dia da recorrência chegar de novo', () => {
    const pagoEmJulho = pagamento({
      status: 'paid',
      isRecurring: true,
      recurringDay: 28,
      paidAt: new Date('2026-07-28T10:00:00').getTime(),
    });
    expect(estaPendente(pagoEmJulho, HOJE)).toBe(false);
  });

  it('não considera pendente recorrente pago sem data de pagamento registrada', () => {
    const semPaidAt = pagamento({ status: 'paid', isRecurring: true, recurringDay: 4 });
    expect(estaPendente(semPaidAt, HOJE)).toBe(false);
  });
});

describe('estaPendente — bordas', () => {
  it('trata recorrente sem dia definido como avulso', () => {
    expect(
      estaPendente(pagamento({ isRecurring: true, dueDate: '2026-08-10' }), HOJE)
    ).toBe(true);
  });

  it('não quebra com data de vencimento inválida', () => {
    expect(() => estaPendente(pagamento({ dueDate: 'nao-e-data' }), HOJE)).not.toThrow();
  });

  it('interpreta a data de vencimento no fuso local, não em UTC', () => {
    // '2026-08-27' não pode virar "26 de agosto 21h" e contar como vencido
    expect(estaPendente(pagamento({ dueDate: '2026-08-27' }), HOJE)).toBe(false);
  });
});
