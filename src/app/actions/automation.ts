"use server";

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * runAiSupervisor
 * Esta função é chamada via Cron Job (ex: a cada hora).
 * Ela funciona como o "Maestro" da automação do Kanban do Blog.
 */
export async function runAiSupervisor() {
  try {
    console.log("[MAESTRO] Iniciando rotina de verificação...");

    // 1. Buscar configurações ativas do Workflow do BLOG
    const workflow = await prisma.automationWorkflow.findFirst({
      where: { entity: "BLOG" },
      include: {
        steps: {
          include: { agent: true }
        }
      }
    });

    if (!workflow) {
      console.log("[MAESTRO] Nenhum workflow do BLOG configurado.");
      return { success: false, message: "Nenhum workflow configurado." };
    }

    if (!workflow.isActive) {
      console.log("[MAESTRO] Workflow pausado pelo Kill-Switch.");
      return { success: false, message: "Workflow inativo (Kill-Switch ligado)." };
    }

    const { batchSize, queueOrder, steps, id: workflowId } = workflow;
    const orderDirection = queueOrder === "LIFO" ? "desc" : "asc";

    let actionsPerformed = 0;

    // Buscar chaves de API para os Agentes
    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    if (!settings?.geminiApiKey) {
      throw new Error("Chave de API do Gemini não configurada.");
    }
    const genAI = new GoogleGenerativeAI(settings.geminiApiKey);

    const redatorId = settings?.blogRedatorAgentId;
    const revisorId = settings?.blogRevisorAgentId;
    
    if (!redatorId || !revisorId) {
      return { success: false, message: "Os Agentes do Blog (Redator ou Revisor) não foram configurados. Configure-os no Editor de Texto usando o botão 'Gerar com IA' primeiro." };
    }

    const redatorAgent = await prisma.aiAgent.findUnique({ where: { id: redatorId } });
    const revisorAgent = await prisma.aiAgent.findUnique({ where: { id: revisorId } });

    // ---------------------------------------------------------
    // PASSO 1: DRAFT -> REVIEW (Redação)
    // ---------------------------------------------------------
    const stepDraft = steps.find(s => s.triggerState === "DRAFT" && s.actionState === "REVIEW");
    
    if (stepDraft && redatorAgent) {
      const drafts = await prisma.blogPost.findMany({
        where: { status: "DRAFT" },
        orderBy: { updatedAt: orderDirection as any },
        take: batchSize
      });

      console.log(`[MAESTRO] Encontrados ${drafts.length} rascunhos.`);

      if (drafts.length > 0) {
        await prisma.automationWorkflow.update({
          where: { id: workflowId },
          data: { currentProcessingStep: "DRAFT" }
        });
        await prisma.blogPost.updateMany({
          where: { id: { in: drafts.map(d => d.id) } },
          data: { isProcessingAi: true }
        });
      }

      for (const draft of drafts) {
        console.log(`[MAESTRO] Redigindo artigo: ${draft.title}`);
        try {
          const systemPrompt = `
Você é o agente: ${redatorAgent.name}.
Papel: ${redatorAgent.role || "Redator Especialista"}
Objetivo: ${redatorAgent.goal || "Escrever um artigo completo e otimizado."}
Regras Rígidas: ${redatorAgent.rules || "Nenhuma regra extra."}
${redatorAgent.instructions ? `Instruções: ${redatorAgent.instructions}` : ""}

Seu formato de saída DEVE ser estritamente um JSON válido contendo:
{
  "title": "Título otimizado (pode manter o original ou melhorar)",
  "excerpt": "Um resumo de 2 a 3 linhas",
  "content": "Conteúdo completo em HTML (use tags <h2>, <p>, <ul>, etc)",
  "metaDescription": "Meta descrição SEO de até 160 caracteres"
}
`;

          const userPrompt = `
Escreva o artigo com base neste rascunho:
Título Inicial: ${draft.title}
Notas/Ideias Atuais: ${draft.excerpt || "Nenhuma anotação."}
Conteúdo Base (se houver): ${draft.content || "Nenhum conteúdo."}
`;

          const aiModel = genAI.getModel({
            model: redatorAgent.model?.replace("openrouter:", "") || 'gemini-2.5-flash-preview-04-17',
            systemInstruction: systemPrompt
          });

          const result = await aiModel.generateContent(userPrompt);
          const text = result.response.text();

          // Limpar blockticks se vier como markdown de código (ex: ```json ... ```)
          let cleanJson = text.trim();
          if (cleanJson.startsWith("```json")) {
            cleanJson = cleanJson.replace(/```json/g, "").replace(/```/g, "").trim();
          }

          const parsedData = JSON.parse(cleanJson);

          // Atualizar o Banco
          await prisma.blogPost.update({
            where: { id: draft.id },
            data: {
              title: parsedData.title || draft.title,
              excerpt: parsedData.excerpt || draft.excerpt,
              content: parsedData.content || draft.content,
              metaDescription: parsedData.metaDescription || draft.metaDescription,
              status: "REVIEW", // Avança a esteira
              isProcessingAi: false
            }
          });

          actionsPerformed++;
          console.log(`[MAESTRO] Sucesso! ${draft.title} movido para REVIEW.`);
        } catch (e) {
          console.error(`[MAESTRO] Falha ao processar rascunho ${draft.title}:`, e);
          await prisma.blogPost.update({ where: { id: draft.id }, data: { isProcessingAi: false } });
          // O Retry Policy (Máx 2 falhas) requereria uma tabela de tentativas por post
          // Como MVP, apenas ignoramos para tentar na próxima rodada
        }
      }
    }

    // ---------------------------------------------------------
    // PASSO 2: REVIEW -> IMAGES (Revisão)
    // ---------------------------------------------------------
    const stepReview = steps.find(s => s.triggerState === "REVIEW" && s.actionState === "IMAGES");
    
    if (stepReview && revisorAgent) {
      const reviews = await prisma.blogPost.findMany({
        where: { status: "REVIEW" },
        orderBy: { updatedAt: orderDirection as any },
        take: batchSize
      });

      console.log(`[MAESTRO] Encontrados ${reviews.length} artigos para revisão.`);

      if (reviews.length > 0) {
        await prisma.automationWorkflow.update({
          where: { id: workflowId },
          data: { currentProcessingStep: "REVIEW" }
        });
        await prisma.blogPost.updateMany({
          where: { id: { in: reviews.map(r => r.id) } },
          data: { isProcessingAi: true }
        });
      }

      for (const rev of reviews) {
        console.log(`[MAESTRO] Revisando artigo: ${rev.title}`);
        try {
          const systemPrompt = `
Você é o agente: ${revisorAgent.name}.
Papel: ${revisorAgent.role || "Revisor Técnico de SEO"}
Objetivo: ${revisorAgent.goal || "Revisar o artigo, corrigir erros e garantir excelência SEO."}
Regras Rígidas: ${revisorAgent.rules || "Não altere a estrutura básica."}
${revisorAgent.instructions ? `Instruções: ${revisorAgent.instructions}` : ""}

Seu formato de saída DEVE ser estritamente um JSON válido contendo:
{
  "content": "Conteúdo corrigido em HTML",
  "tags": "lista, de, palavras, chave, separadas, por, virgula"
}
`;

          const userPrompt = `
Revise e aperfeiçoe este artigo:
Título: ${rev.title}
Conteúdo HTML Atual: 
${rev.content}
`;

          const aiModel = genAI.getModel({
            model: revisorAgent.model?.replace("openrouter:", "") || 'gemini-2.5-flash-preview-04-17',
            systemInstruction: systemPrompt
          });

          const result = await aiModel.generateContent(userPrompt);
          const text = result.response.text();

          let cleanJson = text.trim();
          if (cleanJson.startsWith("```json")) {
            cleanJson = cleanJson.replace(/```json/g, "").replace(/```/g, "").trim();
          }

          const parsedData = JSON.parse(cleanJson);

          // Atualizar o Banco
          await prisma.blogPost.update({
            where: { id: rev.id },
            data: {
              content: parsedData.content || rev.content,
              tags: parsedData.tags || rev.tags,
              status: "IMAGES", // Avança para a parada obrigatória humana
              isProcessingAi: false
            }
          });

          actionsPerformed++;
          console.log(`[MAESTRO] Sucesso! ${rev.title} movido para IMAGES.`);
        } catch (e) {
          console.error(`[MAESTRO] Falha ao revisar artigo ${rev.title}:`, e);
          await prisma.blogPost.update({ where: { id: rev.id }, data: { isProcessingAi: false } });
        }
      }
    }

    // Limpa o status do workflow
    await prisma.automationWorkflow.update({
      where: { id: workflowId },
      data: { currentProcessingStep: null }
    });

    return { 
      success: true, 
      message: `Ciclo concluído. ${actionsPerformed} ações realizadas.` 
    };

  } catch (error: any) {
    console.error("[MAESTRO] Erro crítico:", error);
    return { success: false, error: error.message };
  }
}

export async function getAutomationWorkflows() {
  try {
    // Se não existir nenhum, vamos criar o padrão do Supervisor de Blog
    let workflows = await prisma.automationWorkflow.findMany({
      include: { steps: { include: { agent: true }, orderBy: { order: 'asc' } } }
    });

    if (workflows.length === 0) {
      const defaultWorkflow = await prisma.automationWorkflow.create({
        data: {
          name: "Supervisor de Blog (Maestro)",
          description: "Orquestrador de IA que move automaticamente artigos pelo Kanban.",
          entity: "BLOG",
          frequency: "hourly",
          batchSize: 2,
          maxRetries: 2,
          queueOrder: "FIFO",
          isActive: false
        }
      });
      // Cria passos padrão sem agentes definidos
      await prisma.workflowStep.createMany({
        data: [
          { workflowId: defaultWorkflow.id, agentId: null, triggerState: "DRAFT", actionState: "REVIEW", order: 1 },
          { workflowId: defaultWorkflow.id, agentId: null, triggerState: "REVIEW", actionState: "IMAGES", order: 2 }
        ]
      });
      workflows = await prisma.automationWorkflow.findMany({
        include: { steps: { include: { agent: true }, orderBy: { order: 'asc' } } }
      });
    }

    return { success: true, data: workflows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAutomationWorkflow(id: string, data: any, steps: any[]) {
  try {
    await prisma.automationWorkflow.update({
      where: { id },
      data: {
        isActive: data.isActive,
        frequency: data.frequency,
        batchSize: parseInt(data.batchSize),
        queueOrder: data.queueOrder,
      }
    });

    // Atualizar agentes de cada passo
    for (const step of steps) {
      if (step.agentId) {
        await prisma.workflowStep.update({
          where: { id: step.id },
          data: { agentId: step.agentId }
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

