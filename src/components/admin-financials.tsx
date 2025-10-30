
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, ArrowDown, Landmark, TrendingUp, TrendingDown, Banknote, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { paymentHistory as initialPaymentHistory, users as initialUsers, marketingCosts as initialMarketingCosts, scheduleEvents as initialScheduleEvents } from '@/lib/data';
import { PaymentTransaction, User, MarketingCosts, ScheduleEvent } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';


const PAYMENT_HISTORY_STORAGE_KEY = 'paymentHistory';
const USERS_STORAGE_KEY = 'userList';
const MARKETING_COSTS_STORAGE_KEY = 'marketingCosts';
const TEACHER_PAYMENT_RATE_KEY = 'teacherPaymentRate';
const SCHEDULE_STORAGE_KEY = 'scheduleEvents';

export default function AdminFinancials() {
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [marketingCosts, setMarketingCosts] = useState<MarketingCosts>(initialMarketingCosts);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [packageRevenue, setPackageRevenue] = useState(0);
    const [singleClassRevenue, setSingleClassRevenue] = useState(0);
    const [transactionToDelete, setTransactionToDelete] = useState<PaymentTransaction | null>(null);
    const [isReceiptsOpen, setIsReceiptsOpen] = useState(true);
    const { toast } = useToast();
    const [teacherPaymentsCost, setTeacherPaymentsCost] = useState(0);

    const totalMarketingExpenses = marketingCosts.ads + marketingCosts.team + marketingCosts.organicCommissions + marketingCosts.paidCommissions;
    const totalExpenses = totalMarketingExpenses + teacherPaymentsCost;


    useEffect(() => {
        const updateData = () => {
            const storedHistory = localStorage.getItem(PAYMENT_HISTORY_STORAGE_KEY);
            const history = storedHistory ? JSON.parse(storedHistory).map((p: any) => ({ ...p, date: new Date(p.date) })) : initialPaymentHistory;
            
            setTransactions(history.sort((a: PaymentTransaction, b: PaymentTransaction) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            const revenue = history.reduce((acc: number, t: PaymentTransaction) => acc + t.amount, 0);
            setTotalRevenue(revenue);
            
            const pkgRevenue = history
                .filter((t: PaymentTransaction) => t.packageName && !t.packageName.toLowerCase().includes('avulsa'))
                .reduce((acc: number, t: PaymentTransaction) => acc + t.amount, 0);
            setPackageRevenue(pkgRevenue);

            const singleRevenue = history
                .filter((t: PaymentTransaction) => t.packageName && t.packageName.toLowerCase().includes('avulsa'))
                .reduce((acc: number, t: PaymentTransaction) => acc + t.amount, 0);
            setSingleClassRevenue(singleRevenue);

            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            if (storedUsers) {
                setUsers(JSON.parse(storedUsers));
            } else {
                setUsers(initialUsers);
            }

            const storedMarketingCosts = localStorage.getItem(MARKETING_COSTS_STORAGE_KEY);
            if (storedMarketingCosts) {
                setMarketingCosts(JSON.parse(storedMarketingCosts));
            } else {
                setMarketingCosts(initialMarketingCosts);
            }

            const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
            const schedule: ScheduleEvent[] = storedSchedule ? JSON.parse(storedSchedule) : initialScheduleEvents;
            const completedClasses = schedule.filter(e => e.status === 'completed').length;

            const storedRate = localStorage.getItem(TEACHER_PAYMENT_RATE_KEY);
            const paymentRate = storedRate ? parseFloat(storedRate) : 50;

            setTeacherPaymentsCost(completedClasses * paymentRate);
        };

        updateData();
        
        window.addEventListener('storage', updateData);
        return () => window.removeEventListener('storage', updateData);
    }, []);

    const getUserById = (id: string): User | undefined => {
        return users.find(u => u.id === id);
    }
    
    const handleDeleteTransaction = () => {
        if (!transactionToDelete) return;

        const updatedTransactions = transactions.filter(t => t.id !== transactionToDelete.id);
        
        setTransactions(updatedTransactions);
        localStorage.setItem(PAYMENT_HISTORY_STORAGE_KEY, JSON.stringify(updatedTransactions));
        
        const revenue = updatedTransactions.reduce((acc, t) => acc + t.amount, 0);
        setTotalRevenue(revenue);
        const pkgRevenue = updatedTransactions.filter(t => t.packageName && !t.packageName.toLowerCase().includes('avulsa')).reduce((acc, t) => acc + t.amount, 0);
        setPackageRevenue(pkgRevenue);
        const singleRevenue = updatedTransactions.filter(t => t.packageName && t.packageName.toLowerCase().includes('avulsa')).reduce((acc, t) => acc + t.amount, 0);
        setSingleClassRevenue(singleRevenue);

        toast({
            title: 'Transação Excluída',
            description: 'A transação foi removida com sucesso.',
        });
        setTransactionToDelete(null);
    }


  return (
    <>
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
                <div className="text-2xl font-bold">R$ {totalExpenses.toFixed(2).replace('.',',')}</div>
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
                <div className="text-2xl font-bold text-green-600">R$ {totalRevenue - totalExpenses > 0 ? (totalRevenue - totalExpenses).toFixed(2).replace('.',',') : '0,00'}</div>
                <p className="text-xs text-muted-foreground">
                    Margem de lucro: {totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : 0}%
                </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Patrimônio Líquido</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">R$ {(totalRevenue - totalExpenses).toFixed(2).replace('.',',')}</div>
                <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
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
                        <span className="font-bold">R$ {teacherPaymentsCost.toFixed(2).replace('.',',')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Custo Total de Marketing</span>
                        <span className="font-bold">R$ {totalMarketingExpenses.toFixed(2).replace('.',',')}</span>
                    </div>
                </CardContent>
                 <CardContent className="mt-auto">
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between font-bold">
                        <span>Total de Despesas</span>
                        <span className="text-red-600">R$ {totalExpenses.toFixed(2).replace('.',',')}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Patrimônio Líquido */}
             <Card className="flex flex-col">
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <Landmark className="h-6 w-6 text-blue-500" />
                        <CardTitle>Patrimônio Líquido</CardTitle>
                    </div>
                    <CardDescription>Visão geral dos ativos e passivos.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total de Receitas</span>
                        <span className="font-bold text-green-600">R$ {totalRevenue.toFixed(2).replace('.', ',')}</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total de Despesas</span>
                        <span className="font-bold text-red-600">- R$ {totalExpenses.toFixed(2).replace('.', ',')}</span>
                    </div>
                </CardContent>
                <CardContent className="mt-auto">
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between font-bold">
                        <span>Patrimônio Líquido</span>
                        <span className="text-blue-600">R$ {(totalRevenue - totalExpenses).toFixed(2).replace('.', ',')}</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Collapsible open={isReceiptsOpen} onOpenChange={setIsReceiptsOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                        <div>
                            <CardTitle>Receitas</CardTitle>
                            <CardDescription>Lista das últimas vendas de pacotes de aulas.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                            {isReceiptsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </Button>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Aluno</TableHead>
                                    <TableHead>Pacote</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.slice(0, 5).map(transaction => {
                                    const user = getUserById(transaction.studentId);
                                    return (
                                        <TableRow key={transaction.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                                                        <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="font-medium">{user?.name || 'Aluno não encontrado'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{transaction.packageName}</TableCell>
                                            <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                                            <TableCell className="text-right font-mono">R$ {transaction.amount.toFixed(2).replace('.', ',')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setTransactionToDelete(transaction)}>
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Excluir</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {transactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">Nenhuma transação encontrada.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    </div>
    <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação de <span className="font-bold">{getUserById(transactionToDelete?.studentId || '')?.name}</span> no valor de R$ {transactionToDelete?.amount.toFixed(2).replace('.',',')}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTransaction}>
                    Excluir
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
