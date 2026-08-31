'use client';

import { useState, useEffect } from 'react';
import { Bot, Loader2, Sparkles, Wand2, Plus, PenTool, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAiAgents, runAiAgentTest } from '@/app/actions/ia';
import { toast } from '@/hooks/use-toast';

interface AiDraftModalProps {
  currentTitle: string;
  currentContent?: string;
  mode?: 'DRAFT' | 'REVIEW' | 'IMAGES';
  onDraftGenerated: (contentHtml: string, seo?: { metaDescription: string; tags: string }) => void;
}

export function AiDraftModal({ currentTitle, currentContent, mode = 'DRAFT', onDraftGenerated }: AiDraftModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState('');
  const [topic, setTopic] = useState('');
  const [wordCount, setWordCount] = useState('1400');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [generateSeo, setGenerateSeo] = useState(true);
  
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [generatedSeo, setGeneratedSeo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setTopic(currentTitle);
      setGeneratedHtml(null);
      setGeneratedSeo(null);
      if (agents.length === 0) {
        loadAgents();
      }
    }
  }, [isOpen, currentTitle]);

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    const result = await getAiAgents();
    if (result.success && result.data) {
      const activeAgents = result.data.filter((a: any) => a.status === 'active');
      setAgents(activeAgents);
      if (activeAgents.length > 0) {
        setSelectedAgent(activeAgents[0].id);
      }
    }
    setIsLoadingAgents(false);
  };

  const handleGenerate = async () => {
    if (!selectedAgent) {
      toast({ variant: 'destructive', title: 'Selecione um agente' });
      return;
    }
    if (mode === 'DRAFT' && !topic.trim()) {
      toast({ variant: 'destructive', title: 'O tema não pode estar vazio' });
      return;
    }

    setIsGenerating(true);
    setGeneratedHtml(null);

    let prompt = '';

    if (mode === 'DRAFT') {
      prompt = `
Escreva um rascunho de artigo para blog sobre o seguinte tema: "${topic}".
Tamanho desejado do texto: aproximadamente ${wordCount} palavras.
${extraInstructions ? \`\nInstruções extras (Tópicos obrigatórios):\n\${extraInstructions}\n\` : ''}

${generateSeo ? 'MUITO IMPORTANTE: No final do artigo, inclua OBRIGATORIAMENTE um bloco JSON com uma \`metaDescription\` (resumo chamativo com no máximo 160 caracteres) e \`tags\` (array de strings). Formate exatamente assim:\n```json\n{"metaDescription": "...", "tags": ["tag1", "tag2"]}\n```\n' : ''}

IMPORTANTE: Formate todo o conteúdo do artigo APENAS EM HTML VÁLIDO (use tags <h2>, <h3>, <p>, <ul>, <li>, <strong>, etc.) para que possa ser inserido diretamente em um editor de texto (Rich Text). Não use formatação markdown (asteriscos ou hashes) para o texto do artigo.
`;
    } else if (mode === 'REVIEW') {
      prompt = `
Você é um Revisor e Editor Chefe experiente.
Revise e reescreva o artigo abaixo para melhorar a escaneabilidade, corrigir erros gramaticais, melhorar o tom de voz e adicionar formatação (negritos, listas) onde apropriado.
${extraInstructions ? \`\nInstruções do usuário:\n\${extraInstructions}\n\` : ''}

Título Original: ${topic}
Conteúdo Original:
${currentContent || ''}

IMPORTANTE: Retorne TODO O ARTIGO reescrito e formatado APENAS EM HTML VÁLIDO (use tags <h2>, <h3>, <p>, <ul>, <li>, <strong>). Não use formatação markdown para o texto do artigo.
`;
    } else if (mode === 'IMAGES') {
      prompt = `
Você é um Diretor de Arte. Leia o artigo abaixo.
Seu objetivo é sugerir imagens ricas para este artigo.
Para cada imagem que você sugerir, você deve gerar um bloco de texto com o seguinte formato EXATO:

[SUGESTÃO DE IMAGEM: "prompt detalhado em inglês para o Midjourney/DALL-E focado no conceito visual do parágrafo"]

Instrução CRÍTICA: Você DEVE retornar EXATAMENTE o mesmo código HTML que você recebeu, sem alterar o conteúdo ou a formatação HTML original. Sua ÚNICA modificação permitida é injetar os blocos de [SUGESTÃO DE IMAGEM: ...] no meio do HTML onde fizer sentido ter uma imagem (exemplo: antes de um subtítulo <h2> ou após uma explicação complexa).

Título Original: ${topic}
Conteúdo Original:
${currentContent || ''}
`;
    }

    try {
      const result = await runAiAgentTest(selectedAgent, prompt);
      
      if (result.success && result.response) {
        let contentHtml = result.response;
        let seoData = undefined;

        if (mode === 'DRAFT' && generateSeo) {
          const jsonMatch = contentHtml.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              const parsedSeo = JSON.parse(jsonMatch[1]);
              seoData = {
                metaDescription: parsedSeo.metaDescription || '',
                tags: Array.isArray(parsedSeo.tags) ? parsedSeo.tags.join(', ') : '',
              };
              contentHtml = contentHtml.replace(/```json\n[\s\S]*?\n```/, '').trim();
            } catch (e) {
              console.error('Erro ao fazer parse do JSON de SEO', e);
            }
          }
        }

        contentHtml = contentHtml.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

        setGeneratedHtml(contentHtml);
        setGeneratedSeo(seoData);
        toast({ title: 'Análise concluída!', description: 'Valide o resultado antes de aplicar.', className: 'bg-emerald-600 text-white border-none' });
      } else {
        toast({ variant: 'destructive', title: 'Erro na geração', description: result.error || 'Tente novamente mais tarde.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Não foi possível comunicar com a IA.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedHtml) {
      onDraftGenerated(generatedHtml, generatedSeo);
      setIsOpen(false);
      toast({ title: 'Conteúdo aplicado!', description: 'Lembre-se de salvar o artigo.', className: 'bg-emerald-600 text-white border-none' });
    }
  };

  const getTriggerConfig = () => {
    switch (mode) {
      case 'DRAFT': return { text: 'Gerar com IA', icon: Sparkles, color: 'text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 border-amber-200' };
      case 'REVIEW': return { text: 'Revisar com IA', icon: PenTool, color: 'text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 border-blue-200' };
      case 'IMAGES': return { text: 'Criar Prompts', icon: ImageIcon, color: 'text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 hover:text-fuchsia-800 border-fuchsia-200' };
    }
  };

  const trigger = getTriggerConfig();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={\`rounded-xl \${trigger.color}\`}>
          <trigger.icon className="h-4 w-4 mr-2" />
          {trigger.text}
        </Button>
      </DialogTrigger>
      <DialogContent className={\`sm:max-w-[\${generatedHtml ? '800px' : '500px'}] border-none shadow-2xl transition-all duration-300\`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-5 w-5 text-brand-yellow" /> Assistente de IA
          </DialogTitle>
          <DialogDescription>
            {mode === 'DRAFT' && 'Deixe um Agente escrever um rascunho para você.'}
            {mode === 'REVIEW' && 'A IA fará a revisão e melhoria do seu conteúdo atual.'}
            {mode === 'IMAGES' && 'A IA vai sugerir prompts de imagens nos locais corretos.'}
          </DialogDescription>
        </DialogHeader>

        {generatedHtml ? (
          <div className="space-y-4 py-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">Pré-visualização do Resultado</h3>
            <div 
              className="prose prose-sm max-w-none max-h-[400px] overflow-y-auto p-4 bg-slate-50 border rounded-xl"
              dangerouslySetInnerHTML={{ __html: generatedHtml }}
            />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Agente de IA</Label>
              {isLoadingAgents ? (
                <div className="h-10 border rounded-xl flex items-center px-3 text-sm text-slate-500 bg-slate-50">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando agentes...
                </div>
              ) : (
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-10">
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
            </div>

            {mode === 'DRAFT' && (
              <>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Tema do Artigo</Label>
                  <Input 
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Ex: Como organizar os estudos para o ENEM"
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Tamanho do Texto</Label>
                  <Select value={wordCount} onValueChange={setWordCount}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1400">Curto (~1400 palavras)</SelectItem>
                      <SelectItem value="1950">Médio (~1950 palavras)</SelectItem>
                      <SelectItem value="2500">Longo (~2500 palavras)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(mode === 'DRAFT' || mode === 'REVIEW') && (
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Instruções Extras (Opcional)</Label>
                <Textarea 
                  value={extraInstructions}
                  onChange={e => setExtraInstructions(e.target.value)}
                  placeholder="Ex: Foque no tom encorajador..."
                  className="resize-none rounded-xl border-slate-200 h-20"
                />
              </div>
            )}

            {mode === 'DRAFT' && (
              <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Checkbox 
                  id="seo" 
                  checked={generateSeo} 
                  onCheckedChange={(checked) => setGenerateSeo(checked as boolean)} 
                />
                <label
                  htmlFor="seo"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 cursor-pointer"
                >
                  Preencher Meta Descrição e Tags automaticamente
                </label>
              </div>
            )}
            
            {mode === 'IMAGES' && (
              <div className="p-4 bg-fuchsia-50 text-fuchsia-800 rounded-xl text-sm border border-fuchsia-100">
                A IA vai ler o conteúdo atual e adicionar blocos com as sugestões de imagens. Seu texto original não será modificado.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {generatedHtml ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setGeneratedHtml(null)}
                className="rounded-xl"
              >
                Descartar e Refazer
              </Button>
              <Button 
                onClick={handleApply} 
                className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" /> Aplicar ao Artigo
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isGenerating}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !selectedAgent || (mode === 'DRAFT' && !topic.trim())}
                className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              >
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {mode === 'DRAFT' ? 'Escrevendo...' : 'Analisando...'}</>
                ) : (
                  <><Wand2 className="h-4 w-4 mr-2" /> Iniciar IA</>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}nt>
    </Dialog>
  );
}
