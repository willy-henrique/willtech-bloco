import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Serve as funções de `api/` durante `npm run dev`.
 *
 * Em produção a Vercel executa esses arquivos como serverless functions
 * sozinha. Sem este plugin, `/api/...` só funcionaria depois de publicar,
 * e não daria para testar a integração com o GitHub localmente.
 *
 * O token é lido aqui, no processo do servidor de dev, e passado por
 * `process.env` ao handler. Ele NÃO entra em `define`, portanto nunca
 * chega ao bundle do navegador.
 */
function apiEmDesenvolvimento(env: Record<string, string>): Plugin {
  return {
    name: 'api-em-desenvolvimento',
    configureServer(server) {
      if (env.GITHUB_TOKEN) process.env.GITHUB_TOKEN = env.GITHUB_TOKEN;
      if (env.FIREBASE_SERVICE_ACCOUNT) process.env.FIREBASE_SERVICE_ACCOUNT = env.FIREBASE_SERVICE_ACCOUNT;
      if (env.INGEST_API_KEY) process.env.INGEST_API_KEY = env.INGEST_API_KEY;

      // Middleware genérico: serve qualquer handler default de api/*.ts no dev.
      const servirApi = (rota: string, modulo: string) => {
        server.middlewares.use(rota, async (req, res) => {
          try {
            const corpo = await new Promise<string>((resolve, reject) => {
              let dados = '';
              req.on('data', (pedaco) => { dados += pedaco; });
              req.on('end', () => resolve(dados));
              req.on('error', reject);
            });

            const { default: handler } = await server.ssrLoadModule(modulo);

            await handler(
              { method: req.method, body: corpo || '{}', headers: req.headers as Record<string, string | string[] | undefined> },
              {
                status(codigo: number) {
                  res.statusCode = codigo;
                  return this;
                },
                json(payload: unknown) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(payload));
                },
                setHeader(nome: string, valor: string) {
                  res.setHeader(nome, valor);
                  return this;
                },
              }
            );
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ erro: e instanceof Error ? e.message : 'Falha na função.' }));
          }
        });
      };

      servirApi('/api/github-atividade', '/api/github-atividade.ts');
      servirApi('/api/ingest', '/api/ingest.ts');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), apiEmDesenvolvimento(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/firebase/') || id.includes('\\firebase\\') || id.includes('@firebase')) return 'firebase';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('\\react\\') || id.includes('\\react-dom\\')) return 'react';
            return 'vendor';
          },
        },
      },
    },
  };
});
