
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { DollarSign, ArrowDown, Landmark, TrendingUp, TrendingDown, Banknote, Trash2, ChevronDown, ChevronUp, User, Wallet, CheckCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { paymentHistory as initialPaymentHistory, users as initialUsers, marketingCosts as initialMarketingCosts, scheduleEvents as initialScheduleEvents, teachers as initialTeachers } from '@/lib/data';
import { PaymentTransaction, User as AppUser, MarketingCosts, ScheduleEvent, Teacher } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format, parse, isWithinInterval, startOfMonth, endOfMonth, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, getWeek, addWeeks, addMonths, startOfWeek, endOfWeek, getISODay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { toZonedTime } from 'date-fns-tz';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { getMarketingCosts } from '@/app/actions/marketing';
import { getApprovedTransactions, getCompletedClassesByPeriod, deleteTransaction } from '@/app/actions/finance';


const PAYMENT_HISTORY_STORAGE_KEY = 'paymentHistory';
const USERS_STORAGE_KEY = 'userList';
const TEACHERS_STORAGE_KEY = 'teacherList';
const MONTHLY_MARKETING_COSTS_STORAGE_KEY = 'monthlyMarketingCosts';
const TEACHER_PAYMENT_RATE_KEY = 'teacherPaymentRate';
const TEACHER_PAYMENT_DAY_KEY = 'teacherPaymentDay';
const TEACHER_PAYMENT_FREQUENCY_KEY = 'teacherPaymentFrequency';
const SCHEDULE_STORAGE_KEY = 'scheduleEvents';
const TEACHER_PAYMENT_HISTORY_KEY = 'teacherPaymentHistory';


const DEFAULT_COSTS = { ads: 0, team: 0, organicCommissions: 0, paidCommissions: 0 };


interface AdminFinancialsProps {
  selectedMonth: string;
}

interface TeacherPaymentDetails {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherAvatarUrl?: string;
  completedClasses: number;
  paymentRate: number;
  totalAmount: number;
  period: string;
}


export default function AdminFinancials({ selectedMonth }: AdminFinancialsProps) {
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [marketingCosts, setMarketingCosts] = useState<MarketingCosts>(DEFAULT_COSTS);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [packageRevenue, setPackageRevenue] = useState(0);
    const [singleClassRevenue, setSingleClassRevenue] = useState(0);
    const [transactionToDelete, setTransactionToDelete] = useState<PaymentTransaction | null>(null);
    const [deleteMode, setDeleteMode] = useState<'transaction-only' | 'all'>('all');
    const [isReceiptsOpen, setIsReceiptsOpen] = useState(false);
    const [isExpensesOpen, setIsExpensesOpen] = useState(false);
    const [isTeacherPaymentsOpen, setIsTeacherPaymentsOpen] = useState(true);
    const { toast } = useToast();
    
    // State for the bottom table (period-based)
    const [teacherPaymentDetails, setTeacherPaymentDetails] = useState<TeacherPaymentDetails[]>([]);
    const [selectedPeriodCost, setSelectedPeriodCost] = useState(0);
    
    // State for the top cards (monthly total)
    const [monthlyTeacherPaymentsCost, setMonthlyTeacherPaymentsCost] = useState(0);

    const [paymentDay, setPaymentDay] = useState('friday');
    const [paymentFrequency, setPaymentFrequency] = useState('weekly');
    
    const [paymentPeriods, setPaymentPeriods] = useState<{ label: string, value: string, start: Date, end: Date }[]>([]);
    const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | undefined>();


    const totalMarketingExpenses = marketingCosts.ads + marketingCosts.team + marketingCosts.organicCommissions + marketingCosts.paidCommissions;
    const totalMonthlyExpenses = totalMarketingExpenses + selectedPeriodCost;
    
    const nextPaymentDate = useMemo(() => {
        const now = new Date();
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const zonedNow = toZonedTime(now, userTimezone);

        const dayMap = {
            monday: nextMonday,
            tuesday: nextTuesday,
            wednesday: nextWednesday,
            thursday: nextThursday,
            friday: nextFriday,
        };

        const getNextPaymentDayFunc = dayMap[paymentDay as keyof typeof dayMap] || nextFriday;

        if (paymentFrequency === 'weekly') {
            return getNextPaymentDayFunc(zonedNow);
        }
        
        if (paymentFrequency === 'biweekly') {
            let nextDate = getNextPaymentDayFunc(zonedNow);
            const nextPaymentWeek = getWeek(nextDate, { weekStartsOn: 1 });

            if (nextPaymentWeek % 2 !== 0) { 
                nextDate = addWeeks(nextDate, 1);
            }
            return nextDate;
        }

        if (paymentFrequency === 'monthly') {
            let firstPaymentDayOfMonth = getNextPaymentDayFunc(startOfMonth(zonedNow));
            if (firstPaymentDayOfMonth < zonedNow) {
                return getNextPaymentDayFunc(startOfMonth(addMonths(zonedNow, 1)));
            } else {
                return firstPaymentDayOfMonth;
            }
        }
        
        return getNextPaymentDayFunc(zonedNow);
    }, [paymentDay, paymentFrequency]);


    useEffect(() => {
        const updateData = async () => {
            const storedPaymentDay = localStorage.getItem(TEACHER_PAYMENT_DAY_KEY);
            const currentPaymentDay = storedPaymentDay || 'friday';
            setPaymentDay(currentPaymentDay);
            
            const storedPaymentFrequency = localStorage.getItem(TEACHER_PAYMENT_FREQUENCY_KEY);
            const currentPaymentFrequency = storedPaymentFrequency || 'weekly';
            setPaymentFrequency(currentPaymentFrequency);

            const monthDate = parse(selectedMonth, 'yyyy-MM', new Date());
            const monthInterval = {
              start: startOfMonth(monthDate),
              end: endOfMonth(monthDate),
            };

            const transactionsResult = await getApprovedTransactions(selectedMonth);
            
            if (transactionsResult.success && transactionsResult.data) {
                const dbTransactions = transactionsResult.data.map((t: any) => ({
                    id: t.id,
                    studentId: t.studentId,
                    packageName: t.planName,
                    creditsAdded: t.creditsAdded,
                    amount: t.amountPaid,
                    date: new Date(t.createdAt),
                    paymentMethod: t.paymentMethod,
                    student: t.student,
                }));
                
                const monthHistory = dbTransactions.filter((t: PaymentTransaction) => isWithinInterval(t.date, monthInterval));
                setTransactions(monthHistory.sort((a: any, b: any) => b.date.getTime() - a.date.getTime()));

                const revenue = monthHistory.reduce((acc: number, t: PaymentTransaction) => acc + t.amount, 0);
                setTotalRevenue(revenue);
                
                const pkgRevenue = monthHistory
                    .filter((t: PaymentTransaction) => t.packageName && !t.packageName.toLowerCase().includes('avulsa'))
                    .reduce((acc: number, t: PaymentTransaction) => acc + t.amount, 0);
                setPackageRevenue(pkgRevenue);

                const singleRevenue = monthHistory
                    .filter((t: PaymentTransaction) => t.packageName && t.packageName.toLowerCase().includes('avulsa'))
                    .reduce((acc: number, t: PaymentTransaction) => acc + t.amount, 0);
                setSingleClassRevenue(singleRevenue);
            } else {
                setTransactions([]);
                setTotalRevenue(0);
                setPackageRevenue(0);
                setSingleClassRevenue(0);
            }

            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            if (storedUsers) {
                setUsers(JSON.parse(storedUsers));
            } else {
                setUsers(initialUsers);
            }
            
            const marketingResult = await getMarketingCosts(selectedMonth);
            if (marketingResult.success && marketingResult.data) {
                setMarketingCosts({
                    ads: Number(marketingResult.data.ads) || 0,
                    team: Number(marketingResult.data.team) || 0,
                    organicCommissions: Number(marketingResult.data.organicCommissions) || 0,
                    paidCommissions: Number(marketingResult.data.paidCommissions) || 0,
                });
            } else {
                setMarketingCosts(DEFAULT_COSTS);
            }

            const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
            const schedule: ScheduleEvent[] = storedSchedule ? JSON.parse(storedSchedule).map((e: any) => ({...e, start: new Date(e.start)})) : initialScheduleEvents;
            
            
            const storedRate = localStorage.getItem(TEACHER_PAYMENT_RATE_KEY);
            const paymentRate = storedRate ? parseFloat(storedRate) : 50;
            
            // --- Monthly Calculation for Top Cards ---
            const monthlyCompletedClasses = schedule.filter(e => 
                e.status === 'completed' && isWithinInterval(new Date(e.start), monthInterval) && !e.isExperimental
            );
            const totalMonthlyTeacherCost = monthlyCompletedClasses.length * paymentRate;
            setMonthlyTeacherPaymentsCost(totalMonthlyTeacherCost);
            
            // --- Payment Period Generation ---
            const periods: { label: string, value: string, start: Date, end: Date }[] = [];
            let periodStart = startOfWeek(monthInterval.start, { locale: ptBR });
            
            while(periodStart < monthInterval.end) {
                let periodEnd = endOfWeek(periodStart, { locale: ptBR });
                if (currentPaymentFrequency === 'biweekly') {
                    periodEnd = addWeeks(periodEnd, 1);
                } else if (currentPaymentFrequency === 'monthly') {
                    periodEnd = endOfMonth(periodStart);
                }

                periods.push({
                    label: `${'\'\''}${format(periodStart, 'dd/MM')} - ${'\'\''}${format(periodEnd, 'dd/MM')}`,
                    value: periodStart.toISOString(),
                    start: periodStart,
                    end: periodEnd,
                });
                
                if (currentPaymentFrequency === 'weekly') {
                    periodStart = addWeeks(periodStart, 1);
                } else if (currentPaymentFrequency === 'biweekly') {
                    periodStart = addWeeks(periodStart, 2);
                } else { // monthly
                    periodStart = addMonths(periodStart, 1);
                }
            }
            setPaymentPeriods(periods.reverse());

            const currentPeriodKey = periods.find(p => isWithinInterval(new Date(), {start: p.start, end: p.end}))?.value || (periods[0] ? periods[0].value : undefined);
            if (!selectedPeriodKey) {
                setSelectedPeriodKey(currentPeriodKey);
            }
        };

        updateData();
        
        window.addEventListener('storage', updateData);
        return () => window.removeEventListener('storage', updateData);
    }, [selectedMonth, selectedPeriodKey]);
    
    useEffect(() => {
        if (!selectedPeriodKey || paymentPeriods.length === 0) {
            setTeacherPaymentDetails([]);
            setSelectedPeriodCost(0);
            return;
        };

        const selectedPeriod = paymentPeriods.find(p => p.value === selectedPeriodKey);
        if (!selectedPeriod) return;

        const fetchTeacherPayments = async () => {
            const storedRate = localStorage.getItem(TEACHER_PAYMENT_RATE_KEY);
            const paymentRate = storedRate ? parseFloat(storedRate) : 50;

            const lessonsResult = await getCompletedClassesByPeriod(selectedPeriod.start, selectedPeriod.end);
            
            if (!lessonsResult.success || !lessonsResult.data) {
                setTeacherPaymentDetails([]);
                setSelectedPeriodCost(0);
                return;
            }

            const paymentsByTeacher: Record<string, Omit<TeacherPaymentDetails, 'id'|'period'>> = {};

            lessonsResult.data.forEach((lesson: any) => {
                if (!paymentsByTeacher[lesson.teacherId]) {
                    paymentsByTeacher[lesson.teacherId] = {
                        teacherId: lesson.teacherId,
                        teacherName: lesson.teacher?.name || 'Professor Desconhecido',
                        teacherAvatarUrl: lesson.teacher?.avatarUrl,
                        completedClasses: 0,
                        paymentRate: paymentRate,
                        totalAmount: 0,
                    };
                }
                paymentsByTeacher[lesson.teacherId].completedClasses += 1;
            });
            
            const paymentDetails = Object.entries(paymentsByTeacher).map(([teacherId, p]) => ({
              id: `${selectedPeriodKey}-${teacherId}`,
              ...p,
              totalAmount: p.completedClasses * p.paymentRate,
              period: selectedPeriod.label,
            })).sort((a,b) => b.totalAmount - a.totalAmount);
            
            setTeacherPaymentDetails(paymentDetails);
            setSelectedPeriodCost(paymentDetails.reduce((acc, p) => acc + p.totalAmount, 0));
        };

        fetchTeacherPayments();
    }, [selectedPeriodKey, paymentPeriods, selectedMonth]); // Rerun when month changes to recalculate periods

    const getUserById = (id: string): AppUser | undefined => {
        return users.find(u => u.id === id);
    }
    
    const handleDeleteTransaction = async (removeCredits: boolean) => {
      if (!transactionToDelete) return;

      const result = await deleteTransaction(transactionToDelete.id, removeCredits);

      if (result.success) {
        toast({
          title: removeCredits ? 'Transação Excluída' : 'Transação Excluída',
          description: removeCredits 
            ? 'A transação e os créditos correspondentes foram removidos.' 
            : 'A transação foi removida. Os créditos do aluno foram mantidos.',
        });
        setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
        setTotalRevenue(prev => prev - transactionToDelete.amount);
        
        const updatedTransactions = transactions.filter(t => t.id !== transactionToDelete.id);
        const pkgRevenue = updatedTransactions
          .filter(t => t.packageName && !t.packageName.toLowerCase().includes('avulsa'))
          .reduce((acc, t) => acc + t.amount, 0);
        setPackageRevenue(pkgRevenue);

        const singleRevenue = updatedTransactions
          .filter(t => t.packageName && t.packageName.toLowerCase().includes('avulsa'))
          .reduce((acc, t) => acc + t.amount, 0);
        setSingleClassRevenue(singleRevenue);
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao excluir transação.',
          variant: 'destructive',
        });
      }

      setTransactionToDelete(null);
      setDeleteMode('all');
    };

    const expenseItems = [
      { id: 'exp-1', date: new Date(), category: 'Pagamentos', description: 'Professores (aulas concluídas)', amount: monthlyTeacherPaymentsCost },
      { id: 'exp-2', date: new Date(), category: 'Pagamentos', description: 'Comissões (Marketing)', amount: marketingCosts.organicCommissions + marketingCosts.paidCommissions },
      { id: 'exp-3', date: new Date(), category: 'Custos de Marketing', description: 'Anúncios', amount: marketingCosts.ads },
      { id: 'exp-4', date: new Date(), category: 'Custos de Marketing', description: 'Equipe', amount: marketingCosts.team },
    ];
    
    const getFooterLabel = () => {
        return 'Total a Pagar (Semanal)';
    }


  return (
    <>
    <div className="grid gap-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f5b000] hover:shadow-[0_0_15px_rgba(245,176,0,0.3)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento (Mês)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2).replace('.',',')}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                    +20.1% vs. mês anterior
                </p>
                </CardContent>
            </Card>
            <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f5b000] hover:shadow-[0_0_15px_rgba(245,176,0,0.3)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
                <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">R$ {totalMonthlyExpenses.toFixed(2).replace('.',',')}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                    <ArrowDown className="h-4 w-4 text-red-500" />
                     -5.2% vs. mês anterior
                </p>
                </CardContent>
            </Card>
             <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f5b000] hover:shadow-[0_0_15px_rgba(245,176,0,0.3)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resultado Líquido (mês)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ {(totalRevenue - totalMonthlyExpenses).toFixed(2).replace('.',',')}</div>
                <p className="text-xs text-muted-foreground">
                    Margem: {totalRevenue > 0 ? ((totalRevenue - totalMonthlyExpenses) / totalRevenue * 100).toFixed(1) : 0}%
                </p>
                </CardContent>
            </Card>
            <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f5b000] hover:shadow-[0_0_15px_rgba(245,176,0,0.3)]">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Patrimônio Líquido (Mês)</CardTitle>
                  <CardDescription className="text-xs">Resultado do mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {(totalRevenue - totalMonthlyExpenses).toFixed(2).replace('.',',')}</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="text-green-500" />Receitas</CardTitle>
                    <CardDescription>Distribuição do faturamento.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Venda de Pacotes</span>
                        <span className="font-bold">R$ {packageRevenue.toFixed(2).replace('.',',')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Aulas Avulsas</span>
                        <span className="font-bold">R$ {singleClassRevenue.toFixed(2).replace('.',',')}</span>
                    </div>
                </CardContent>
                <CardContent className="mt-auto">
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between font-bold text-lg">
                        <span>Total de Receitas</span>
                        <span className="text-green-600">R$ {totalRevenue.toFixed(2).replace('.',',')}</span>
                    </div>
                </CardContent>
            </Card>
            <Card className="rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingDown className="text-red-500" />Despesas</CardTitle>
                    <CardDescription>Distribuição dos custos operacionais.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 flex-1">
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pagamentos (Professores)</span>
                        <span className="font-bold">R$ {selectedPeriodCost.toFixed(2).replace('.',',')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Marketing e Anúncios</span>
                        <span className="font-bold">R$ {totalMarketingExpenses.toFixed(2).replace('.',',')}</span>
                    </div>
                </CardContent>
                 <CardContent className="mt-auto">
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between font-bold text-lg">
                        <span>Total de Despesas</span>
                        <span className="text-red-600">R$ {totalMonthlyExpenses.toFixed(2).replace('.',',')}</span>
                    </div>
                </CardContent>
            </Card>
            <Card className="rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign />Resultado do Mês</CardTitle>
                    <CardDescription>Demonstração do resultado do mês.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total de Receitas</span>
                        <span className="font-bold text-green-600">R$ {totalRevenue.toFixed(2).replace('.',',')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total de Despesas</span>
                        <span className="font-bold text-red-600">- R$ {totalMonthlyExpenses.toFixed(2).replace('.',',')}</span>
                    </div>
                </CardContent>
                <CardContent className="mt-auto">
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between font-bold text-lg">
                        <span>Resultado Líquido</span>
                        <span className={(totalRevenue - totalMonthlyExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            R$ {(totalRevenue - totalMonthlyExpenses).toFixed(2).replace('.',',')}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Collapsible open={isReceiptsOpen} onOpenChange={setIsReceiptsOpen}>
            <Card className="rounded-xl">
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
                                        <TableHead className="text-center">Créditos</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map(transaction => {
                                        const studentName = (transaction as any).student?.name || getUserById(transaction.studentId)?.name || 'Aluno não encontrado';
                                        const studentAvatar = (transaction as any).student?.avatarUrl || getUserById(transaction.studentId)?.avatarUrl;
                                        return (
                                            <TableRow key={transaction.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={studentAvatar} alt={studentName} />
                                                            <AvatarFallback>{studentName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="font-medium">{studentName}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{transaction.packageName}</TableCell>
                                                <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                                                <TableCell className="text-center font-medium">+{transaction.creditsAdded}</TableCell>
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
                                            <TableCell colSpan={6} className="h-24 text-center">Nenhuma transação encontrada.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
        
        <Collapsible open={isExpensesOpen} onOpenChange={setIsExpensesOpen}>
            <Card className="rounded-xl">
                <CollapsibleTrigger asChild>
                    <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                        <div>
                            <CardTitle>Despesas Detalhadas</CardTitle>
                            <CardDescription>Detalhes dos custos operacionais.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                            {isExpensesOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </Button>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenseItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{format(item.date, 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="font-medium">{item.category}</TableCell>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right font-mono">R$ {item.amount.toFixed(2).replace('.', ',')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                             </Table>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
        <Collapsible open={isTeacherPaymentsOpen} onOpenChange={setIsTeacherPaymentsOpen}>
            <Card className="rounded-xl">
                <CollapsibleTrigger asChild>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer gap-4">
                        <div className="flex-1">
                            <CardTitle>Pagamentos de Professores</CardTitle>
                            <CardDescription>
                                Detalhes para aulas concluídas no período. Próximo pagamento em: {format(nextPaymentDate, 'dd/MM/yyyy')}
                            </CardDescription>
                        </div>
                        <div className="flex w-full sm:w-auto items-center gap-2">
                             <Label htmlFor="period-filter" className="sr-only">Filtrar Período</Label>
                             <Select value={selectedPeriodKey} onValueChange={setSelectedPeriodKey}>
                                <SelectTrigger id="period-filter" className="w-full justify-center text-center sm:w-[180px]">
                                    <SelectValue placeholder="Selecione um período" />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentPeriods.map(p => (
                                        <SelectItem key={p.value} value={p.value}>
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" className='hidden sm:inline-flex'>
                                {isTeacherPaymentsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </Button>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Professor</TableHead>
                                        <TableHead>Período</TableHead>
                                        <TableHead className="text-center">Aulas Concluídas</TableHead>
                                        <TableHead className="text-center">Valor por Aula</TableHead>
                                        <TableHead className="text-right">Total a Pagar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teacherPaymentDetails.map(payment => (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={payment.teacherAvatarUrl} alt={payment.teacherName} />
                                                        <AvatarFallback>{payment.teacherName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="font-medium">{payment.teacherName}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{payment.period}</TableCell>
                                            <TableCell className="text-center font-medium">{payment.completedClasses}</TableCell>
                                            <TableCell className="text-center font-mono">R$ {payment.paymentRate.toFixed(2).replace('.', ',')}</TableCell>
                                            <TableCell className="text-right font-bold">R$ {payment.totalAmount.toFixed(2).replace('.', ',')}</TableCell>
                                        </TableRow>
                                    ))}
                                    {teacherPaymentDetails.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">Nenhum pagamento de professor para este período.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                    <TableCell colSpan={4} className="text-right font-bold">{getFooterLabel()}</TableCell>
                                    <TableCell className="text-right font-extrabold text-lg">R$ {selectedPeriodCost.toFixed(2).replace('.', ',')}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    </div>
    
    <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
        <AlertDialogContent className="sm:max-w-[650px] border-amber-50 shadow-xl">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 font-headline">
                    <Trash2 className="h-5 w-5 text-rose-600" />
                    Confirmar Exclusão de Receita
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base pt-2 text-slate-500">
                    Esta ação é irreversível e removerá o registro financeiro permanentemente.
                </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Resumo da Transação em Destaque */}
            <div className="my-6 rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-inner">
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aluno</span>
                        <p className="font-bold text-slate-900 truncate text-base leading-none">
                            {getUserById(transactionToDelete?.studentId || '')?.name || 'Carregando...'}
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valor Total</span>
                        <p className="text-xl font-black text-slate-950 font-mono tracking-tight leading-none">
                            R$ {transactionToDelete?.amount.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                    <div className="col-span-2 flex items-center gap-4 pt-4 border-t border-slate-200/60">
                        <div className="flex-1 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pacote / Produto</span>
                            <p className="text-sm font-medium text-slate-600 truncate">{transactionToDelete?.packageName}</p>
                        </div>
                        <div className="text-right space-y-1">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID Ref</span>
                             <p className="text-[10px] font-mono text-slate-300">#{transactionToDelete?.id.slice(0, 8)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <AlertDialogCancel className="w-full sm:w-auto mt-0 order-3 sm:order-1 h-12 border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl transition-all">
                    Cancelar
                </AlertDialogCancel>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1 justify-end order-1 sm:order-2">
                    <Button 
                        variant="outline" 
                        className="w-full sm:w-auto h-12 border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 rounded-xl transition-all"
                        onClick={() => handleDeleteTransaction(false)}
                    >
                        Excluir receita
                    </Button>
                    <Button 
                        variant="destructive"
                        className="w-full sm:w-auto h-12 bg-rose-600 hover:bg-rose-700 shadow-md rounded-xl font-bold transition-all px-6"
                        onClick={() => handleDeleteTransaction(true)}
                    >
                        Excluir receita + crédito
                    </Button>
                </div>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
