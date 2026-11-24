"use server";

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import OpenAI from "openai";

/**
 * runAiSupervisor
 * Esta função é chamada via Cron Job (ex: a cada hora).
 * Ela funciona como o "Maestro" da automação do Kanban do Blog.
 */
export async function runAiSupervisor() {
  let globalWorkflowId: string | null = null;
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
      return { success: false, message: "Nenhum workflow configurado.", step: "GLOBAL" };
    }

    globalWorkflowId = workflow.id;

    if (!workflow.isActive) {
      console.log("[MAESTRO] Workflow pausado pelo Kill-Switch.");
      return { success: false, message: "Workflow inativo (Kill-Switch ligado).", step: "GLOBAL" };
    }

    const { batchSize, queueOrder, steps, id: workflowId } = workflow;
    const orderDirection = queueOrder === "LIFO" ? "desc" : "asc";

    let actionsPerformed = 0;
    let draftsProcessed = 0;
    let reviewsProcessed = 0;

    // Buscar chaves de API e Agentes
    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });

    const rawGeminiKey = settings?.geminiApiKey || "";
    const geminiApiKeys = rawGeminiKey.split(/\r?\n|,/).map(k => k.trim()).filter(k => k.length > 0);
    const geminiKey = geminiApiKeys[0]; // Usa a primeira chave válida do pool
    const orApiKey = settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;

    if (!geminiKey && !orApiKey) {
      throw new Error("Nenhuma chave de API configurada (Gemini ou OpenRouter).");
    }

    const redatorId = settings?.blogRedatorAgentId;
    const revisorId = settings?.blogRevisorAgentId;
    
    if (!redatorId) {
      return { success: false, message: "Agente Redator não configurado. Vá no Editor de Texto e escolha um agente em 'Gerar com IA'.", step: "DRAFT" };
    }
    
    if (!revisorId) {
      return { success: false, message: "Agente Revisor não configurado. Vá no Editor de Texto e escolha um agente em 'Revisar com IA'.", step: "REVIEW" };
    }

    const redatorAgent = redatorId ? await prisma.aiAgent.findUnique({ where: { id: redatorId } }) : null;
    const revisorAgent = revisorId ? await prisma.aiAgent.findUnique({ where: { id: revisorId } }) : null;

    if (!redatorAgent) {
      return { success: false, message: "O Agente Redator configurado não existe mais no banco de dados.", step: "DRAFT" };
    }

    if (!revisorAgent) {
      return { success: false, message: "O Agente Revisor configurado não existe mais no banco de dados.", step: "REVIEW" };
    }

    // ---------------------------------------------------------
    // PASSO 1: DRAFT -> REVIEW (Redação)
    // ---------------------------------------------------------
    const stepDraft = steps.find(s => s.triggerState === "DRAFT" && s.actionState === "REVIEW");
    
    if (stepDraft && redatorAgent) {
      const drafts = await prisma.blogPost.findMany({
        where: { 
          OR: [{ status: "DRAFT" }, { status: "", published: false }],
          orchestrationStatus: { notIn: ["PAUSED", "AWAITING_ADMIN"] }
        },
        orderBy: { updatedAt: orderDirection as any },
        take: batchSize
      });

      console.log(`[MAESTRO] Encontrados ${drafts.length} rascunhos elegíveis.`);

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
        console.log(`[MAESTRO] Redigindo artigo: ${draft.title} (Iteração ${(draft.loopIteration || 0) + 1})`);
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

          let userPrompt = `
Escreva o artigo com base neste rascunho:
Título Inicial: ${draft.title}
Notas/Ideias Atuais: ${draft.excerpt || "Nenhuma anotação."}
Conteúdo Base (se houver): ${draft.content || "Nenhum conteúdo."}
`;

          if (draft.lastReviewFeedback) {
            userPrompt += `\n⚠️ ATENÇÃO: O Revisor reprovou a versão anterior com o seguinte feedback:\n"${draft.lastReviewFeedback}"\nCorrija todos os pontos apontados para garantir aprovação.`;
          }
          if (draft.adminDirective) {
            userPrompt += `\n📌 DIRECIONAMENTO DIRETO DO ADMINISTRADOR:\n"${draft.adminDirective}"\nSiga esta instrução com prioridade máxima.`;
          }

          const isOpenRouter = redatorAgent.model?.startsWith('openrouter:');
          let text = "";

          if (isOpenRouter) {
            if (!orApiKey) throw new Error("Chave de API do OpenRouter não configurada.");
            const orModelName = redatorAgent.model!.replace('openrouter:', '');
            const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: orApiKey });
            
            const response = await openai.chat.completions.create({
              model: orModelName,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ]
            });
            text = response.choices[0]?.message?.content || "";
          } else {
            if (!geminiKey) throw new Error("Chave de API do Gemini não configurada.");
            const genAI = new GoogleGenerativeAI(geminiKey);
            const aiModel = genAI.getGenerativeModel({
              model: redatorAgent.model?.replace("openrouter:", "") || 'gemini-1.5-pro',
              systemInstruction: systemPrompt,
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: SchemaType.OBJECT,
                  properties: {
                    title: { type: SchemaType.STRING },
                    excerpt: { type: SchemaType.STRING },
                    content: { type: SchemaType.STRING },
                    metaDescription: { type: SchemaType.STRING }
                  },
                  required: ["title", "excerpt", "content", "metaDescription"]
                }
              }
            });

            const result = await aiModel.generateContent(userPrompt);
            text = result.response.text();
          }

          // Sanitização ultra-robusta de JSON (extrai entre a primeira { e a última })
          let cleanJson = text.trim();
          const firstBrace = cleanJson.indexOf("{");
          const lastBrace = cleanJson.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
          }

          const parsedData = JSON.parse(cleanJson);
          const nextIteration = (draft.loopIteration || 0) + 1;

          // Atualizar o Banco
          await prisma.blogPost.update({
            where: { id: draft.id },
            data: {
              title: parsedData.title || draft.title,
              excerpt: parsedData.excerpt || draft.excerpt,
              content: parsedData.content || draft.content,
              metaDescription: parsedData.metaDescription || draft.metaDescription,
              status: "REVIEW", // Avança a esteira para revisão
              loopIteration: nextIteration,
              isProcessingAi: false
            }
          });

          // Registrar no Log de Auditoria
          await (prisma as any).agentLoopLog.create({
            data: {
              entityType: "BLOG_POST",
              entityId: draft.id,
              entityTitle: parsedData.title || draft.title,
              iteration: nextIteration,
              agentName: redatorAgent.name,
              action: "DRAFT_GENERATED",
              status: "IN_PROGRESS",
              feedback: `Rascunho gerado pelo agente redator (Iteração ${nextIteration}) e enviado para avaliação do revisor.`,
            }
          });

          draftsProcessed++;
          actionsPerformed++;
          console.log(`[MAESTRO] Sucesso! ${draft.title} movido para REVIEW.`);
        } catch (e: any) {
          console.error(`[MAESTRO] Falha ao processar rascunho ${draft.title}:`, e);
          await prisma.blogPost.update({ where: { id: draft.id }, data: { isProcessingAi: false } });
          return { success: false, message: `O agente falhou ao redigir o artigo "${draft.title}". Detalhes: ${e.message}`, step: "DRAFT" };
        }
      }
    }

    // ---------------------------------------------------------
    // PASSO 2: REVIEW -> IMAGES (Revisão com Qualidade & Trava)
    // ---------------------------------------------------------
    const stepReview = steps.find(s => s.triggerState === "REVIEW" && s.actionState === "IMAGES");
    
    if (stepReview && revisorAgent) {
      const reviews = await prisma.blogPost.findMany({
        where: { 
          status: "REVIEW",
          orchestrationStatus: { notIn: ["PAUSED", "AWAITING_ADMIN"] }
        },
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
        const currentIteration = rev.loopIteration || 1;
        console.log(`[MAESTRO] Revisando artigo: ${rev.title} (Iteração ${currentIteration})`);
        try {
          const systemPrompt = `
Você é o agente: ${revisorAgent.name}.
Papel: ${revisorAgent.role || "Revisor Técnico de SEO e Qualidade"}
Objetivo: ${revisorAgent.goal || "Revisar criticamente o artigo, corrigir erros e atribuir nota de qualidade."}
Regras Rígidas: ${revisorAgent.rules || "Não altere a estrutura básica."}
${revisorAgent.instructions ? `Instruções: ${revisorAgent.instructions}` : ""}

Seu formato de saída DEVE ser estritamente um JSON válido contendo:
{
  "score": 85,
  "feedback": "Justificativa da nota e o que pode melhorar",
  "content": "Conteúdo corrigido em HTML",
  "tags": "lista, de, palavras, chave, separadas, por, virgula"
}
Nota: Atribua um score inteiro de 0 a 100 baseado em clareza, relevância, formatação HTML e SEO. Scores iguais ou superiores a 80 aprovam o artigo.
`;

          let userPrompt = `
Revise criticamente este artigo e atribua uma nota de 0 a 100:
Título: ${rev.title}
Conteúdo HTML Atual: 
${rev.content}
`;

          if (rev.adminDirective) {
            userPrompt += `\n📌 DIRECIONAMENTO DIRETO DO ADMINISTRADOR:\n"${rev.adminDirective}"\nConsidere isso prioritário na sua revisão.`;
          }

          const isOpenRouter = revisorAgent.model?.startsWith('openrouter:');
          let text = "";

          if (isOpenRouter) {
            if (!orApiKey) throw new Error("Chave de API do OpenRouter não configurada.");
            const orModelName = revisorAgent.model!.replace('openrouter:', '');
            const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: orApiKey });
            
            const response = await openai.chat.completions.create({
              model: orModelName,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ]
            });
            text = response.choices[0]?.message?.content || "";
          } else {
            if (!geminiKey) throw new Error("Chave de API do Gemini não configurada.");
            const genAI = new GoogleGenerativeAI(geminiKey);
            const aiModel = genAI.getGenerativeModel({
              model: revisorAgent.model?.replace("openrouter:", "") || 'gemini-1.5-pro',
              systemInstruction: systemPrompt,
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: SchemaType.OBJECT,
                  properties: {
                    score: { type: SchemaType.INTEGER },
                    feedback: { type: SchemaType.STRING },
                    content: { type: SchemaType.STRING },
                    tags: { type: SchemaType.STRING }
                  },
                  required: ["score", "feedback", "content", "tags"]
                }
              }
            });

            const result = await aiModel.generateContent(userPrompt);
            text = result.response.text();
          }

          // Sanitização ultra-robusta de JSON (extrai entre a primeira { e a última })
          let cleanJson = text.trim();
          const firstBrace = cleanJson.indexOf("{");
          const lastBrace = cleanJson.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
          }

          const parsedData = JSON.parse(cleanJson);
          const score = typeof parsedData.score === 'number' ? parsedData.score : 80;
          const feedback = parsedData.feedback || "Revisão e checagem de qualidade concluídas.";
          const QUALITY_THRESHOLD = 80;
          const MAX_LOOPS = 3;

          if (score >= QUALITY_THRESHOLD) {
            // ==========================================
            // CENÁRIO A: QUALIDADE APROVADA (Score >= 80)
            // ==========================================
            await prisma.blogPost.update({
              where: { id: rev.id },
              data: {
                content: parsedData.content || rev.content,
                tags: parsedData.tags || rev.tags,
                status: "IMAGES", // Avança esteira para imagens
                qualityScore: score,
                lastReviewFeedback: feedback,
                orchestrationStatus: "AUTO_APPROVED",
                adminDirective: null, // Limpa diretiva após aprovação
                isProcessingAi: false
              }
            });

            await (prisma as any).agentLoopLog.create({
              data: {
                entityType: "BLOG_POST",
                entityId: rev.id,
                entityTitle: rev.title,
                iteration: currentIteration,
                agentName: revisorAgent.name,
                action: "QUALITY_CHECK",
                status: "APPROVED",
                score,
                feedback: `Aprovado com Score ${score}/100! ${feedback}`,
              }
            });

            reviewsProcessed++;
            actionsPerformed++;
            console.log(`[MAESTRO] Aprovado! Score ${score}/100. ${rev.title} movido para IMAGES.`);

          } else {
            // ==========================================
            // CENÁRIO B: SCORE INSUFICIENTE (< 80)
            // ==========================================
            if (currentIteration >= MAX_LOOPS) {
              // TRAVA DE SEGURANÇA: Limite de iterações atingido (Circuit Breaker)
              await prisma.blogPost.update({
                where: { id: rev.id },
                data: {
                  qualityScore: score,
                  lastReviewFeedback: feedback,
                  orchestrationStatus: "AWAITING_ADMIN", // Pausa automática
                  isProcessingAi: false
                }
              });

              await (prisma as any).agentLoopLog.create({
                data: {
                  entityType: "BLOG_POST",
                  entityId: rev.id,
                  entityTitle: rev.title,
                  iteration: currentIteration,
                  agentName: revisorAgent.name,
                  action: "ESCALATED_ADMIN",
                  status: "ESCALATED_ADMIN",
                  score,
                  feedback: `TRAVA DE SEGURANÇA: Limite de ${MAX_LOOPS} ciclos atingido com Score ${score}/100. Requer intervenção humana do Administrador. Feedback: ${feedback}`,
                }
              });

              console.warn(`[MAESTRO CIRCUIT BREAKER] Limite de ${MAX_LOOPS} ciclos atingido para '${rev.title}'. Escalado para o Administrador.`);
            } else {
              // Devolve para DRAFT para o Redator aperfeiçoar no próximo ciclo
              await prisma.blogPost.update({
                where: { id: rev.id },
                data: {
                  content: parsedData.content || rev.content,
                  tags: parsedData.tags || rev.tags,
                  status: "DRAFT", // Volta para redação
                  qualityScore: score,
                  lastReviewFeedback: feedback,
                  isProcessingAi: false
                }
              });

              await (prisma as any).agentLoopLog.create({
                data: {
                  entityType: "BLOG_POST",
                  entityId: rev.id,
                  entityTitle: rev.title,
                  iteration: currentIteration,
                  agentName: revisorAgent.name,
                  action: "REVIEW_ANALYSIS",
                  status: "NEEDS_REVISION",
                  score,
                  feedback: `Score ${score}/100 (mínimo ${QUALITY_THRESHOLD}). Devolvido ao Redator para correções. Feedback: ${feedback}`,
                }
              });

              console.log(`[MAESTRO] Reprovado com Score ${score}/100. Devolvido para DRAFT (Ciclo ${currentIteration}/${MAX_LOOPS}).`);
            }
          }
        } catch (e: any) {
          console.error(`[MAESTRO] Falha ao revisar artigo ${rev.title}:`, e);
          await prisma.blogPost.update({ where: { id: rev.id }, data: { isProcessingAi: false } });
          return { success: false, message: `O agente falhou ao revisar o artigo "${rev.title}". Detalhes: ${e.message}`, step: "REVIEW" };
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
      message: `Ciclo concluído. ${actionsPerformed} ação(ões) realizada(s).`,
      step: "GLOBAL",
      stepResults: {
        DRAFT: draftsProcessed > 0 ? `${draftsProcessed} artigo(s) redigido(s) e movido(s) para Revisão.` : "Nenhum rascunho processado.",
        REVIEW: reviewsProcessed > 0 ? `${reviewsProcessed} artigo(s) revisado(s) e movido(s) para Imagens.` : "Nenhum artigo revisado."
      }
    };

  } catch (error: any) {
    console.error("[MAESTRO] Erro crítico:", error);
    
    return { success: false, error: error.message, step: "GLOBAL" };
  } finally {
    // Garante que o status seja limpo independentemente de falhas ou retornos antecipados
    if (globalWorkflowId) {
      try {
        await prisma.automationWorkflow.update({
          where: { id: globalWorkflowId },
          data: { currentProcessingStep: null }
        });
      } catch (e) {
        console.error("[MAESTRO] Falha ao limpar status do workflow:", e);
      }
    }
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
        supervisorAgentId: data.supervisorAgentId,
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

