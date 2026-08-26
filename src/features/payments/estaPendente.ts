import type { ProjectPayment } from '../../../types';

/**
 * `new Date('2026-08-27')` é interpretado como UTC meia-noite, o que no
 * Brasil vira 26 de agosto às 21h — e um pagamento que vence amanhã
 * apareceria como vencido hoje. Fixar meio-dia local elimina o problema
 * em qualquer fuso.
 */
function dataLocal(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

const mesmoMes = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/**
 * Diz se um pagamento está cobrando atenção hoje.
 *
 * Avulso: pendente quando o vencimento chegou ou passou.
 *
 * Recorrente: pendente quando o dia do mês já chegou. Se foi quitado, volta
 * a pendente no mês seguinte — é o comportamento que faz uma mensalidade
 * reaparecer sozinha sem precisar recriar o registro todo mês.
 */
export function estaPendente(pagamento: ProjectPayment, hoje: Date = new Date()): boolean {
  const recorrente = Boolean(pagamento.isRecurring && pagamento.recurringDay);

  if (pagamento.status === 'paid') {
    // Só um recorrente quitado pode voltar a vencer.
    if (!recorrente || !pagamento.paidAt) return false;

    const pagoEm = new Date(pagamento.paidAt);
    return hoje.getDate() >= pagamento.recurringDay! && !mesmoMes(hoje, pagoEm);
  }

  if (recorrente) {
    return hoje.getDate() >= pagamento.recurringDay!;
  }

  const vencimento = dataLocal(pagamento.dueDate);
  if (Number.isNaN(vencimento.getTime())) return false;

  return vencimento <= hoje;
}
