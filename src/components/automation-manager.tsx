"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Play, Pause, Activity, Bot, ArrowRight, ShieldAlert, LayoutDashboard, Loader2, PlayCircle } from "lucide-react";
import { runAiSupervisor } from "@/app/actions/automation";
import { toast } from "sonner";

export function AutomationManager() {
  const [isActive, setIsActive] = useState(false);
  const [frequency, setFrequency] = useState("hourly");
  const [batchSize, setBatchSize] = useState("2");
  const [queueOrder, setQueueOrder] = useState("FIFO");
  const [isTesting, setIsTesting] = useState(false);

  const handleRunManualTest = async () => {
    setIsTesting(true);
    toast("O Maestro está girando a esteira...", { description: "Isso pode levar alguns segundos dependendo dos artigos." });
    
    try {
      const result = await runAiSupervisor();
      if (result.success) {
        toast.success("Ciclo finalizado com sucesso!", { description: result.message });
      } else {
        toast.error("Aviso do Maestro", { description: result.message || result.error });
      }
    } catch (error: any) {
      toast.error("Erro crítico", { description: error.message });
    }
    
    setIsTesting(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL */}
      <Card className="rounded-[15px] border-primary/20 bg-primary/5">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isActive ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
              {isActive ? <Activity className="h-6 w-6 animate-pulse" /> : <Pause className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Supervisor de Blog (Maestro)
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  {isActive ? 'Ativo' : 'Pausado'}
                </span>
              </h2>
              <p className="text-sm text-slate-600">Orquestrador de IA que move automaticamente artigos pelo Kanban.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border">
            <Label className="text-sm font-semibold text-slate-700 cursor-pointer" htmlFor="kill-switch">
              {isActive ? 'Pausar Automação' : 'Ligar Automação'}
            </Label>
            <Switch 
              id="kill-switch" 
              checked={isActive} 
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* COLUNA ESQUERDA: CONFIGURAÇÕES */}
        <Card className="rounded-[15px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              Parâmetros Globais
            </CardTitle>
            <CardDescription>Defina as regras de funcionamento da sua esteira de conteúdo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <Label className="font-semibold text-slate-700">Frequência de Execução</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15m">A cada 15 minutos</SelectItem>
                    <SelectItem value="30m">A cada 30 minutos</SelectItem>
                    <SelectItem value="hourly">A cada 1 hora</SelectItem>
                    <SelectItem value="6h">A cada 6 horas</SelectItem>
                    <SelectItem value="daily">1 vez ao dia (00:00)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">De quanto em quanto tempo o Maestro verifica o Kanban.</p>
              </div>

              <div className="space-y-3">
                <Label className="font-semibold text-slate-700">Lote de Processamento (Batch)</Label>
                <Select value={batchSize} onValueChange={setBatchSize}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 artigo por ciclo</SelectItem>
                    <SelectItem value="2">2 artigos por ciclo</SelectItem>
                    <SelectItem value="5">5 artigos por ciclo</SelectItem>
                    <SelectItem value="10">10 artigos por ciclo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Máximo de artigos movidos por execução para estabilidade.</p>
              </div>

              <div className="space-y-3">
                <Label className="font-semibold text-slate-700">Ordem de Fila</Label>
                <Select value={queueOrder} onValueChange={setQueueOrder}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione a ordem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">Mais Antigos Primeiro (FIFO)</SelectItem>
                    <SelectItem value="LIFO">Mais Recentes Primeiro (LIFO)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Define qual rascunho tem prioridade na fila de redação.</p>
              </div>

              <div className="space-y-3">
                <Label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  Limite de Falhas (Retries)
                </Label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 flex justify-between items-center">
                  <span>Máx. Tentativas:</span>
                  <span className="bg-amber-100 text-amber-800 px-2 rounded-full text-xs font-bold">Travado em 2</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Se a IA falhar 2x no mesmo artigo, ele pausa para intervenção humana.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Button 
              variant="outline" 
              className="w-full sm:w-fit rounded-xl gap-2 border-primary/20 hover:bg-primary/5 text-primary"
              onClick={handleRunManualTest}
              disabled={isTesting}
            >
              {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              {isTesting ? "Rodando..." : "Rodar Maestro Agora"}
            </Button>
            <Button className="w-full sm:w-fit rounded-xl">Salvar Configurações</Button>
          </CardFooter>
        </Card>

        {/* COLUNA DIREITA: MAPA DO FLUXO */}
        <Card className="rounded-[15px] bg-slate-900 text-slate-100 overflow-hidden relative">
          {/* Decoração de fundo */}
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <LayoutDashboard className="h-40 w-40" />
          </div>
          
          <CardHeader>
            <CardTitle className="text-lg text-white">Mapa da Esteira</CardTitle>
            <CardDescription className="text-slate-400">
              Fluxo atual orquestrado pelo Supervisor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            {/* Passo 1 */}
            <div className="flex flex-col gap-1 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passo 1</span>
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-sm font-semibold flex items-center gap-2">
                DRAFT <ArrowRight className="h-3 w-3 text-slate-500" /> REVIEW
              </p>
              <p className="text-xs text-slate-400">Aciona: <span className="text-emerald-400 font-medium">Agente Redator</span></p>
            </div>

            {/* Passo 2 */}
            <div className="flex flex-col gap-1 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passo 2</span>
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-sm font-semibold flex items-center gap-2">
                REVIEW <ArrowRight className="h-3 w-3 text-slate-500" /> IMAGES
              </p>
              <p className="text-xs text-slate-400">Aciona: <span className="text-blue-400 font-medium">Agente Revisor</span></p>
            </div>

            {/* Fim da Linha */}
            <div className="flex flex-col gap-1 p-3 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Parada Obrigatória</span>
                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-sm font-semibold">Coluna IMAGES</p>
              <p className="text-[11px] text-slate-300">A partir daqui, a intervenção humana é necessária para gerar artes e publicar.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
