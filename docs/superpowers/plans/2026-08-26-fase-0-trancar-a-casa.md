# Fase 0 — Trancar a Casa: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tirar o painel `willtech-bloco` do estado de exposição pública — hoje ele está no ar no Vercel sem autenticação, com `allow read, write: if true` no Firestore e senhas de clientes no Vault.

**Architecture:** Firebase Auth com Google barra o render do painel antes de qualquer listener do Firestore subir. As `firestore.rules` passam a exigir um UID único, com as coleções de máquina (coletor e bot das fases seguintes) marcadas como somente-leitura pelo cliente — o Admin SDK ignora rules e continua escrevendo. As rules são verificadas por testes reais no emulador do Firestore, não por inspeção visual.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, Tailwind 4, Firebase 12 (Auth + Firestore), Vitest 3, Testing Library, `@firebase/rules-unit-testing`, firebase-tools 14.25 (emulador, exige Java — Java 21 confirmado na máquina).

## Global Constraints

- **Nenhuma mensagem de commit pode conter `Co-Authored-By`.** Preferência explícita do usuário.
- **Branch:** todo o trabalho acontece em `feat/fase-0-seguranca`. Não commitar direto em `main`.
- **Nenhuma chave de API pode entrar no bundle do cliente.** Chaves de LLM vivem apenas em Vercel Functions (fases seguintes).
- **A `firebaseConfig` em `src/config/firebase.ts` NÃO é segredo** e continua no código. É identificador público de projeto; quem protege o banco são as rules.
- **`AppProvider` deve ficar dentro do gate de autenticação.** Se ficar fora, os listeners do Firestore sobem sem usuário logado e tomam `permission-denied` assim que as rules fecharem.
- **Idioma:** todo texto visível ao usuário em português do Brasil.
- **Tema visual existente:** fundo `bg-neutral-950`, texto `text-neutral-200`, acento `lime-500`. A tela de login deve seguir isso.
- **UID do dono:** valor real capturado na Task 2. Vive literal em `firestore.rules` (não é segredo, é identificador).

---

## File Structure

| Arquivo | Responsabilidade | Ação |
|---|---|---|
| `src/config/firebase.ts` | Init do Firebase + exporta `auth`, `db`, `googleProvider` | Modificar |
| `src/auth/AuthContext.tsx` | Estado de sessão: `user`, `loading`, `error`, `signIn`, `logout` | Criar |
| `src/auth/AuthGate.tsx` | Decide entre spinner, `LoginScreen` e `children` | Criar |
| `src/auth/LoginScreen.tsx` | Tela de login com botão do Google | Criar |
| `src/auth/AuthGate.test.tsx` | Prova que o painel não renderiza sem usuário | Criar |
| `App.tsx` | Compõe `AuthProvider` → `AuthGate` → `AppProvider` | Modificar |
| `MainDashboard.tsx` | Ganha botão de sair no header | Modificar |
| `firestore.rules` | Lockdown por UID | Modificar |
| `tests/rules/firestore.rules.test.ts` | Testes das rules no emulador | Criar |
| `firebase.json` | Config do emulador de Firestore | Criar |
| `vitest.config.ts` | jsdom por padrão; rules test roda em node via docblock | Criar |
| `vitest.setup.ts` | `@testing-library/jest-dom` | Criar |
| `vite.config.ts` | Remover o `define` que injeta `GEMINI_API_KEY` no bundle | Modificar |
| `package.json` | Dependências de teste e scripts `test` / `test:rules` | Modificar |

---

### Task 1: Gate de autenticação com Google

Ao fim desta task o painel exige login. As rules continuam abertas — isso é intencional: não dá para travar as rules num UID antes de existir um UID (Task 2).

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Create: `src/auth/AuthContext.tsx`, `src/auth/AuthGate.tsx`, `src/auth/LoginScreen.tsx`
- Modify: `src/config/firebase.ts`, `App.tsx`, `MainDashboard.tsx`, `package.json`
- Test: `src/auth/AuthGate.test.tsx`

**Interfaces:**
- Consumes: `auth` de `src/config/firebase.ts` (já existe)
- Produces:
  - `googleProvider: GoogleAuthProvider` — export de `src/config/firebase.ts`
  - `AuthProvider: React.FC<{ children: React.ReactNode }>` — export de `src/auth/AuthContext.tsx`
  - `useAuth(): { user: User | null; loading: boolean; error: string | null; signIn: () => Promise<void>; logout: () => Promise<void> }` — export de `src/auth/AuthContext.tsx`
  - `AuthGate: React.FC<{ children: React.ReactNode }>` — export default de `src/auth/AuthGate.tsx`

- [ ] **Step 1: Criar a branch de trabalho**

```bash
git -C "C:/willydev/willtech-bloco" checkout -b feat/fase-0-seguranca
```

Esperado: `Switched to a new branch 'feat/fase-0-seguranca'`

- [ ] **Step 2: Instalar as dependências de teste**

```bash
cd "C:/willydev/willtech-bloco" && npm install -D vitest@^3 jsdom @testing-library/react @testing-library/jest-dom @firebase/rules-unit-testing
```

Esperado: `added N packages`. `@firebase/rules-unit-testing` já entra aqui porque a Task 3 vai usá-lo.

- [ ] **Step 3: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Criar `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Adicionar os scripts de teste ao `package.json`**

No objeto `"scripts"`, adicionar as três linhas abaixo depois de `"preview": "vite preview"`:

```json
    "test": "vitest run",
    "test:watch": "vitest",
    "test:rules": "firebase emulators:exec --only firestore --project willtech-rules-test \"vitest run tests/rules\""
```

- [ ] **Step 6: Escrever o teste que falha**

Criar `src/auth/AuthGate.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseAuth = vi.fn();
vi.mock('./AuthContext', () => ({ useAuth: () => mockUseAuth() }));

import AuthGate from './AuthGate';

describe('AuthGate', () => {
  beforeEach(() => mockUseAuth.mockReset());

  it('não renderiza o painel enquanto a sessão está carregando', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, error: null, signIn: vi.fn(), logout: vi.fn() });
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.queryByText('PAINEL')).not.toBeInTheDocument();
  });

  it('mostra a tela de login quando não há usuário', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, error: null, signIn: vi.fn(), logout: vi.fn() });
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.queryByText('PAINEL')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar com google/i })).toBeInTheDocument();
  });

  it('renderiza o painel quando há usuário', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'abc123' }, loading: false, error: null, signIn: vi.fn(), logout: vi.fn() });
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.getByText('PAINEL')).toBeInTheDocument();
  });

  it('mostra a mensagem de erro do login', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, error: 'Falha ao entrar', signIn: vi.fn(), logout: vi.fn() });
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.getByText('Falha ao entrar')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Rodar o teste e confirmar que falha**

```bash
cd "C:/willydev/willtech-bloco" && npm test -- src/auth/AuthGate.test.tsx
```

Esperado: FAIL — `Failed to resolve import "./AuthGate"`.

- [ ] **Step 8: Exportar o `googleProvider` do Firebase**

Em `src/config/firebase.ts`, trocar a linha de import do auth:

```ts
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
```

E, logo antes da linha `export { app, db, auth };`, adicionar:

```ts
export const googleProvider = new GoogleAuthProvider();
```

- [ ] **Step 9: Criar `src/auth/AuthContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      setError('Não foi possível entrar. Tente novamente.');
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
};
```

- [ ] **Step 10: Criar `src/auth/LoginScreen.tsx`**

```tsx
import React from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';
import { useAuth } from './AuthContext';

const LoginScreen: React.FC = () => {
  const { signIn, error } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-lime-400" aria-hidden="true" />
          <h1 className="text-lg font-semibold tracking-tight">WillTech Bloco</h1>
        </div>

        <p className="text-sm text-neutral-400 mb-6">
          Painel restrito. Entre com a conta autorizada para continuar.
        </p>

        <button
          type="button"
          onClick={signIn}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-lime-500 px-4 py-3
                     text-sm font-medium text-neutral-950 transition hover:bg-lime-400
                     focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2
                     focus:ring-offset-neutral-950"
        >
          <LogIn className="w-4 h-4" aria-hidden="true" />
          Entrar com Google
        </button>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
```

- [ ] **Step 11: Criar `src/auth/AuthGate.tsx`**

```tsx
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
```

- [ ] **Step 12: Rodar os testes e confirmar que passam**

```bash
cd "C:/willydev/willtech-bloco" && npm test -- src/auth/AuthGate.test.tsx
```

Esperado: PASS — 4 testes.

- [ ] **Step 13: Ligar o gate no `App.tsx`**

Substituir o conteúdo inteiro de `App.tsx` por:

```tsx
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
```

`AppProvider` está **dentro** do `AuthGate` de propósito: seus listeners do Firestore só sobem depois do login.

- [ ] **Step 14: Ligar os botões de sair que já existem**

`MainDashboard.tsx` já importa `LogOut` de `lucide-react` (linha 13) e já renderiza **dois** botões de logout decorativos, sem `onClick` — um na sidebar da visão de finanças (linha 48) e outro na sidebar do dashboard (linha 101). Não é preciso criar UI nova: basta ligá-los.

Adicionar aos imports:

```tsx
import { useAuth } from './src/auth/AuthContext';
```

Dentro do componente, junto dos outros hooks (logo abaixo do `useApp()`):

```tsx
const { user, logout } = useAuth();
```

As duas ocorrências têm exatamente o mesmo texto, então a substituição pode ser feita de uma vez. De:

```tsx
<button className="p-3 rounded-xl text-neutral-700 hover:text-red-400 mt-auto"><LogOut size={20} /></button>
```

Para:

```tsx
<button onClick={logout} title={user?.email ?? undefined} aria-label="Sair" className="p-3 rounded-xl text-neutral-700 hover:text-red-400 mt-auto"><LogOut size={20} /></button>
```

Confirmar que as duas foram trocadas:

```bash
cd "C:/willydev/willtech-bloco" && grep -c "onClick={logout}" MainDashboard.tsx
```

Esperado: `2`

- [ ] **Step 15: Habilitar o provedor Google no Firebase (ação do usuário)**

No console: <https://console.firebase.google.com/project/willtech-a9bb6/authentication/providers> → **Google** → **Ativar** → definir e-mail de suporte → **Salvar**.

Depois, em **Authentication → Settings → Authorized domains**, confirmar que o domínio do Vercel está na lista (`localhost` já vem por padrão).

- [ ] **Step 16: Verificar o build e o login local**

```bash
cd "C:/willydev/willtech-bloco" && npm run build
```

Esperado: build sem erro de TypeScript.

Depois subir o dev server e confirmar no navegador: a tela de login aparece, o botão do Google abre o popup, e o painel só renderiza depois de autenticar.

- [ ] **Step 17: Commit**

```bash
cd "C:/willydev/willtech-bloco" && git add -A && git commit -m "feat(auth): exige login com Google antes de renderizar o painel"
```

---

### Task 2: Capturar o UID do dono (checkpoint)

**Files:** nenhum. É uma ação do usuário que desbloqueia a Task 3.

- [ ] **Step 1: Fazer o primeiro login**

Com o dev server rodando, entrar com a conta Google que será a dona do painel.

- [ ] **Step 2: Copiar o UID**

Console → <https://console.firebase.google.com/project/willtech-a9bb6/authentication/users> → localizar o usuário recém-criado → copiar o valor da coluna **User UID** (28 caracteres alfanuméricos).

- [ ] **Step 3: Registrar o UID**

Anotar o valor. Ele será colado literalmente em `firestore.rules` na Task 3, Step 4. Não é segredo — é identificador de conta, e o repositório fica privado ao fim da Task 5.

---

### Task 3: Rules fechadas, verificadas no emulador

**Files:**
- Create: `firebase.json`, `tests/rules/firestore.rules.test.ts`
- Modify: `firestore.rules`

**Interfaces:**
- Consumes: o UID capturado na Task 2
- Produces: `firestore.rules` contendo exatamente uma linha no formato `function ownerUid() { return '<UID>'; }` — o teste extrai o UID desse padrão, então o formato precisa ser preservado

- [ ] **Step 1: Criar `firebase.json`**

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "emulators": {
    "firestore": {
      "host": "127.0.0.1",
      "port": 8080
    },
    "ui": {
      "enabled": false
    },
    "singleProjectMode": true
  }
}
```

- [ ] **Step 2: Escrever os testes que falham**

Criar `tests/rules/firestore.rules.test.ts`:

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const RULES = readFileSync('firestore.rules', 'utf8');

const uidMatch = RULES.match(/function ownerUid\(\) \{ return '([^']+)'; \}/);
if (!uidMatch) {
  throw new Error(
    "firestore.rules precisa conter exatamente: function ownerUid() { return '<UID>'; }"
  );
}
const OWNER_UID = uidMatch[1];
const INTRUDER_UID = 'intruso-nao-autorizado';

const HUMAN_COLLECTIONS = [
  'projects', 'tasks', 'snippets', 'vault',
  'project_credentials', 'project_payments', 'project_notes', 'project_details',
];

const MACHINE_COLLECTIONS = [
  'project_signals', 'project_events', 'project_inbox', 'capture_inbox', 'sync_runs',
];

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'willtech-rules-test',
    firestore: { host: '127.0.0.1', port: 8080, rules: RULES },
  });
});

afterAll(async () => { await testEnv.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); });

describe('o UID do dono', () => {
  it('não é um placeholder', () => {
    expect(OWNER_UID).toMatch(/^[A-Za-z0-9]{20,}$/);
  });
});

describe('coleções humanas', () => {
  it.each(HUMAN_COLLECTIONS)('nega leitura anônima em %s', async (col) => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, col, 'x')));
  });

  it.each(HUMAN_COLLECTIONS)('nega escrita anônima em %s', async (col) => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, col, 'x'), { a: 1 }));
  });

  it.each(HUMAN_COLLECTIONS)('nega leitura de outro usuário logado em %s', async (col) => {
    const db = testEnv.authenticatedContext(INTRUDER_UID).firestore();
    await assertFails(getDoc(doc(db, col, 'x')));
  });

  it.each(HUMAN_COLLECTIONS)('permite leitura e escrita do dono em %s', async (col) => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(setDoc(doc(db, col, 'x'), { a: 1 }));
    await assertSucceeds(getDoc(doc(db, col, 'x')));
  });
});

describe('coleções de máquina', () => {
  it.each(MACHINE_COLLECTIONS)('permite o dono ler %s', async (col) => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(getDoc(doc(db, col, 'x')));
  });

  it.each(MACHINE_COLLECTIONS)('nega escrita até do dono em %s (só Admin SDK)', async (col) => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(setDoc(doc(db, col, 'x'), { a: 1 }));
  });

  it.each(MACHINE_COLLECTIONS)('nega leitura anônima em %s', async (col) => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, col, 'x')));
  });
});

describe('coleção desconhecida', () => {
  it('é negada até para o dono', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(getDoc(doc(db, 'colecao_inventada', 'x')));
    await assertFails(setDoc(doc(db, 'colecao_inventada', 'x'), { a: 1 }));
  });
});
```

- [ ] **Step 3: Rodar os testes e confirmar que falham**

```bash
cd "C:/willydev/willtech-bloco" && npm run test:rules
```

Esperado: FAIL logo na carga do arquivo, com a mensagem `firestore.rules precisa conter exatamente: function ownerUid() ...` — porque as rules atuais ainda são `allow read, write: if true`.

- [ ] **Step 4: Escrever as rules fechadas**

Substituir o conteúdo inteiro de `firestore.rules`. Trocar `COLE_O_UID_DA_TASK_2` pelo UID capturado na Task 2, preservando o formato exato da linha `function ownerUid()` — o teste depende dele.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function ownerUid() { return 'COLE_O_UID_DA_TASK_2'; }

    function isOwner() {
      return request.auth != null && request.auth.uid == ownerUid();
    }

    // ---- Coleções humanas: só o dono lê e escreve ----
    match /projects/{docId}            { allow read, write: if isOwner(); }
    match /tasks/{docId}               { allow read, write: if isOwner(); }
    match /snippets/{docId}            { allow read, write: if isOwner(); }
    match /vault/{docId}               { allow read, write: if isOwner(); }
    match /project_credentials/{docId} { allow read, write: if isOwner(); }
    match /project_payments/{docId}    { allow read, write: if isOwner(); }
    match /project_notes/{docId}       { allow read, write: if isOwner(); }
    match /project_details/{docId}     { allow read, write: if isOwner(); }

    // ---- Coleções de máquina ----
    // O dono lê no painel; nenhum cliente escreve.
    // O coletor e o bot usam Admin SDK, que ignora rules.
    match /project_signals/{docId} { allow read: if isOwner(); allow write: if false; }
    match /project_events/{docId}  { allow read: if isOwner(); allow write: if false; }
    match /project_inbox/{docId}   { allow read: if isOwner(); allow write: if false; }
    match /capture_inbox/{docId}   { allow read: if isOwner(); allow write: if false; }
    match /sync_runs/{docId}       { allow read: if isOwner(); allow write: if false; }

    // ---- Qualquer outro caminho: negado ----
    match /{document=**} { allow read, write: if false; }
  }
}
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

```bash
cd "C:/willydev/willtech-bloco" && npm run test:rules
```

Esperado: PASS — **49 testes**, zero falhas. A conta: 1 (UID não é placeholder) + 32 (8 coleções humanas × 4 cenários) + 15 (5 coleções de máquina × 3 cenários) + 1 (coleção desconhecida).

- [ ] **Step 6: Rodar a suíte inteira**

```bash
cd "C:/willydev/willtech-bloco" && npm test
```

Esperado: os 4 testes do `AuthGate` passam. Os testes de rules falham aqui — é esperado, porque `npm test` não sobe o emulador. Eles só rodam via `npm run test:rules`.

- [ ] **Step 7: Commit**

```bash
cd "C:/willydev/willtech-bloco" && git add -A && git commit -m "feat(security): fecha as firestore.rules no UID do dono, com testes no emulador"
```

---

### Task 4: Tirar a chave do Gemini do bundle

**Files:**
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: nada
- Produces: nada. `GEMINI_API_KEY` deixa de existir no bundle.

Contexto: `process.env.API_KEY` e `process.env.GEMINI_API_KEY` são injetados no bundle do cliente pelo `define`. Hoje o valor é vazio e nenhum código do projeto os consome — é sobra do scaffold do AI Studio. É uma armadilha: bastaria preencher o `.env.local` para publicar a chave no Vercel. As fases seguintes usam Groq dentro de Vercel Functions, onde a chave nunca toca o cliente.

- [ ] **Step 1: Confirmar que nada consome as variáveis**

```bash
cd "C:/willydev/willtech-bloco" && grep -rnE "process\.env\.(API_KEY|GEMINI_API_KEY)" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v vite.config
```

Esperado: nenhuma saída.

- [ ] **Step 2: Remover o bloco `define`**

Em `vite.config.ts`, apagar as quatro linhas do bloco `define` (o objeto inteiro, incluindo as duas linhas `'process.env...'`). O `loadEnv` também deixa de ser usado — remover `loadEnv` do import e a linha `const env = loadEnv(...)`. O arquivo fica:

```ts
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
```

- [ ] **Step 3: Confirmar que o build limpo não contém a variável**

```bash
cd "C:/willydev/willtech-bloco" && rm -rf dist && npm run build && grep -rl "GEMINI_API_KEY" dist/ || echo "OK: nada no bundle"
```

Esperado: `OK: nada no bundle`

- [ ] **Step 4: Commit**

```bash
cd "C:/willydev/willtech-bloco" && git add -A && git commit -m "chore(security): remove injecao de GEMINI_API_KEY no bundle do cliente"
```

---

### Task 5: Publicar e verificar o fechamento

**Files:** nenhum arquivo de código. Deploy e verificação.

**Interfaces:**
- Consumes: `firestore.rules` da Task 3
- Produces: critério de aceite da Fase 0 satisfeito

- [ ] **Step 1: Publicar as rules**

```bash
cd "C:/willydev/willtech-bloco" && npx firebase deploy --only firestore:rules --project willtech-a9bb6
```

Esperado: `+  Deploy complete!`

- [ ] **Step 2: Provar que o acesso anônimo está bloqueado**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://firestore.googleapis.com/v1/projects/willtech-a9bb6/databases/(default)/documents/vault"
```

Esperado: `403`

Repetir para as outras coleções sensíveis:

```bash
for c in projects tasks project_credentials project_payments project_notes project_details snippets; do printf "%-22s %s\n" "$c" "$(curl -s -o /dev/null -w "%{http_code}" "https://firestore.googleapis.com/v1/projects/willtech-a9bb6/databases/(default)/documents/$c")"; done
```

Esperado: `403` em todas.

- [ ] **Step 3: Confirmar que o painel logado continua funcionando**

Com o dev server rodando e a sessão autenticada, verificar que projetos, tarefas, vault e snippets carregam normalmente. Se aparecer `permission-denied` no console, a causa mais provável é o `AppProvider` ter saído de dentro do `AuthGate` — conferir `App.tsx`.

- [ ] **Step 4: Tornar o repositório privado (ação do usuário)**

<https://github.com/willy-henrique/willtech-bloco/settings> → **Danger Zone** → **Change repository visibility** → **Make private**.

Consequência registrada no spec §12: com o repo privado, o GitHub Actions das fases seguintes passa a consumir a cota de 2000 min/mês do free tier — por isso o cron do coletor é de 1 hora.

- [ ] **Step 5: Fazer o push da branch**

```bash
cd "C:/willydev/willtech-bloco" && git push -u origin feat/fase-0-seguranca
```

- [ ] **Step 6: Confirmar o deploy no Vercel**

Após o merge em `main`, abrir a URL de produção numa janela anônima e confirmar que a tela de login aparece e o painel não renderiza sem autenticação.

---

## Critério de aceite da Fase 0

- [ ] Requisição anônima à REST API do Firestore retorna `403` em todas as 8 coleções humanas
- [ ] Um usuário logado com UID diferente do dono também recebe negação (coberto por teste)
- [ ] O painel exige login na URL de produção do Vercel
- [ ] `npm run test:rules` passa com zero falhas
- [ ] `dist/` não contém `GEMINI_API_KEY`
- [ ] O repositório `willtech-bloco` está privado
