import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthPage } from '../features/auth/AuthPage';
import { PageSkeleton } from '../components/ui/Skeleton';

const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const TasksPage = lazy(() =>
  import('../features/tasks/TasksPage').then((m) => ({ default: m.TasksPage })),
);
const CalendarPage = lazy(() =>
  import('../features/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage })),
);
const ProjectsPage = lazy(() =>
  import('../features/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
);
const ProjectDetailPage = lazy(() =>
  import('../features/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })),
);
const NotesPage = lazy(() =>
  import('../features/notes/NotesPage').then((m) => ({ default: m.NotesPage })),
);
const FinancePage = lazy(() =>
  import('../features/finance/FinancePage').then((m) => ({ default: m.FinancePage })),
);
const HabitsPage = lazy(() =>
  import('../features/habits/HabitsPage').then((m) => ({ default: m.HabitsPage })),
);
const FilesPage = lazy(() =>
  import('../features/files/FilesPage').then((m) => ({ default: m.FilesPage })),
);
const AssistantPage = lazy(() =>
  import('../features/assistant/AssistantPage').then((m) => ({ default: m.AssistantPage })),
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const AutomationsPage = lazy(() =>
  import('../features/automations/AutomationsPage').then((m) => ({ default: m.AutomationsPage })),
);

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Lazy><DashboardPage /></Lazy>} />
          <Route path="assistente" element={<Lazy><AssistantPage /></Lazy>} />
          <Route path="agenda" element={<Lazy><CalendarPage /></Lazy>} />
          <Route path="tarefas" element={<Lazy><TasksPage /></Lazy>} />
          <Route path="projetos" element={<Lazy><ProjectsPage /></Lazy>} />
          <Route path="projetos/:id" element={<Lazy><ProjectDetailPage /></Lazy>} />
          <Route path="notas" element={<Lazy><NotesPage /></Lazy>} />
          <Route path="financas" element={<Lazy><FinancePage /></Lazy>} />
          <Route path="habitos" element={<Lazy><HabitsPage /></Lazy>} />
          <Route path="arquivos" element={<Lazy><FilesPage /></Lazy>} />
          <Route path="automacoes" element={<Lazy><AutomationsPage /></Lazy>} />
          <Route path="configuracoes" element={<Lazy><SettingsPage /></Lazy>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
