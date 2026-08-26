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

      server.middlewares.use('/api/github-atividade', async (req, res) => {
        try {
          const corpo = await new Promise<string>((resolve, reject) => {
            let dados = '';
            req.on('data', (pedaco) => { dados += pedaco; });
            req.on('end', () => resolve(dados));
            req.on('error', reject);
          });

          const { default: handler } = await server.ssrLoadModule('/api/github-atividade.ts');

          await handler(
            { method: req.method, body: corpo || '{}' },
            {
              status(codigo: number) {
                res.statusCode = codigo;
                return this;
              },
              json(payload: unknown) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(payload));
              },
            }
          );
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ erro: e instanceof Error ? e.message : 'Falha na função.' }));
        }
      });
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
  };
});
