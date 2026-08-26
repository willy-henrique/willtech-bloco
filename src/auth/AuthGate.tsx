import React from 'react';
import { useAuth } from './AuthContext';
import LoginScreen from './LoginScreen';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          role="status"
          aria-label="Carregando"
          className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-lime-400"
        />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <>{children}</>;
};

export default AuthGate;
