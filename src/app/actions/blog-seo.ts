"use server";

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export async function generateSeoSuggestion(content: string, type: 'title' | 'cover' | 'excerpt') {
  try {
    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    if (!settings) throw new Error("Configurações não encontradas.");

    let provider = 'gemini';
    let apiKey = settings.geminiApiKey?.split(/\r?\n|,/)[0].trim() || '';
    
    // Prioriza OpenRouter se existir, pois modelos como gpt-4o-mini/claude-3-haiku são ótimos para seguir instruções curtas
    if (settings.openRouterApiKey) {
      provider = 'openrouter';
      apiKey = settings.openRouterApiKey;
    }

    if (!apiKey) throw new Error("Nenhuma chave de API configurada no painel de Integrações.");

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

    if (provider === 'openrouter') {
      const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey });
      const res = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini", // rápido e excelente em JSON e instruções curtas
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      });
      responseText = res.choices[0].message.content || "";
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: systemPrompt });
      const res = await model.generateContent(userMessage);
      responseText = res.response.text();
    }

    const cleanText = responseText.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();

    return { success: true, data: cleanText };

  } catch (error: any) {
    console.error("[SEO ASSISTANT ERRO]", error);
    return { success: false, error: error.message || "Falha na geração com IA." };
  }
}
