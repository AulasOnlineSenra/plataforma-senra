
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

const teacherPayments = [
    { name: 'Ana Silva', amount: 'R$ 3.800,00', status: 'pago', date: '05/07/2024' },
    { name: 'Carlos Lima', amount: 'R$ 4.250,00', status: 'pago', date: '05/07/2024' },
    { name: 'Beatriz Costa', amount: 'R$ 3.100,00', status: 'pendente', date: 'A pagar' },
];

export default function AdminFinancials() {
  return (
    <div className="grid gap-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">R$ 45.231,89</div>
                <p className="text-xs text-muted-foreground flex items-center">
                    <ArrowUp className="h-4 w-4 text-green-500" />
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
                        <span className="font-bold">R$ 42.180,00</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Aulas avulsas</span>
                        <span className="font-bold">R$ 3.051,89</span>
                    </div>
                </CardContent>
                <CardContent className="mt-auto">
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between font-bold">
                        <span>Total de Receitas</span>
                        <span className="text-green-600">R$ 45.231,89</span>
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
