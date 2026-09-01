"use client";

import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { runAiAgentTest } from '@/app/actions/ia';

interface AiSeoAssistantProps {
  content: string;
  title?: string;
  type: 'title' | 'cover' | 'excerpt';
  onApply?: (text: string) => void;
  onApplyAlt?: (text: string) => void;
}

// Strip HTML tags so we send clean text to the AI (same logic as ai-draft-modal)
const stripHtml = (html: string) =>
  html
    .replace(/<\/(p|h[1-6]|li|div|tr|td|th|blockquote)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Build the task prompt for each SEO type
const buildPrompt = (type: 'title' | 'cover' | 'excerpt', plainContent: string, title?: string): string => {
  // Limit to ~3000 chars to keep tokens reasonable
  const excerpt = plainContent.substring(0, 3000);

  if (type === 'title') {
    return `Você é um especialista em Copywriting e SEO. Crie 3 opções de Títulos extremamente clicáveis (virais e otimizados para busca) para este artigo.
Retorne APENAS os 3 títulos, um por linha, estritamente separados por quebra de linha dupla. Sem numeração, sem aspas, sem marcadores (bullet points).
Exemplo de saída:
Como Estudar para o ENEM em 2026

O Guia Definitivo do ENEM 2026

Passe no ENEM: Dicas de Ouro

Conteúdo do Artigo (baseie-se apenas nisto):

${excerpt}`;
  }

  if (type === 'excerpt') {
    return `Você é um especialista em SEO. Escreva UMA ÚNICA meta description (resumo) para o artigo.
Regras:
- MÁXIMO absoluto de 160 caracteres. Seja conciso e direto.
- Use gatilhos de curiosidade para gerar cliques (CTR alto) no Google.
- Retorne APENAS o texto do resumo, sem aspas, sem prefixos, sem a palavra "Resumo:".

Conteúdo do Artigo (baseie-se apenas nisto):

${excerpt}`;
  }

  // type === 'cover'
  return `Você é o Diretor de Arte Editorial do Aulas Online Senra, uma marca brasileira de educação premium especializada em aulas particulares online e preparação acadêmica para ENEM, vestibulares e processos seletivos.

Sua tarefa é analisar o título e o conteúdo inicial do artigo e criar o conceito visual da IMAGEM DE CAPA do artigo.

A imagem deve parecer uma fotografia editorial premium produzida profissionalmente para uma publicação educacional, e NÃO uma imagem genérica de banco de imagens.

### OBJETIVO VISUAL

Crie uma cena que comunique visualmente a IDEIA CENTRAL do artigo de forma natural, sofisticada e imediatamente compreensível.

Não ilustre literalmente cada palavra do título. Primeiro identifique o principal assunto, situação, problema, ação ou contexto apresentado no artigo e transforme isso em uma cena visual convincente.

Priorize representação conceitual e editorial em vez de clichês visuais.

### DIREÇÃO DE ARTE

Sempre utilizar fotografia realista e hiper-realista.

A estética deve transmitir:

* educação de alto nível;
* inteligência;
* concentração;
* credibilidade;
* sofisticação;
* naturalidade;
* contexto brasileiro quando isso for relevante;
* aparência premium e contemporânea.

Preferir momentos espontâneos e plausíveis em vez de poses artificiais de banco de imagens.

Evitar clichês excessivamente genéricos, como estudante sorrindo para a câmera segurando livros, pilhas de livros aleatórias, professor posando artificialmente diante de um quadro ou imagens educacionais excessivamente encenadas.

A iluminação deve ser natural ou cinematográfica, escolhida de acordo com o tema do artigo. Não utilizar neon ou efeitos futuristas sem justificativa explícita pelo assunto.

Utilizar composição fotográfica sofisticada, profundidade de campo natural, texturas realistas, iluminação fisicamente plausível e detalhes faciais e ambientais autênticos.

### IDENTIDADE VISUAL

Manter uma linguagem visual compatível com uma marca educacional premium.

Priorizar ambientes elegantes, limpos e contemporâneos, com predominância visual sutil de azul-marinho, branco/off-white e detalhes quentes discretos quando fizer sentido.

Não transformar a imagem em uma peça publicitária da marca.

Não inserir elementos gráficos da identidade visual artificialmente dentro da fotografia.

### COMPOSIÇÃO

A imagem será utilizada como capa de artigo em formato horizontal 1200x628.

Criar composição cinematográfica horizontal, adequada para hero image de site.

Manter um ponto focal visual muito claro.

Utilizar espaço negativo de forma intencional quando necessário para acomodar o layout do site.

Evitar cortar cabeças, mãos, objetos principais ou elementos essenciais da cena.

A composição deve continuar funcionando mesmo com pequenos recortes em diferentes dispositivos.

### RESTRIÇÕES OBRIGATÓRIAS

Não inserir:

* texto;
* letras;
* números;
* títulos;
* palavras;
* logotipos;
* marcas;
* marcas d'água;
* interfaces artificiais;
* elementos gráficos;
* infográficos;
* ilustrações;
* aparência de desenho;
* aparência de CGI;
* estética cartoon;
* anatomia deformada;
* mãos deformadas;
* objetos impossíveis;
* elementos que não façam sentido no contexto do artigo.

Sempre utilizar pessoas com aparência humana realista e proporções anatômicas naturais.

### ALT TEXT

Crie um texto alternativo em português, curto, literal e objetivo.

Descreva SOMENTE o que pode ser observado na imagem.

Não invente informações.

Não inclua opiniões, interpretações, intenções, chamadas comerciais ou palavras-chave artificiais.

Não diga que a pessoa está se preparando para determinado exame, curso ou profissão se isso não puder ser visualmente identificado.

O alt text deve priorizar acessibilidade e descrever os elementos visuais essenciais da cena.

### FORMATO DE SAÍDA

Retorne ESTRITAMENTE um JSON válido, sem markdown, sem \`\`\`json e sem qualquer texto adicional:

{
  "prompt": "Prompt em INGLÊS extremamente detalhado para Midjourney/Flux. Descreva o sujeito principal, ação, ambiente, contexto, composição horizontal, enquadramento, câmera, lente, profundidade de campo, iluminação, atmosfera, materiais, textura, realismo fotográfico e estética editorial premium.",
  "alt": "Texto alternativo em PORTUGUÊS, literal, objetivo e acessível."
}

Não inclua nenhum campo adicional.

### CONTEÚDO DO ARTIGO

Título:
${title || '(não informado)'}

Conteúdo inicial:
${excerpt}`;
};

export function AiSeoAssistant({ content, title, type, onApply, onApplyAlt }: AiSeoAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedAlt, setCopiedAlt] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    // Check minimum content
    const plainText = (content || '').replace(/<[^>]*>?/gm, '').trim();
    if (!plainText || plainText.length < 50) {
      toast({
        title: 'Escreva um pouco mais',
        description: 'A IA precisa de pelo menos um parágrafo para gerar sugestões precisas.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Read the same agent used for the article body in this pipeline stage
      let agentId: string | undefined = undefined;
      if (typeof window !== 'undefined') {
        agentId = localStorage.getItem('lastUsedBlogAgentId_DRAFT')
          || localStorage.getItem('lastUsedBlogAgentId_REVIEW')
          || localStorage.getItem('lastUsedBlogAgentId')
          || undefined;
      }

      if (!agentId) {
        toast({
          title: 'Nenhum agente selecionado',
          description: 'Abra o assistente de IA (botão "Gerar com IA") e selecione um agente primeiro.',
          variant: 'destructive',
        });
        return;
      }

      const prompt = buildPrompt(type, stripHtml(content), title);

      // Use the same engine as the article body — with disableTools to prevent
      // the "Role 'function' not supported" error that occurs with tool-enabled agents
      const res = await runAiAgentTest(agentId, prompt, undefined, { disableTools: true });

      if (res.success && res.response) {
        const responseText = res.response.trim();

        if (type === 'cover') {
          try {
            const cleanJson = responseText
              .replace(/^```json/i, '')
              .replace(/^```/, '')
              .replace(/```$/, '')
              .trim();
            const parsed = JSON.parse(cleanJson);
            setResult(parsed);
          } catch {
            toast({
              title: 'Erro',
              description: 'Erro na leitura dos dados da IA. Tente gerar novamente.',
              variant: 'destructive',
            });
          }
        } else if (type === 'title') {
          const titles = responseText.split('\n').filter((t: string) => t.trim().length > 0);
          setResult(titles);
        } else {
          setResult(responseText);
        }
      } else {
        toast({
          title: 'Erro ao gerar',
          description: res.error || 'Falha na comunicação com a IA.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha inesperada na comunicação com a IA.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, copyType: 'prompt' | 'alt') => {
    navigator.clipboard.writeText(text);
    if (copyType === 'prompt') {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedAlt(true);
      setTimeout(() => setCopiedAlt(false), 2000);
    }
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open && !result && !isLoading) {
          handleGenerate();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title={type === 'title' ? 'Gerar Ideias' : type === 'cover' ? 'Prompt de Arte' : 'Gerar Resumo SEO'}
          className="h-8 w-8 rounded-full border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow-dark hover:bg-brand-yellow/20 hover:text-brand-yellow-dark hover:border-brand-yellow/50 transition-all shadow-sm flex-shrink-0"
        >
          <Sparkles className="h-4 w-4 fill-current" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 sm:w-96 p-0 overflow-hidden shadow-xl rounded-xl border-slate-200" align="start">
        <div className="bg-gradient-to-r from-brand-yellow/10 to-amber-500/10 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-md shadow-sm">
              <Wand2 className="h-4 w-4 text-brand-yellow-dark" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                {type === 'title' && 'Ideias de Título SEO'}
                {type === 'cover' && 'Direção de Arte (Capa)'}
                {type === 'excerpt' && 'Resumo Otimizado (Meta)'}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">Lendo contexto do rascunho...</p>
            </div>
          </div>
          {!isLoading && result && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-slate-200"
              onClick={handleGenerate}
              title="Gerar novamente"
            >
              <Sparkles className="h-3.5 w-3.5 text-slate-400 hover:text-amber-500" />
            </Button>
          )}
        </div>

        <div className="p-4 bg-white min-h-[100px] flex flex-col justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-brand-yellow" />
              <span className="text-xs font-medium animate-pulse">A IA está pensando...</span>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* TÍTULO */}
              {type === 'title' && Array.isArray(result) && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-slate-500 mb-1">Clique no título para aplicar:</p>
                  {result.map((titleStr: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onApply?.(titleStr);
                        setIsOpen(false);
                        toast({ title: 'Sucesso', description: 'Título atualizado!', className: 'bg-emerald-600 text-white border-none' });
                      }}
                      className="text-left text-sm font-bold text-slate-700 hover:text-brand-yellow-dark bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 rounded-lg p-3 transition-colors group"
                    >
                      {titleStr}
                    </button>
                  ))}
                </div>
              )}

              {/* EXCERPT / RESUMO */}
              {type === 'excerpt' && typeof result === 'string' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed">
                    {result}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Check className="h-3 w-3 text-emerald-500" /> SEO Otimizado
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        onApply?.(result);
                        setIsOpen(false);
                        toast({ title: 'Sucesso', description: 'Resumo aplicado!', className: 'bg-emerald-600 text-white border-none' });
                      }}
                      className="h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs px-4"
                    >
                      Aplicar Resumo
                    </Button>
                  </div>
                </div>
              )}

              {/* COVER / IMAGEM */}
              {type === 'cover' && result.prompt && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        Prompt de Imagem (Inglês)
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => copyToClipboard(result.prompt, 'prompt')}>
                        {copiedPrompt ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        {copiedPrompt ? 'Copiado' : 'Copiar'}
                      </Button>
                    </div>
                    <div className="p-2.5 bg-slate-900 text-slate-300 font-mono text-[11px] rounded-lg border border-slate-800 leading-relaxed select-all">
                      {result.prompt}
                    </div>
                    <p className="text-[10px] text-slate-400">Cole no Midjourney, Flux, DALL-E ou Bing.</p>
                  </div>

                  <div className="w-full h-px bg-slate-100"></div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        Alt Text / Texto Alternativo
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => copyToClipboard(result.alt, 'alt')}>
                        {copiedAlt ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        {copiedAlt ? 'Copiado' : 'Copiar'}
                      </Button>
                    </div>
                    <div className="p-2.5 bg-slate-50 text-slate-600 text-[11px] rounded-lg border border-slate-200 leading-relaxed">
                      {result.alt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-slate-500">
              Nenhuma sugestão gerada.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
