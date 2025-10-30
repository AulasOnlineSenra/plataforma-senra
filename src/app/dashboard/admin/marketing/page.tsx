
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Target, Users, Percent, Save } from 'lucide-react';
import { marketingCosts as initialMarketingCosts } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const MARKETING_COSTS_STORAGE_KEY = 'marketingCosts';

export default function MarketingPage() {
  const [costs, setCosts] = useState(initialMarketingCosts);
  const { toast } = useToast();

  useEffect(() => {
    const storedCosts = localStorage.getItem(MARKETING_COSTS_STORAGE_KEY);
    if (storedCosts) {
      setCosts(JSON.parse(storedCosts));
    }
  }, []);

  const handleCostChange = (
    category: 'ads' | 'team' | 'organicCommissions' | 'paidCommissions',
    value: string
  ) => {
    setCosts((prev) => ({
      ...prev,
      [category]: parseFloat(value) || 0,
    }));
  };

  const totalCommissions = useMemo(() => {
    return costs.organicCommissions + costs.paidCommissions;
  }, [costs.organicCommissions, costs.paidCommissions]);

  const totalCost = useMemo(() => {
    return costs.ads + costs.team + totalCommissions;
  }, [costs, totalCommissions]);

  const handleSaveChanges = () => {
    localStorage.setItem(MARKETING_COSTS_STORAGE_KEY, JSON.stringify(costs));
    toast({
      title: 'Custos Salvos!',
      description: 'As alterações nos custos de marketing foram salvas.',
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Marketing
        </h1>
        <Button onClick={handleSaveChanges}>
          <Save className="mr-2" />
          Salvar Alterações
        </Button>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custos com Anúncios
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="ads-cost" className="sr-only">
                  Custo com Anúncios
                </Label>
                <Input
                  id="ads-cost"
                  type="number"
                  value={costs.ads}
                  onChange={(e) => handleCostChange('ads', e.target.value)}
                  className="text-2xl font-bold h-auto p-0 border-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                +20.1% em relação ao mês passado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custos com Equipe de Marketing
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="team-cost" className="sr-only">
                  Custo com Equipe
                </Label>
                <Input
                  id="team-cost"
                  type="number"
                  value={costs.team}
                  onChange={(e) => handleCostChange('team', e.target.value)}
                  className="text-2xl font-bold h-auto p-0 border-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Salários e ferramentas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Comissões Pagas
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalCommissions.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-xs text-muted-foreground">
                Equipes orgânico e pago
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custo Total
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalCost.toFixed(2).replace('.', ',')}</div>
              <p className="text-xs text-muted-foreground">
                Soma de todos os custos
              </p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes das Comissões</CardTitle>
            <CardDescription>
              Valores pagos por categoria de equipe de marketing.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Equipe de Marketing Orgânico</h3>
              <div className="grid gap-2 mt-1">
                <Label
                  htmlFor="organic-commissions"
                  className="sr-only"
                >
                  Comissões Orgânicas
                </Label>
                <Input
                  id="organic-commissions"
                  type="number"
                  value={costs.organicCommissions}
                  onChange={(e) =>
                    handleCostChange('organicCommissions', e.target.value)
                  }
                  className="text-2xl font-bold h-auto p-0 border-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Baseado em performance e metas atingidas.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Equipe de Marketing Pago</h3>
              <div className="grid gap-2 mt-1">
                <Label htmlFor="paid-commissions" className="sr-only">
                  Comissões Marketing Pago
                </Label>
                <Input
                  id="paid-commissions"
                  type="number"
                  value={costs.paidCommissions}
                  onChange={(e) =>
                    handleCostChange('paidCommissions', e.target.value)
                  }
                  className="text-2xl font-bold h-auto p-0 border-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Comissões sobre o resultado das campanhas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
