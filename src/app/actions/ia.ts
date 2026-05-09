"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAiAgents() {
  try {
    const agents = await prisma.aiAgent.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: agents };
  } catch (error) {
    console.error("Erro ao buscar agentes de IA:", error);
    return { success: false, error: "Falha ao carregar agentes." };
  }
}

export async function createAiAgent(data: {
  name: string;
  description?: string;
  instructions?: string;
  model?: string;
  tools?: string;
}) {
  try {
    const agent = await prisma.aiAgent.create({
      data: {
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        model: data.model || "gemini-2.5-flash-preview-04-17",
        tools: data.tools || "[]",
      },
    });
    revalidatePath("/dashboard/admin/ia");
    return { success: true, data: agent };
  } catch (error) {
    console.error("Erro ao criar agente de IA:", error);
    return { success: false, error: "Falha ao criar agente." };
  }
}

export async function updateAiAgent(id: string, data: {
  name?: string;
  description?: string;
  instructions?: string;
  model?: string;
  tools?: string;
  status?: string;
}) {
  try {
    const agent = await prisma.aiAgent.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/admin/ia");
    return { success: true, data: agent };
  } catch (error) {
    console.error("Erro ao atualizar agente de IA:", error);
    return { success: false, error: "Falha ao atualizar agente." };
  }
}

export async function deleteAiAgent(id: string) {
  try {
    await prisma.aiAgent.delete({
      where: { id },
    });
    revalidatePath("/dashboard/admin/ia");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar agente de IA:", error);
    return { success: false, error: "Falha ao deletar agente." };
  }
}

export async function getAvailableProviders() {
  try {
    const settings = await prisma.appSetting.findUnique({
      where: { id: "global" },
      select: {
        geminiApiKey: true,
        openaiApiKey: true,
        anthropicApiKey: true,
        openRouterApiKey: true,
        minimaxApiKey: true,
        grokApiKey: true,
      }
    });

    if (!settings) return { success: true, data: [] };

    const providers = [];
    if (settings.geminiApiKey) providers.push("gemini");
    if (settings.openaiApiKey) providers.push("openai");
    if (settings.anthropicApiKey) providers.push("anthropic");
    if (settings.openRouterApiKey) providers.push("openrouter");
    if (settings.minimaxApiKey) providers.push("minimax");
    if (settings.grokApiKey) providers.push("grok");

    return { success: true, data: providers };
  } catch (error) {
    console.error("Erro ao buscar provedores disponíveis:", error);
    return { success: false, error: "Falha ao carregar provedores." };
  }
}

import { ai } from "@/ai/genkit";
import { allTools } from "@/lib/ai/tools";

export async function runAiAgentTest(agentId: string, prompt: string) {
  try {
    const agent = await prisma.aiAgent.findUnique({ where: { id: agentId } });
    if (!agent) return { success: false, error: "Agente não encontrado." };

    // Injetar a chave do Google AI dinamicamente (buscando do banco de dados)
    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    if (settings?.geminiApiKey) {
      process.env.GOOGLE_GENAI_API_KEY = settings.geminiApiKey;
    }

    if (!process.env.GOOGLE_GENAI_API_KEY) {
      return { success: false, error: "Chave de API do Google (Gemini) não configurada. Vá em Configurações e adicione sua GOOGLE_GENAI_API_KEY." };
    }

    const enabledToolIds = typeof agent.tools === 'string' ? JSON.parse(agent.tools || "[]") : (agent.tools || []);
    
    const toolMapping: Record<string, string[]> = {
      'crm': ['searchLeads', 'createLead', 'updateLead'],
      'moveLead': ['moveLead'],
      'blog': ['generateBlogPost'],
      'searchBlogPosts': ['searchBlogPosts'],
      'webSearch': ['webSearch'],
      'stats': ['getSystemStats'],
      'email': ['sendEmail'],
    };

    const finalTools = allTools.filter(t => {
      for (const id of enabledToolIds) {
        if (toolMapping[id]?.includes(t.name) || t.name === id) return true;
      }
      return false;
    });

    // Normalizar o nome do modelo para o formato do Genkit: 'googleai/nome-do-modelo'
    let modelName = agent.model;
    if (!modelName.includes('/')) {
      modelName = `googleai/${modelName}`;
    }

    console.log(`[IA] Agente: ${agent.name} | Modelo: ${modelName} | Ferramentas: ${finalTools.map(t => t.name).join(', ') || 'nenhuma'}`);

    const response = await ai.generate({
      model: modelName,
      system: agent.instructions || "Você é um assistente útil da Plataforma Senra.",
      prompt: prompt,
      tools: finalTools,
    });

    return { 
      success: true, 
      response: response.text,
      toolCalls: response.toolCalls?.map(tc => ({ name: tc.name, args: tc.args }))
    };
  } catch (error: any) {
    console.error("[IA ERRO]", error);
    let errorMsg = error.message || "Falha ao testar agente.";
    if (errorMsg.includes("429") || errorMsg.includes("quota exceeded")) {
      errorMsg = "Limite de cota atingido (429). Sua chave de API atingiu o limite gratuito. Considere habilitar o faturamento no Google AI Studio.";
    } else if (errorMsg.includes("404") || errorMsg.includes("not found")) {
      errorMsg = `Modelo '${error.message?.match(/models\/([^:]+)/)?.[1] || agent?.model}' não encontrado. Por favor, selecione um modelo Gemini 2.5 nas configurações do agente.`;
    } else if (errorMsg.includes("API key") || errorMsg.includes("GOOGLE_GENAI_API_KEY")) {
      errorMsg = "Chave de API inválida ou não configurada. Vá em Configurações e verifique sua chave do Google AI.";
    }
    return { success: false, error: errorMsg };
  }
}
