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
        model: data.model || "gemini-2.0-flash",
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

import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import openAI from "genkitx-openai";
import anthropic from "genkitx-anthropic";
import { allTools } from "@/lib/ai/tools";

export async function runAiAgentTest(agentId: string, prompt: string) {
  try {
    const agent = await prisma.aiAgent.findUnique({ where: { id: agentId } });
    if (!agent) return { success: false, error: "Agente não encontrado." };

    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    
    // Normalização robusta do nome do modelo para decidir qual plugin carregar
    let modelName = agent.model;
    const plugins = [];

    if (modelName.includes('gemini') || !modelName.includes('/')) {
      if (!modelName.includes('/')) modelName = `googleai/${modelName}`;
      plugins.push(googleAI({ apiKey: settings?.geminiApiKey || process.env.GOOGLE_GENAI_API_KEY }));
    } else if (modelName.startsWith('openai/') || modelName.includes('gpt')) {
      if (!modelName.includes('/')) modelName = `openai/${modelName}`;
      plugins.push(openAI({ apiKey: settings?.openaiApiKey || process.env.OPENAI_API_KEY }));
    } else if (modelName.startsWith('anthropic/') || modelName.includes('claude')) {
      if (!modelName.includes('/')) modelName = `anthropic/${modelName}`;
      plugins.push(anthropic({ apiKey: settings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY }));
    }

    // Inicialização dinâmica do Genkit apenas com o plugin necessário
    const localAi = genkit({ plugins });

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

    const response = await localAi.generate({
      model: modelName,
      system: agent.instructions || "Você é um assistente útil.",
      prompt: prompt,
      tools: finalTools,
    });

    return { 
      success: true, 
      response: response.text,
      toolCalls: response.toolCalls?.map(tc => ({ name: tc.name, args: tc.args }))
    };
  } catch (error: any) {
    console.error("ERRO CRÍTICO NO AGENTE DE IA:", error);
    let errorMsg = error.message || "Falha ao testar agente.";
    if (errorMsg.includes("429") || errorMsg.includes("quota exceeded")) {
      errorMsg = "Limite de cota atingido (429). Dica: Tente usar o modelo 'gemini-1.5-flash', que possui limites maiores no plano gratuito.";
    }
    return { success: false, error: errorMsg };
  }
}
