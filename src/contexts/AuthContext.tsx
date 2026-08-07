import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { readJSON, removeKey, writeJSON } from '../lib/storage';
import type { UserProfile } from '../types';
import { DEFAULT_TIMEZONE } from '../constants/defaults';

const LOCAL_USER_KEY = 'willtech.v2:local-user';

interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isLocalMode: boolean;
  firebaseReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginLocal: (displayName?: string) => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateLocalProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toProfile(user: User): UserProfile {
  const now = Date.now();
  return {
    id: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
    photoURL: user.photoURL || undefined,
    timezone: DEFAULT_TIMEZONE,
    language: 'pt-BR',
    createdAt: now,
    updatedAt: now,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    const local = readJSON<UserProfile | null>(LOCAL_USER_KEY, null);
    if (local) {
      setUser(local);
      setIsLocalMode(true);
      setLoading(false);
    }

    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (next) => {
      setFirebaseUser(next);
      if (next) {
        removeKey(LOCAL_USER_KEY);
        setIsLocalMode(false);
        setUser(toProfile(next));
      } else if (!readJSON<UserProfile | null>(LOCAL_USER_KEY, null)) {
        setUser(null);
        setIsLocalMode(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth não configurado. Use o modo local ou defina as variáveis VITE_FIREBASE_*.');
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    if (!auth) throw new Error('Firebase Auth não configurado. Use o modo local ou defina as variáveis VITE_FIREBASE_*.');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    setUser(toProfile({ ...credential.user, displayName } as User));
  }, []);

  const loginLocal = useCallback((displayName = 'Willy') => {
    const now = Date.now();
    const localUser: UserProfile = {
      id: 'local-user',
      email: 'local@willtech.app',
      displayName,
      timezone: DEFAULT_TIMEZONE,
      language: 'pt-BR',
      createdAt: now,
      updatedAt: now,
    };
    writeJSON(LOCAL_USER_KEY, localUser);
    setUser(localUser);
    setIsLocalMode(true);
    setFirebaseUser(null);
  }, []);

  const logout = useCallback(async () => {
    removeKey(LOCAL_USER_KEY);
    setIsLocalMode(false);
    setUser(null);
    if (auth && firebaseUser) {
      await signOut(auth);
    }
  }, [firebaseUser]);

  const resetPassword = useCallback(async (email: string) => {
    if (!auth) throw new Error('Firebase Auth não configurado.');
    await sendPasswordResetEmail(auth, email);
  }, []);

  const updateLocalProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates, updatedAt: Date.now() };
      if (isLocalMode) writeJSON(LOCAL_USER_KEY, next);
      return next;
    });
  }, [isLocalMode]);

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      loading,
      isLocalMode,
      firebaseReady: isFirebaseConfigured,
      login,
      register,
      loginLocal,
      logout,
      resetPassword,
      updateLocalProfile,
    }),
    [
      user,
      firebaseUser,
      loading,
      isLocalMode,
      login,
      register,
      loginLocal,
      logout,
      resetPassword,
      updateLocalProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
