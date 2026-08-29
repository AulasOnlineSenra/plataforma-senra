'use client';

import { useState, useEffect } from 'react';
import { Bot, Loader2, Sparkles, Wand2 } from 'lucide-react';
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
  onDraftGenerated: (contentHtml: string, seo?: { metaDescription: string; tags: string }) => void;
}

export function AiDraftModal({ currentTitle, onDraftGenerated }: AiDraftModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState('');
  const [topic, setTopic] = useState('');
  const [wordCount, setWordCount] = useState('1000');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [generateSeo, setGenerateSeo] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setTopic(currentTitle);
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
    if (!topic.trim()) {
      toast({ variant: 'destructive', title: 'O tema não pode estar vazio' });
      return;
    }

    setIsGenerating(true);

    const prompt = `
Escreva um rascunho de artigo para blog sobre o seguinte tema: "${topic}".
Tamanho desejado do texto: aproximadamente ${wordCount} palavras.
${extraInstructions ? `\nInstruções extras (Tópicos obrigatórios):\n${extraInstructions}\n` : ''}

${generateSeo ? 'MUITO IMPORTANTE: No final do artigo, inclua OBRIGATORIAMENTE um bloco JSON com uma `metaDescription` (resumo chamativo com no máximo 160 caracteres) e `tags` (array de strings). Formate exatamente assim:\n```json\n{"metaDescription": "...", "tags": ["tag1", "tag2"]}\n```\n' : ''}

IMPORTANTE: Formate todo o conteúdo do artigo APENAS EM HTML VÁLIDO (use tags <h2>, <h3>, <p>, <ul>, <li>, <strong>, etc.) para que possa ser inserido diretamente em um editor de texto (Rich Text). Não use formatação markdown (asteriscos ou hashes) para o texto do artigo.
`;

    try {
      const result = await runAiAgentTest(selectedAgent, prompt);
      
      if (result.success && result.response) {
        let contentHtml = result.response;
        let seoData = undefined;

        // Extract JSON if SEO was requested
        if (generateSeo) {
          const jsonMatch = contentHtml.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              const parsedSeo = JSON.parse(jsonMatch[1]);
              seoData = {
                metaDescription: parsedSeo.metaDescription || '',
                tags: Array.isArray(parsedSeo.tags) ? parsedSeo.tags.join(', ') : '',
              };
              // Remove the JSON block from the HTML content
              contentHtml = contentHtml.replace(/```json\n[\s\S]*?\n```/, '').trim();
            } catch (e) {
              console.error('Erro ao fazer parse do JSON de SEO', e);
            }
          }
        }

        // Clean up markdown wrapping if present
        contentHtml = contentHtml.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

        onDraftGenerated(contentHtml, seoData);
        setIsOpen(false);
        toast({ title: 'Rascunho gerado!', className: 'bg-emerald-600 text-white border-none' });
      } else {
        toast({ variant: 'destructive', title: 'Erro na geração', description: result.error || 'Tente novamente mais tarde.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Não foi possível comunicar com a IA.' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800">
          <Sparkles className="h-4 w-4 mr-2" />
          Gerar com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-5 w-5 text-brand-yellow" /> Assistente de Redação
          </DialogTitle>
          <DialogDescription>
            Deixe um de seus Agentes de IA escrever um rascunho completo para você.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Agente</Label>
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
                <SelectItem value="500">Curto (~500 palavras)</SelectItem>
                <SelectItem value="1000">Médio (~1000 palavras)</SelectItem>
                <SelectItem value="2000">Longo (~2000 palavras)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Tópicos Extras (Opcional)</Label>
            <Textarea 
              value={extraInstructions}
              onChange={e => setExtraInstructions(e.target.value)}
              placeholder="Ex: Não se esqueça de mencionar a nova turma intensiva..."
              className="resize-none rounded-xl border-slate-200 h-20"
            />
          </div>

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
        </div>

        <DialogFooter>
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
            disabled={isGenerating || !selectedAgent || !topic.trim()}
            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Escrevendo...</>
            ) : (
              <><Wand2 className="h-4 w-4 mr-2" /> Gerar Rascunho</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
