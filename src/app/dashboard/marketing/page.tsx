'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Save, TrendingUp, DollarSign, Users, Target } from 'lucide-react';
import { getMarketingCosts, saveMarketingCosts } from '@/app/actions/marketing';
import { MarketingCosts } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_COSTS: MarketingCosts = {
  ads: 0,
  team: 0,
  organicCommissions: 0,
  paidCommissions: 0,
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const label = format(date, 'MMMM/yyyy', { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function MarketingPage() {
  const { toast } = useToast();
  const currentMonth = format(new Date(), 'yyyy-MM');

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [costs, setCosts] = useState<MarketingCosts>(DEFAULT_COSTS);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 18 }, (_, index) => {
      const date = subMonths(new Date(), index);
      const value = format(date, 'yyyy-MM');
      return {
        value,
        label: formatMonthLabel(value),
      };
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadMarketingCosts = async () => {
      setIsLoadingMonth(true);
      const result = await getMarketingCosts(selectedMonth);

      if (!isMounted) return;

      if (result.success && result.data) {
        setCosts({
          ads: Number(result.data.ads) || 0,
          team: Number(result.data.team) || 0,
          organicCommissions: Number(result.data.organicCommissions) || 0,
          paidCommissions: Number(result.data.paidCommissions) || 0,
        });
      } else {
        setCosts(DEFAULT_COSTS);
      }

      setIsLoadingMonth(false);
    };

    loadMarketingCosts();

    return () => {
      isMounted = false;
    };
  }, [selectedMonth]);

  const totalCommissions = useMemo(() => {
    return costs.organicCommissions + costs.paidCommissions;
  }, [costs.organicCommissions, costs.paidCommissions]);

  const totalCost = useMemo(() => {
    return costs.ads + costs.team + totalCommissions;
  }, [costs.ads, costs.team, totalCommissions]);

  const handleCostChange = (category: keyof MarketingCosts, value: string) => {
    let cleanValue = value.replace(/^0+(?=\d)/, '');
    cleanValue = cleanValue.replace(',', '.');
    
    if (cleanValue === '' || isNaN(Number(cleanValue))) {
      setCosts((prev) => ({ ...prev, [category]: 0 }));
      return;
    }

    setCosts((prev) => ({
      ...prev,
      [category]: Number(cleanValue),
    }));
  };

  const handleSaveChanges = async () => {
    if (isSaving) return;

    setIsSaving(true);
    toast({ title: 'Salvando...', description: 'Atualizando custos de marketing.' });

    const result = await saveMarketingCosts(selectedMonth, {
      ads: Number(costs.ads) || 0,
      team: Number(costs.team) || 0,
      organicCommissions: Number(costs.organicCommissions) || 0,
      paidCommissions: Number(costs.paidCommissions) || 0,
    });

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: 'Despesas do mês atualizadas.',
        className: 'border-none bg-green-600 text-white',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: result.error || 'Não foi possivel salvar os custos.',
      });
    }

    setIsSaving(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Despesas de Marketing</h1>
          <p className="text-slate-500 mt-1">Gerencie os investimentos em canais de aquisição.</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isLoadingMonth || isSaving}>
            <SelectTrigger className="h-12 w-full min-w-[220px] bg-white border-slate-200 shadow-sm sm:w-[240px] text-base font-medium rounded-xl focus:ring-brand-yellow">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value} className="text-base cursor-pointer">
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleSaveChanges}
            disabled={isLoadingMonth || isSaving}
            className="h-12 rounded-xl bg-brand-yellow px-6 text-base font-bold text-slate-900 shadow-sm hover:scale-105 hover:bg-brand-yellow/90 transition-all"
          >
            <Save className="mr-2 h-5 w-5" />
            {isSaving ? 'Salvando...' : 'Salvar Mês'}
          </Button>
        </div>
      </div>

      {/* CARDS SUPERIORES */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f5b000] hover:shadow-[0_0_15px_rgba(245,176,0,0.3)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anúncios</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <input
              type="text"
              inputMode="decimal"
              value={costs.ads === 0 ? '' : costs.ads}
              placeholder="0,00"
              disabled={isLoadingMonth || isSaving}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleCostChange('ads', e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-200 text-2xl font-bold text-slate-900 focus:outline-none focus:border-brand-yellow placeholder:text-slate-300 transition-colors"
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f5b000] hover:shadow-[0_0_15px_rgba(245,176,0,0.3)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <input
              type="text"
              inputMode="decimal"
              value={costs.team === 0 ? '' : costs.team}
              placeholder="0,00"
              disabled={isLoadingMonth || isSaving}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleCostChange('team', e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-200 text-2xl font-bold text-slate-900 focus:outline-none focus:border-brand-yellow placeholder:text-slate-300 transition-colors"
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f5b000] hover:shadow-[0_0_15px_rgba(245,176,0,0.3)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <input
              type="text"
              inputMode="decimal"
              value={totalCommissions === 0 ? '' : totalCommissions}
              placeholder="0,00"
              disabled={isLoadingMonth || isSaving}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const value = Number(e.target.value.replace(/^0+(?=\d)/, '').replace(',', '.')) || 0;
                const diff = value - totalCommissions;
                if (diff !== 0) {
                  setCosts(prev => ({
                    ...prev,
                    organicCommissions: prev.organicCommissions + diff,
                  }));
                }
              }}
              className="w-full bg-transparent border-b-2 border-slate-200 text-2xl font-bold text-slate-900 focus:outline-none focus:border-brand-yellow placeholder:text-slate-300 transition-colors"
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f5b000] hover:shadow-[0_0_15px_rgba(245,176,0,0.3)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalCost.toFixed(2).replace('.', ',')}</div>
            <p className="text-xs text-muted-foreground">Total de despesas do mês</p>
          </CardContent>
        </Card>
      </div>

      {/* DETALHES DAS COMISSÕES */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm mt-2">
        <CardHeader className="border-b border-slate-100 pb-6 pt-6 px-8">
          <CardTitle className="text-xl text-slate-900">Detalhamento de Comissões</CardTitle>
          <CardDescription className="text-base text-slate-500 mt-1">
            Separe os valores de repasse por origem da venda.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-10 py-8 px-8 md:grid-cols-2">
          
          <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <Label htmlFor="organic-commissions" className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Comissão Vendas Orgânicas
            </Label>
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 font-bold text-2xl">R$</span>
              <input
                id="organic-commissions"
                type="text"
                inputMode="decimal"
                value={costs.organicCommissions === 0 ? '' : costs.organicCommissions}
                placeholder="0,00"
                disabled={isLoadingMonth || isSaving}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleCostChange('organicCommissions', e.target.value)}
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 text-4xl font-extrabold text-slate-900 focus:outline-none focus:border-brand-yellow placeholder:text-slate-200 transition-colors py-1"
              />
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <Label htmlFor="paid-commissions" className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Comissão Tráfego Pago
            </Label>
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 font-bold text-2xl">R$</span>
              <input
                id="paid-commissions"
                type="text"
                inputMode="decimal"
                value={costs.paidCommissions === 0 ? '' : costs.paidCommissions}
                placeholder="0,00"
                disabled={isLoadingMonth || isSaving}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleCostChange('paidCommissions', e.target.value)}
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 text-4xl font-extrabold text-slate-900 focus:outline-none focus:border-brand-yellow placeholder:text-slate-200 transition-colors py-1"
              />
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
