"use server";

import prisma from "@/lib/prisma";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

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

    const { batchSize, queueOrder, steps } = workflow;
    const orderDirection = queueOrder === "LIFO" ? "desc" : "asc";

    let actionsPerformed = 0;

    // Buscar chaves de API para os Agentes
    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    if (!settings?.geminiApiKey) {
      throw new Error("Chave de API do Gemini não configurada.");
    }
    const google = createGoogleGenerativeAI({ apiKey: settings.geminiApiKey });

    // ---------------------------------------------------------
    // PASSO 1: DRAFT -> REVIEW (Redação)
    // ---------------------------------------------------------
    const stepDraft = steps.find(s => s.triggerState === "DRAFT" && s.actionState === "REVIEW");
    
    if (stepDraft && stepDraft.agent) {
      const drafts = await prisma.blogPost.findMany({
        where: { status: "DRAFT" },
        orderBy: { updatedAt: orderDirection },
        take: batchSize
      });

      console.log(`[MAESTRO] Encontrados ${drafts.length} rascunhos.`);

      for (const draft of drafts) {
        console.log(`[MAESTRO] Redigindo artigo: ${draft.title}`);
        
        try {
          const redatorAgent = stepDraft.agent;
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

          const { text } = await generateText({
            model: google(redatorAgent.model || 'gemini-2.0-flash'),
            system: systemPrompt,
            prompt: userPrompt,
          });

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
            }
          });

          actionsPerformed++;
          console.log(`[MAESTRO] Sucesso! ${draft.title} movido para REVIEW.`);
        } catch (e) {
          console.error(`[MAESTRO] Falha ao processar rascunho ${draft.title}:`, e);
          // O Retry Policy (Máx 2 falhas) requereria uma tabela de tentativas por post
          // Como MVP, apenas ignoramos para tentar na próxima rodada
        }
      }
    }

    // ---------------------------------------------------------
    // PASSO 2: REVIEW -> IMAGES (Revisão)
    // ---------------------------------------------------------
    const stepReview = steps.find(s => s.triggerState === "REVIEW" && s.actionState === "IMAGES");
    
    if (stepReview && stepReview.agent) {
      const reviews = await prisma.blogPost.findMany({
        where: { status: "REVIEW" },
        orderBy: { updatedAt: orderDirection },
        take: batchSize
      });

      console.log(`[MAESTRO] Encontrados ${reviews.length} artigos para revisão.`);

      for (const rev of reviews) {
        console.log(`[MAESTRO] Revisando artigo: ${rev.title}`);
        
        try {
          const revisorAgent = stepReview.agent;
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

          const { text } = await generateText({
            model: google(revisorAgent.model || 'gemini-2.0-flash'),
            system: systemPrompt,
            prompt: userPrompt,
          });

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
            }
          });

          actionsPerformed++;
          console.log(`[MAESTRO] Sucesso! ${rev.title} movido para IMAGES.`);
        } catch (e) {
          console.error(`[MAESTRO] Falha ao revisar artigo ${rev.title}:`, e);
        }
      }
    }

    return { 
      success: true, 
      message: `Ciclo concluído. ${actionsPerformed} ações realizadas.` 
    };

  } catch (error: any) {
    console.error("[MAESTRO] Erro crítico:", error);
    return { success: false, error: error.message };
  }
}
