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
  role?: string;
  goal?: string;
  rules?: string;
  permissions?: string;
  outputFormat?: string;
  knowledgeUrl?: string;
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

// ==========================================
// MEM0 CONTINUOUS MEMORY ENGINE (AÇÕES CRUD)
// ==========================================

export async function getAgentMemories(agentId: string) {
  try {
    const memories = await (prisma as any).agentMemory.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: memories };
  } catch (error: any) {
    console.error("Erro ao buscar memórias do agente:", error);
    return { success: false, error: "Falha ao buscar memórias." };
  }
}

export async function createAgentMemory(agentId: string, content: string, category: string = "diretriz") {
  try {
    const memory = await (prisma as any).agentMemory.create({
      data: {
        agentId,
        content: content.trim(),
        category,
        isActive: true,
      },
    });
    revalidatePath("/dashboard/admin/ia");
    return { success: true, data: memory };
  } catch (error: any) {
    console.error("Erro ao criar memória do agente:", error);
    return { success: false, error: "Falha ao criar memória." };
  }
}

export async function deleteAgentMemory(id: string) {
  try {
    await (prisma as any).agentMemory.delete({
      where: { id },
    });
    revalidatePath("/dashboard/admin/ia");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao deletar memória:", error);
    return { success: false, error: "Falha ao deletar memória." };
  }
}

export async function resetAgentMemories(agentId: string) {
  try {
    await (prisma as any).agentMemory.deleteMany({
      where: { agentId },
    });
    revalidatePath("/dashboard/admin/ia");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao resetar memórias do agente:", error);
    return { success: false, error: "Falha ao resetar memórias." };
  }
}

export async function extractMemoriesFromInteraction(agentId: string, userPrompt: string, assistantResponse: string) {
  try {
    if (!userPrompt || userPrompt.trim().length < 5) return;

    // Buscar memórias atuais para reconciliação
    const existing = await (prisma as any).agentMemory.findMany({
      where: { agentId, isActive: true },
    });

    const settings = await prisma.appSetting.findUnique({
      where: { id: "global" },
      select: { geminiApiKey: true }
    });

    const apiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const extractionPrompt = `Você é o curador de memória semântica contínua (estilo Mem0) de um agente de IA.
Sua função é analisar a mensagem do Administrador e a resposta do Agente para identificar novas diretrizes permanentes, preferências de estilo, correções ou restrições que o agente deve lembrar para sempre.

Regras importantes:
1. Extraia apenas orientações, preferências, estilos, restrições ou correções claras do Administrador.
2. Ignore cumprimentos simples, saudações triviais ou perguntas que não definem regras ("oi", "tudo bem?", "quantos posts temos").
3. Se a nova instrução CONTRADIZER ou SUBSTITUIR uma memória existente, identifique o ID da memória antiga em "deleteIds" para ser descartada/substituída.
4. Retorne estritamente um JSON no seguinte formato:
{
  "newMemories": [
    { "content": "descrição clara da regra/preferência", "category": "diretriz" | "estilo" | "fato" | "restricao" }
  ],
  "deleteIds": ["id_da_memoria_antiga_que_ficou_obsoleta"]
}

MEMÓRIAS ATUAIS DO AGENTE:
${JSON.stringify(existing.map((m: any) => ({ id: m.id, content: m.content, category: m.category })))}

MENSAGEM DO ADMINISTRADOR:
"""
${userPrompt}
"""

RESPOSTA DO AGENTE:
"""
${(assistantResponse || '').substring(0, 1000)}
"""`;

    const result = await model.generateContent(extractionPrompt);
    const text = result.response.text();
    if (!text) return;

    const parsed = JSON.parse(text);

    // Deletar obsoletas
    if (parsed.deleteIds && Array.isArray(parsed.deleteIds) && parsed.deleteIds.length > 0) {
      await (prisma as any).agentMemory.deleteMany({
        where: { id: { in: parsed.deleteIds } }
      });
      console.log(`[IA Mem0] Removidas ${parsed.deleteIds.length} memórias obsoletas.`);
    }

    // Inserir novas
    if (parsed.newMemories && Array.isArray(parsed.newMemories) && parsed.newMemories.length > 0) {
      for (const item of parsed.newMemories) {
        if (item.content && item.content.length > 5) {
          await (prisma as any).agentMemory.create({
            data: {
              agentId,
              content: item.content.trim(),
              category: item.category || "diretriz",
              isActive: true,
            }
          });
        }
      }
      console.log(`[IA Mem0] Adicionadas ${parsed.newMemories.length} novas memórias para o agente ${agentId}.`);
    }
  } catch (e: any) {
    console.warn("[IA Mem0 Extraction] Erro na extração de memória:", e.message);
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

export async function runAiAgentTest(agentId: string, userPrompt: string, history?: { role: 'user' | 'model', content: string }[], options?: { disableTools?: boolean, overrideSystemPrompt?: string }) {
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
    // Se disableTools=true, ignora as ferramentas do agente para evitar o erro
    // "Role 'function' is not supported" em chamadas do modal do blog.
    const googleTools: Tool[] = (!options?.disableTools && activeTools.length > 0) ? [{
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

    // Construir o System Prompt combinando V2 (role, goal, rules) e V1 (instructions)
    const promptParts: string[] = [];
    if (agent.role) promptParts.push(`PAPEL DO AGENTE:\n${agent.role}`);
    if (agent.goal) promptParts.push(`OBJETIVO PRINCIPAL:\n${agent.goal}`);
    if (agent.rules) promptParts.push(`REGRAS RÍGIDAS E GUARDRAILS:\n${agent.rules}`);
    if (agent.instructions) promptParts.push(`INSTRUÇÕES ADICIONAIS:\n${agent.instructions}`);
    
    // Buscar memórias ativas do agente (Mem0 Continuous Memory Engine)
    try {
      const agentMemories = await (prisma as any).agentMemory.findMany({
        where: { agentId: agent.id, isActive: true },
        orderBy: { createdAt: "desc" },
        take: 20
      });
      if (agentMemories && agentMemories.length > 0) {
        promptParts.push(`MEMÓRIAS APRENDIDAS E DIRETRIZES DO ADMINISTRADOR (MEM0 ENGINE):\n${agentMemories.map((m: any) => `- [${m.category.toUpperCase()}] ${m.content}`).join("\n")}`);
      }
    } catch (memErr) {
      console.warn("[IA Memória] Falha ao carregar memórias:", memErr);
    }

    if (activeTools.length > 0) {
      promptParts.push(`FERRAMENTAS HABILITADAS:\nVocê possui ferramentas nativas ativas (${activeTools.map(t => t.name).join(', ')}). Quando o usuário solicitar informações do banco, estatísticas ou ações do sistema, acione OBRIGATORIAMENTE as ferramentas correspondentes.`);
    }

    const finalSystemPrompt = options?.overrideSystemPrompt || (promptParts.length > 0 ? promptParts.join("\n\n") : "Você é um assistente útil da Plataforma Senra.");

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
      messages.push({ role: "system", content: finalSystemPrompt });
      
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
        
        const responseContent = response.choices[0]?.message?.content || "";
        
        // Dispara extração de aprendizado e memória (Mem0 Engine) em background
        extractMemoriesFromInteraction(agent.id, userPrompt, responseContent).catch(err => {
          console.warn("[IA Mem0 Extraction Error]:", err);
        });

        return {
          success: true,
          response: responseContent,
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
          systemInstruction: finalSystemPrompt,
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

            // Validar Permissões de Ação (RBAC/CRUD) do Agente
            let agentPermissions = { read: true, create: true, update: true, delete: false, publish: false };
            try {
              if (agent.permissions) {
                agentPermissions = typeof agent.permissions === 'string' ? JSON.parse(agent.permissions) : agent.permissions;
              }
            } catch (e) {}

            const requiredAction = tool.actionType || 'read';
            if (!(agentPermissions as any)[requiredAction]) {
              console.warn(`[IA PERMISSÕES] Ação '${requiredAction}' bloqueada para o agente ${agent.name}`);
              functionResponses.push({
                functionResponse: { 
                  name: call.name, 
                  response: { error: `Ação bloqueada: O agente não possui permissão de '${requiredAction.toUpperCase()}' ativada nas suas configurações.` } 
                }
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

        const responseText = response.text();

        // Dispara extração de aprendizado e memória (Mem0 Engine) em background
        extractMemoriesFromInteraction(agent.id, userPrompt, responseText).catch(err => {
          console.warn("[IA Mem0 Extraction Error]:", err);
        });

        return {
          success: true,
          response: responseText,
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

export async function getBlogAgentDefaults() {
  try {
    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    return { 
      success: true, 
      data: {
        blogRedatorAgentId: settings?.blogRedatorAgentId || null,
        blogRevisorAgentId: settings?.blogRevisorAgentId || null,
        blogAuditorAgentId: settings?.blogAuditorAgentId || null
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setBlogAgentDefaults(mode: 'DRAFT' | 'REVIEW' | 'AUDITOR', agentId: string) {
  try {
    const data: any = {};
    if (mode === 'DRAFT') data.blogRedatorAgentId = agentId;
    if (mode === 'REVIEW') data.blogRevisorAgentId = agentId;
    if (mode === 'AUDITOR') data.blogAuditorAgentId = agentId;
    
    await prisma.appSetting.upsert({
      where: { id: "global" },
      update: data,
      create: {
        id: "global",
        ...data
      }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
