// GERADO por scripts/gerar-catalogo.mjs em 2026-08-26.
// Rode de novo quando criar repositórios novos.
// Para renomear projetos ou marcar duplicatas, edite OVERRIDES no gerador —
// não edite este arquivo, ele é sobrescrito.
import type { CatalogoProjeto } from './tipos';

export const CATALOGO: CatalogoProjeto[] = [
  {
    "name": "WillTech Bloco",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "React + Firebase + Tailwind",
    "repo": "willy-henrique/willtech-bloco",
    "aliases": [
      "bloco",
      "command dashboard",
      "painel",
      "willtech",
      "willtech bloco",
      "willtech-bloco",
      "willtechbloco"
    ],
    "vocab": [
      "firestore",
      "salvar",
      "validacao",
      "pagamentos",
      "titulo",
      "deletefield",
      "credenciais",
      "notas",
      "tailwind",
      "login",
      "google",
      "painel",
      "cliente",
      "controle"
    ],
    "ultimoCommit": "2026-08-26",
    "evolucoes30d": 4,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-08-26",
        "tipo": "evoluiu",
        "assunto": "login por e-mail/senha ao lado do Google + rules travadas no e-mail do dono"
      },
      {
        "data": "2026-08-26",
        "tipo": "evoluiu",
        "assunto": "chat de anotacao no painel, sem chave de API"
      },
      {
        "data": "2026-08-26",
        "tipo": "evoluiu",
        "assunto": "resolvedor de projeto e extrator de intencao"
      },
      {
        "data": "2026-08-26",
        "tipo": "manutencao",
        "assunto": "adiciona suite de seguranca do Firestore no emulador"
      },
      {
        "data": "2026-08-26",
        "tipo": "manutencao",
        "assunto": "remove injecao de GEMINI_API_KEY no bundle do cliente"
      },
      {
        "data": "2026-08-26",
        "tipo": "evoluiu",
        "assunto": "exige login com Google antes de renderizar o painel"
      },
      {
        "data": "2026-08-26",
        "tipo": "manutencao",
        "assunto": "adiciona spec da plataforma de controle e plano da Fase 0"
      },
      {
        "data": "2026-02-03",
        "tipo": "evoluiu",
        "assunto": "Make Finance Hub fully editable with complete transaction and goals management"
      },
      {
        "data": "2026-02-02",
        "tipo": "evoluiu",
        "assunto": "Finance Hub, TransactionModal e integracao no dashboard"
      },
      {
        "data": "2026-01-28",
        "tipo": "corrigiu",
        "assunto": "corrige validação de campos opcionais nos pagamentos - Remove campos undefined/null antes de salvar no Firestore - Apenas título é obrigatório, demais campos são opcionais - Adiciona controle de exibição do formulário de pagamento - Adiciona deleteField para remover campos vazios no update - Melhora validação e tratamento de erros"
      },
      {
        "data": "2026-01-28",
        "tipo": "corrigiu",
        "assunto": "corrige validação de campos opcionais nas anotações - Remove campo category undefined antes de salvar no Firestore - Apenas título e conteúdo são obrigatórios, categoria é opcional - Adiciona deleteField para remover categoria vazia no update - Melhora validação e tratamento de erros"
      },
      {
        "data": "2026-01-28",
        "tipo": "corrigiu",
        "assunto": "corrige validação de campos opcionais nas credenciais - Apenas título é obrigatório, demais campos são opcionais - Remove campos undefined/null antes de salvar no Firestore - Adiciona deleteField para remover campos vazios no update - Melhora mensagens de validação e feedback ao usuário"
      },
      {
        "data": "2026-01-28",
        "tipo": "evoluiu",
        "assunto": "implementa funcionalidades completas de botões e melhorias no dashboard - Adiciona ações aos botões de Nova Credencial e Nova Nota - Implementa Strategic Priorities com adição de tarefas por coluna e ALL CLEAR - Adiciona alternância entre Lifecycle Calendar e Payment Calendar - Melhora visual geral e UX do dashboard"
      },
      {
        "data": "2026-01-28",
        "tipo": "evoluiu",
        "assunto": "melhorias no frontend de notas e .env - UI/UX aprimorada com design moderno, validações e feedback visual melhorado"
      },
      {
        "data": "2026-01-27",
        "tipo": "corrigiu",
        "assunto": "corrige sintaxe do Tailwind CSS v4 - Atualiza index.css para usar @import ao invés de @tailwind diretivas - Tailwind v4 requer nova sintaxe de importação"
      },
      {
        "data": "2026-01-27",
        "tipo": "corrigiu",
        "assunto": "corrige build do Tailwind CSS v4 e problema de projetos desaparecendo - Atualiza PostCSS para usar @tailwindcss/postcss (Tailwind v4) - Corrige listener do Firestore para não substituir projetos por iniciais - Adiciona tratamento de erros melhorado no listener - Adiciona fallback para queries sem orderBy quando índice não existe - Melhora lógica de migração de projetos iniciais"
      },
      {
        "data": "2026-01-27",
        "tipo": "evoluiu",
        "assunto": "melhorias completas no sistema de pagamentos e UI responsiva - Pagamentos recorrentes mensais com dia específico - Botão para marcar pagamento como pago - Alertas visuais vermelhos para pagamentos vencidos no ProjectCard - Campo .env nas credenciais para salvar arquivos de ambiente - UI melhorada de notas com formulário maior - UI melhorada de informações com foco em URLs - 100% responsivo para mobile com breakpoints adaptativos - Configuração do Tailwind CSS como PostCSS plugin - Documentação de configuração do Firestore"
      },
      {
        "data": "2026-01-27",
        "tipo": "evoluiu",
        "assunto": "adiciona sistema completo de bloco de notas por projeto - Página de detalhes do projeto com 4 abas (Credenciais, Pagamentos, Notas, Informações) - Gerenciamento de credenciais de desenvolvimento com senhas ocultas - Sistema de pagamentos com alertas visuais para vencimentos - Notas e anotações por projeto - Informações gerais editáveis (cliente, URLs, descrição) - Integração completa com Firestore - Modal para adicionar/editar projetos - Navegação entre lista e detalhes"
      },
      {
        "data": "2026-01-27",
        "tipo": "outro",
        "assunto": "first commit"
      }
    ],
    "color": "#22d3ee"
  },
  {
    "name": "Mavo AI",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Next.js + Supabase + PostgreSQL + Tailwind",
    "repo": "willy-henrique/mavoai",
    "aliases": [
      "chat",
      "chat inteligente",
      "chat-inteligente",
      "chatinteligente",
      "inteligente",
      "mavo ai",
      "mavo ia",
      "mavoai"
    ],
    "vocab": [
      "auge",
      "resposta",
      "cliente",
      "chave",
      "plano",
      "painel",
      "sync",
      "real",
      "fallback",
      "relatorio",
      "pergunta",
      "assunto",
      "conversa",
      "base"
    ],
    "ultimoCommit": "2026-08-25",
    "evolucoes30d": 9,
    "correcoes30d": 25,
    "historico": [
      {
        "data": "2026-08-25",
        "tipo": "corrigiu",
        "assunto": "raciocinio do qwen consumia o orcamento e o print voltava vazio"
      },
      {
        "data": "2026-08-21",
        "tipo": "manutencao",
        "assunto": "relatorio semanal de evolucao (13-19/08)"
      },
      {
        "data": "2026-08-19",
        "tipo": "evoluiu",
        "assunto": "mostra SALDO quando o provedor e pago"
      },
      {
        "data": "2026-08-19",
        "tipo": "evoluiu",
        "assunto": "primeira pergunta dirigida ao assunto que o cliente citou"
      },
      {
        "data": "2026-08-19",
        "tipo": "corrigiu",
        "assunto": "sync quebrado pela troca de API + semente de docIds"
      },
      {
        "data": "2026-08-19",
        "tipo": "corrigiu",
        "assunto": "conversa do bot nao vira conhecimento consultavel"
      },
      {
        "data": "2026-08-19",
        "tipo": "corrigiu",
        "assunto": "conversa do bot so entra na base com passo acionavel"
      },
      {
        "data": "2026-08-19",
        "tipo": "corrigiu",
        "assunto": "cliente pedindo humano ficava preso em laco"
      },
      {
        "data": "2026-08-18",
        "tipo": "corrigiu",
        "assunto": "health e ai-status liam a chave por conta propria"
      },
      {
        "data": "2026-08-17",
        "tipo": "evoluiu",
        "assunto": "trocar de provedor do atendimento pedindo so a chave"
      },
      {
        "data": "2026-08-17",
        "tipo": "manutencao",
        "assunto": "relatorio da rodada de curadoria e dos modelos mortos"
      },
      {
        "data": "2026-08-17",
        "tipo": "evoluiu",
        "assunto": "DeepSeek como provider de curadoria + remove modelos mortos"
      },
      {
        "data": "2026-08-17",
        "tipo": "outro",
        "assunto": "traz identidade AUGE (PR #2) para a deepseek-2.0"
      },
      {
        "data": "2026-08-07",
        "tipo": "manutencao",
        "assunto": "relatorio da despoluicao da base (Trilha B)"
      },
      {
        "data": "2026-08-07",
        "tipo": "corrigiu",
        "assunto": "negacao no meio do procedimento nao e \"sem solucao\""
      },
      {
        "data": "2026-08-07",
        "tipo": "corrigiu",
        "assunto": "chave de visao e audio deixa de depender do provider de texto"
      },
      {
        "data": "2026-08-07",
        "tipo": "manutencao",
        "assunto": "A1 - medicao aciona a condicao de parada do plano"
      },
      {
        "data": "2026-08-07",
        "tipo": "manutencao",
        "assunto": "relatorio da linha de base A0 e correcao do plano"
      },
      {
        "data": "2026-08-07",
        "tipo": "corrigiu",
        "assunto": "chave de API nao pode ser salva como nome de modelo"
      },
      {
        "data": "2026-08-07",
        "tipo": "manutencao",
        "assunto": "plano de execucao passo a passo da migracao V4 Flash"
      }
    ],
    "color": "#a78bfa"
  },
  {
    "name": "Mavo Gerenciamento",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Next.js + Tailwind",
    "repo": "willy-henrique/mavo-metricas",
    "aliases": [
      "gerenciamento",
      "mavo",
      "mavo gerenciamento",
      "mavo metricas",
      "mavo-gerenciamento",
      "mavo-metricas",
      "mavogerenciamento",
      "mavometricas",
      "metricas"
    ],
    "vocab": [
      "relatorios",
      "tabela",
      "talk"
    ],
    "ultimoCommit": "2026-08-25",
    "evolucoes30d": 12,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "renova interface com tema escuro e relatorios em PDF"
      },
      {
        "data": "2026-08-25",
        "tipo": "manutencao",
        "assunto": "adiciona guia de configuracao e deploy"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "configuracoes da empresa com gestao de usuarios"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "telas de recuperacao e redefinicao de senha"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "relatorios com tabela paginada e exportacao CSV"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "desempenho do atendimento automatico com funil de destinos"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "tela de producao da equipe com tabela ordenavel"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "visao geral com metrica heroi, secundarias e ritmo do periodo"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "coluna Agora com polling que pausa em aba oculta"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "barra de contexto com pilulas de filtro e formatacao pt-BR"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "login com aquecimento do Talk e casca do painel"
      },
      {
        "data": "2026-08-24",
        "tipo": "evoluiu",
        "assunto": "cliente do Talk e sessao em cookie httpOnly"
      },
      {
        "data": "2026-08-24",
        "tipo": "evoluiu",
        "assunto": "esqueleto do Mavo Gerenciamento com tokens da paleta Mavo"
      }
    ],
    "color": "#f59e0b"
  },
  {
    "name": "Mavo Talk",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Next.js + Supabase + Prisma + PostgreSQL + Tailwind",
    "repo": "willy-henrique/willtalk",
    "aliases": [
      "mavo",
      "mavo talk",
      "mavotalk",
      "talk",
      "willtalk"
    ],
    "vocab": [
      "whatsapp",
      "metricas",
      "atendimento",
      "fuso",
      "loja",
      "pareamento",
      "sessao",
      "status",
      "atendente",
      "periodo",
      "queue",
      "conversa",
      "login",
      "assinatura"
    ],
    "ultimoCommit": "2026-08-25",
    "evolucoes30d": 37,
    "correcoes30d": 53,
    "historico": [
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "presenca da equipe, audio no atendimento e transferencia de chamado"
      },
      {
        "data": "2026-08-25",
        "tipo": "manutencao",
        "assunto": "desenho de nova conversa por contato e de audio no atendimento"
      },
      {
        "data": "2026-08-25",
        "tipo": "corrigiu",
        "assunto": "revogar sessao quando papel ou status do usuario mudar"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "CRUD de usuarios restrito ao administrador da empresa"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "recuperacao de senha com entrega pelo WhatsApp"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "tokens seguros para recuperacao de senha"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "relatorio de tickets com paginacao por cursor"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "metricas por fila com fechamento do total"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "metricas do atendimento automatico"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "producao por atendente na API de metricas"
      },
      {
        "data": "2026-08-25",
        "tipo": "corrigiu",
        "assunto": "interpretar periodo personalizado no fuso da organizacao"
      },
      {
        "data": "2026-08-25",
        "tipo": "manutencao",
        "assunto": "varredura de isolamento entre empresas nas rotas de metricas"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "serie temporal e opcoes de filtro da API de metricas"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "consulta e rota dos indicadores do periodo"
      },
      {
        "data": "2026-08-25",
        "tipo": "evoluiu",
        "assunto": "consulta e rota do bloco Agora"
      },
      {
        "data": "2026-08-24",
        "tipo": "evoluiu",
        "assunto": "rotas health, login e me da API de metricas v1"
      },
      {
        "data": "2026-08-24",
        "tipo": "evoluiu",
        "assunto": "guard das rotas de metricas com token de servico e papel"
      },
      {
        "data": "2026-08-24",
        "tipo": "evoluiu",
        "assunto": "resolucao de periodo no fuso da organizacao com teto de 90 dias"
      },
      {
        "data": "2026-08-24",
        "tipo": "evoluiu",
        "assunto": "envelope e erros padronizados da API de metricas"
      },
      {
        "data": "2026-08-24",
        "tipo": "corrigiu",
        "assunto": "devolver os contadores de situacao para a tela do Inbox"
      }
    ],
    "color": "#34d399"
  },
  {
    "name": "barber-leonico",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Firebase + Express",
    "repo": "willy-henrique/barber-leonico",
    "aliases": [
      "barber",
      "barber leonico",
      "barber-leonico",
      "barberleonico",
      "leonico"
    ],
    "vocab": [
      "asaas",
      "clube",
      "barbeiro",
      "atualizacao",
      "leonico",
      "firebase",
      "servicos",
      "cliente",
      "horario",
      "admin",
      "painel",
      "fidelidade",
      "vercel",
      "firestore"
    ],
    "ultimoCommit": "2026-08-19",
    "evolucoes30d": 5,
    "correcoes30d": 10,
    "historico": [
      {
        "data": "2026-08-19",
        "tipo": "melhorou",
        "assunto": "extrai createSubscriptionRequest de handleSubmit"
      },
      {
        "data": "2026-08-19",
        "tipo": "corrigiu",
        "assunto": "mantem texto original de fallback em mapAuthError"
      },
      {
        "data": "2026-08-19",
        "tipo": "melhorou",
        "assunto": "extrai GoogleIcon e mapAuthError para arquivos compartilhados"
      },
      {
        "data": "2026-08-19",
        "tipo": "manutencao",
        "assunto": "plano de implementacao do cadastro via Google no clube"
      },
      {
        "data": "2026-08-19",
        "tipo": "corrigiu",
        "assunto": "cadastro de assinatura nao herda sessao de quem estiver logado"
      },
      {
        "data": "2026-08-19",
        "tipo": "manutencao",
        "assunto": "spec de cadastro via Google na tela de adesao do clube"
      },
      {
        "data": "2026-08-19",
        "tipo": "corrigiu",
        "assunto": "ativar/renovar re-vincula userId a assinatura existente"
      },
      {
        "data": "2026-08-19",
        "tipo": "corrigiu",
        "assunto": "exclusao remove todos cadastros duplicados e limpa logs de debug"
      },
      {
        "data": "2026-08-19",
        "tipo": "corrigiu",
        "assunto": "libera exclusao de mensalista sem login e corrige assinatura vigente"
      },
      {
        "data": "2026-08-19",
        "tipo": "corrigiu",
        "assunto": "admin acessa painel do barbeiro e destaca botao do clube"
      },
      {
        "data": "2026-08-19",
        "tipo": "evoluiu",
        "assunto": "adiciona icones e manifest para PWA (icone real na tela de inicio)"
      },
      {
        "data": "2026-08-17",
        "tipo": "corrigiu",
        "assunto": "remove chamada residual a cancelAsaasSubscription apos merge"
      },
      {
        "data": "2026-08-17",
        "tipo": "outro",
        "assunto": "Merge remote-tracking branch 'origin/main'"
      },
      {
        "data": "2026-08-17",
        "tipo": "manutencao",
        "assunto": "marca checklist do plano como concluido"
      },
      {
        "data": "2026-08-17",
        "tipo": "manutencao",
        "assunto": "remove variaveis de ambiente do Asaas"
      },
      {
        "data": "2026-08-17",
        "tipo": "manutencao",
        "assunto": "remove client Asaas e script de teste sandbox (sem uso)"
      },
      {
        "data": "2026-08-17",
        "tipo": "outro",
        "assunto": "remove rotas de pagamento Asaas do servidor local"
      },
      {
        "data": "2026-08-17",
        "tipo": "outro",
        "assunto": "remove rotas de pagamento Asaas da API serverless"
      },
      {
        "data": "2026-08-17",
        "tipo": "evoluiu",
        "assunto": "barbeiro aprova/bloqueia pedidos e ve vencimento automatico no painel"
      },
      {
        "data": "2026-08-17",
        "tipo": "manutencao",
        "assunto": "remove client HTTP do Asaas no frontend (sem uso)"
      }
    ],
    "color": "#f472b6"
  },
  {
    "name": "pet",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Next.js + Firebase + Tailwind",
    "repo": null,
    "aliases": [
      "pet"
    ],
    "vocab": [
      "firebase"
    ],
    "ultimoCommit": "2026-08-19",
    "evolucoes30d": 4,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-08-19",
        "tipo": "evoluiu",
        "assunto": "add pet needs engine"
      },
      {
        "data": "2026-08-19",
        "tipo": "evoluiu",
        "assunto": "add pet adoption flow"
      },
      {
        "data": "2026-08-19",
        "tipo": "evoluiu",
        "assunto": "add Firebase email authentication"
      },
      {
        "data": "2026-08-19",
        "tipo": "manutencao",
        "assunto": "track Firebase environment template"
      },
      {
        "data": "2026-08-19",
        "tipo": "evoluiu",
        "assunto": "establish AI pet foundation"
      },
      {
        "data": "2026-08-19",
        "tipo": "outro",
        "assunto": "Initial commit from Create Next App"
      }
    ],
    "color": "#60a5fa"
  },
  {
    "name": "Portfólio Willy",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "React + Tailwind",
    "repo": "willy-henrique/lang-page-willy",
    "aliases": [
      "landing page",
      "lang",
      "lang page willy",
      "lang-page-willy",
      "langpagewilly",
      "page",
      "portfolio",
      "portfolio willy",
      "portfoliowilly",
      "willy"
    ],
    "vocab": [
      "portfolio",
      "projetos",
      "emailjs",
      "redesign",
      "design",
      "componentes",
      "vercel",
      "willtech",
      "extensao",
      "imagem",
      "intro",
      "robo",
      "public",
      "links"
    ],
    "ultimoCommit": "2026-07-29",
    "evolucoes30d": 1,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-07-29",
        "tipo": "evoluiu",
        "assunto": "add Intro component and Experience section, polish redesigned layout"
      },
      {
        "data": "2026-07-29",
        "tipo": "melhorou",
        "assunto": "strip 3D/music/intro-animation systems for simplified portfolio redesign"
      },
      {
        "data": "2026-07-27",
        "tipo": "manutencao",
        "assunto": "add phased implementation plan for portfolio redesign"
      },
      {
        "data": "2026-07-27",
        "tipo": "manutencao",
        "assunto": "add portfolio redesign design spec"
      },
      {
        "data": "2026-05-29",
        "tipo": "outro",
        "assunto": "sadas"
      },
      {
        "data": "2026-05-29",
        "tipo": "outro",
        "assunto": "asfdasda"
      },
      {
        "data": "2026-05-29",
        "tipo": "outro",
        "assunto": "repositorio ATUALIADO"
      },
      {
        "data": "2026-05-29",
        "tipo": "evoluiu",
        "assunto": "adicionar componentes 3D do robô interativo"
      },
      {
        "data": "2026-05-29",
        "tipo": "evoluiu",
        "assunto": "rastreamento dinâmico do cursor do mouse no robô 3D e responsividade mobile perfeita"
      },
      {
        "data": "2026-02-26",
        "tipo": "evoluiu",
        "assunto": "fotos dos projetos em public, links só para Royale/LEOGÁS/Leônico/Essencialle/Tillit, texto Vercel/deploy no Sobre"
      },
      {
        "data": "2026-02-25",
        "tipo": "melhorou",
        "assunto": "reestruturar src - sections, components, alias @/, framer-motion, main.jsx"
      },
      {
        "data": "2026-01-25",
        "tipo": "corrigiu",
        "assunto": "corrigir erro de sintaxe no ProjectDetail.jsx - remover tags de fechamento extras"
      },
      {
        "data": "2026-01-25",
        "tipo": "evoluiu",
        "assunto": "adicionar projeto NATURIZE Dedetização e profissionalizar páginas de detalhes"
      },
      {
        "data": "2026-01-25",
        "tipo": "corrigiu",
        "assunto": "atualizar descrição do projeto WillTech BI e garantir extensão .jpg correta"
      },
      {
        "data": "2026-01-25",
        "tipo": "corrigiu",
        "assunto": "garantir que Vercel use a versão correta com extensão .jpg"
      },
      {
        "data": "2026-01-25",
        "tipo": "corrigiu",
        "assunto": "corrigir extensão da imagem do projeto WillTech BI de .png para .jpg"
      },
      {
        "data": "2026-01-25",
        "tipo": "evoluiu",
        "assunto": "adicionar projeto WillTech Power Business - BI Analytics integrado ao ERP Auge"
      },
      {
        "data": "2026-01-25",
        "tipo": "outro",
        "assunto": "Merge branch 'main' of https://github.com/willy-henrique/lang-page-willy"
      },
      {
        "data": "2026-01-25",
        "tipo": "evoluiu",
        "assunto": "atualizar foto de perfil para nova imagem JPG"
      },
      {
        "data": "2025-11-24",
        "tipo": "outro",
        "assunto": "Adiciona imagens dos novos projetos e atualiza componentes"
      }
    ],
    "color": "#fb923c"
  },
  {
    "name": "Escola Estrelinha",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Next.js + Firebase + Tailwind",
    "repo": "willy-henrique/escola-estrelinha",
    "aliases": [
      "escola",
      "escola estrelinha",
      "escola gestao",
      "escola-estrelinha",
      "escola-gestao",
      "escolaestrelinha",
      "escolagestao",
      "estrelinha",
      "gestao"
    ],
    "vocab": [
      "next",
      "bloqueia",
      "responsavel"
    ],
    "ultimoCommit": "2026-07-17",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-07-17",
        "tipo": "manutencao",
        "assunto": "adiciona app completo (Next.js + Flutter) ao versionamento"
      },
      {
        "data": "2026-07-17",
        "tipo": "corrigiu",
        "assunto": "impoe audiencia de avisos na leitura do Firestore (SEC-03)"
      },
      {
        "data": "2026-07-17",
        "tipo": "corrigiu",
        "assunto": "baixa transacional e idempotente com valor conferido (FIN-01, FIN-02)"
      },
      {
        "data": "2026-07-17",
        "tipo": "corrigiu",
        "assunto": "bloqueia responsavel de anexar documento em matricula alheia (SEC-01)"
      },
      {
        "data": "2026-07-17",
        "tipo": "corrigiu",
        "assunto": "bloqueia responsavel de assinar contrato de outra familia (SEC-02)"
      },
      {
        "data": "2026-07-17",
        "tipo": "corrigiu",
        "assunto": "evita crash em transicao sem note (ENR-500)"
      },
      {
        "data": "2026-07-14",
        "tipo": "outro",
        "assunto": "Initial commit from Create Next App"
      }
    ],
    "color": "#4ade80"
  },
  {
    "name": "WillTech ERP",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "React + Firebase + Express + Tailwind",
    "repo": "willy-henrique/WillTech-ERP",
    "aliases": [
      "agro rafia",
      "agrorafia",
      "erp",
      "willtech",
      "willtech erp",
      "willtech-erp",
      "willtecherp"
    ],
    "vocab": [
      "atualizacao",
      "boleto",
      "focus",
      "functions",
      "status",
      "cliente",
      "board",
      "produto",
      "estoque",
      "custo",
      "admin",
      "entrada",
      "factor",
      "empresa"
    ],
    "ultimoCommit": "2026-07-15",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-07-15",
        "tipo": "evoluiu",
        "assunto": "gestao completa - criar/excluir no /willydev e bloquear no admin"
      },
      {
        "data": "2026-07-15",
        "tipo": "evoluiu",
        "assunto": "atualiza operacao e experiencia do ERP"
      },
      {
        "data": "2026-07-15",
        "tipo": "evoluiu",
        "assunto": "campo CFOP manual (opcional) no wizard de emissao"
      },
      {
        "data": "2026-07-15",
        "tipo": "manutencao",
        "assunto": "reporta status da GROQ_API_KEY (sem expor o valor)"
      },
      {
        "data": "2026-07-15",
        "tipo": "evoluiu",
        "assunto": "IA de ajuda flutuante com Groq"
      },
      {
        "data": "2026-07-15",
        "tipo": "evoluiu",
        "assunto": "status clicavel na listagem + fix addDoc undefined na OP"
      },
      {
        "data": "2026-07-15",
        "tipo": "evoluiu",
        "assunto": "prazos por parcela do boleto com valor e vencimento"
      },
      {
        "data": "2026-07-15",
        "tipo": "evoluiu",
        "assunto": "bobina finalizada sai da listagem + filtro de status"
      },
      {
        "data": "2026-07-14",
        "tipo": "evoluiu",
        "assunto": "entrada de NF-e recebida gera contas a pagar por duplicata"
      },
      {
        "data": "2026-07-13",
        "tipo": "corrigiu",
        "assunto": "cancelamento da VendasPage agora cancela de verdade na SEFAZ"
      },
      {
        "data": "2026-07-13",
        "tipo": "corrigiu",
        "assunto": "consolida endpoints de NF-e em rota dinamica [action].ts"
      },
      {
        "data": "2026-07-13",
        "tipo": "evoluiu",
        "assunto": "Painel de NF-e estilo Omie com operações fiscais completas via Focus"
      },
      {
        "data": "2026-07-08",
        "tipo": "corrigiu",
        "assunto": "regra correta de Factoring e comissao, confirmada com o cliente"
      },
      {
        "data": "2026-07-08",
        "tipo": "corrigiu",
        "assunto": "taxa do Factor agora e proporcional ao prazo de cada boleto"
      },
      {
        "data": "2026-07-08",
        "tipo": "corrigiu",
        "assunto": "extrai serie e numero da chave de acesso quando ausentes"
      },
      {
        "data": "2026-07-08",
        "tipo": "melhorou",
        "assunto": "remove mencoes a fornecedores externos (gateway fiscal, servidor) do texto visivel"
      },
      {
        "data": "2026-07-08",
        "tipo": "evoluiu",
        "assunto": "serie da NF-e configuravel em Configuracoes -> Empresa"
      },
      {
        "data": "2026-07-08",
        "tipo": "corrigiu",
        "assunto": "usa o ambiente configurado por empresa (producao/homologacao)"
      },
      {
        "data": "2026-07-08",
        "tipo": "evoluiu",
        "assunto": "unifica pedidos do App Vendedor no board do ERP + IE do cliente na NF-e"
      },
      {
        "data": "2026-07-08",
        "tipo": "corrigiu",
        "assunto": "corrige UX do card de pedido no board (menu cortado e botao espremido)"
      }
    ],
    "color": "#c084fc"
  },
  {
    "name": "Exclusão de Conta",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Next.js + Firebase + Tailwind",
    "repo": "willy-henrique/exclusao-conta",
    "aliases": [
      "apagarconta",
      "apagarconta dashboardamin",
      "apagarconta-dashboardamin",
      "apagarcontadashboardamin",
      "conta",
      "dashboardamin",
      "exclusao",
      "exclusao conta",
      "exclusao de conta",
      "exclusao-conta",
      "exclusaoconta"
    ],
    "vocab": [],
    "ultimoCommit": "2026-07-06",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-07-06",
        "tipo": "evoluiu",
        "assunto": "adiciona páginas de política de privacidade e termos de uso"
      },
      {
        "data": "2026-04-02",
        "tipo": "evoluiu",
        "assunto": "segurança API exclusão (CORS, rate limit, Zod), PEM service account, middleware headers, .env.example"
      },
      {
        "data": "2026-04-02",
        "tipo": "outro",
        "assunto": "first commit"
      }
    ],
    "color": "#facc15"
  },
  {
    "name": "AquiResolve App",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Indefinida",
    "repo": "Delta657/Aqui_Resolve",
    "aliases": [
      "app",
      "app do aqui resolve",
      "aqui",
      "aqui resolve",
      "aqui_resolve",
      "aquiresolve",
      "aquiresolve app",
      "aquiresolveapp",
      "ar",
      "resolve"
    ],
    "vocab": [
      "prestador",
      "pedido",
      "home",
      "chat",
      "cliente",
      "painel",
      "admin",
      "cashback",
      "pagar",
      "pedidos",
      "notificacao",
      "banners",
      "copiloto",
      "conta"
    ],
    "ultimoCommit": "2026-07-06",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-07-06",
        "tipo": "corrigiu",
        "assunto": "remove turbopack.root fixo que conflitava com monorepo"
      },
      {
        "data": "2026-07-06",
        "tipo": "evoluiu",
        "assunto": "integra projeto de exclusão de conta (exclusao-conta/)"
      },
      {
        "data": "2026-07-06",
        "tipo": "outro",
        "assunto": "Bump versão para 1.3.1 (versionCode 20260706) p/ release na Play"
      },
      {
        "data": "2026-07-06",
        "tipo": "outro",
        "assunto": "Migra seleção de imagens para o Android Photo Picker (política Play)"
      },
      {
        "data": "2026-07-04",
        "tipo": "outro",
        "assunto": "v1.3.0 (versionCode 20260704) — AAB enviado para análise Play Store"
      },
      {
        "data": "2026-07-04",
        "tipo": "evoluiu",
        "assunto": "webhook Pagar.me pronto p/ ativação — HMAC, idempotência e sem rate limit"
      },
      {
        "data": "2026-07-03",
        "tipo": "manutencao",
        "assunto": "documentar pendencia do webhook Pagar.me (#18)"
      },
      {
        "data": "2026-06-29",
        "tipo": "corrigiu",
        "assunto": "fotos de cliente e prestador realmente independentes na mesma conta"
      },
      {
        "data": "2026-06-29",
        "tipo": "evoluiu",
        "assunto": "solicitacao do cliente (motivo+fotos) com aprovar/recusar no painel"
      },
      {
        "data": "2026-06-29",
        "tipo": "evoluiu",
        "assunto": "fila de reembolsos no painel e foto de prestador separada"
      },
      {
        "data": "2026-06-29",
        "tipo": "evoluiu",
        "assunto": "foto/nome da contraparte no pedido (cliente <-> prestador)"
      },
      {
        "data": "2026-06-29",
        "tipo": "evoluiu",
        "assunto": "remove cards \"Descricao do Servico\" e \"O problema foi solucionado?\" do checklist"
      },
      {
        "data": "2026-06-29",
        "tipo": "corrigiu",
        "assunto": "prestador pode avaliar o cliente de forma persistente"
      },
      {
        "data": "2026-06-29",
        "tipo": "corrigiu",
        "assunto": "prestador aprovado nao some mais o banner \"em analise\""
      },
      {
        "data": "2026-06-29",
        "tipo": "corrigiu",
        "assunto": "corrige aceite de pedidos e upload da OS"
      },
      {
        "data": "2026-06-28",
        "tipo": "manutencao",
        "assunto": "reescreve README e adiciona indice navegavel de docs/"
      },
      {
        "data": "2026-06-28",
        "tipo": "evoluiu",
        "assunto": "analise de imagem — cliente envia foto e a IA sugere o servico"
      },
      {
        "data": "2026-06-28",
        "tipo": "corrigiu",
        "assunto": "alerta de novo pedido nao tocava (FGS dataSync sem permissao API34+)"
      },
      {
        "data": "2026-06-28",
        "tipo": "corrigiu",
        "assunto": "mensagem da Central do prestador e reabrir na conta ativa"
      },
      {
        "data": "2026-06-28",
        "tipo": "corrigiu",
        "assunto": "entrega de notificacao (fcm_tokens) + estados no app + regra"
      }
    ],
    "color": "#22d3ee"
  },
  {
    "name": "AquiResolve Site",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Next.js + Tailwind",
    "repo": "willy-henrique/AquiResolve",
    "aliases": [
      "aquiresolve",
      "aquiresolve site",
      "aquiresolvesite",
      "landing",
      "site",
      "site do aqui resolve"
    ],
    "vocab": [
      "hero",
      "aquiresolve",
      "instagram",
      "play",
      "download",
      "project"
    ],
    "ultimoCommit": "2026-07-01",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-07-01",
        "tipo": "corrigiu",
        "assunto": "footer — trocar telefone por Instagram no Contato"
      },
      {
        "data": "2026-07-01",
        "tipo": "corrigiu",
        "assunto": "botão flutuante agora linka pra Play Store (Download)"
      },
      {
        "data": "2026-07-01",
        "tipo": "evoluiu",
        "assunto": "trocar WhatsApp por Instagram + CTA pulsante de download"
      },
      {
        "data": "2026-07-01",
        "tipo": "outro",
        "assunto": "Troca imagem do hero pela arte oficial dos profissionais"
      },
      {
        "data": "2026-06-30",
        "tipo": "outro",
        "assunto": "nome AquiResolve no topo (reordena hero)"
      },
      {
        "data": "2026-06-30",
        "tipo": "outro",
        "assunto": "Hero unificado em layout split com foto dos prestadores primeiro"
      },
      {
        "data": "2026-06-30",
        "tipo": "outro",
        "assunto": "Redesign da home + link do app na Google Play"
      },
      {
        "data": "2025-10-01",
        "tipo": "outro",
        "assunto": "Adicionar favicon usando logo do AquiResolve"
      },
      {
        "data": "2025-10-01",
        "tipo": "outro",
        "assunto": "Remove serviços: manutenção eletrodomésticos, faxina, chaveiro, borracheiro e pane seca"
      },
      {
        "data": "2025-07-31",
        "tipo": "manutencao",
        "assunto": "sync main changes to AquiResolve project"
      },
      {
        "data": "2025-07-31",
        "tipo": "outro",
        "assunto": "Initialized repository for project Seu emprego é aqui design"
      }
    ],
    "color": "#a78bfa"
  },
  {
    "name": "AquiResolve Painel",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Next.js + Firebase + Express + Tailwind",
    "repo": "willy-henrique/dashboard_admin",
    "aliases": [
      "admin",
      "aquiresolve",
      "aquiresolve painel",
      "aquiresolvepainel",
      "dashboard",
      "dashboard admin",
      "dashboard_admin",
      "dashboard_admin-1",
      "dashboardadmin",
      "painel",
      "painel do aqui resolve"
    ],
    "vocab": [
      "login",
      "master",
      "modal",
      "layout",
      "logo",
      "firestore",
      "visibilidade",
      "contraste",
      "paleta",
      "melhor",
      "cards",
      "sidebar",
      "aquiresolve",
      "prestadores"
    ],
    "ultimoCommit": "2026-06-12",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-06-12",
        "tipo": "evoluiu",
        "assunto": "add checklist closure logic and validation for service orders"
      },
      {
        "data": "2026-05-25",
        "tipo": "outro",
        "assunto": "VAMOOOOOOOOS"
      },
      {
        "data": "2026-05-25",
        "tipo": "outro",
        "assunto": "asfafsdfs"
      },
      {
        "data": "2026-03-25",
        "tipo": "corrigiu",
        "assunto": "fila de prestadores alinhada ao Firestore e status PT/EN"
      },
      {
        "data": "2026-03-25",
        "tipo": "evoluiu",
        "assunto": "listar nomes dos prestadores por categoria"
      },
      {
        "data": "2026-03-25",
        "tipo": "evoluiu",
        "assunto": "classificação de prestadores (planilha) e extração de categorias"
      },
      {
        "data": "2026-03-23",
        "tipo": "corrigiu",
        "assunto": "abrir detalhes com objeto da linha selecionada"
      },
      {
        "data": "2026-03-23",
        "tipo": "corrigiu",
        "assunto": "usar timeCreated real no horário de documentos"
      },
      {
        "data": "2026-03-23",
        "tipo": "corrigiu",
        "assunto": "sincronizar rastreamento com providers e aceitação"
      },
      {
        "data": "2026-03-23",
        "tipo": "corrigiu",
        "assunto": "read provider services field from Firestore"
      },
      {
        "data": "2026-03-22",
        "tipo": "evoluiu",
        "assunto": "exibir servicos cadastrados pelo prestador na aceitacao e gestao"
      },
      {
        "data": "2026-03-22",
        "tipo": "evoluiu",
        "assunto": "pagina de aceitacao de prestadores e correcoes Firebase"
      },
      {
        "data": "2026-03-17",
        "tipo": "corrigiu",
        "assunto": "improve error handling in payment processing and update Firestore references"
      },
      {
        "data": "2026-03-17",
        "tipo": "evoluiu",
        "assunto": "enhance user and provider modals with safe display functions and improve user table styling"
      },
      {
        "data": "2026-03-09",
        "tipo": "outro",
        "assunto": "atualiza descrição das cobranças na tabela de transações"
      },
      {
        "data": "2026-03-09",
        "tipo": "outro",
        "assunto": "final"
      },
      {
        "data": "2026-03-09",
        "tipo": "manutencao",
        "assunto": "testedadosmockado"
      },
      {
        "data": "2026-03-06",
        "tipo": "outro",
        "assunto": "atualizaçao"
      },
      {
        "data": "2026-03-06",
        "tipo": "outro",
        "assunto": "atualização 2"
      },
      {
        "data": "2026-03-06",
        "tipo": "manutencao",
        "assunto": "teste 2"
      }
    ],
    "color": "#f59e0b"
  },
  {
    "name": "WillTech Pesqueiros",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Next.js + Firebase + Tailwind",
    "repo": "willy-henrique/pesque-pague",
    "aliases": [
      "pague",
      "pesque",
      "pesque e pague",
      "pesque pague",
      "pesque-pague",
      "pesqueiro",
      "pesqueiros",
      "pesquepague",
      "sistema",
      "sistema pesquepague",
      "sistema-pesquepague",
      "sistemapesquepague",
      "willtech",
      "willtech pesqueiros",
      "willtechpesqueiros"
    ],
    "vocab": [
      "comanda",
      "admin",
      "atualizacao",
      "flow",
      "management",
      "pedidos",
      "user",
      "with",
      "pagamento",
      "logica",
      "status",
      "atendente",
      "alteracao",
      "caixa"
    ],
    "ultimoCommit": "2026-06-12",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-06-12",
        "tipo": "evoluiu",
        "assunto": "add Marlon authentication and account initialization functions"
      },
      {
        "data": "2026-06-09",
        "tipo": "evoluiu",
        "assunto": "add reports and user management pages with functionality for creating, editing, and deleting users"
      },
      {
        "data": "2026-06-09",
        "tipo": "evoluiu",
        "assunto": "add user management endpoints for admin and dev roles"
      },
      {
        "data": "2026-06-09",
        "tipo": "evoluiu",
        "assunto": "implementar gerenciamento de administradores com autenticação e operações CRUD"
      },
      {
        "data": "2026-06-09",
        "tipo": "evoluiu",
        "assunto": "adicionar suporte à taxa de serviço nos pedidos e exibir informações no pagamento"
      },
      {
        "data": "2026-06-09",
        "tipo": "evoluiu",
        "assunto": "adicionar lógica para atualizar status de pedidos com setores"
      },
      {
        "data": "2026-06-09",
        "tipo": "melhorou",
        "assunto": "ajustar estilo do botão de cancelamento de pedido"
      },
      {
        "data": "2026-06-09",
        "tipo": "evoluiu",
        "assunto": "adicionar subtotais por cliente e melhorar botões de pagamento na comanda"
      },
      {
        "data": "2026-06-09",
        "tipo": "evoluiu",
        "assunto": "atualizar lógica de filtragem de pedidos para considerar status de setor"
      },
      {
        "data": "2026-06-09",
        "tipo": "outro",
        "assunto": "atendente"
      },
      {
        "data": "2026-06-09",
        "tipo": "outro",
        "assunto": "oi"
      },
      {
        "data": "2026-06-09",
        "tipo": "outro",
        "assunto": "alteracao de fluxo"
      },
      {
        "data": "2026-06-08",
        "tipo": "evoluiu",
        "assunto": "máscara de telefone brasileiro em todos os campos de telefone"
      },
      {
        "data": "2026-06-08",
        "tipo": "evoluiu",
        "assunto": "prontos visíveis ao atendente + expand/print comanda no caixa"
      },
      {
        "data": "2026-06-08",
        "tipo": "corrigiu",
        "assunto": "substituir hash aleatório por número sequencial legível na comanda"
      },
      {
        "data": "2026-06-08",
        "tipo": "corrigiu",
        "assunto": "logo Confraria no cardápio e layout badge/preço na comanda"
      },
      {
        "data": "2026-06-08",
        "tipo": "outro",
        "assunto": "a"
      },
      {
        "data": "2026-06-08",
        "tipo": "outro",
        "assunto": "atualizacao"
      },
      {
        "data": "2026-06-08",
        "tipo": "outro",
        "assunto": "oi"
      },
      {
        "data": "2026-06-08",
        "tipo": "outro",
        "assunto": "atualizacao"
      }
    ],
    "color": "#34d399"
  },
  {
    "name": "life-pro",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "Next.js + Firebase + Tailwind",
    "repo": null,
    "aliases": [
      "life",
      "life pro",
      "life-pro",
      "lifepro",
      "pro"
    ],
    "vocab": [],
    "ultimoCommit": "2026-06-02",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-06-02",
        "tipo": "outro",
        "assunto": "Initial commit from Create Next App"
      }
    ],
    "color": "#f472b6"
  },
  {
    "name": "bloco-maisvarejo",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "React + Firebase + Tailwind",
    "repo": "willy-henrique/bloco-maisvarejo",
    "aliases": [
      "bloco",
      "bloco maisvarejo",
      "bloco-maisvarejo",
      "blocomaisvarejo",
      "maisvarejo"
    ],
    "vocab": [
      "operacional",
      "backlog",
      "estrategico",
      "empresa",
      "modal",
      "workspace",
      "admin",
      "mavo",
      "atualizacao",
      "tatico",
      "gestao",
      "tarefas",
      "filtros",
      "kanban"
    ],
    "ultimoCommit": "2026-05-14",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-05-14",
        "tipo": "outro",
        "assunto": "bug 14.05"
      },
      {
        "data": "2026-05-13",
        "tipo": "evoluiu",
        "assunto": "atualizações do projeto"
      },
      {
        "data": "2026-05-13",
        "tipo": "evoluiu",
        "assunto": "atualizações do projeto"
      },
      {
        "data": "2026-05-13",
        "tipo": "evoluiu",
        "assunto": "atualizações do projeto"
      },
      {
        "data": "2026-05-13",
        "tipo": "manutencao",
        "assunto": "teste"
      },
      {
        "data": "2026-05-12",
        "tipo": "evoluiu",
        "assunto": "excluir evento do MAVO também exclui do Google Calendar"
      },
      {
        "data": "2026-05-12",
        "tipo": "corrigiu",
        "assunto": "botão novo evento do painel Google Calendar abre formulário MAVO"
      },
      {
        "data": "2026-05-12",
        "tipo": "corrigiu",
        "assunto": "corrige convite Google Calendar e melhora UI da agenda"
      },
      {
        "data": "2026-05-12",
        "tipo": "outro",
        "assunto": "atualização 2.3.1"
      },
      {
        "data": "2026-05-08",
        "tipo": "outro",
        "assunto": "sem ia"
      },
      {
        "data": "2026-05-08",
        "tipo": "outro",
        "assunto": "atualização 2.3 🚀 MAVO Gestão 2.3.0"
      },
      {
        "data": "2026-05-07",
        "tipo": "outro",
        "assunto": "Bump version to 2.2.0"
      },
      {
        "data": "2026-05-07",
        "tipo": "outro",
        "assunto": "Corrige sincronizacao de exclusao de tickets"
      },
      {
        "data": "2026-05-06",
        "tipo": "outro",
        "assunto": "versão 2.2.0"
      },
      {
        "data": "2026-05-06",
        "tipo": "outro",
        "assunto": "Remove arquivos temporarios do repositorio"
      },
      {
        "data": "2026-05-06",
        "tipo": "outro",
        "assunto": "ATUALIZAÇÃO TOTAL"
      },
      {
        "data": "2026-05-05",
        "tipo": "outro",
        "assunto": "agenda atualizada"
      },
      {
        "data": "2026-05-05",
        "tipo": "outro",
        "assunto": "askokofksp"
      },
      {
        "data": "2026-05-04",
        "tipo": "manutencao",
        "assunto": "ajustes da versao 2.0.6"
      },
      {
        "data": "2026-05-04",
        "tipo": "outro",
        "assunto": "atualização 2.1"
      }
    ],
    "color": "#60a5fa"
  },
  {
    "name": "AgroOliveira",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "React + Firebase + Supabase + Express + Tailwind",
    "repo": null,
    "aliases": [
      "agrooliveira"
    ],
    "vocab": [],
    "ultimoCommit": "2026-04-29",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-04-29",
        "tipo": "evoluiu",
        "assunto": "atualiza ERP e integrações"
      },
      {
        "data": "2026-03-27",
        "tipo": "outro",
        "assunto": "Refine auth and role routing flow for WillyDev and ERP domains."
      },
      {
        "data": "2026-03-27",
        "tipo": "outro",
        "assunto": "first commit"
      },
      {
        "data": "2026-03-19",
        "tipo": "evoluiu",
        "assunto": "Initialize Agro Ferragista Oliveira ERP frontend"
      },
      {
        "data": "2026-03-19",
        "tipo": "outro",
        "assunto": "Initial commit"
      }
    ],
    "color": "#fb923c"
  },
  {
    "name": "projeto-pitdog",
    "status": "Active",
    "type": "Software",
    "progress": 0,
    "stack": "React + Supabase + Express + Tailwind",
    "repo": "willy-henrique/projeto-pitdog",
    "aliases": [
      "pitdog",
      "projeto",
      "projeto pitdog",
      "projeto-pitdog",
      "projetopitdog"
    ],
    "vocab": [],
    "ultimoCommit": "2026-03-07",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2026-03-07",
        "tipo": "evoluiu",
        "assunto": "Initialize AquiFood SaaS application"
      },
      {
        "data": "2026-03-07",
        "tipo": "outro",
        "assunto": "Initial commit"
      }
    ],
    "color": "#4ade80"
  },
  {
    "name": "GRDEDETIZAÇÃO",
    "status": "Legacy",
    "type": "Software",
    "progress": 0,
    "stack": "Indefinida",
    "repo": "willy-henrique/dedetiza-o",
    "aliases": [
      "dedetiza-o",
      "grdedetizacao"
    ],
    "vocab": [
      "tecnicos",
      "willydev",
      "painel",
      "criacao",
      "login",
      "rota",
      "completo",
      "scripts",
      "administrativo",
      "script",
      "configuracao",
      "graficos",
      "validacao",
      "admin"
    ],
    "ultimoCommit": "2025-12-15",
    "evolucoes30d": 0,
    "correcoes30d": 0,
    "historico": [
      {
        "data": "2025-12-15",
        "tipo": "evoluiu",
        "assunto": "Implementacao completa do sistema conforme requisitos - Adiciona pagina de Produtos Quimicos com composicao quimica detalhada - Atualiza modulo Financeiro com classificacao de pagamentos (pago, pendente, parcial, vencido) - Adiciona campo CRQ para tecnicos - Cria telas de Produtos no Flutter (lista, detalhes, selecao para OS) - Atualiza PDFService com certificado completo incluindo produtos e CRQ - Adiciona scripts SQL para estrutura completa do banco - Melhora interface do painel administrativo"
      },
      {
        "data": "2025-12-15",
        "tipo": "corrigiu",
        "assunto": "adicionar tratamento de erros RLS e criar script de configuração"
      },
      {
        "data": "2025-12-15",
        "tipo": "corrigiu",
        "assunto": "corrigir criação de técnicos e gráficos do dashboard"
      },
      {
        "data": "2025-12-15",
        "tipo": "corrigiu",
        "assunto": "melhorar validação de email e mensagens de erro"
      },
      {
        "data": "2025-12-15",
        "tipo": "corrigiu",
        "assunto": "garantir que gráficos apareçam mesmo com dados vazios"
      },
      {
        "data": "2025-12-15",
        "tipo": "evoluiu",
        "assunto": "implementar logout completo no botão Sair"
      },
      {
        "data": "2025-12-15",
        "tipo": "corrigiu",
        "assunto": "manter sessão admin ao criar técnicos para RLS funcionar"
      },
      {
        "data": "2025-12-15",
        "tipo": "corrigiu",
        "assunto": "melhorar tratamento de erros ao criar técnicos"
      },
      {
        "data": "2025-12-15",
        "tipo": "corrigiu",
        "assunto": "corrigir erro 401 e validação de email na edge function"
      },
      {
        "data": "2025-12-15",
        "tipo": "corrigiu",
        "assunto": "corrigir erro RLS ao criar técnicos"
      },
      {
        "data": "2025-12-15",
        "tipo": "corrigiu",
        "assunto": "corrigir busca de técnicos pendentes na página willydev"
      },
      {
        "data": "2025-12-15",
        "tipo": "evoluiu",
        "assunto": "adicionar campo senha para técnicos e corrigir criação de ordens de serviço"
      },
      {
        "data": "2025-12-15",
        "tipo": "outro",
        "assunto": "Simplificar script de modificacao da tabela tecnicos - remover apenas FK sem alterar PK"
      },
      {
        "data": "2025-12-15",
        "tipo": "outro",
        "assunto": "Corrigir erro ao salvar tecnico - melhorar tratamento de erros e adicionar script para modificar tabela"
      },
      {
        "data": "2025-12-15",
        "tipo": "outro",
        "assunto": "Forcar novo login toda vez que acessar rota willydev"
      },
      {
        "data": "2025-12-15",
        "tipo": "outro",
        "assunto": "Remover limpeza automatica de sessao no WillyDevLogin"
      },
      {
        "data": "2025-12-15",
        "tipo": "outro",
        "assunto": "Corrigir imports no WillyDevLogin"
      },
      {
        "data": "2025-12-15",
        "tipo": "outro",
        "assunto": "Ajustar logica para sempre pedir login na rota willydev"
      },
      {
        "data": "2025-12-15",
        "tipo": "outro",
        "assunto": "Garantir que rota willydev sempre exija login especifico independente de outras sessoes"
      },
      {
        "data": "2025-12-15",
        "tipo": "outro",
        "assunto": "Adicionar login especial para willydev"
      }
    ],
    "color": "#c084fc"
  }
];
