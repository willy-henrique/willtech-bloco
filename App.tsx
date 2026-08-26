import React from 'react';
import { AppProvider } from './AppContext';
import MainDashboard from './MainDashboard';
import { AuthProvider } from './src/auth/AuthContext';
import AuthGate from './src/auth/AuthGate';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-lime-500/30">
        <AuthGate>
          <AppProvider>
            <MainDashboard />
          </AppProvider>
        </AuthGate>
      </div>
    </AuthProvider>
  );
};

export default App;
