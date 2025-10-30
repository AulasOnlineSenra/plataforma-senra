
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, ArrowUp, ArrowDown, Percent, Users, Landmark, TrendingUp, TrendingDown, Banknote } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { paymentHistory as initialPaymentHistory } from '@/lib/data';
import { PaymentTransaction } from '@/lib/types';


const PAYMENT_HISTORY_STORAGE_KEY = 'paymentHistory';

export default function AdminFinancials() {
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [packageRevenue, setPackageRevenue] = useState(0);
    const [singleClassRevenue, setSingleClassRevenue] = useState(0);

    useEffect(() => {
        const updateHistory = () => {
            const storedHistory = localStorage.getItem(PAYMENT_HISTORY_STORAGE_KEY);
            let history: PaymentTransaction[] = [];
            if (storedHistory) {
                history = JSON.parse(storedHistory).map((p: any) => ({...p, date: new Date(p.date)}));
            } else {
                history = initialPaymentHistory;
            }
            setTransactions(history);

            const revenue = history.reduce((acc, t) => acc + t.amount, 0);
            setTotalRevenue(revenue);
            
            const pkgRevenue = history
                .filter(t => t.packageName && !t.packageName.toLowerCase().includes('avulsa'))
                .reduce((acc, t) => acc + t.amount, 0);
            setPackageRevenue(pkgRevenue);

            const singleRevenue = history
                .filter(t => t.packageName && t.packageName.toLowerCase().includes('avulsa'))
                .reduce((acc, t) => acc + t.amount, 0);
            setSingleClassRevenue(singleRevenue);
        };

        updateHistory();
        window.addEventListener('storage', updateHistory);
        return () => window.removeEventListener('storage', updateHistory);
    }, []);


  return (
    <div className="grid gap-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2).replace('.',',')}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                    +20.1% vs. mês anterior
                </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas Totais (Mês)</CardTitle>
                <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">R$ 28.233,50</div>
                <p className="text-xs text-muted-foreground flex items-center">
                    <ArrowDown className="h-4 w-4 text-red-500" />
                     -5.2% vs. mês anterior
                </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Líquido (Mês)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ 16.998,39</div>
                <p className="text-xs text-muted-foreground">
                    Margem de lucro: 37.6%
                </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Patrimônio Líquido</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">R$ 152.879,20</div>
                <p className="text-xs text-muted-foreground">Total acumulado</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            {/* Receitas */}
            <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-green-500" />
                        <CardTitle>Receitas</CardTitle>
                    </div>
                    <CardDescription>Origem do faturamento mensal.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Venda de pacotes de aulas</span>
                        <span className="font-bold">R$ {packageRevenue.toFixed(2).replace('.',',')}</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Aulas avulsas</span>
                        <span className="font-bold">R$ {singleClassRevenue.toFixed(2).replace('.',',')}</span>
                    </div>
                </CardContent>
                <CardContent className="mt-auto">
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between font-bold">
                        <span>Total de Receitas</span>
                        <span className="text-green-600">R$ {totalRevenue.toFixed(2).replace('.',',')}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Despesas */}
             <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingDown className="h-6 w-6 text-red-500" />
                        <CardTitle>Despesas</CardTitle>
                    </div>
                    <CardDescription>Distribuição dos custos operacionais.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pagamentos (Professores)</span>
                        <span className="font-bold">R$ 11.150,00</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Marketing e Anúncios</span>
                        <span className="font-bold">R$ 21.293,00</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Plataforma e Infra</span>
                        <span className="font-bold">R$ 1.500,00</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Comissões</span>
                        <span className="font-bold">R$ 4.890,50</span>
                    </div>
                </CardContent>
                 <CardContent className="mt-auto">
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between font-bold">
                        <span>Total de Despesas</span>
                        <span className="text-red-600">R$ 38.833,50</span>
                    </div>
                </CardContent>
            </Card>
            
            {/* Patrimônio */}
             <Card className="flex flex-col">
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <Landmark className="h-6 w-6 text-blue-500" />
                        <CardTitle>Patrimônio</CardTitle>
                    </div>
                    <CardDescription>Visão geral dos ativos e passivos.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Caixa e Equivalentes</span>
                        <span className="font-bold text-green-600">R$ 180.429,20</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pagamentos a realizar</span>
                        <span className="font-bold text-red-600">- R$ 27.550,00</span>
                    </div>
                </CardContent>
                <CardContent className="mt-auto">
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between font-bold">
                        <span>Patrimônio Líquido</span>
                        <span className="text-blue-600">R$ 152.879,20</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
