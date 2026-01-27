
import React from 'react';
import { AppProvider } from './AppContext';
import MainDashboard from './MainDashboard';

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-lime-500/30">
        <MainDashboard />
      </div>
    </AppProvider>
  );
};

export default App;
