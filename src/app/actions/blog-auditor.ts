"use server";

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export async function auditBlogText(content: string, agentId: string) {
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

    if (!apiKey) throw new Error("API Key não configurada.");

    const cleanContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanContent) throw new Error("Conteúdo vazio.");

    const systemPrompt = `Você é um Auditor Especialista em Detecção de Texto Sintético (IA). Sua missão é ler o artigo fornecido e avaliá-lo rigorosamente usando um framework de 13 etapas.

REGRA CRÍTICA: Você NÃO PODE pular nenhuma etapa. Você deve avaliar cada um dos 13 critérios de forma independente. Para cada critério, primeiro escreva a sua análise (citando trechos do texto) e depois atribua uma nota de 0 a 10 (onde 0 = Completamente humano, sem indícios daquela falha, e 10 = Fortíssimo indício de IA).

O framework de 13 etapas é:
1. Ritmo e naturalidade das frases (regularidade excessiva de ritmo)
2. Repetição de estruturas, palavras e padrões sintáticos (fórmulas estruturais recorrentes)
3. Excesso ou uso padronizado de conectivos e marcadores discursivos ("portanto", "nesse sentido")
4. Frases excessivamente equilibradas, simétricas ou previsíveis ("não apenas X, mas também Y")
5. Generalizações, abstrações e enchimento sem exemplos concretos
6. Profundidade real versus aparência de profundidade (cita conceitos mas não os aprofunda)
7. Escolhas vocabulares artificiais ou excessivamente sofisticadas ("teia", "jornada", "multifacetado")
8. Variação nula no tamanho de frases e parágrafos
9. Ausência de pequenas imperfeições naturais ou voz autoral individual
10. Padrões clichês de introdução e conclusão (sanduíche argumentativo)
11. Mudanças bruscas ou inconsistências de estilo (texto híbrido)
12. Sinais de texto humano polido/expandido artificialmente pela IA
13. Identificação de outros trechos genéricos suspeitos que levantam suspeita de IA

Sua resposta DEVE ser EXCLUSIVAMENTE um objeto JSON com a seguinte estrutura estrita:
{
  "analises": [
    {
      "etapa": 1,
      "nome": "Ritmo e naturalidade das frases",
      "analise": "sua justificativa detalhada aqui...",
      "trechos_suspeitos": ["trecho citado 1", "trecho citado 2"],
      "nota_ia": 5
    }
  ]
}
Nota: Certifique-se de que o array 'analises' tenha exatos 13 itens.`;

    const userMessage = `Artigo a ser auditado:\n\n${cleanContent.substring(0, 10000)}`;

    if (provider === 'openrouter') {
      const openai = new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
      const response = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });
      const text = response.choices[0]?.message?.content || '{}';
      try {
        const data = JSON.parse(text);
        return { success: true, data };
      } catch (err) {
        return { success: false, error: 'Erro ao fazer parse do JSON do auditor.' };
      }
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: modelToUse, 
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 } 
      });
      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userMessage }] }
        ],
      });
      const text = result.response.text();
      try {
        const data = JSON.parse(text);
        return { success: true, data };
      } catch (err) {
        return { success: false, error: 'Erro ao fazer parse do JSON do auditor.' };
      }
    }
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message || 'Erro na auditoria.' };
  }
}
