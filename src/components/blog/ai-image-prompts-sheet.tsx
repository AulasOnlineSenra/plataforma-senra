"use client";

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ImageIcon, Trash2, Wand2, Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiAgents, runAiAgentTest } from '@/app/actions/ia';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AiImagePromptsSheetProps {
  articleTitle: string;
  blocks: string[];
  onRemoveBlock: (index: number) => void;
  triggerColorClass?: string;
}

const SYSTEM_PROMPT = `Você é um Diretor de Arte Editorial, Especialista em Comunicação Visual, Acessibilidade e SEO para um portal brasileiro de educação premium.

Sua tarefa é analisar cada um dos trechos numerados selecionados pelo usuário dentro de um artigo e determinar se uma imagem realmente acrescentaria valor à compreensão ou à experiência de leitura.
Para cada trecho numerado recebido, crie um conceito visual e transforme-o em um prompt altamente detalhado para geração de imagem por IA, além de criar o texto alternativo correspondente.

### OBJETIVO
A imagem deve complementar o conteúdo do trecho correspondente.
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
Retorne ESTRITAMENTE um ARRAY JSON válido, onde cada elemento corresponde a um trecho na mesma ordem que foram enviados, no seguinte formato:
[
  {
    "recommended": true ou false,
    "reason": "Explicação curta do motivo",
    "prompt": "Prompt altamente detalhado em INGLÊS aqui, ou vazio se não recomendado",
    "altText": "Texto alternativo em PORTUGUÊS aqui, ou vazio se não recomendado"
  }
]

Nunca utilize markdown. Nunca utilize \`\`\`json. Nunca escreva qualquer texto antes ou depois do array JSON.`;

export function AiImagePromptsSheet({ articleTitle, blocks, onRemoveBlock, triggerColorClass = 'text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 hover:text-fuchsia-800 border-fuchsia-200' }: AiImagePromptsSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Array<{ recommended: boolean; reason: string; prompt: string; altText: string }> | null>(null);
  const [copiedPrompts, setCopiedPrompts] = useState<{ [index: number]: boolean }>({});
  const [copiedAlts, setCopiedAlts] = useState<{ [index: number]: boolean }>({});
  
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      if (agents.length === 0) {
        loadAgents();
      } else {
        if (typeof window !== 'undefined') {
          const savedAgentId = localStorage.getItem('lastUsedBlogAgentId_IMAGES');
          if (savedAgentId && agents.find((a: any) => a.id === savedAgentId)) {
            setSelectedAgent(savedAgentId);
          }
        }
      }
    }
  }, [isOpen]);

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    const result = await getAiAgents();
    if (result.success && result.data) {
      const activeAgents = result.data.filter((a: any) => a.status === 'active');
      setAgents(activeAgents);
      if (activeAgents.length > 0) {
        let savedAgentId = null;
        if (typeof window !== 'undefined') {
          savedAgentId = localStorage.getItem('lastUsedBlogAgentId_IMAGES');
        }
        if (savedAgentId && activeAgents.find((a: any) => a.id === savedAgentId)) {
          setSelectedAgent(savedAgentId);
        } else {
          setSelectedAgent(activeAgents[0].id);
        }
      }
    }
    setIsLoadingAgents(false);
  };

  const handleGenerate = async () => {
    if (!selectedAgent) {
      toast({ variant: 'destructive', title: 'Selecione um agente' });
      return;
    }
    if (blocks.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhum bloco', description: 'Adicione pelo menos um trecho de texto do artigo.' });
      return;
    }

    setIsGenerating(true);
    setResults(null);
    setCopiedPrompts({});
    setCopiedAlts({});

    try {
      const userContent = `Título do artigo:\n${articleTitle}\n\nTrechos selecionados pelo usuário:\n${blocks.map((b, i) => `[${i + 1}] ${b}`).join('\n\n')}`;
      
      const res = await runAiAgentTest(selectedAgent, SYSTEM_PROMPT + '\n\n' + userContent, undefined, { disableTools: true });
      
      if (res.success && res.response) {
        let jsonStr = res.response.trim();
        if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
        else if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.replace(/\`\`\`/g, '');
        
        try {
          const parsed = JSON.parse(jsonStr);
          const parsedArray = Array.isArray(parsed) ? parsed : [parsed];
          setResults(parsedArray);
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

  const handleCopy = (text: string, type: 'prompt' | 'alt', index: number) => {
    navigator.clipboard.writeText(text);
    if (type === 'prompt') {
      setCopiedPrompts(prev => ({ ...prev, [index]: true }));
      setTimeout(() => setCopiedPrompts(prev => ({ ...prev, [index]: false })), 2000);
    } else {
      setCopiedAlts(prev => ({ ...prev, [index]: true }));
      setTimeout(() => setCopiedAlts(prev => ({ ...prev, [index]: false })), 2000);
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
              <div className="space-y-6">
                {blocks.map((block, index) => (
                  <div key={index} className="space-y-3">
                    <div className="relative group bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-sm text-slate-600 pr-10 leading-relaxed">
                      "{block}"
                      <button 
                        onClick={() => onRemoveBlock(index)}
                        className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remover trecho"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {results && results[index] && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pl-4 border-l-2 border-fuchsia-200">
                        {!results[index].recommended ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2 text-xs">
                              ⚠️ Imagem Não Recomendada
                            </h4>
                            <p className="text-xs text-amber-700 leading-relaxed">{results[index].reason}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prompt (Inglês)</span>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] font-medium text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50" onClick={() => handleCopy(results[index].prompt, 'prompt', index)}>
                                  {copiedPrompts[index] ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                  Copiar
                                </Button>
                              </div>
                              <div className="p-3 text-xs text-slate-700 leading-relaxed font-mono">
                                {results[index].prompt}
                              </div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alt Text (Português)</span>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] font-medium text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50" onClick={() => handleCopy(results[index].altText, 'alt', index)}>
                                  {copiedAlts[index] ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                  Copiar
                                </Button>
                              </div>
                              <div className="p-3 text-xs text-slate-700 leading-relaxed">
                                {results[index].altText}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-6 mt-2">
            <Label className="font-bold text-slate-700">Agente de IA</Label>
            {isLoadingAgents ? (
              <div className="h-10 border rounded-xl flex items-center px-3 text-sm text-slate-500 bg-slate-50">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando agentes...
              </div>
            ) : (
            <Select 
              value={selectedAgent} 
              onValueChange={(val) => {
                setSelectedAgent(val);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('lastUsedBlogAgentId_IMAGES', val);
                }
              }}
            >
                <SelectTrigger className="rounded-xl border-slate-200 h-10 bg-white">
                  <SelectValue placeholder="Selecione um agente..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                  {agents.length === 0 && <div className="p-2 text-sm text-slate-500 text-center">Nenhum agente ativo encontrado.</div>}
                </SelectContent>
              </Select>
            )}
            <div className="p-3 bg-fuchsia-50 text-fuchsia-800 rounded-xl text-xs border border-fuchsia-100 mt-3">
              A IA vai ler os trechos acima e sugerir o prompt de imagem mais adequado.
            </div>
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

        </div>
      </SheetContent>
    </Sheet>
  );
}
