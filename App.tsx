import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './AppContext';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import { AppShell } from './components/layout/AppShell';
import { TodayPage } from './features/today/TodayPage';
import { InboxPage } from './features/inbox/InboxPage';
import { AgendaPage } from './features/agenda/AgendaPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { SearchPage } from './features/search/SearchPage';
import { NotesPage } from './features/notes/NotesPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ListSkeleton } from './components/ui/Skeleton';

const OpsProjectPage = lazy(() =>
  import('./features/ops/OpsProjectPage').then((m) => ({ default: m.OpsProjectPage }))
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<TodayPage />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="projetos" element={<ProjectsPage />} />
                <Route path="tudo" element={<SearchPage />} />
                <Route path="notas" element={<NotesPage />} />
                <Route path="configuracoes" element={<SettingsPage />} />
                <Route
                  path="ops/projeto/:id"
                  element={
                    <Suspense fallback={<ListSkeleton />}>
                      <OpsProjectPage />
                    </Suspense>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
