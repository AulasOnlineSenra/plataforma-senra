"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getAiAgents, getBlogAgentDefaults, setBlogAgentDefaults } from '@/app/actions/ia';
import { auditBlogText } from '@/app/actions/blog-auditor';

type AiAuditorSheetProps = {
  currentContent: string;
};

export default function AiAuditorSheet({ currentContent }: AiAuditorSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [auditResult, setAuditResult] = useState<any>(null);

  const auditSteps = [
    "Ritmo e naturalidade",
    "Repetição de estruturas e padrões",
    "Uso padronizado de conectivos",
    "Frases simétricas e previsíveis",
    "Generalizações e abstrações",
    "Profundidade real vs aparente",
    "Vocabulário artificial",
    "Variação de tamanho de frases",
    "Imperfeições naturais e voz autoral",
    "Padrões clichês de introdução/conclusão",
    "Consistência de estilo",
    "Sinais de expansão artificial",
    "Identificação de trechos genéricos"
  ];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isAuditing) {
      let i = 0;
      setCurrentStepIndex(0);
      const interval = setInterval(() => {
        i = (i + 1) % auditSteps.length;
        setCurrentStepIndex(i);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuditing]);

  const getScoreTextColor = (score: number) => {
    if (score < 30) return 'text-emerald-600';
    if (score < 70) return 'text-amber-500';
    return 'text-red-600';
  };

  useEffect(() => {
    if (isOpen) {
      if (agents.length === 0) loadAgents();
      else syncDefaultAgent(agents);
    }
  }, [isOpen]);

  const syncDefaultAgent = async (activeAgents: any[]) => {
    const defaultsRes = await getBlogAgentDefaults();
    if (defaultsRes.success && defaultsRes.data) {
      const savedAgentId = defaultsRes.data.blogAuditorAgentId;
      if (savedAgentId && activeAgents.find((a: any) => a.id === savedAgentId)) {
        setSelectedAgent(savedAgentId);
        return;
      }
    }
    const fallbackAgent = activeAgents[0]?.id || '';
    setSelectedAgent(fallbackAgent);
    if (fallbackAgent) await setBlogAgentDefaults('AUDITOR', fallbackAgent);
  };

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    const result = await getAiAgents();
    if (result.success && result.data) {
      const activeAgents = result.data.filter((a: any) => a.status === 'active');
      setAgents(activeAgents);
      if (activeAgents.length > 0) await syncDefaultAgent(activeAgents);
    }
    setIsLoadingAgents(false);
  };

  const handleAudit = async () => {
    if (!selectedAgent) {
      toast({ variant: 'destructive', title: 'Selecione um agente' });
      return;
    }
    if (!currentContent || currentContent.trim().length < 50) {
      toast({ variant: 'destructive', title: 'Pouco texto', description: 'Escreva mais conteúdo para poder auditar.' });
      return;
    }

    setIsAuditing(true);
    setAuditResult(null);

    const result = await auditBlogText(currentContent, selectedAgent);
    setIsAuditing(false);

    if (result.success && result.data && result.data.analises) {
      const analises = result.data.analises;
      const totalScore = analises.reduce((acc: number, curr: any) => acc + (curr.nota_ia || 0), 0);
      // Max score is 130
      const finalPercentage = Math.round((totalScore / 130) * 100);
      setAuditResult({ analises, finalPercentage });
      toast({ title: 'Auditoria concluída!', className: 'bg-emerald-600 text-white' });
    } else {
      toast({ variant: 'destructive', title: 'Erro na auditoria', description: result.error || 'Falha ao processar.' });
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-emerald-500 bg-emerald-50';
    if (score < 70) return 'text-amber-500 bg-amber-50';
    return 'text-red-500 bg-red-50';
  };

  const getScoreIcon = (score: number) => {
    if (score < 30) return <ShieldCheck className="w-8 h-8 text-emerald-500" />;
    if (score < 70) return <AlertTriangle className="w-8 h-8 text-amber-500" />;
    return <ShieldAlert className="w-8 h-8 text-red-500" />;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size={auditResult ? "default" : "icon"} 
          className={`rounded-xl border-slate-200 text-slate-600 h-9 ${auditResult ? 'px-3' : 'w-9'}`} 
          title="Auditoria de IA"
        >
          <ShieldAlert className="h-4 w-4" />
          {auditResult && (
            <span className={`ml-2 font-bold ${getScoreTextColor(auditResult.finalPercentage)}`}>
              {auditResult.finalPercentage}%
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px] border-l-0 shadow-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-headline text-2xl flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-brand-yellow" /> Auditoria de Texto
          </SheetTitle>
          <SheetDescription>Verifique se o seu artigo possui padrões robóticos de IA.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Agente Auditor</Label>
            {isLoadingAgents ? (
              <div className="h-10 border rounded-xl flex items-center px-3 text-sm text-slate-500 bg-slate-50">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando agentes...
              </div>
            ) : (
              <Select 
                value={selectedAgent} 
                onValueChange={async (val) => {
                  setSelectedAgent(val);
                  await setBlogAgentDefaults('AUDITOR', val);
                }}
              >
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Selecione um agente..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                  {agents.length === 0 && <div className="p-2 text-sm text-slate-500 text-center">Nenhum agente ativo.</div>}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button 
            onClick={handleAudit} 
            disabled={isAuditing || !selectedAgent}
            className="w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 h-12"
          >
            {isAuditing ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Auditando (Pode demorar)...</> : 'Iniciar Auditoria'}
          </Button>

          {isAuditing && (
            <div className="mt-4 text-center animate-in fade-in duration-500">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                Analisando Etapa {currentStepIndex + 1}/13
              </div>
              <div className="text-sm text-brand-yellow font-bold animate-pulse">
                {auditSteps[currentStepIndex]}...
              </div>
            </div>
          )}

          {auditResult && (
            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 shadow-sm bg-white">
                <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Probabilidade de IA</div>
                <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl ${getScoreColor(auditResult.finalPercentage)}`}>
                  {getScoreIcon(auditResult.finalPercentage)}
                  <span className="text-4xl font-bold font-headline">{auditResult.finalPercentage}%</span>
                </div>
                <p className="text-center text-sm text-slate-500 mt-4 max-w-[280px]">
                  {auditResult.finalPercentage < 30 ? 'Texto autêntico e natural!' : auditResult.finalPercentage < 70 ? 'Alguns padrões artificiais detectados. Revise os pontos abaixo.' : 'Fortes indícios de texto gerado por máquina. Considere reescrever.'}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">Detalhamento (13 Etapas)</h3>
                {auditResult.analises.map((item: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <div className="flex items-center justify-between p-3 bg-white border-b border-slate-100">
                      <div className="font-medium text-sm text-slate-700 flex-1">{item.etapa}. {item.nome}</div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-md ${item.nota_ia > 6 ? 'bg-red-100 text-red-700' : item.nota_ia > 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        Nota: {item.nota_ia}/10
                      </div>
                    </div>
                    <div className="p-4 text-sm text-slate-600 space-y-3">
                      <p>{item.analise}</p>
                      {item.trechos_suspeitos && item.trechos_suspeitos.length > 0 && item.trechos_suspeitos.some((t: string) => t.length > 0) && (
                        <div className="bg-white border border-slate-200 rounded-md p-3">
                          <span className="text-xs font-bold text-slate-500 mb-2 block">Trechos Suspeitos:</span>
                          <ul className="list-disc pl-4 space-y-1">
                            {item.trechos_suspeitos.filter((t:string)=>t.length>0).map((trecho: string, i: number) => (
                              <li key={i} className="text-slate-700 italic">"{trecho}"</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
