'use client';

import { useState } from 'react';
import { Bot, CheckCircle, AlertTriangle, XCircle, Globe, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { updateScrapingUrl } from '@/app/actions/vestibular';

export function CalendarioList({ initialData }: { initialData: any[] }) {
  const { toast } = useToast();
  const [vestibulares, setVestibulares] = useState(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSave = async (id: string, url: string) => {
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

  if (vestibulares.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
        <p className="text-slate-500">Nenhum vestibular cadastrado no banco de dados.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {vestibulares.map((vest) => {
        let StatusIcon = Bot;
        let statusColor = "text-slate-400";
        let bgIcon = "bg-slate-100";
        let statusText = "Ainda não rodou ou não configurado";

        if (vest.lastScrapeStatus === 'SUCCESS') {
          StatusIcon = CheckCircle;
          statusColor = "text-emerald-500";
          bgIcon = "bg-emerald-100";
          statusText = `Sucesso: Última verificação ${vest.lastScrapeDate ? format(new Date(vest.lastScrapeDate), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''} (${vest._count?.events || 0} datas no banco)`;
        } else if (vest.lastScrapeStatus === 'NO_DATA') {
          StatusIcon = AlertTriangle;
          statusColor = "text-amber-500";
          bgIcon = "bg-amber-100";
          statusText = `Aviso: Nenhuma data encontrada na página (${vest.lastScrapeDate ? format(new Date(vest.lastScrapeDate), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''}). Ajuste a URL!`;
        } else if (vest.lastScrapeStatus === 'ERROR') {
          StatusIcon = XCircle;
          statusColor = "text-rose-500";
          bgIcon = "bg-rose-100";
          statusText = `Erro: Falha na requisição ao site ou limite da IA (${vest.lastScrapeDate ? format(new Date(vest.lastScrapeDate), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''}).`;
        }

        return (
          <div key={vest.id} className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`rounded-full p-2 ${bgIcon}`}>
                  <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{vest.institution}</h2>
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1">
                     <span className={statusColor}>{statusText}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 md:border-l md:border-slate-100 md:pl-5">
              <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-400" /> URL de Extração (Scraping)
              </p>
              <div className="flex gap-2">
                 <input 
                    type="text" 
                    value={vest.scrapingUrl || ''} 
                    onChange={(e) => handleUrlChange(vest.id, e.target.value)}
                    placeholder="https://..."
                    className="flex-1 h-10 px-3 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-600 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
                 />
                 <Button 
                    onClick={() => handleSave(vest.id, vest.scrapingUrl || '')}
                    disabled={loadingId === vest.id}
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 shrink-0 border-slate-200 hover:bg-brand-yellow hover:text-slate-900"
                 >
                    <Save className="h-4 w-4" />
                 </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
