"use server";

import { runAiAgentTest } from "./ia";

export async function auditBlogText(content: string, agentId: string) {
  try {
    const cleanContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanContent) throw new Error("Conteúdo vazio.");

    const overrideSystemPrompt = `Você é um Auditor Especialista em Detecção de Texto Sintético (IA). Sua missão é ler o artigo fornecido e avaliá-lo rigorosamente usando um framework de 13 etapas.

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

Sua resposta DEVE ser EXCLUSIVAMENTE um objeto JSON válido, sem formatação markdown ou blocos de código (\`\`\`json), com a seguinte estrutura estrita:
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
Nota: Certifique-se de que o array 'analises' tenha exatos 13 itens. Não inclua NENHUM texto fora do JSON.`;

    const userMessage = `Artigo a ser auditado:\n\n${cleanContent.substring(0, 10000)}`;

    const result = await runAiAgentTest(agentId, userMessage, [], { 
      disableTools: true,
      overrideSystemPrompt 
    });

    if (!result.success) {
      throw new Error(result.error || "Erro na execução do agente.");
    }

    let text = result.response || '{}';
    // Limpar possíveis blocos markdown (```json ... ```)
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (err) {
      console.error("[IA Auditor] JSON Parse error:", err, ". Text was:", text);
      return { success: false, error: 'Erro ao fazer parse do JSON do auditor. O modelo não retornou um JSON válido.' };
    }
  } catch (error: any) {
    console.error("[IA Auditor] Error:", error);
    return { success: false, error: error.message || 'Erro na auditoria.' };
  }
}
