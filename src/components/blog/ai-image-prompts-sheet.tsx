"use client";

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ImageIcon, Trash2, Wand2, Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runAiAgentTest } from '@/app/actions/ia';

interface AiImagePromptsSheetProps {
  articleTitle: string;
  blocks: string[];
  onRemoveBlock: (index: number) => void;
  triggerColorClass?: string;
}

const SYSTEM_PROMPT = `Você é um Diretor de Arte Editorial, Especialista em Comunicação Visual, Acessibilidade e SEO para um portal brasileiro de educação premium.

Sua tarefa é analisar o trecho selecionado pelo usuário dentro de um artigo e determinar se uma imagem realmente acrescentaria valor à compreensão ou à experiência de leitura.

Crie um conceito visual e transforme-o em um prompt altamente detalhado para geração de imagem por IA, além de criar o texto alternativo correspondente.

### OBJETIVO
A imagem deve complementar o conteúdo do trecho selecionado.
Ela não deve simplesmente repetir visualmente as palavras do texto nem ser uma fotografia genérica relacionada ao tema.
A imagem deve ter uma função editorial clara, como:
* contextualizar uma situação;
* representar visualmente uma ação ou conceito;
* facilitar a compreensão de uma ideia;
* ilustrar um processo;
* tornar um conceito abstrato mais visual;
* reforçar visualmente uma informação importante.

Quando uma imagem não acrescentar valor real ao conteúdo, informe que não é recomendada.

### ANÁLISE EDITORIAL
1. Qual é a ideia central do trecho selecionado?
2. Qual é o contexto fornecido pelo título e pela seção do artigo?
3. Existe uma representação visual natural para essa ideia?
4. Qual tipo de representação visual é mais adequado?

### HIERARQUIA DE REPRESENTAÇÃO VISUAL
Prioridade padrão:
1. Fotografia editorial realista;
2. Fotografia documental ou contextual;
3. Diagrama ou composição visual explicativa;
4. Ilustração conceitual sofisticada.

Não transforme automaticamente todo conteúdo educacional em fotografia de estudante estudando.

### DIREÇÃO DE ARTE
Priorize: realismo fotográfico, ambientes autênticos, sofisticação, iluminação natural ou cinematográfica, materiais e texturas plausíveis.
Evite estética de banco de imagens genérico, poses artificiais ou repetir a fórmula visual de estudante + notebook + livros.

### CONTEXTO
Use três níveis de informação para construir a imagem:
A imagem deve representar principalmente o trecho selecionado.

### RESTRIÇÕES
Não incluir: textos, letras, números, logotipos, marcas d'água, estética cartoon, aparência de CGI.

### ALT TEXT
O alt text deve descrever objetivamente o que está visível, ser curto e natural em português. Não inventar informações.

### FORMATO DE SAÍDA
Retorne ESTRITAMENTE um objeto JSON válido no seguinte formato:
{
  "recommended": true ou false,
  "reason": "Explicação curta do motivo",
  "prompt": "Prompt altamente detalhado em INGLÊS aqui, ou vazio se não recomendado",
  "altText": "Texto alternativo em PORTUGUÊS aqui, ou vazio se não recomendado"
}

Nunca utilize markdown. Nunca utilize \`\`\`json. Nunca escreva qualquer texto antes ou depois do objeto JSON.`;

export function AiImagePromptsSheet({ articleTitle, blocks, onRemoveBlock, triggerColorClass = 'text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 hover:text-fuchsia-800 border-fuchsia-200' }: AiImagePromptsSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ recommended: boolean; reason: string; prompt: string; altText: string } | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedAlt, setCopiedAlt] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (blocks.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhum bloco', description: 'Adicione pelo menos um trecho de texto do artigo.' });
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setCopiedPrompt(false);
    setCopiedAlt(false);

    try {
      const userContent = `Título do artigo:\n${articleTitle}\n\nTrechos selecionados pelo usuário:\n${blocks.map((b, i) => `[${i + 1}] ${b}`).join('\n\n')}`;
      
      const res = await runAiAgentTest(SYSTEM_PROMPT, userContent);
      
      if (res.success && res.text) {
        let jsonStr = res.text.trim();
        if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
        else if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.replace(/\`\`\`/g, '');
        
        try {
          const parsed = JSON.parse(jsonStr);
          setResult(parsed);
          toast({ title: 'Análise concluída', className: 'bg-emerald-600 text-white border-none' });
        } catch (e) {
          toast({ variant: 'destructive', title: 'Erro de formatação', description: 'A IA não retornou um formato válido.' });
        }
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: res.error || 'Falha na IA' });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Ocorreu um erro ao gerar os prompts.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, type: 'prompt' | 'alt') => {
    navigator.clipboard.writeText(text);
    if (type === 'prompt') {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedAlt(true);
      setTimeout(() => setCopiedAlt(false), 2000);
    }
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência.', className: 'bg-emerald-600 text-white border-none' });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={`rounded-xl ${triggerColorClass}`}>
          <ImageIcon className="h-4 w-4 mr-2" />
          Criar Prompts
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px] border-l-0 shadow-2xl overflow-y-auto bg-slate-50 flex flex-col p-0">
        <div className="p-6 bg-white border-b sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-headline text-2xl flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-fuchsia-500" />
              Pauta Visual (IA)
            </SheetTitle>
            <SheetDescription>
              Selecione trechos no artigo e adicione-os aqui. A IA analisará o contexto para criar um prompt editorial.
            </SheetDescription>
          </SheetHeader>
        </div>
        
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Blocos Adicionados */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-700 flex items-center justify-between">
              Trechos Selecionados ({blocks.length})
            </h3>
            
            {blocks.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-white">
                <p className="text-sm text-slate-400">Nenhum trecho adicionado.<br/>Selecione um texto no editor e clique no botão <b className="text-slate-600">[+]</b></p>
              </div>
            ) : (
              <div className="space-y-3">
                {blocks.map((block, index) => (
                  <div key={index} className="relative group bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-sm text-slate-600 pr-10 leading-relaxed">
                    "{block}"
                    <button 
                      onClick={() => onRemoveBlock(index)}
                      className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remover trecho"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão de Ação */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || blocks.length === 0}
            className="w-full h-12 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-base shadow-lg shadow-fuchsia-200 transition-all"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analisando Contexto...</>
            ) : (
              <><Wand2 className="w-5 h-5 mr-2" /> Gerar Direção de Arte</>
            )}
          </Button>

          {/* Resultado */}
          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-2">
              {!result.recommended ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                    ⚠️ Imagem Não Recomendada
                  </h4>
                  <p className="text-sm text-amber-700 leading-relaxed">{result.reason}</p>
                </div>
              ) : (
                <>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prompt (Inglês)</span>
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50" onClick={() => handleCopy(result.prompt, 'prompt')}>
                        {copiedPrompt ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        Copiar
                      </Button>
                    </div>
                    <div className="p-4 text-sm text-slate-700 leading-relaxed font-mono">
                      {result.prompt}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alt Text (Acessibilidade)</span>
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50" onClick={() => handleCopy(result.altText, 'alt')}>
                        {copiedAlt ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        Copiar
                      </Button>
                    </div>
                    <div className="p-4 text-sm text-slate-700 leading-relaxed">
                      {result.altText}
                    </div>
                  </div>
                  
                  {result.reason && (
                    <p className="text-xs text-slate-400 italic px-2">
                      <b className="font-semibold">Justificativa:</b> {result.reason}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
