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

export async function fetchOpenRouterModels() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao buscar modelos");
    const data = await res.json();
    return { success: true, data: data.data };
  } catch (error) {
    console.error("Erro ao buscar modelos OpenRouter:", error);
    return { success: false, error: "Falha ao carregar modelos." };
  }
}

// ============================================================
// Execução do Agente IA — usando SDK nativo do Google Generative AI
// A chave é buscada do banco a cada chamada, nunca fica em process.env
// ============================================================
import { GoogleGenerativeAI, Tool, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import OpenAI from "openai";

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

export async function runAiAgentTest(agentId: string, userPrompt: string, history?: { role: 'user' | 'model', content: string }[]) {
  let agentRef: any = null;
  let modelName = '';
  const startTime = Date.now();
  try {
    const agent = await prisma.aiAgent.findUnique({ where: { id: agentId } });
    if (!agent) return { success: false, error: "Agente não encontrado." };
    agentRef = agent;

    // Normalizar nome do modelo aqui (fora do escopo interno) para o catch poder ler
    modelName = (agent.model || 'gemini-3.6-flash').replace(/^googleai\//, '');

    // Buscar a chave diretamente do banco — sem tocar em process.env
    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    const rawApiKey = settings?.geminiApiKey || "";
    const apiKeys = rawApiKey.split(/\r?\n|,/).map(k => k.trim()).filter(k => k.length > 0);

    if (apiKeys.length === 0) {
      return { 
        success: false, 
        error: "Chave de API do Google (Gemini) não configurada. Vá em Configurações → Integrações e adicione sua chave do Google AI Studio." 
      };
    }

    // Resolver as ferramentas habilitadas para o agente (fora do loop)
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

    console.log(`[IA] Agente: ${agent.name} | Modelo: ${modelName} | Ferramentas: ${activeTools.map(t => t.name).join(', ') || 'nenhuma'}`);

    // Converter histórico para o formato do SDK se fornecido
    const sdkHistory = (history || []).map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));

    const isOpenRouter = agent.model?.startsWith('openrouter:');
    
    if (isOpenRouter) {
      const orModelName = agent.model!.replace('openrouter:', '');
      const orApiKey = settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
      
      if (!orApiKey) {
        return { success: false, error: "Chave de API do OpenRouter não configurada nas Integrações. Vá em Configurações e adicione sua chave." };
      }
      
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: orApiKey,
      });

      const messages: any[] = [];
      if (agent.instructions) {
        messages.push({ role: "system", content: agent.instructions });
      }
      
      if (history) {
        for (const h of history) {
          messages.push({ role: h.role === 'model' ? 'assistant' : 'user', content: h.content });
        }
      }
      messages.push({ role: "user", content: userPrompt });

      try {
        console.log(`[IA] Executando via OpenRouter | Modelo: ${orModelName}`);
        const response = await openai.chat.completions.create({
          model: orModelName,
          messages: messages,
        });
        
        return {
          success: true,
          response: response.choices[0]?.message?.content || "",
          toolCalls: [],
          executionTimeMs: Date.now() - startTime,
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            candidatesTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
          }
        };
      } catch (err: any) {
        console.error("[IA OpenRouter Error]", err);
        return { success: false, error: "Erro na API do OpenRouter: " + (err.message || "Desconhecido") };
      }
    }

    // === INÍCIO DO POOL DE CHAVES (API KEY ROTATION NATIVO GEMINI) ===
    let lastError: any = null;
    let lastErrorMsg = "";

    for (let i = 0; i < apiKeys.length; i++) {
      const currentKey = apiKeys[i];
      try {
        console.log(`[IA] Tentando execução com a chave API #${i + 1}...`);
        
        // Instanciar o cliente com a chave atual do loop
        const genAI = new GoogleGenerativeAI(currentKey);
        
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: agent.instructions || "Você é um assistente útil da Plataforma Senra.",
          ...(googleTools.length > 0 ? { tools: googleTools } : {}),
        });

        // Suporte a agentic loop (tool calls)
        const chat = model.startChat({ history: sdkHistory });
        let result = await chat.sendMessage(userPrompt);
        let response = result.response;
        const toolCallsMade: { name: string; args: any; result: any }[] = [];
        
        // Processar chamadas de ferramentas (até 5 iterações para evitar loop infinito)
        for (let j = 0; j < 5; j++) {
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

        const executionTimeMs = Date.now() - startTime;
        const usage = response.usageMetadata ? {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          candidatesTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        } : null;

        console.log(`[IA] Sucesso com a chave API #${i + 1}!`);

        return {
          success: true,
          response: response.text(),
          toolCalls: toolCallsMade.map(tc => ({ name: tc.name, args: tc.args, result: tc.result })),
          executionTimeMs,
          usage,
        };

      } catch (error: any) {
        lastError = error;
        lastErrorMsg = error.message || "Falha ao executar o agente.";
        
        const isRateLimit = lastErrorMsg.includes("429") || lastErrorMsg.toLowerCase().includes("quota") || lastErrorMsg.includes("503");
        
        console.warn(`[IA ERRO] Falha com a chave #${i + 1}: ${lastErrorMsg}`);
        
        if (isRateLimit && i < apiKeys.length - 1) {
          console.log(`[IA] Limite atingido na chave #${i + 1}. Rotacionando para a chave #${i + 2}...`);
          continue; // Tenta a próxima chave
        } else {
          // Erro fatal (ex: 404, 403) ou acabaram as chaves do pool
          break;
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    console.error("[IA ERRO FATAL] Todas as tentativas falharam ou ocorreu erro fatal.", lastError);
    
    let errorMsg = lastErrorMsg;
    if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota")) {
      errorMsg = "Limite de cota atingido (429) em todas as chaves cadastradas. Cadastre novas chaves no Google AI Studio.";
    } else if (errorMsg.includes("404") || errorMsg.toLowerCase().includes("not found")) {
      errorMsg = `Erro 404 da API: ${errorMsg} (Modelo tentado: ${modelName})`;
    } else if (errorMsg.toLowerCase().includes("api key") || errorMsg.toLowerCase().includes("api_key") || errorMsg.includes("403")) {
      errorMsg = "Chave de API inválida ou sem permissão. Verifique suas chaves do Google AI Studio em Configurações.";
    } else {
      errorMsg = `Erro na API do Google: ${errorMsg}`;
    }
    
    return { success: false, error: errorMsg };

  } catch (error: any) {
    console.error("[IA ERRO GERAL]", error);
    return { success: false, error: error.message || "Erro desconhecido." };
  }
}
