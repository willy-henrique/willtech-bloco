import {
  Home,
  Sparkles,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  StickyNote,
  Wallet,
  Target,
  Link2,
  Workflow,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  group: 'principal' | 'vida' | 'sistema';
  mobilePrimary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Início', icon: Home, group: 'principal', mobilePrimary: true },
  { to: '/assistente', label: 'Assistente', icon: Sparkles, group: 'principal' },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, group: 'principal', mobilePrimary: true },
  { to: '/tarefas', label: 'Tarefas', icon: CheckSquare, group: 'principal', mobilePrimary: true },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban, group: 'principal' },
  { to: '/notas', label: 'Notas', icon: StickyNote, group: 'principal' },
  { to: '/financas', label: 'Finanças', icon: Wallet, group: 'vida' },
  { to: '/habitos', label: 'Hábitos e metas', icon: Target, group: 'vida' },
  { to: '/arquivos', label: 'Arquivos e links', icon: Link2, group: 'vida' },
  { to: '/automacoes', label: 'Automações', icon: Workflow, group: 'sistema' },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, group: 'sistema' },
];

export const MOBILE_PRIMARY = NAV_ITEMS.filter((item) => item.mobilePrimary);
