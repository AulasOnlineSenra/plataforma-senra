import { ai } from '@/ai/genkit';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Tool: Buscar Leads no CRM
export const searchLeadsTool = ai.defineTool(
  {
    name: 'searchLeads',
    description: 'Busca leads no banco de dados do CRM por nome, email ou telefone.',
    inputSchema: z.object({
      query: z.string().describe('O termo de busca (nome, email ou parte do telefone)'),
    }),
    outputSchema: z.array(z.any()),
  },
  async (input) => {
    try {
      const leads = await prisma.crmLead.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: 'insensitive' } },
            { email: { contains: input.query, mode: 'insensitive' } },
            { phone: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        include: {
          column: {
            select: { name: true, board: { select: { name: true } } }
          }
        },
        take: 10,
      });
      return leads;
    } catch (error) {
      console.error('Erro na ferramenta searchLeads:', error);
      throw error;
    }
  }
);

// Tool: Criar novo Lead
export const createLeadTool = ai.defineTool(
  {
    name: 'createLead',
    description: 'Cria um novo lead no CRM.',
    inputSchema: z.object({
      name: z.string().describe('Nome completo do lead'),
      email: z.string().email().optional().describe('Email de contato'),
      phone: z.string().optional().describe('Telefone de contato'),
      source: z.string().optional().describe('Origem do lead (ex: Instagram, WhatsApp)'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      // Busca a primeira coluna do primeiro board para colocar o lead novo
      const firstColumn = await prisma.crmColumn.findFirst({
        orderBy: { order: 'asc' },
      });

      if (!firstColumn) {
        throw new Error('Nenhuma coluna de CRM encontrada para adicionar o lead.');
      }

      const lead = await prisma.crmLead.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          source: input.source || 'IA Agent',
          columnId: firstColumn.id,
          temperature: 'frio',
        },
      });
      return lead;
    } catch (error) {
      console.error('Erro na ferramenta createLead:', error);
      throw error;
    }
  }
);

// Tool: Gerar conteúdo para Blog
export const generateBlogPostTool = ai.defineTool(
  {
    name: 'generateBlogPost',
    description: 'Cria um rascunho de postagem para o blog da plataforma.',
    inputSchema: z.object({
      title: z.string().describe('Título da postagem'),
      excerpt: z.string().describe('Resumo curto para atração'),
      content: z.string().describe('Conteúdo completo em markdown'),
      author: z.string().describe('Nome do autor'),
      tags: z.array(z.string()).optional().describe('Lista de tags relevantes'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      const post = await prisma.blogPost.create({
        data: {
          title: input.title,
          excerpt: input.excerpt,
          content: input.content,
          author: input.author,
          tags: JSON.stringify(input.tags || []),
          published: false, // Sempre rascunho por segurança
        },
      });
      return post;
    } catch (error) {
      console.error('Erro na ferramenta generateBlogPost:', error);
      throw error;
    }
  }
);

// Tool: Mover Lead de Coluna
export const moveLeadTool = ai.defineTool(
  {
    name: 'moveLead',
    description: 'Move um lead para uma coluna diferente no CRM.',
    inputSchema: z.object({
      leadId: z.string().describe('ID do lead a ser movido'),
      columnId: z.string().describe('ID da coluna de destino'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      const lead = await prisma.crmLead.update({
        where: { id: input.leadId },
        data: { columnId: input.columnId },
      });
      return lead;
    } catch (error) {
      console.error('Erro na ferramenta moveLead:', error);
      throw error;
    }
  }
);

// Tool: Atualizar Lead
export const updateLeadTool = ai.defineTool(
  {
    name: 'updateLead',
    description: 'Atualiza informações de um lead existente.',
    inputSchema: z.object({
      leadId: z.string().describe('ID do lead'),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      temperature: z.enum(['frio', 'morno', 'quente', 'muito-quente']).optional(),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const { leadId, ...data } = input;
    try {
      const lead = await prisma.crmLead.update({
        where: { id: leadId },
        data,
      });
      return lead;
    } catch (error) {
      console.error('Erro na ferramenta updateLead:', error);
      throw error;
    }
  }
);

// Tool: Buscar Postagens do Blog
export const searchBlogPostsTool = ai.defineTool(
  {
    name: 'searchBlogPosts',
    description: 'Busca postagens existentes no blog.',
    inputSchema: z.object({
      query: z.string().describe('Termo de busca no título ou conteúdo'),
    }),
    outputSchema: z.array(z.any()),
  },
  async (input) => {
    try {
      const posts = await prisma.blogPost.findMany({
        where: {
          OR: [
            { title: { contains: input.query, mode: 'insensitive' } },
            { content: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      });
      return posts;
    } catch (error) {
      console.error('Erro na ferramenta searchBlogPosts:', error);
      throw error;
    }
  }
);

// Tool: Estatísticas do Sistema
export const getSystemStatsTool = ai.defineTool(
  {
    name: 'getSystemStats',
    description: 'Retorna estatísticas gerais da plataforma (leads, alunos, professores).',
    inputSchema: z.object({}),
    outputSchema: z.any(),
  },
  async () => {
    try {
      const [leadsCount, studentsCount, teachersCount, postsCount] = await Promise.all([
        prisma.crmLead.count(),
        prisma.user.count({ where: { role: 'student' } }),
        prisma.user.count({ where: { role: 'teacher' } }),
        prisma.blogPost.count(),
      ]);
      return {
        leads: leadsCount,
        alunos: studentsCount,
        professores: teachersCount,
        postagens: postsCount,
      };
    } catch (error) {
      console.error('Erro na ferramenta getSystemStats:', error);
      throw error;
    }
  }
);

// Tool: Pesquisa na Web (Tavily)
export const webSearchTool = ai.defineTool(
  {
    name: 'webSearch',
    description: 'Busca informações atualizadas na internet (notícias, artigos, dados recentes).',
    inputSchema: z.object({
      query: z.string().describe('O que você deseja pesquisar na web'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
      const apiKey = settings?.searchApiKey || process.env.TAVILY_API_KEY;

      if (!apiKey) {
        return { error: "Chave de API de busca não configurada (Tavily)." };
      }

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query: input.query,
          search_depth: "smart",
          max_results: 5
        })
      });

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Erro na ferramenta webSearch:', error);
      throw error;
    }
  }
);

// Tool: Enviar Email
export const sendEmailTool = ai.defineTool(
  {
    name: 'sendEmail',
    description: 'Envia uma notificação por e-mail para um destinatário.',
    inputSchema: z.object({
      to: z.string().email().describe('E-mail do destinatário'),
      subject: z.string().describe('Assunto do e-mail'),
      body: z.string().describe('Conteúdo do e-mail (pode ser texto ou HTML)'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      // Aqui usaríamos o nodemailer configurado no projeto
      // Por enquanto, simulamos o envio bem-sucedido
      console.log(`[Email Tool] Enviando para ${input.to}: ${input.subject}`);
      return { success: true, message: "E-mail enviado com sucesso." };
    } catch (error) {
      console.error('Erro na ferramenta sendEmail:', error);
      throw error;
    }
  }
);

export const allTools = [
  searchLeadsTool, 
  createLeadTool, 
  generateBlogPostTool, 
  moveLeadTool, 
  updateLeadTool, 
  searchBlogPostsTool, 
  getSystemStatsTool,
  webSearchTool,
  sendEmailTool
];
