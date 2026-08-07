# Modelo de dados

Entidades principais (todas com `id`, `userId`, `createdAt`, `updatedAt`, `deletedAt` quando aplicável):

- profiles / user preferences
- tasks (+ subtasks/checklist embutidos)
- projects
- notes
- events
- reminders
- transactions
- financial_accounts
- financial_categories
- habits
- habit_entries
- goals
- saved_links / files metadata (`storagePath` futuro)
- notifications
- ai_conversations
- ai_messages
- ai_tool_executions
- audit_logs

## Migrations

Não há SQL. A “migration” desta versão é:

1. Namespace de storage `willtech.v2`
2. Seed de contas/categorias financeiras padrão no primeiro login
3. Regras Firestore versionadas em `firestore.rules`

Dados antigos do app v1 (`wt_*`, `willtech_finance_*`) não são migrados automaticamente para evitar misturar mocks com dados reais. Export/import virá em etapa futura.
