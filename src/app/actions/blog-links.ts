"use server";

import { runAiAgentTest } from "./ia";

export async function suggestRelatedLinks(content: string, publishedPosts: { id: string; title: string }[], maxLinks: number, agentId?: string) {
  try {
    if (!agentId) {
      throw new Error("Nenhum agente selecionado. Por favor, selecione um Agente IA primeiro.");
    }

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

    // Usando o sistema central de agentes com disableTools para evitar erros
    const res = await runAiAgentTest(agentId, prompt, undefined, { disableTools: true });

    if (!res.success || !res.response) {
      throw new Error(res.error || 'Falha na comunicação com a IA central.');
    }

    const text = res.response.trim();
    try {
      const jsonMatch = text.match(/\[(.*?)\]/s);
      if (jsonMatch) return { success: true, data: JSON.parse(jsonMatch[0]) as string[] };
      return { success: true, data: JSON.parse(text) as string[] };
    } catch {
      return { success: false, error: 'Erro ao fazer parse da resposta da IA.' };
    }
  } catch (error: any) {
    console.error(error);
    return { success: false, error: 'Erro ao buscar sugestões: ' + (error.message || String(error)) };
  }
}
