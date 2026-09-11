"use server";

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export async function suggestRelatedLinks(content: string, publishedPosts: { id: string; title: string }[], maxLinks: number) {
  try {
    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    if (!settings) throw new Error("Configurações não encontradas.");

    let provider = 'gemini';
    let apiKey = settings.geminiApiKey?.split(/\r?\n|,/)[0].trim() || '';
    let modelToUse = "gemini-1.5-flash";
    
    if (settings.openRouterApiKey) {
      provider = 'openrouter';
      apiKey = settings.openRouterApiKey;
      modelToUse = "openai/gpt-4o-mini";
    }

    if (!apiKey) throw new Error("API Key não configurada (Gemini ou OpenRouter).");

    const prompt = `Você é um especialista em SEO e Link Building.
O usuário está escrevendo um novo artigo para o blog.
Abaixo está o conteúdo (rascunho) do novo artigo:
"""
${content.substring(0, 5000)}...
"""

Aqui estão os artigos já publicados no blog (formato ID: Título):
${publishedPosts.map(p => `- ${p.id}: ${p.title}`).join('\n')}

Selecione no máximo ${maxLinks} artigos publicados que mais fazem sentido ser linkados como leitura complementar ("Leia também").
Retorne APENAS um array JSON contendo os IDs selecionados, sem formatação markdown ou texto extra. Exemplo: ["id1", "id2"]`;

    if (provider === 'openrouter') {
      const openai = new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
      const response = await openai.chat.completions.create({
        model: modelToUse,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.3,
      });
      const text = response.choices[0]?.message?.content || '[]';
      try {
        const jsonMatch = text.match(/\[(.*?)\]/s);
        if (jsonMatch) {
            return { success: true, data: JSON.parse(jsonMatch[0]) as string[] };
        }
        return { success: true, data: JSON.parse(text) as string[] };
      } catch {
        return { success: false, error: 'Erro ao fazer parse da IA.' };
      }
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelToUse });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 100 },
      });
      const text = result.response.text();
      try {
        const jsonMatch = text.match(/\[(.*?)\]/s);
        if (jsonMatch) {
            return { success: true, data: JSON.parse(jsonMatch[0]) as string[] };
        }
        return { success: true, data: JSON.parse(text) as string[] };
      } catch {
        return { success: false, error: 'Erro ao fazer parse da IA.' };
      }
    }
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Erro ao buscar sugestões.' };
  }
}
