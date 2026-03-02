'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Save } from 'lucide-react';
import { getMarketingCosts, saveMarketingCosts } from '@/app/actions/marketing';
import { MarketingCosts } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
        toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Falha ao carregar custos.' });
      }

      setIsLoadingMonth(false);
    };

    loadMarketingCosts();

    return () => {
      isMounted = false;
    };
  }, [selectedMonth, toast]);

  const totalCommissions = useMemo(() => {
    return costs.organicCommissions + costs.paidCommissions;
  }, [costs.organicCommissions, costs.paidCommissions]);

  const totalCost = useMemo(() => {
    return costs.ads + costs.team + totalCommissions;
  }, [costs.ads, costs.team, totalCommissions]);

  const handleCostChange = (category: keyof MarketingCosts, value: string) => {
    const cleanValue = value.replace(/^0+(?=\d)/, '');
    const normalizedValue = cleanValue === '' ? '0' : cleanValue;
    const parsedValue = Number(normalizedValue.replace(',', '.'));

    setCosts((prev) => ({
      ...prev,
      [category]: Number.isFinite(parsedValue) ? parsedValue : 0,
    }));
  };

  const handleSaveChanges = async () => {
    if (isSaving) return;

    setIsSaving(true);
    toast({ title: 'Salvando...', description: 'Persistindo custos de marketing no banco.' });

    const result = await saveMarketingCosts(selectedMonth, {
      ads: Number(costs.ads) || 0,
      team: Number(costs.team) || 0,
      organicCommissions: Number(costs.organicCommissions) || 0,
      paidCommissions: Number(costs.paidCommissions) || 0,
    });

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: 'Custos de marketing atualizados com sucesso.',
        className: 'border-none bg-green-600 text-white',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: result.error || 'Nao foi possivel salvar os custos de marketing.',
      });
    }

    setIsSaving(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 bg-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold mb-6 text-slate-900">Despesas de Marketing</h1>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isLoadingMonth || isSaving}>
            <SelectTrigger className="h-11 w-full min-w-[220px] bg-white sm:w-[240px]">
              <SelectValue placeholder="Selecione o mes" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleSaveChanges}
            disabled={isLoadingMonth || isSaving}
            className="h-11 bg-brand-yellow font-bold text-slate-900 hover:bg-brand-yellow/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Anuncios</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              inputMode="decimal"
              value={costs.ads}
              disabled={isLoadingMonth || isSaving}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleCostChange('ads', e.target.value)}
              className="h-auto rounded-none border-0 border-b border-slate-200 bg-transparent px-0 text-3xl font-extrabold text-slate-900 shadow-none focus-visible:border-brand-yellow focus-visible:ring-0"
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              inputMode="decimal"
              value={costs.team}
              disabled={isLoadingMonth || isSaving}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleCostChange('team', e.target.value)}
              className="h-auto rounded-none border-0 border-b border-slate-200 bg-transparent px-0 text-3xl font-extrabold text-slate-900 shadow-none focus-visible:border-brand-yellow focus-visible:ring-0"
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Comissoes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-slate-900">{currencyFormatter.format(totalCommissions)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Custo Total</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-slate-900">{currencyFormatter.format(totalCost)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-slate-900">Detalhes das Comissoes</CardTitle>
          <CardDescription>Edite os custos de comissoes para canais organico e pago.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 py-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label htmlFor="organic-commissions" className="text-sm font-medium text-slate-600">
              Comissao Organica
            </Label>
            <Input
              id="organic-commissions"
              type="text"
              inputMode="decimal"
              value={costs.organicCommissions}
              disabled={isLoadingMonth || isSaving}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleCostChange('organicCommissions', e.target.value)}
              className="h-auto rounded-none border-0 border-b border-slate-200 bg-transparent px-0 text-3xl font-extrabold text-slate-900 shadow-none focus-visible:border-brand-yellow focus-visible:ring-0"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="paid-commissions" className="text-sm font-medium text-slate-600">
              Comissao Pago
            </Label>
            <Input
              id="paid-commissions"
              type="text"
              inputMode="decimal"
              value={costs.paidCommissions}
              disabled={isLoadingMonth || isSaving}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleCostChange('paidCommissions', e.target.value)}
              className="h-auto rounded-none border-0 border-b border-slate-200 bg-transparent px-0 text-3xl font-extrabold text-slate-900 shadow-none focus-visible:border-brand-yellow focus-visible:ring-0"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
            <p className="text-sm text-slate-500">Total de Comissoes no mes</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">{currencyFormatter.format(totalCommissions)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
