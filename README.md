# Plataforma Senra

Sistema integrado de gestão educacional e marketing para instituições de ensino.

## Visão Geral

A Plataforma Senra é um sistema web completo desenvolvido com Next.js que combina funcionalidades de gestão acadêmica, CRM, marketing automation e analytics em uma única plataforma intuitiva.

## Tecnologias Utilizadas

- **Frontend**: Next.js 13+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase/Firestore
- **Banco de Dados**: Firestore (via Firebase Admin SDK)
- **Autenticação**: NextAuth.js ou similar
- **Deploy**: Vercel ou similar
- **Integrações**: Meta (Facebook/Instagram) Ads API, Google Workspace, Telegram, etc.

## Estrutura do Projeto

```
plataforma-senra/
├── src/                   # Código fonte principal
│   ├── app/              # Rotas e páginas (Next.js App Router)
│   ├── components/       # Componentes reutilizáveis de UI
│   ├── hooks/            # Hooks customizados do React
│   ├── lib/              # Bibliotecas e utilitários compartilhados
│   ├── types/            # Definições de tipos TypeScript
│   └── ai/               # Lógica de inteligência artificial e agentes MCP
├── public/               # Arquivos estáticos (imagens, ícones, etc.)
├── prisma/               # Schema e migrações do Prisma ORM
├── docs/                 # Documentação adicional
├── .next/                # Build do Next.js (gerado)
├── node_modules/         # Dependências do projeto
├── package.json          # Dependências e scripts
├── next.config.ts        # Configuração do Next.js
├── tailwind.config.ts    # Configuração do Tailwind CSS
├── tsconfig.json         # Configuração do TypeScript
└── README.md             # Este arquivo
```

## Funcionalidades Principais

1. **Gestão Acadêmica**:
   - Cadastro de alunos, professores e cursos
   - Gestão de turmas e horários
   - Controle de frequência e notas
   - Geração de boletins e histórico escolar

2. **CRM e Vendas**:
   - Gestão de leads e oportunidades
   - Funil de vendas personalizável
   - Automação de follow-ups
   - Integração com WhatsApp/Telegram

3. **Marketing Automation**:
   - Campanhas de email e SMS
   - Integração com Meta Ads (Facebook/Instagram)
   - Gestão de redes sociais
   - Landing pages e formulários de captura

4. **Analytics e Relatórios**:
   - Dashboards personalizáveis
   - Relatórios de desempenho acadêmico
   - Métricas de marketing e conversão
   - Integração com Google Analytics

5. **Inteligência Artificial**:
   - Agentes MCP para automação de tarefas
   - Chatbots para atendimento ao aluno
   - Geração automática de conteúdo
   - Análise predicial de evasão

## Como Executar Localmente

1. **Pré-requisitos**:
   - Node.js 16.x ou superior
   - Conta Firebase configurada
   - Contas de API para Meta Ads, Google Workspace, etc. (opcional para funcionalidades completas)

2. **Passos**:
   ```bash
   # Instalar dependências
   npm install

   # Configurar variáveis de ambiente
   cp .env.example .env
   # Editar .env com suas credenciais

   # Executar em desenvolvimento
   npm run dev

   # Acessar em http://localhost:3000
   ```

## Variáveis de Ambiente

Consulte o arquivo `.env.example` para ver todas as variáveis necessárias, incluindo:
- Credenciais do Firebase
- Chaves de API do Meta (Facebook/Instagram)
- Credenciais do Google Workspace
- Tokens do Telegram
- Configurações de email (SendGrid/SMTP)
- URLs de redeirecionamento OAuth

## Deploy

A plataforma está otimizada para deploy no Vercel:
```bash
npm run build
```

Ou pode ser deployed em qualquer serviço que suporte Node.js (AWS, Heroku, Docker, etc.).

## Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
3. Faça suas alterações
4. Commit suas mudanças (`git commit -m 'Adiciona alguma feature'`)
5. Push para a branch (`git push origin feature/nome-da-feature`)
6. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT - veja o arquivo LICENSE.md para mais detalhes.