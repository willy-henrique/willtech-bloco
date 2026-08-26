import { TaskPriority } from '../../../types';

export type CaptureType = 'task' | 'note';

export interface Intent {
  type: CaptureType;
  priority: TaskPriority;
  /** Texto limpo, sem os marcadores, com acentuação e caixa originais. */
  description: string;
}

/**
 * Marcadores em português. Cada entrada lista as variantes com e sem
 * acento porque a limpeza roda sobre o texto ORIGINAL — normalizar aqui
 * destruiria a acentuação que o usuário digitou.
 *
 * Ordem importa: o primeiro que casar vence, então o mais grave vem antes.
 */
const PRIORITY_MARKERS: Array<{ priority: TaskPriority; pattern: RegExp }> = [
  { priority: TaskPriority.CRITICAL, pattern: /\b(cr[ií]tic[oa]|urgent[ií]ssim[oa]|emerg[êe]ncia)\b/i },
  { priority: TaskPriority.URGENT, pattern: /\b(urgente|urg[êe]ncia|asap|pra ontem)\b/i },
  { priority: TaskPriority.LOW, pattern: /\b(quando der|sem pressa|baixa prioridade|algum dia|qualquer hora)\b/i },
];

const TYPE_MARKERS: Array<{ type: CaptureType; pattern: RegExp }> = [
  { type: 'note', pattern: /\b(nota|anota[çc][ãa]o|ideia|id[ée]ia|lembrar que|lembrete)\b/i },
];

/**
 * Tira o trecho casado e a pontuação que sobra grudada nele
 * ("subir o deploy - urgente" não pode virar "subir o deploy -").
 */
function stripMarker(text: string, pattern: RegExp): string {
  return text
    .replace(pattern, ' ')
    .replace(/\s*[:;,\-–—]\s*/g, (match, offset: number, full: string) => {
      const isEdge = offset === 0 || offset + match.length >= full.trimEnd().length;
      return isEdge ? ' ' : match;
    })
    .replace(/^[\s:;,\-–—]+/, '')
    .replace(/[\s:;,\-–—]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai tipo, prioridade e descrição limpa de um texto solto.
 * Puro: sem rede, sem chave de API. Roda no navegador.
 */
export function parseIntent(text: string): Intent {
  let description = text.trim();

  let priority = TaskPriority.NORMAL;
  for (const marker of PRIORITY_MARKERS) {
    if (marker.pattern.test(description)) {
      priority = marker.priority;
      description = stripMarker(description, marker.pattern);
      break;
    }
  }

  let type: CaptureType = 'task';
  for (const marker of TYPE_MARKERS) {
    if (marker.pattern.test(description)) {
      type = marker.type;
      description = stripMarker(description, marker.pattern);
      break;
    }
  }

  return { type, priority, description };
}
