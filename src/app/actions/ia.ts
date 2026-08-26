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

// ============================================================
// Execução do Agente IA — usando SDK nativo do Google Generative AI
// A chave é buscada do banco a cada chamada, nunca fica em process.env
// ============================================================
import { GoogleGenerativeAI, Tool, FunctionDeclaration, SchemaType } from "@google/generative-ai";

// Mapeia os tipos Zod básicos para o SchemaType do Google AI SDK
function zodToGoogleSchema(schema: any): any {
  if (!schema || !schema._def) return { type: SchemaType.STRING };
  const typeName = schema._def.typeName;

  if (typeName === "ZodString") return { type: SchemaType.STRING };
  if (typeName === "ZodNumber") return { type: SchemaType.NUMBER };
  if (typeName === "ZodBoolean") return { type: SchemaType.BOOLEAN };
  if (typeName === "ZodArray") return { type: SchemaType.ARRAY, items: zodToGoogleSchema(schema._def.type) };
  if (typeName === "ZodOptional") return zodToGoogleSchema(schema._def.innerType);
  if (typeName === "ZodEnum") return { type: SchemaType.STRING, enum: schema._def.values };
  if (typeName === "ZodObject") {
    const shape = schema._def.shape();
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const [key, val] of Object.entries(shape)) {
      const fieldSchema = val as any;
      const isOptional = fieldSchema._def?.typeName === "ZodOptional";
      properties[key] = zodToGoogleSchema(isOptional ? fieldSchema._def.innerType : fieldSchema);
      if (properties[key].description === undefined && fieldSchema._def?.description) {
        properties[key].description = fieldSchema._def.description;
      }
      if (!isOptional) required.push(key);
    }
    return { type: SchemaType.OBJECT, properties, required: required.length > 0 ? required : undefined };
  }
  return { type: SchemaType.STRING };
}

export async function runAiAgentTest(agentId: string, userPrompt: string) {
  let agentRef: any = null;
  try {
    const agent = await prisma.aiAgent.findUnique({ where: { id: agentId } });
    if (!agent) return { success: false, error: "Agente não encontrado." };
    agentRef = agent;

    // Buscar a chave diretamente do banco — sem tocar em process.env
    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    const apiKey = settings?.geminiApiKey;

    if (!apiKey) {
      return { 
        success: false, 
        error: "Chave de API do Google (Gemini) não configurada. Vá em Configurações → Integrações e adicione sua chave do Google AI Studio." 
      };
    }

    // Instanciar o cliente com a chave do banco (escopo local, descartado após a requisição)
    const genAI = new GoogleGenerativeAI(apiKey);

    // Resolver as ferramentas habilitadas para o agente
    const enabledToolIds: string[] = typeof agent.tools === 'string' 
      ? JSON.parse(agent.tools || "[]") 
      : (agent.tools as string[] || []);

    const toolGroupMap: Record<string, string[]> = {
      'crm': ['searchLeads', 'createLead', 'updateLead'],
      'moveLead': ['moveLead'],
      'blog': ['generateBlogPost'],
      'searchBlogPosts': ['searchBlogPosts'],
      'webSearch': ['webSearch'],
      'stats': ['getSystemStats'],
      'email': ['sendEmail'],
    };

    // Importar allTools apenas para obter os schemas Zod de cada ferramenta
    const { allTools } = await import("@/lib/ai/tools");
    const activeTools = allTools.filter(t => {
      for (const id of enabledToolIds) {
        if (toolGroupMap[id]?.includes(t.name) || t.name === id) return true;
      }
      return false;
    });

    // Converter ferramentas Genkit para o formato do Google AI SDK
    const googleTools: Tool[] = activeTools.length > 0 ? [{
      functionDeclarations: activeTools.map(t => {
        const decl: FunctionDeclaration = {
          name: t.name,
          description: (t as any).description || t.name,
        };
        const inputSchema = (t as any).inputSchema;
        if (inputSchema) {
          decl.parameters = zodToGoogleSchema(inputSchema) as any;
        }
        return decl;
      })
    }] : [];

    // Normalizar nome do modelo (remover prefixo 'googleai/' se existir)
    const modelName = agent.model.replace(/^googleai\//, '');

    console.log(`[IA] Agente: ${agent.name} | Modelo: ${modelName} | Ferramentas: ${activeTools.map(t => t.name).join(', ') || 'nenhuma'}`);

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: agent.instructions || "Você é um assistente útil da Plataforma Senra.",
      ...(googleTools.length > 0 ? { tools: googleTools } : {}),
    });

    // Suporte a agentic loop (tool calls)
    const chat = model.startChat();
    let result = await chat.sendMessage(userPrompt);
    let response = result.response;
    const toolCallsMade: { name: string; args: any; result: any }[] = [];
    
    // Processar chamadas de ferramentas (até 5 iterações para evitar loop infinito)
    for (let i = 0; i < 5; i++) {
      const functionCalls = response.functionCalls();
      if (!functionCalls || functionCalls.length === 0) break;

      const functionResponses = [];
      for (const call of functionCalls) {
        const tool = activeTools.find(t => t.name === call.name);
        if (!tool) {
          functionResponses.push({
            functionResponse: { name: call.name, response: { error: "Ferramenta não encontrada." } }
          });
          continue;
        }
        try {
          const toolResult = await tool.execute(call.args);
          toolCallsMade.push({ name: call.name, args: call.args, result: toolResult });
          
          const responsePayload = (toolResult !== null && typeof toolResult === 'object' && !Array.isArray(toolResult))
            ? toolResult
            : { items: toolResult };

          functionResponses.push({
            functionResponse: { name: call.name, response: responsePayload }
          });
        } catch (toolErr: any) {
          functionResponses.push({
            functionResponse: { name: call.name, response: { error: toolErr.message } }
          });
        }
      }

      result = await chat.sendMessage(functionResponses as any);
      response = result.response;
    }

    return {
      success: true,
      response: response.text(),
      toolCalls: toolCallsMade.map(tc => ({ name: tc.name, args: tc.args })),
    };

  } catch (error: any) {
    console.error("[IA ERRO]", error);
    let errorMsg = error.message || "Falha ao executar o agente.";
    
    if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota")) {
      errorMsg = "Limite de cota atingido (429). Sua chave de API atingiu o limite gratuito. Habilite o faturamento no Google AI Studio.";
    } else if (errorMsg.includes("404") || errorMsg.toLowerCase().includes("not found")) {
      errorMsg = `Erro 404 da API: ${error.message} (Modelo tentado: ${modelName})`;
    } else if (errorMsg.toLowerCase().includes("api key") || errorMsg.toLowerCase().includes("api_key") || errorMsg.includes("403")) {
      errorMsg = "Chave de API inválida ou sem permissão. Verifique sua chave do Google AI Studio em Configurações.";
    } else {
      errorMsg = `Erro na API do Google: ${error.message}`;
    }
    return { success: false, error: errorMsg };
  }
}
