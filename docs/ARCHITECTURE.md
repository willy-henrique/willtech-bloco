# Will Tech — Arquitetura

## Stack preservada

- Vite 6 + React 19 + TypeScript
- Tailwind CSS 4 (tokens centralizados)
- Firebase Auth + Firestore (quando configurados)
- Framer Motion + Lucide React

## Novas camadas

- `src/components/ui` — design system
- `src/components/layout` — shell desktop/mobile
- `src/features/*` — módulos por domínio
- `src/repositories` — persistência local com soft delete
- `src/schemas` — validação Zod compartilhada
- `src/ai` — contratos da Will AI desacoplados de provedor

## Persistência

1. **Local-first** por `userId` em `localStorage` (`willtech.v2:<userId>:<collection>`)
2. Soft delete via `deletedAt`
3. Preferências, auditoria e conversas de IA no mesmo modelo
4. Firestore rules exigem `request.auth.uid == resource.data.userId`

## Autenticação

- Firebase Auth (e-mail/senha + reset) quando `VITE_FIREBASE_*` estiver definido
- Modo local para uso pessoal/offline sem expor segredos

## Will AI

Fluxo obrigatório:

1. UI envia mensagem
2. `AiService` (server-oriented) chama provider abstrato
3. Modelo sugere ferramenta
4. Tool valida usuário/params
5. Ações sensíveis pedem confirmação
6. Execução + auditoria

Nenhuma chave de API no frontend.
