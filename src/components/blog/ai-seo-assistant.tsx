"use client";

import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { generateSeoSuggestion } from '@/app/actions/blog-seo';

interface AiSeoAssistantProps {
  content: string;
  type: 'title' | 'cover' | 'excerpt';
  onApply?: (text: string) => void;
  onApplyAlt?: (text: string) => void;
}

export function AiSeoAssistant({ content, type, onApply, onApplyAlt }: AiSeoAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedAlt, setCopiedAlt] = useState(false);

  const handleGenerate = async () => {
    // Evita chamada à API se não houver contexto suficiente
    if (!content || content.trim().length < 50) {
      toast('Escreva um pouco mais do artigo', {
        description: 'A IA precisa de pelo menos um parágrafo para gerar sugestões precisas.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      let agentId = undefined;
      if (typeof window !== 'undefined') {
        agentId = localStorage.getItem('lastUsedBlogAgentId') || undefined;
      }
      const res = await generateSeoSuggestion(content, type, agentId);
      if (res.success && res.data) {
        if (type === 'cover') {
          try {
            const parsed = JSON.parse(res.data);
            setResult(parsed);
          } catch {
            toast('Erro na leitura dos dados da IA', { description: 'Tente gerar novamente.' });
          }
        } else if (type === 'title') {
          const titles = res.data.split('\n').filter((t: string) => t.trim().length > 0);
          setResult(titles);
        } else {
          setResult(res.data);
        }
      } else {
        toast('Erro ao gerar', { description: res.error });
      }
    } catch (e) {
      toast('Erro inesperado', { description: 'Falha na comunicação com a IA.' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'prompt' | 'alt') => {
    navigator.clipboard.writeText(text);
    if (type === 'prompt') {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedAlt(true);
      setTimeout(() => setCopiedAlt(false), 2000);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title={type === 'title' ? "Gerar Ideias" : type === 'cover' ? "Prompt de Arte" : "Gerar Resumo SEO"}
          className="h-8 w-8 rounded-full border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow-dark hover:bg-brand-yellow/20 hover:text-brand-yellow-dark hover:border-brand-yellow/50 transition-all shadow-sm flex-shrink-0"
          onClick={() => {
            if (!result) handleGenerate();
          }}
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
                {type === 'title' && "Ideias de Título SEO"}
                {type === 'cover' && "Direção de Arte (Capa)"}
                {type === 'excerpt' && "Resumo Otimizado (Meta)"}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">Lendo contexto do rascunho...</p>
            </div>
          </div>
          {!isLoading && result && (
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-200" onClick={handleGenerate} title="Gerar novamente">
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
                        toast('Título atualizado com sucesso!');
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
                        toast('Resumo aplicado!');
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
