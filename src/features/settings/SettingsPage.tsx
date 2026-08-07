import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import type { ThemePreference } from '../../types';

const INTEGRATIONS = [
  'Google Calendar',
  'Gmail',
  'WhatsApp',
  'Telegram',
];

export function SettingsPage() {
  const toast = useToast();
  const { user, logout, updateLocalProfile, isLocalMode } = useAuth();
  const { preferences, updatePreferences, exportData, clearAllData } = useData();
  const { preference, setPreference } = useTheme();
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-4 md:px-6">
      <div>
        <h2 className="text-lg font-semibold">Configurações</h2>
        <p className="text-sm text-text-muted">Perfil, aparência, preferências e integrações</p>
      </div>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <h3 className="font-semibold">Perfil</h3>
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="E-mail" value={user?.email || ''} disabled />
        <Input label="Telefone (opcional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Fuso horário" value={user?.timezone || 'America/Sao_Paulo'} disabled />
        <Input label="Idioma" value={user?.language || 'pt-BR'} disabled />
        <Button
          onClick={() => {
            updateLocalProfile({ displayName: name, phone });
            toast.success('Perfil atualizado');
          }}
        >
          Salvar perfil
        </Button>
        {isLocalMode ? <Badge tone="info">Modo local</Badge> : <Badge tone="success">Firebase Auth</Badge>}
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <h3 className="font-semibold">Aparência</h3>
        <Select
          label="Tema"
          value={preference}
          onChange={(e) => {
            const value = e.target.value as ThemePreference;
            setPreference(value);
            updatePreferences({ theme: value });
          }}
          options={[
            { value: 'light', label: 'Claro' },
            { value: 'dark', label: 'Escuro' },
            { value: 'system', label: 'Sistema' },
          ]}
        />
        <Select
          label="Densidade"
          value={preferences.density}
          onChange={(e) => updatePreferences({ density: e.target.value as 'comfortable' | 'compact' })}
          options={[
            { value: 'comfortable', label: 'Confortável' },
            { value: 'compact', label: 'Compacta' },
          ]}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={preferences.reduceMotion}
            onChange={(e) => updatePreferences({ reduceMotion: e.target.checked })}
          />
          Reduzir animações
        </label>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <h3 className="font-semibold">Preferências</h3>
        <Select
          label="Início da semana"
          value={String(preferences.weekStartsOn)}
          onChange={(e) => updatePreferences({ weekStartsOn: Number(e.target.value) as 0 | 1 })}
          options={[
            { value: '1', label: 'Segunda' },
            { value: '0', label: 'Domingo' },
          ]}
        />
        <Select
          label="Formato de data"
          value={preferences.dateFormat}
          onChange={(e) =>
            updatePreferences({
              dateFormat: e.target.value as 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd',
            })
          }
          options={[
            { value: 'dd/MM/yyyy', label: 'dd/MM/yyyy' },
            { value: 'MM/dd/yyyy', label: 'MM/dd/yyyy' },
            { value: 'yyyy-MM-dd', label: 'yyyy-MM-dd' },
          ]}
        />
        <Select
          label="Formato de horário"
          value={preferences.timeFormat}
          onChange={(e) => updatePreferences({ timeFormat: e.target.value as '24h' | '12h' })}
          options={[
            { value: '24h', label: '24h' },
            { value: '12h', label: '12h' },
          ]}
        />
        <Input label="Moeda" value="BRL" disabled />
        <Select
          label="Página inicial"
          value={preferences.homePage}
          onChange={(e) => updatePreferences({ homePage: e.target.value })}
          options={[
            { value: '/', label: 'Início' },
            { value: '/tarefas', label: 'Tarefas' },
            { value: '/agenda', label: 'Agenda' },
          ]}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={preferences.notificationsEnabled}
            onChange={(e) => updatePreferences({ notificationsEnabled: e.target.checked })}
          />
          Notificações habilitadas
        </label>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <h3 className="font-semibold">Dados</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              const blob = new Blob([exportData()], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = `willtech-export-${Date.now()}.json`;
              anchor.click();
              URL.revokeObjectURL(url);
              toast.success('Exportação gerada');
            }}
          >
            Exportar dados
          </Button>
          <Button variant="ghost" disabled>
            Importar dados <Badge>Em breve</Badge>
          </Button>
          <Button variant="danger" onClick={() => setClearOpen(true)}>
            Limpar dados
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <h3 className="font-semibold">Integrações</h3>
        <ul className="space-y-2">
          {INTEGRATIONS.map((item) => (
            <li key={item} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span>{item}</span>
              <Badge>Em breve</Badge>
            </li>
          ))}
        </ul>
      </section>

      <Button variant="outline" onClick={() => void logout()}>
        Sair da conta
      </Button>

      <ConfirmDialog
        open={clearOpen}
        title="Limpar todos os dados?"
        description="Esta ação remove tarefas, notas, eventos e demais registros deste usuário neste dispositivo."
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          clearAllData();
          setClearOpen(false);
          toast.success('Dados limpos');
        }}
      />
    </div>
  );
}
