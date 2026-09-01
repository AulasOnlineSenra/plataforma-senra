"use server";

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export async function generateSeoSuggestion(content: string, type: 'title' | 'cover' | 'excerpt', agentId?: string) {
  try {
    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    if (!settings) throw new Error("Configurações não encontradas.");

    let provider = 'gemini';
    let apiKey = settings.geminiApiKey?.split(/\r?\n|,/)[0].trim() || '';
    let modelToUse = "gemini-1.5-flash"; // Default fallback
    
    // Prioriza OpenRouter se existir, a menos que o agente force o gemini
    if (settings.openRouterApiKey) {
      provider = 'openrouter';
      apiKey = settings.openRouterApiKey;
      modelToUse = "openai/gpt-4o-mini";
    }

    if (!apiKey) throw new Error("Nenhuma chave de API configurada no painel de Integrações.");

    // Se o usuário passou um agentId (salvo no localStorage), pegamos qual modelo aquele agente usa
    if (agentId) {
      const agent = await prisma.aiAgent.findUnique({ where: { id: agentId }, select: { model: true } });
      if (agent && agent.model) {
        if (agent.model.startsWith("openrouter:")) {
          provider = "openrouter";
          modelToUse = agent.model.replace("openrouter:", "");
          apiKey = settings.openRouterApiKey || "";
        } else if (agent.model.startsWith("googleai/")) {
          provider = "gemini";
          modelToUse = agent.model.replace("googleai/", "");
          apiKey = settings.geminiApiKey?.split(/\r?\n|,/)[0].trim() || "";
        } else {
          // Fallback assumindo gemini
          provider = "gemini";
          modelToUse = agent.model;
          apiKey = settings.geminiApiKey?.split(/\r?\n|,/)[0].trim() || "";
        }
      }
    }

    if (!apiKey) {
      // Se o provedor escolhido não tem chave, tentamos o outro como fallback de emergência
      if (provider === 'gemini' && settings.openRouterApiKey) {
        provider = 'openrouter';
        apiKey = settings.openRouterApiKey;
        modelToUse = "openai/gpt-4o-mini";
      } else if (provider === 'openrouter' && settings.geminiApiKey) {
        provider = 'gemini';
        apiKey = settings.geminiApiKey.split(/\r?\n|,/)[0].trim();
        modelToUse = "gemini-1.5-flash";
      } else {
        throw new Error(`A chave de API para o provedor selecionado (${provider}) não está configurada.`);
      }
    }

    let systemPrompt = "";
    if (type === 'title') {
      systemPrompt = `Você é um especialista em Copywriting e SEO. Crie 3 opções de Títulos extremamente clicáveis (virais e otimizados para busca) para este artigo.
Retorne APENAS os 3 títulos, um por linha, estritamente separados por quebra de linha dupla. Sem numeração, sem aspas, sem marcadores (bullet points).
Exemplo de saída:
Como Estudar para o ENEM em 2026

O Guia Definitivo do ENEM 2026

Passe no ENEM: Dicas de Ouro`;
    } else if (type === 'excerpt') {
      systemPrompt = `Você é um especialista em SEO. Escreva UMA ÚNICA meta description (resumo) para o artigo.
Regras:
- MÁXIMO absoluto de 160 caracteres. Seja conciso e direto.
- Use gatilhos de curiosidade para gerar cliques (CTR alto) no Google.
- Retorne APENAS o texto do resumo, sem aspas, sem prefixos, sem a palavra "Resumo:".`;
    } else if (type === 'cover') {
      systemPrompt = `Você é um Diretor de Arte e Especialista em Acessibilidade. Leia o artigo e crie o cenário para a imagem de capa.
Devolva ESTRITAMENTE um JSON válido no seguinte formato:
{
  "prompt": "Prompt em INGLÊS mega detalhado para Midjourney/Flux. Descreva o sujeito, ação, iluminação (neon, natural, cinematic), estilo (hyper-realistic, photography) e ambiente.",
  "alt": "Texto alternativo em PORTUGUÊS (descrevendo literalmente e de forma seca o que tem na imagem) para pontuar no SEO do Google Imagens."
}
Não coloque \`\`\`json ou qualquer outro texto antes ou depois. APENAS o objeto JSON.`;
    }

    // Limitamos o texto para não estourar tokens e ir direto ao ponto
    const userMessage = `Conteúdo do Artigo (baseie-se apenas nisto):\n\n${content.substring(0, 3000)}`;

    let responseText = "";

    const executeOpenRouter = async (key: string, model: string) => {
      const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: key });
      const res = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      });
      return res.choices[0].message.content || "";
    };

    const executeGemini = async (key: string, model: string) => {
      const genAI = new GoogleGenerativeAI(key);
      const aiModel = genAI.getGenerativeModel({ model: model, systemInstruction: systemPrompt });
      const res = await aiModel.generateContent(userMessage);
      return res.response.text();
    };

    try {
      if (provider === 'openrouter') {
        responseText = await executeOpenRouter(apiKey, modelToUse);
      } else {
        responseText = await executeGemini(apiKey, modelToUse);
      }
    } catch (primaryError: any) {
      console.warn(`[SEO] Falha no provedor primário (${provider}):`, primaryError.message);
      
      // FALLBACK AUTOMÁTICO PARA O PROVEDOR SECUNDÁRIO SE O PRIMEIRO FALHAR (ex: limite de cota, chave inválida)
      try {
        if (provider === 'gemini' && settings.openRouterApiKey) {
          console.log(`[SEO] Tentando fallback para OpenRouter...`);
          responseText = await executeOpenRouter(settings.openRouterApiKey, "openai/gpt-4o-mini");
        } else if (provider === 'openrouter' && settings.geminiApiKey) {
          console.log(`[SEO] Tentando fallback para Gemini...`);
          const fallbackKey = settings.geminiApiKey.split(/\r?\n|,/)[0].trim();
          responseText = await executeGemini(fallbackKey, "gemini-1.5-flash");
        } else {
          throw primaryError; // Se não tem chave secundária, repassa o erro original
        }
      } catch (fallbackError: any) {
        console.error(`[SEO] Fallback também falhou:`, fallbackError.message);
        throw primaryError; // Mostra o erro do provedor principal para o usuário
      }
    }

    const cleanText = responseText.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();

    return { success: true, data: cleanText };

  } catch (error: any) {
    console.error("[SEO ASSISTANT ERRO]", error);
    return { success: false, error: error.message || "Falha na geração com IA." };
  }
}
