# Deploy

## Vercel

1. Conecte o repositório
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Defina as variáveis `VITE_FIREBASE_*`
6. Publique as regras de `firestore.rules` no Firebase Console
7. Habilite Authentication → Email/Password

## PWA / iPhone

Após o deploy HTTPS:

1. Safari → Compartilhar → Adicionar à Tela de Início
2. O manifest e os ícones já estão configurados
3. Safe areas iOS são respeitadas no layout

## Will AI (futuro)

Exponha um endpoint server-side (Cloud Function / API route) que leia `WILL_AI_API_KEY`. Nunca use prefixo `VITE_` para segredos.
