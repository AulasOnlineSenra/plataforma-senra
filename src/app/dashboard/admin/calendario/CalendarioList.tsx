'use client';

import { useState } from 'react';
import { Bot, CheckCircle, AlertTriangle, XCircle, Globe, Save, Check, Sparkles, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateScrapingUrl, approveEvent } from '@/app/actions/vestibular';
import { updateSettings } from '@/app/actions/settings';

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'INSCRIÇÃO': { label: 'Inscrição', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  'INSCRICAO': { label: 'Inscrição', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  'PAGAMENTO': { label: 'Pagamento', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  'PROVA': { label: 'Prova', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  'RESULTADO': { label: 'Resultado', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  'MATRÍCULA': { label: 'Matrícula', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  'MATRICULA': { label: 'Matrícula', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

function getEventStyle(type: string) {
  const normalized = type.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, val] of Object.entries(EVENT_TYPE_LABELS)) {
    const normKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(normKey)) return val;
  }
  return { label: type, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' };
}

export function CalendarioList({ initialData, scraperConfig }: { initialData: any[], scraperConfig: any }) {
  const { toast } = useToast();
  const [vestibulares, setVestibulares] = useState(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isScrapingNow, setIsScrapingNow] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

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

  const handleApproveEvent = async (vestId: string, eventId: string) => {
    setApprovingId(eventId);
    const res = await approveEvent(eventId);
    setApprovingId(null);
    if (res.success) {
      setVestibulares(prev => prev.map(v => {
        if (v.id !== vestId) return v;
        return {
          ...v,
          events: v.events.map((e: any) => e.id === eventId ? { ...e, status: 'APPROVED' } : e)
        };
      }));
      toast({ title: 'Aprovado!', description: 'A data agora está visível na página pública.', className: 'border-none bg-green-600 text-white' });
    }
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

  const sortedVestibulares = [...vestibulares].sort((a, b) => {
    const aHasUrl = !!a.scrapingUrl;
    const bHasUrl = !!b.scrapingUrl;
    if (aHasUrl && !bHasUrl) return -1;
    if (!aHasUrl && bHasUrl) return 1;
    return a.institution.localeCompare(b.institution);
  });

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
                  Sistema de &quot;Quarentena&quot;
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Se ativado, as datas extraídas entrarão com status &quot;Pendente&quot; para você aprovar antes que os alunos possam ver.
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
            <div className="flex flex-col gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-full md:w-[200px] border-slate-200 focus:ring-brand-yellow text-sm bg-white">
                  <SelectValue placeholder="Modelo de IA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-3.6-flash">gemini-3.6-flash</SelectItem>
                  <SelectItem value="gemini-3.5-flash">gemini-3.5-flash</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                disabled={isScrapingNow}
                onClick={async () => {
                  try {
                    setIsScrapingNow(true);
                    toast({ title: 'A IA está analisando...', description: 'O Gemini está lendo os sites oficiais, aguarde...' });
                    const res = await fetch('/api/scraper/calendario', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ model: selectedModel })
                    });
                    if (!res.ok) throw new Error('Erro na requisição');
                    const data = await res.json();
                    if (data.success) {
                       toast({ title: 'Sucesso!', description: `Extração finalizada. ${data.updated} datas coletadas.`, className: 'border-none bg-green-600 text-white' });
                       window.location.reload();
                    } else {
                       toast({ title: 'Aviso', description: data.error || 'O processo encerrou com possíveis avisos.', variant: 'destructive' });
                    }
                  } catch(e) {
                    toast({ title: 'Erro', description: 'Falha ao executar o scraper', variant: 'destructive' });
                  } finally {
                    setIsScrapingNow(false);
                  }
                }}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
              >
                {isScrapingNow ? 'Varrendo sites...' : 'Rodar Robô Agora'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Institutions List */}
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
          <div className="max-h-[600px] overflow-y-auto p-4 bg-slate-50/50 flex flex-col gap-3 custom-scrollbar">
            {sortedVestibulares.map((vest) => {
              let StatusIcon = Bot;
              let statusColor = "text-slate-400";
              let bgIcon = "bg-slate-100";
              let statusText = "Ainda não rodou ou não configurado";
              const eventCount = vest._count?.events || vest.events?.length || 0;

              if (vest.lastScrapeStatus === 'SUCCESS') {
                StatusIcon = CheckCircle;
                statusColor = "text-emerald-600";
                bgIcon = "bg-emerald-100";
                statusText = `Sucesso: ${vest.lastScrapeDate ? format(new Date(vest.lastScrapeDate), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''} (${eventCount} datas)`;
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

              const isExpanded = expandedId === vest.id;
              const hasEvents = vest.events && vest.events.length > 0;

              return (
                <div key={vest.id} className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Row header */}
                  <div className="flex flex-col md:flex-row gap-4 p-4 items-center justify-between">
                    <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[280px]">
                      <div className={`rounded-xl p-2 shrink-0 ${bgIcon}`}>
                        <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-slate-900 truncate">{vest.institution}</h2>
                          {hasEvents && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : vest.id)}
                              className="flex items-center gap-1 text-xs font-semibold text-fuchsia-600 hover:text-fuchsia-800 transition-colors shrink-0"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              {isExpanded ? 'Fechar' : 'Ver datas'}
                            </button>
                          )}
                        </div>
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

                  {/* Expandable events panel */}
                  {isExpanded && hasEvents && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-4 pb-4 pt-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Datas extraídas — {vest.events.length} evento(s)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {vest.events.map((ev: any) => {
                          const style = getEventStyle(ev.type);
                          const isPending = ev.status === 'PENDING';
                          return (
                            <div
                              key={ev.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} relative`}
                            >
                              <div className="flex-1 min-w-0">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${style.color}`}>
                                  {style.label}
                                </span>
                                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                                  {format(new Date(ev.dateStart), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </p>
                                {ev.description && (
                                  <p className="text-xs text-slate-500 mt-0.5 truncate">{ev.description}</p>
                                )}
                              </div>
                              {isPending && (
                                <button
                                  onClick={() => handleApproveEvent(vest.id, ev.id)}
                                  disabled={approvingId === ev.id}
                                  className="shrink-0 text-[10px] font-bold bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                                >
                                  {approvingId === ev.id ? '...' : 'Aprovar'}
                                </button>
                              )}
                              {!isPending && (
                                <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                                  ✓ Pub.
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}} />
    </div>
  );
}
