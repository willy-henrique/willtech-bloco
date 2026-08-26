# WillTech Bloco → Plataforma de Controle

**Data:** 2026-08-26
**Status:** Design aprovado, aguardando plano de implementação
**Revisão 2:** captura migrada para bot de Telegram; adicionada fase de reestruturação do frontend

---

## 1. Problema

O `willtech-bloco` é hoje um "WillTech Command Dashboard" (React 19 + Vite + Firestore + Tailwind v4) publicado no Vercel. Ele já tem Projects, Tasks (matriz de Eisenhower), Vault, Snippets, Deadline Calendar, Finance Hub e detalhes por projeto (credenciais / pagamentos / notas).

Três problemas:

1. **Tudo é alimentado à mão.** O painel não sabe nada sobre o estado real dos ~14 projetos ativos: se o deploy quebrou, se o site do cliente caiu, há quantos dias um projeto está parado. Último commit do painel: 03/02/2026 — parado há 6 meses.
2. **Anotar dá trabalho.** Registrar uma tarefa exige abrir o painel, achar o projeto e preencher formulário. Na prática, as ideias se perdem.
3. **O frontend acumulou dívida estrutural** que vai ser multiplicada pelo volume de código novo das fases seguintes (ver §8).

O objetivo é transformá-lo numa plataforma de controle: os projetos se reportam sozinhos, e a entrada de tarefas acontece por mensagem de Telegram sem escolher projeto.

## 2. Contexto levantado

### 2.1 Repositórios em `C:\willydev`

21 repos git; 19 com remote. Quase todos em `github.com/willy-henrique`.

| Fora do alcance | Motivo |
|---|---|
| `life-pro`, `pet` | Sem remote — o coletor só-nuvem não os enxerga |
| `mavotalk-local` | Remote aponta para caminho local (`C:/willydev/willtalk`) |
| `AgroOliveira` | Hospedado no Gitea, não no GitHub — adapter opcional na Fase 4 |
| `APLICATIVO-COMPLETO`, `ar` | Org `Delta657` — o PAT precisa de acesso à org |

### 2.2 A colisão de nomes "Mavo"

Os três projetos mais ativos commitaram no mesmo dia (25/08/2026) e **nenhum** tem o nome que o usuário fala:

| Nome falado | Pasta local | Repo GitHub |
|---|---|---|
| Mavo Talk | `willtalk` | `willtalk` |
| Mavo AI | `chat-inteligente` | `mavoai` |
| Mavo Gerenciamento | `mavo-gerenciamento` | `mavo-metricas` |

Dizer apenas "mavo" é ambíguo entre três projetos vivos. Este é o caso de teste mais duro da classificação automática, e é o uso diário do usuário.

### 2.3 Problemas de segurança encontrados

| # | Problema | Onde | Gravidade |
|---|---|---|---|
| S1 | `allow read, write: if true` — Firestore totalmente aberto | `firestore.rules` | **Crítica** — o painel está no ar no Vercel sem login; qualquer um com a URL lê o Vault com senhas e `.env` de clientes |
| S2 | Sem autenticação alguma no painel | app inteiro | **Crítica** |
| S3 | `GEMINI_API_KEY` injetado no bundle do cliente via `define` | `vite.config.ts:14-15` | **Média** — hoje vazio e não usado (sobra do scaffold do AI Studio), mas é uma armadilha: preencher o `.env` publicaria a chave |
| S4 | Vault guarda senhas e `.env` em texto puro | Firestore | **Média** — mitigado pelo login, não resolvido |

### 2.4 Estado do frontend (medido)

```
1367 linhas / 17 useState   components/ProjectDetails.tsx    ← o problema principal
 730 linhas / 11 useState   components/FinanceHub.tsx
 707 linhas                 src/services/firestoreService.ts
 310 linhas                 components/ProjectModal.tsx
 300 linhas /  6 useState   MainDashboard.tsx                ← aceitável
```

| # | Problema | Detalhe |
|---|---|---|
| F1 | `ProjectDetails.tsx` com 1367 linhas e 17 `useState` | Faz credenciais + pagamentos + notas + info do projeto num arquivo só |
| F2 | Estrutura de pastas duplicada | `App.tsx`, `AppContext.tsx`, `MainDashboard.tsx`, `types.ts`, `constants.tsx` e `components/` na **raiz**; `src/config/` e `src/services/` dentro de `src/`. Duas convenções brigando (herança do scaffold do AI Studio) |
| F3 | `AppContext` vaza setters brutos | Expõe `setProjects`, `setTasks`, `setSnippets`, `setVaultItems` junto com as ações semânticas — qualquer componente pode atropelar o estado |
| F4 | Duas arquiteturas de dados no mesmo app | `AppContext` não cobre Finance nem ProjectDetails; esses falam com o Firestore por conta própria |
| F5 | Sem teste, sem lint, sem CI | Nada em `package.json`, nenhum `.eslintrc`, nenhum `.github/` |

**O que NÃO está ruim:** a stack está correta e atual (React 19, Vite 6, TS 5.8, Tailwind 4), e a maioria dos componentes fica entre 100 e 310 linhas, faixa saudável. Um rewrite do zero jogaria fora Finance Hub, pagamentos recorrentes e matriz de Eisenhower — features que funcionam — para reconstruir o equivalente. Por isso a decisão D12 é reestruturação cirúrgica, não reescrita.

## 3. Decisões tomadas

| # | Decisão | Escolha |
|---|---|---|
| D1 | Sinais a coletar | Todos: Git, deploy, uptime, erros/logs |
| D2 | Onde roda o coletor | Somente GitHub Actions (cron na nuvem) |
| D3 | Como projetos entram | Descoberta automática + curadoria em Inbox + manifesto `willtech.json` |
| D4 | Hospedagem do painel | Vercel (já publicado) |
| D5 | Superfície de captura | **Bot de Telegram** (revisão 2 — substitui PWA + Atalhos do Siri) |
| D6 | Motor de classificação | Híbrido: apelido/vocabulário primeiro, Groq só quando ambíguo |
| D7 | Voz | Voice note do Telegram → Groq Whisper (revisão 2 — substitui ditado do iOS) |
| D8 | Ordem das fases | Segurança → reestruturação → captura → coletor |
| D9 | Escopo do piloto | Todos os projetos ativos de uma vez, via script de seed |
| D10 | Criptografia do Vault | Fora do escopo por ora — o login resolve o risco real |
| D11 | Telegram vs Discord | **Telegram** (revisão 2 — ver §3.3) |
| D12 | Refatoração do frontend | **Reestruturação cirúrgica de código**, mesma aparência (revisão 2) |

**Definição de "projeto ativo"** (usada pelo seed da §7.6): repo com remote no GitHub **e** push nos últimos 6 meses. Pelo levantamento atual isso dá ~14 repos, de `willtalk` (25/08) a `bloco-maisvarejo` (14/05). `projeto-pitdog` (07/03) e `GRDEDETIZAÇÃO` (15/12/2025) entram como `Legacy` com `syncEnabled: false`. O usuário revisa e corrige a classificação no painel.

### 3.1 Por que captura antes do coletor

A Captura depende apenas das fases 0-1 e da coleção `projects`, que já existe. O coletor é infra-pesado e paga mais devagar. A captura entrega valor na primeira semana.

### 3.2 Por que segurança antes da reestruturação

A Fase 0 são ~4h; a Fase 1 são ~2 dias. O painel está exposto **agora**. Fazer a reestruturação primeiro significaria 2 dias a mais de exposição para economizar o retrabalho de mover um provider de auth e uma tela de login — que é trivial. Segurança primeiro.

### 3.3 Por que Telegram e não Discord

| | Telegram | Discord |
|---|---|---|
| Receber mensagem comum | **Webhook HTTP** → Vercel Function | Exige **WebSocket 24/7** (Gateway) → volta o problema de hibernação do Render |
| Alternativa serverless | — | Só slash commands + verificação de assinatura Ed25519 em toda request |
| Criar o bot | @BotFather, ~30 s | Portal de developers, app, OAuth, escopos, convite ao servidor |
| Áudio | Voice note nativo → `getFile` → Whisper | Mais trabalhoso de recuperar |
| Infra nova exigida | **Nenhuma** | Um processo sempre ligado |

O Telegram roda inteiro dentro do Vercel que já existe. Zero infra nova, zero custo.

### 3.4 O que o Telegram resolve do desenho anterior

1. **Elimina o Bearer token do Atalho do Siri**, que era o ponto mais fraco da revisão 1. A autenticação vira `secret_token` no header (validado pelo próprio Telegram) + allowlist de `chat_id`. Nenhum segredo colado dentro de um Atalho.
2. **Mantém o hands-free.** O Siri envia mensagens de Telegram nativamente: *"Ei Siri, mandar mensagem no Telegram pra Bloco"* → dita → cai no bot. Sem abrir app.
3. **Ganha canal de resposta.** Quando a classificação fica ambígua, o bot pergunta ali mesmo com botões inline. O `capture_inbox` deixa de precisar do painel na maioria dos casos.
4. **Dispensa a fila offline.** O app do Telegram já enfileira a mensagem sem sinal e envia ao reconectar. Elimina o service worker e o IndexedDB da revisão 1.
5. **Dispensa a PWA como superfície de captura.** O manifest/`apple-touch-icon` viram item opcional, só para consultar o painel no celular — não bloqueiam nada.

## 4. Arquitetura

### 4.1 Duas metades independentes

```
  ENTRADA HUMANA                          ENTRADA DE MÁQUINA
  ──────────────                          ──────────────────
  Telegram (qualquer aparelho)            GitHub Actions (cron 1h)
        │ texto ou voice note                    │
        ▼                                        ▼
  /api/telegram (Vercel Function)          collector/ (Node + TS)
        │                                        │
        └──────────────► Firestore ◄─────────────┘
                             │
                             ▼
                   Painel React (Vercel)
```

Cada metade pode quebrar sem derrubar a outra. O único ponto de encontro é o **catálogo de projetos**, que serve tanto para desenhar o card quanto para ensinar o agente a reconhecer de qual projeto o usuário está falando.

### 4.2 Regra de escrita

Regra rígida para o robô nunca atropelar curadoria humana:

| Quem escreve | Coleções |
|---|---|
| **Só o usuário** (painel) | `projects`, `tasks`, `vault`, `snippets`, `finance_*`, `project_notes`, `project_credentials`, `project_payments` |
| **Só o coletor** (Admin SDK) | `project_signals`, `project_events`, `project_inbox`, `sync_runs` |
| **Agente de captura** | escreve em `tasks` / `project_notes` **como se fosse o usuário**, e em `capture_inbox` quando a confiança é baixa |

Se o coletor quebrar, o bloco de notas continua intacto.

## 5. Modelo de dados

### 5.1 Coleções novas

```ts
// Estado ATUAL de cada projeto — 1 doc por projeto, sobrescrito a cada sync
project_signals/{projectId}
  git    { branch, lastCommitAt, lastCommitMsg, commits7d, openPRs, daysIdle }
  deploy { provider, state: 'ready'|'building'|'error', url, at, commitSha }
  uptime { status: 'up'|'down'|'slow', httpCode, latencyMs, checkedAt }
  errors { count24h, lastAt, topMessage }          // Fase 7
  health 'green' | 'yellow' | 'red'                // derivado dos acima
  updatedAt: number

// Histórico append-only — TTL 90 dias
project_events/{autoId}
  { projectId, type, title, at, meta }
  // type: commit.pushed | deploy.failed | deploy.succeeded
  //     | site.down | site.recovered | pr.opened | project.idle

// Fila de curadoria de projetos descobertos.
// Só rastreia se o repo já foi triado — a classificação em si vive em `projects`.
project_inbox/{repoFullName}
  { fullName, name, language, lastPushedAt, htmlUrl,
    status: 'pending' | 'promoted' | 'ignored', discoveredAt }
  // pending  → aparece no badge "N projetos novos"
  // promoted → virou doc em `projects` (com status Active/Maintenance/Legacy)
  // ignored  → nunca mais aparece, e a descoberta não recria

// Capturas de baixa confiança. Normalmente resolvidas no próprio chat
// com botões inline; o painel é o fallback.
capture_inbox/{autoId}
  { rawText, source: 'telegram-text' | 'telegram-voice',
    candidates: [{ projectId, confidence }],
    suggested: { type, priority, description, dueDate? },
    telegramMessageId, createdAt }

// Observabilidade do coletor
sync_runs/{runId}
  { startedAt, finishedAt, durationMs, ok: boolean,
    adapters: { [name]: { ok, ms, error? } }, projectsSynced: number }
```

`sync_runs` não é enfeite: sem ele o coletor morre calado e o usuário conclui que os projetos pararam quando na verdade foi o token que expirou. O header do painel mostra `última sync: há 12 min ✓`.

### 5.2 Extensões em coleções existentes

```ts
// projects/{id} ganha:
  aliases: string[]        // ["talk", "willtalk", "mavotalk"]
  vocab:   string[]        // ["whatsapp", "sessão", "fila", "supabase"]
  repo:    string          // "willy-henrique/willtalk"
  isFocus: boolean         // atalho rápido nos comandos do bot
  syncEnabled: boolean     // Ativo/Manutenção = true; Legacy = false

// tasks/{id} ganha:
  source:     'manual' | 'telegram-text' | 'telegram-voice'
  rawText?:   string       // o que foi ditado/escrito, para auditoria
  confidence?: number
```

## 6. Fase 0 — Trancar a casa (bloqueante, ~4h)

**Entrega:** o painel deixa de estar exposto. Nenhuma feature nova.

1. **Firebase Auth com Google**, restrito a um único UID. Tela de login antes de qualquer render.
2. **`firestore.rules` reescritas:**
   ```
   function isOwner() { return request.auth != null && request.auth.uid == OWNER_UID; }

   // coleções humanas: leitura e escrita só do dono
   match /{col}/{doc} where col in [projects, tasks, vault, ...] {
     allow read, write: if isOwner();
   }

   // coleções de máquina: dono lê, ninguém escreve pelo cliente.
   // O Admin SDK ignora rules, então coletor e bot continuam escrevendo.
   match /project_signals/{doc}  { allow read: if isOwner(); allow write: if false; }
   match /project_events/{doc}   { allow read: if isOwner(); allow write: if false; }
   match /project_inbox/{doc}    { allow read: if isOwner(); allow write: if false; }
   match /sync_runs/{doc}        { allow read: if isOwner(); allow write: if false; }
   ```
3. **Repo `willtech-bloco` vira privado.** É um painel pessoal com credenciais de cliente. Consequência: GitHub Actions passa a consumir a cota de 2000 min/mês do free tier (ver §12).
4. **Remover `GEMINI_API_KEY` do `vite.config.ts`** (linhas 14-15). Nenhuma chave de LLM entra no bundle — todas vivem em Vercel Functions.
5. **Verificação:** `curl` anônimo na REST API do Firestore deve retornar 403 para todas as coleções.

**Critério de aceite:** request anônima rejeitada em todas as coleções; login exigido na URL do Vercel.

## 7. Fase 1 — Reestruturação do frontend (~2 dias)

**Entrega:** mesma aparência, mesmas features, código pronto para receber o volume das fases seguintes. Nenhuma mudança visual.

Feita **antes** das features novas porque as fases 2-7 somam auth, bot, coletor, signals, timeline e alertas. Esse volume entrando na estrutura atual multiplica F1-F5 em vez de resolvê-los.

### 7.1 Estrutura alvo

```
src/
  app/          App.tsx, main.tsx, AuthProvider
  features/
    projects/   ProjectCard, ProjectModal, ProjectDetails/
    tasks/      EisenhowerMatrix
    finance/    FinanceHub, TransactionModal, GoalModal
    vault/      Vault
    snippets/   SnippetManager
    calendar/   DeadlineCalendar
    capture/    (Fase 2 — inbox de captura)
    collector/  (Fase 3 — curadoria, signals, timeline)
  shared/
    ui/         botão, modal, campo, badge
    hooks/      useProjects, useTasks, useVault, useFinance, ...
    lib/        firebase.ts, utils
  types/
```

Resolve **F2** (estrutura duplicada): nada mais fica na raiz além de config.

### 7.2 Quebra do `ProjectDetails.tsx` (F1)

1367 linhas → cinco arquivos:

| Arquivo | Responsabilidade | ~linhas |
|---|---|---|
| `ProjectDetails/index.tsx` | Layout e navegação entre abas | 120 |
| `ProjectDetails/InfoTab.tsx` | Descrição, cliente, URLs | 200 |
| `ProjectDetails/CredentialsTab.tsx` | Credenciais e `.env` | 300 |
| `ProjectDetails/PaymentsTab.tsx` | Pagamentos e recorrência | 400 |
| `ProjectDetails/NotesTab.tsx` | Anotações | 300 |

Cada aba passa a ter estado próprio e local, dissolvendo os 17 `useState` do componente único.

### 7.3 Camada de dados única (F3, F4)

`firestoreService.ts` (707 linhas) vira um hook por domínio em `shared/hooks/`, encapsulando `onSnapshot` + CRUD:

```ts
useProjects()  → { projects, addProject, updateProject, deleteProject, loading }
useTasks()     → { tasks, addTask, toggleTask, deleteTask, loading }
useVault()     → { items, addItem, deleteItem, loading }
useFinance()   → { transactions, goals, ... }
```

- `AppContext` deixa de expor `setProjects` / `setTasks` / `setSnippets` / `setVaultItems`. Só ações semânticas. **(F3)**
- `FinanceHub` e `ProjectDetails` param de falar direto com o Firestore e passam a usar os hooks. Uma arquitetura de dados só. **(F4)**
- `AppContext` fica reduzido a auth e estado global mínimo.

### 7.4 Ferramental (F5)

- ESLint + Prettier, com `npm run lint` no `package.json`
- Vitest + Testing Library. Cobertura mínima nesta fase: os hooks de dados e o resolvedor de apelidos da Fase 2
- Workflow de CI no GitHub Actions rodando lint + testes no push

### 7.5 Estratégia de migração

**Incremental, nunca big-bang.** Uma feature por vez, com o app buildando e funcionando ao fim de cada passo. Ordem sugerida: `shared/` → `vault` (menor) → `snippets` → `calendar` → `tasks` → `projects` (com a quebra do ProjectDetails) → `finance` (maior). O usuário nunca fica sem painel utilizável — o que importa, já que a captura diária de Mavo Talk e Mavo AI depende dele.

## 8. Fase 2 — Captura via Telegram (~2 dias)

**Entrega:** anotar por texto ou áudio, de qualquer aparelho, sem escolher projeto.

### 8.1 Fluxo

```
Você (Telegram, qualquer aparelho)
   │ texto ou voice note
   ▼
Telegram Bot API ──webhook──► POST /api/telegram   (Vercel Function)
                                  │
                                  ├─ valida header X-Telegram-Bot-Api-Secret-Token
                                  ├─ allowlist de chat_id (só o usuário)
                                  ├─ é voice? → getFile → Groq Whisper → texto
                                  ├─ pipeline de classificação (§8.3)
                                  └─ responde no chat:
                                       ✓ Mavo Talk · Urgent · "Corrigir leitura do QR"
                                       ou  qual? [Mavo Talk] [Mavo AI] [Mavo Ger]
```

### 8.2 Autenticação

Duas camadas, nenhuma delas um segredo copiado à mão:

1. `setWebhook` registra um `secret_token`; o Telegram o envia no header `X-Telegram-Bot-Api-Secret-Token` em toda chamada. Requests sem ele são rejeitadas.
2. Allowlist de `chat_id` em env var. Mensagem de qualquer outro chat é ignorada silenciosamente.

### 8.3 Pipeline de classificação

1. **Comando explícito?** (`/talk`, `/ai`, ou botão de projeto em foco) → grava direto, sem classificar.
2. **Resolução por apelido/vocabulário** (local, síncrono, grátis) — pontuação por termo casado contra `aliases` e `vocab` dos projetos com `syncEnabled: true`. Vencedor claro → grava.
3. **Ambíguo ou sem match?** → Groq (`llama-3.3-70b`, JSON mode, ~300ms). Entrada: o texto + o catálogo de projetos ativos com nome, cliente, stack, aliases e vocab. Saída:
   ```json
   { "projectId": "willtalk", "confidence": 0.94, "type": "task",
     "priority": "Urgent", "description": "Corrigir leitura do QR Code",
     "dueDate": null }
   ```
4. **Gravação (Admin SDK):**
   - `confidence >= 0.75` → `tasks/` do projeto, com `source` e `rawText`. O bot confirma no chat.
   - `confidence < 0.75` → `capture_inbox/` **e** botões inline no chat. Um toque resolve sem abrir o painel.

### 8.4 Áudio

Voice note do Telegram chega como OGG/Opus. `getFile` baixa, Groq Whisper (`whisper-large-v3-turbo`) transcreve, e o texto entra no mesmo pipeline. Funciona em qualquer aparelho, sem depender de ditado do sistema operacional.

**Orçamento de tempo:** o Vercel Hobby limita a função a 10s. Whisper de um áudio curto ~1-2s + Groq ~300ms cabe com folga. Notas longas de áudio (>1 min) são o único risco — mitigar respondendo 200 imediatamente e processando com `waitUntil`.

### 8.5 Desambiguação por vocabulário

Como "mavo" não resolve nada, o catálogo carrega o vocabulário do domínio e o Groq classifica pelo assunto, não pelo nome:

| Texto | Resolve para | Como |
|---|---|---|
| "a sessão do whats caiu de novo" | Mavo Talk | vocabulário, sem citar o nome |
| "o RAG tá devolvendo lixo" | Mavo AI | vocabulário |
| "mavo tá lento" | ambíguo | botões inline no chat |

### 8.6 Aprendizado de apelido

Quando o usuário resolve uma ambiguidade (no chat ou no painel), o termo não reconhecido é adicionado ao array `aliases` daquele projeto. Erra uma vez, nunca mais — e o sistema fica progressivamente mais rápido e mais barato, porque cada vez menos capturas chegam ao Groq.

### 8.7 Comandos do bot

O canal é bidirecional, então o painel passa a poder responder:

| Comando | Efeito |
|---|---|
| *(texto ou áudio solto)* | Captura com classificação automática |
| `/talk`, `/ai` | Captura em projeto fixo, sem classificação |
| `/hoje` | Lista as tarefas abertas de hoje |
| `/status <projeto>` | Mostra os sinais do projeto (após a Fase 4) |

### 8.8 Script de seed do catálogo

One-shot, roda uma vez localmente. Lista os repos do usuário pela API do GitHub, gera o catálogo completo com apelidos deduzidos automaticamente (nome do repo, nome da pasta local, variações com/sem hífen), e grava em `projects`. O usuário revisa e ajusta à mão apenas os casos que colidem — na prática, os três Mavo, cujos `aliases` e `vocab` são escritos manualmente.

Isso atende a decisão D9 (todos os projetos de uma vez) sem transformá-la em 14 cadastros manuais.

## 9. Fase 3 — Espinha do coletor (~1 dia)

**Entrega:** projetos novos aparecem sozinhos no painel.

- Workflow do GitHub Actions com `schedule` (cron 1h) + `workflow_dispatch` + `repository_dispatch`
- `collector/` em Node + TypeScript, autenticado por service account do Firebase (GitHub Secret)
- Arquitetura de adapters: interface única `collect(project) => Promise<Partial<Signals>>`. **Falha isolada** — se a API da Vercel devolver 500, os outros adapters continuam. Coletor monolítico que morre inteiro por causa de um adapter é inútil.
- Adapter `discovery`: `GET /user/repos` → repos nunca vistos vão para `project_inbox`
- Gravação de `sync_runs` a cada execução, com duração e status por adapter
- UI de curadoria no painel: badge "N projetos novos" → classificar **Ativo / Manutenção / Legacy / Ignorar**. `Ignorar` é permanente
- Botão "Sincronizar agora" no painel → `/api/sync` (Vercel Function) → `repository_dispatch` na API do GitHub

## 10. Fase 4 — Sinais Git + manifesto (~1 dia)

- Adapter `git`: último commit, mensagem, branch padrão, commits nos últimos 7 dias, PRs abertos, dias parado
- Adapter `manifest`: lê `willtech.json` da raiz de cada repo e enriquece o card **e os apelidos**

```json
{
  "name": "Mavo Talk",
  "client": "Mavo",
  "stack": "Next.js 16 + Supabase",
  "productionUrl": "https://willtalk.onrender.com",
  "aliases": ["talk", "willtalk", "mavotalk"],
  "vocab": ["whatsapp", "sessão", "atendimento", "fila", "chamado",
            "transferência", "áudio", "supabase", "render", "presença"],
  "deploy": { "provider": "render", "serviceId": "srv-xxxx" },
  "color": "#22d3ee"
}
```

O mesmo arquivo que desenha o card ensina o bot a entender o usuário. Projeto novo nasce com o arquivo e se autodescreve nos dois sentidos.

- Opcional: adapter Gitea para `AgroOliveira` (API REST equivalente à do GitHub)

## 11. Fases 5 a 7

| # | Fase | Entrega |
|---|---|---|
| 5 | Deploy + Uptime | Adapters Vercel (`/v6/deployments`), Render (`/v1/services/{id}/deploys`) e Firebase Hosting. Ping HTTP na `productionUrl` com latência. Badge de saúde verde/amarelo/vermelho no card |
| 6 | Timeline + alertas | `project_events` alimentado pelos adapters, feed cronológico no painel, e alertas **empurrados pelo bot**: deploy falhou, site fora do ar, projeto parado há 30 dias. O canal do Telegram já existe desde a Fase 2 |
| 7 | Erros e logs | Sentry por projeto (free tier 5k eventos/mês) ou endpoint próprio de ingestão. **Exige instrumentar cada app** — por isso é a última |

## 12. Riscos e decisões assumidas

| Risco | Mitigação / decisão |
|---|---|
| **Cota do GitHub Actions.** Repo privado = 2000 min/mês. Cron de 20 min estoura (2160 min) | Cron de **1 hora** (~720 min/mês) + botão "Sincronizar agora" para quando a latência incomodar |
| **Timeout de 10s do Vercel Hobby** em áudio longo | Responder 200 imediatamente e processar com `waitUntil` |
| **Projetos invisíveis.** `life-pro`, `pet`, `mavotalk-local` não têm remote no GitHub | Consequência aceita de D2 (coletor só-nuvem). Passam a aparecer se forem pushados |
| **Org `Delta657`** | O PAT precisa de escopo na org, senão `APLICATIVO-COMPLETO` e `ar` não aparecem |
| **Vault em texto puro** | A Fase 0 tranca atrás do login, eliminando o risco da URL pública. Continua legível por quem abrir o console do Firebase — aceito conscientemente (D10) |
| **Alucinação do Groq** | Limiar de confiança em 0.75 e `rawText` sempre gravado. Classificação errada é corrigível com um toque no chat e vira aprendizado |
| **Custo de Groq** | Comandos explícitos e resolução por apelido cobrem a maioria das capturas. O Groq é exceção, não regra |
| **Reestruturação quebrar features existentes** | Migração incremental (§7.5), app funcional a cada passo, testes dos hooks de dados antes de mover consumidores |
| **Token do bot do Telegram vazar** | Vive só em env var da Vercel. Se vazar, `/revoke` no @BotFather gera outro em segundos — e o allowlist de `chat_id` já barra qualquer terceiro |

## 13. Fora de escopo

- Criptografia client-side do Vault (D10 — item separado, depois das fases principais)
- PWA instalável (manifest, `apple-touch-icon`, service worker) — deixou de ser superfície de captura em D5; vira item opcional para consultar o painel no celular
- Atalhos do Siri com Bearer token (descartado em D5 — substituído pelo Telegram)
- Notificações push no navegador — o bot do Telegram cobre esse papel a partir da Fase 6
- Agente local no PC para estado do working tree (descartado em D2)
- Migração das credenciais para gerenciador externo
- Redesign visual do painel (D12 — a reestruturação preserva a aparência atual)
