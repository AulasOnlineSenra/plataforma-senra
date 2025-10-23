
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, ArrowUp, ArrowDown, Percent, Users, Landmark } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from './ui/badge';

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
                <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">42%</div>
                <p className="text-xs text-muted-foreground">Média de todos os planos</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            {/* Despesas Detalhadas */}
            <Card>
                <CardHeader>
                    <CardTitle>Despesas Detalhadas</CardTitle>
                    <CardDescription>Distribuição dos custos operacionais do mês.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pagamentos para professores</span>
                        <span className="font-bold">R$ 11.150,00</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Custos com site/plataforma</span>
                        <span className="font-bold">R$ 1.500,00</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Custos com Anúncios</span>
                        <span className="font-bold">R$ 12.543,00</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Custos com Equipe de Marketing</span>
                        <span className="font-bold">R$ 8.750,00</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Comissões Pagas</span>
                        <span className="font-bold">R$ 4.890,50</span>
                    </div>
                </CardContent>
            </Card>

            {/* Gestão de Pagamentos de Professores */}
            <Card>
                <CardHeader>
                    <CardTitle>Gestão de Professores</CardTitle>
                    <CardDescription>Histórico e status dos pagamentos.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Professor</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teacherPayments.map((payment) => (
                            <TableRow key={payment.name}>
                                <TableCell className="font-medium">{payment.name}</TableCell>
                                <TableCell>{payment.amount}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={payment.status === 'pago' ? 'default' : 'destructive'} className={payment.status === 'pago' ? 'bg-green-100 text-green-800' : ''}>
                                        {payment.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
