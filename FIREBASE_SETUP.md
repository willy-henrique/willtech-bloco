# 🔥 Configuração do Firebase

Este projeto está configurado para usar **Firebase Firestore** como banco de dados, substituindo o localStorage anterior.

## 📋 Pré-requisitos

1. Projeto Firebase criado no [Firebase Console](https://console.firebase.google.com/)
2. Firestore Database habilitado
3. Regras de segurança configuradas

## 🚀 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

**Nota:** O projeto já está configurado com valores padrão caso as variáveis não sejam encontradas.

### 2. Configurar Firestore

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Firestore Database**
4. Crie o banco de dados (modo de produção ou teste)

### 3. Regras de Segurança ⚠️ **OBRIGATÓRIO**

**IMPORTANTE:** Sem configurar as regras, os projetos NÃO serão salvos!

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Firestore Database** → **Regras**
4. Cole o seguinte código e clique em **Publicar**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita para todas as coleções (apenas para desenvolvimento)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ ATENÇÃO:** Para produção, configure regras de segurança adequadas com autenticação!

📖 **Veja o arquivo `CONFIGURAR_FIRESTORE.md` para instruções detalhadas!**

### 4. Estrutura das Coleções

O Firestore criará automaticamente as seguintes coleções:

- `tasks` - Tarefas dos projetos
- `snippets` - Snippets de código
- `vault` - Itens do cofre (credenciais sensíveis)

## 🔒 Segurança

### Arquivos Sensíveis

Os seguintes arquivos estão no `.gitignore` e **NÃO** devem ser commitados:

- `.env`
- `*-firebase-adminsdk-*.json`
- `firebase-adminsdk-*.json`
- `serviceAccountKey.json`

### Credenciais

- **Nunca** commite credenciais no código
- Use variáveis de ambiente para configurações sensíveis
- O arquivo Admin SDK (`willtech-a9bb6-firebase-adminsdk-*.json`) é apenas para uso no backend (se necessário)

## ✨ Funcionalidades

### Sincronização em Tempo Real

O projeto utiliza **Firestore Listeners** para sincronização em tempo real:

- ✅ Mudanças são refletidas instantaneamente em todos os dispositivos
- ✅ Não é necessário recarregar a página
- ✅ Suporte offline (com cache do Firestore)

### Fallback para localStorage

Em caso de erro na conexão com o Firebase, o sistema automaticamente:

1. Tenta carregar dados do localStorage
2. Exibe mensagens de erro no console
3. Mantém a aplicação funcional

## 🛠️ Estrutura do Código

```
src/
├── config/
│   └── firebase.ts          # Configuração e inicialização do Firebase
└── services/
    └── firestoreService.ts  # Serviços CRUD para Firestore
```

## 📝 Migração de Dados

Se você tinha dados no localStorage, eles serão automaticamente:

1. Carregados na primeira execução
2. Migrados para o Firestore quando você criar/editar itens
3. Mantidos no localStorage como backup

## 🐛 Troubleshooting

### Erro: "Firebase: Error (auth/unauthorized)"

- Verifique se as regras do Firestore permitem leitura/escrita
- Confirme que as credenciais estão corretas

### Erro: "Firebase: Error (app/no-app)"

- Verifique se o Firebase foi inicializado corretamente
- Confirme que `src/config/firebase.ts` está sendo importado

### Dados não aparecem

- Verifique o console do navegador para erros
- Confirme que o Firestore está habilitado no Firebase Console
- Verifique as regras de segurança do Firestore

## 📚 Recursos

- [Documentação do Firebase](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com/)
