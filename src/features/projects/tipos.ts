export type { EventoDeCommit } from '../../../types';
import type { EventoDeCommit } from '../../../types';

/**
 * Um projeto como o gerador o enxerga a partir do repositório local.
 * É o formato intermediário: vira um doc em `projects` na importação.
 */
export interface CatalogoProjeto {
  name: string;
  status: 'Active' | 'Maintenance' | 'Legacy';
  type: string;
  progress: number;
  color: string;
  stack: string;
  /** "owner/repo" no GitHub, ou null para repositório sem remote lá. */
  repo: string | null;
  /** Apelidos que o resolvedor da captura reconhece. */
  aliases: string[];
  /** Vocabulário de domínio, minerado das mensagens de commit. */
  vocab: string[];
  /** YYYY-MM-DD do commit mais recente. */
  ultimoCommit: string;
  evolucoes30d: number;
  correcoes30d: number;
  historico: EventoDeCommit[];
}
