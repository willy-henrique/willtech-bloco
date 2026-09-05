import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import LoginScreen from "./LoginScreen";

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0e0d] text-neutral-400 gap-3">
        <div
          role="status"
          aria-label="Carregando"
          className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-emerald-400"
        />
        <span className="text-xs text-neutral-500">Iniciando workspace...</span>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <>{children}</>;
};

export default AuthGate;
