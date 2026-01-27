# 🔥 Como Configurar as Regras do Firestore

## ⚠️ PROBLEMA: Projetos não estão salvando

Se os projetos não estão sendo salvos, é porque as **regras de segurança do Firestore** não estão configuradas.

## 🚀 Solução Rápida (Desenvolvimento)

### Passo 1: Acesse o Firebase Console

1. Vá para: https://console.firebase.google.com/
2. Selecione seu projeto: **willtech-a9bb6**

### Passo 2: Configure as Regras do Firestore

1. No menu lateral, clique em **Firestore Database**
2. Vá na aba **Regras** (Rules)
3. Cole o seguinte código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita para todas as coleções
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Clique em **Publicar** (Publish)

### Passo 3: Verifique se o Firestore está Criado

1. Se ainda não criou o banco de dados:
   - Clique em **Criar banco de dados**
   - Escolha **Modo de teste** (para desenvolvimento)
   - Escolha uma localização (ex: `southamerica-east1` para Brasil)
   - Clique em **Habilitar**

## ✅ Verificação

Após configurar as regras:

1. Recarregue a aplicação
2. Tente criar um novo projeto
3. Verifique o console do navegador (F12) - não deve ter erros de permissão
4. Os projetos devem aparecer e persistir

## 🔒 Regras para Produção (Mais Seguras)

Para produção, use regras com autenticação:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Requer autenticação
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📋 Coleções que serão criadas automaticamente:

- `projects` - Projetos
- `tasks` - Tarefas
- `snippets` - Snippets de código
- `vault` - Itens do cofre
- `project_credentials` - Credenciais dos projetos
- `project_payments` - Pagamentos dos projetos
- `project_notes` - Notas dos projetos
- `project_details` - Detalhes dos projetos

## 🐛 Troubleshooting

### Erro: "Missing or insufficient permissions"

- ✅ Verifique se as regras foram publicadas
- ✅ Verifique se o Firestore está habilitado
- ✅ Recarregue a página após publicar as regras

### Erro: "Firestore (8) RESOURCE_EXHAUSTED"

- O Firestore pode estar em modo de teste com limites
- Verifique se não excedeu o limite de requisições

### Dados não aparecem

- Abra o console do navegador (F12)
- Verifique se há erros do Firebase
- Verifique a aba Network para ver requisições bloqueadas

## 📚 Links Úteis

- [Firebase Console](https://console.firebase.google.com/)
- [Documentação das Regras](https://firebase.google.com/docs/firestore/security/get-started)
- [Regras de Segurança](https://firebase.google.com/docs/firestore/security/rules-structure)
