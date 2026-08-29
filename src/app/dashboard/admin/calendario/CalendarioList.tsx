'use client';

import { useState } from 'react';
import { Bot, CheckCircle, AlertTriangle, XCircle, Globe, Save, Check, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateScrapingUrl } from '@/app/actions/vestibular';
import { updateSettings } from '@/app/actions/settings';

export function CalendarioList({ initialData, scraperConfig }: { initialData: any[], scraperConfig: any }) {
  const { toast } = useToast();
  const [vestibulares, setVestibulares] = useState(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isScrapingNow, setIsScrapingNow] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [scraperRequiresApproval, setScraperRequiresApproval] = useState(scraperConfig?.scraperRequiresApproval ?? true);
  const [scraperFrequency, setScraperFrequency] = useState(scraperConfig?.scraperFrequency || 'weekly');

  const handleSaveUrl = async (id: string, url: string) => {
    setLoadingId(id);
    const res = await updateScrapingUrl(id, url);
    setLoadingId(null);

    if (res.success) {
      toast({ title: 'Sucesso', description: 'URL atualizada.', className: 'border-none bg-green-600 text-white' });
    } else {
      toast({ title: 'Erro', description: res.error, variant: 'destructive' });
    }
  };

  const handleUrlChange = (id: string, url: string) => {
    setVestibulares(prev => prev.map(v => v.id === id ? { ...v, scrapingUrl: url } : v));
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    const result = await updateSettings({
      scraperRequiresApproval,
      scraperFrequency
    } as any);
    setIsSavingConfig(false);

    if (result.success) {
      toast({ title: 'Configurações salvas', description: 'As preferências do robô foram atualizadas.', className: 'border-none bg-green-600 text-white' });
    } else {
      toast({ title: 'Erro', description: 'Falha ao salvar as configurações.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Scraper Settings Card */}
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-fuchsia-100 p-3 text-fuchsia-600">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">Robô Extração (Datas Vestibulares)</CardTitle>
              <CardDescription>Automatize a coleta das datas nos sites oficiais via IA</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6 p-4 rounded-xl border border-slate-200 bg-white">
            <div className="space-y-4">
              <div>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Check className="w-5 h-5 text-fuchsia-500" />
                  Sistema de "Quarentena"
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Se ativado, as datas extraídas entrarão com status "Pendente" para você aprovar antes que os alunos possam ver.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch 
                   checked={scraperRequiresApproval} 
                   onCheckedChange={setScraperRequiresApproval} 
                   className="data-[state=checked]:bg-fuchsia-600"
                />
                <Label className="font-medium">Exigir aprovação manual</Label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                 <Label>Frequência da Varredura Automática</Label>
                 <Select value={scraperFrequency} onValueChange={setScraperFrequency}>
                    <SelectTrigger className="border-slate-200 focus:ring-brand-yellow">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário (Recomendado na reta final)</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="bg-brand-yellow hover:bg-amber-400 text-slate-900 font-bold"
            >
              {isSavingConfig ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <p className="font-medium text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Forçar Sincronização Agora
              </p>
              <p className="text-sm text-slate-500 max-w-lg mt-1">
                Aperte este botão para ignorar a frequência acima e obrigar o robô a varrer os sites imediatamente.
              </p>
            </div>
            <Button
              type="button"
              disabled={isScrapingNow}
              onClick={async () => {
                try {
                  setIsScrapingNow(true);
                  toast({ title: 'A IA está analisando...', description: 'O Gemini está lendo os sites oficiais, aguarde...' });
                  const res = await fetch('/api/scraper/calendario', { method: 'POST' });
                  if (!res.ok) throw new Error('Erro na requisição');
                  const data = await res.json();
                  if(data.success) {
                     toast({ title: 'Sucesso!', description: 'Extração finalizada com sucesso.', className: 'border-none bg-green-600 text-white' });
                     window.location.reload(); // Atualiza a página para ver os novos status
                  } else {
                     toast({ title: 'Aviso', description: 'O processo encerrou com possíveis avisos. Cheque os logs.', variant: 'destructive' });
                  }
                } catch(e) {
                  toast({ title: 'Erro', description: 'Falha ao executar o scraper', variant: 'destructive' });
                } finally {
                  setIsScrapingNow(false);
                }
              }}
              className="shrink-0 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            >
              {isScrapingNow ? 'Varrendo sites...' : 'Rodar Robô Agora'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Institutions List with Scrollbar */}
      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-bold text-slate-900">Instituições Monitoradas</h2>
          <p className="text-sm text-slate-500 mt-1">Status individual e logs da última extração de cada vestibular.</p>
        </div>
        
        {vestibulares.length === 0 ? (
          <div className="p-8 text-center bg-slate-50">
            <p className="text-slate-500">Nenhum vestibular cadastrado no banco de dados.</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto p-4 bg-slate-50/50 flex flex-col gap-3 custom-scrollbar">
            {vestibulares.map((vest) => {
              let StatusIcon = Bot;
              let statusColor = "text-slate-400";
              let bgIcon = "bg-slate-100";
              let statusText = "Ainda não rodou ou não configurado";

              if (vest.lastScrapeStatus === 'SUCCESS') {
                StatusIcon = CheckCircle;
                statusColor = "text-emerald-600";
                bgIcon = "bg-emerald-100";
                statusText = `Sucesso: ${vest.lastScrapeDate ? format(new Date(vest.lastScrapeDate), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''} (${vest._count?.events || 0} datas)`;
              } else if (vest.lastScrapeStatus === 'NO_DATA') {
                StatusIcon = AlertTriangle;
                statusColor = "text-amber-600";
                bgIcon = "bg-amber-100";
                statusText = `Aviso: Nenhuma data encontrada (${vest.lastScrapeDate ? format(new Date(vest.lastScrapeDate), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''})`;
              } else if (vest.lastScrapeStatus === 'ERROR') {
                StatusIcon = XCircle;
                statusColor = "text-rose-600";
                bgIcon = "bg-rose-100";
                statusText = `Erro: Falha na IA ou conexão (${vest.lastScrapeDate ? format(new Date(vest.lastScrapeDate), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''})`;
              }

              return (
                <div key={vest.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow items-center justify-between">
                  <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[320px]">
                    <div className={`rounded-xl p-2 shrink-0 ${bgIcon}`}>
                      <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-slate-900 truncate">{vest.institution}</h2>
                      <p className={`text-xs font-medium mt-0.5 truncate ${statusColor}`}>
                        {statusText}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-lg">
                    <Globe className="h-4 w-4 text-slate-400 shrink-0 hidden md:block" />
                    <input 
                      type="text" 
                      value={vest.scrapingUrl || ''} 
                      onChange={(e) => handleUrlChange(vest.id, e.target.value)}
                      placeholder="URL de extração (Ex: https://...)"
                      className="flex-1 h-9 px-3 text-sm rounded-md border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow min-w-[200px]"
                    />
                    <Button 
                      onClick={() => handleSaveUrl(vest.id, vest.scrapingUrl || '')}
                      disabled={loadingId === vest.id}
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9 shrink-0 border-slate-200 hover:bg-brand-yellow hover:text-slate-900"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      
      {/* Scrollbar Styles Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}} />
    </div>
  );
}
