
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
    const totalMonthlyExpenses = totalMarketingExpenses + monthlyTeacherPaymentsCost;
    
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
        const updateData = () => {
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

            const storedHistory = localStorage.getItem(PAYMENT_HISTORY_STORAGE_KEY);
            const allHistory: PaymentTransaction[] = storedHistory ? JSON.parse(storedHistory).map((p: any) => ({ ...p, date: new Date(p.date) })) : initialPaymentHistory;
            
            const monthHistory = allHistory.filter(t => isWithinInterval(t.date, monthInterval));

            setTransactions(monthHistory.sort((a, b) => b.date.getTime() - a.date.getTime()));

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

            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            if (storedUsers) {
                setUsers(JSON.parse(storedUsers));
            } else {
                setUsers(initialUsers);
            }
            
            const storedMonthlyCosts = localStorage.getItem(MONTHLY_MARKETING_COSTS_STORAGE_KEY);
            let allCosts = {};
            if (storedMonthlyCosts) {
                allCosts = JSON.parse(storedMonthlyCosts);
                setMarketingCosts(allCosts[selectedMonth] || DEFAULT_COSTS);
            } else {
                const initialData = { [format(new Date(), 'yyyy-MM')]: initialMarketingCosts };
                localStorage.setItem(MONTHLY_MARKETING_COSTS_STORAGE_KEY, JSON.stringify(initialData));
                allCosts = initialData;
                setMarketingCosts(selectedMonth === format(new Date(), 'yyyy-MM') ? initialMarketingCosts : DEFAULT_COSTS);
            }

            const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
            const schedule: ScheduleEvent[] = storedSchedule ? JSON.parse(storedSchedule).map((e: any) => ({...e, start: new Date(e.start)})) : initialScheduleEvents;
            
            
            const storedRate = localStorage.getItem(TEACHER_PAYMENT_RATE_KEY);
            const paymentRate = storedRate ? parseFloat(storedRate) : 50;
            
            // --- Monthly Calculation for Top Cards ---
            const monthlyCompletedClasses = schedule.filter(e => 
                e.status === 'completed' && isWithinInterval(new Date(e.start), monthInterval)
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
                    label: `${format(periodStart, 'dd/MM')} - ${format(periodEnd, 'dd/MM')}`,
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

        const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        const schedule: ScheduleEvent[] = storedSchedule ? JSON.parse(storedSchedule).map((e: any) => ({...e, start: new Date(e.start)})) : initialScheduleEvents;
        
        const storedTeachers = localStorage.getItem(TEACHERS_STORAGE_KEY);
        const teachers: Teacher[] = storedTeachers ? JSON.parse(storedTeachers) : initialTeachers;
        
        const storedRate = localStorage.getItem(TEACHER_PAYMENT_RATE_KEY);
        const paymentRate = storedRate ? parseFloat(storedRate) : 50;

        const paymentsByTeacher: Record<string, Omit<TeacherPaymentDetails, 'id'|'period'>> = {};

        const classesInPeriod = schedule.filter(e => 
            e.status === 'completed' && isWithinInterval(new Date(e.start), { start: selectedPeriod.start, end: selectedPeriod.end })
        );

        classesInPeriod.forEach(c => {
            if (!paymentsByTeacher[c.teacherId]) {
                const teacher = teachers.find(t => t.id === c.teacherId);
                paymentsByTeacher[c.teacherId] = {
                    teacherId: c.teacherId,
                    teacherName: teacher?.name || 'Professor Desconhecido',
                    teacherAvatarUrl: teacher?.avatarUrl,
                    completedClasses: 0,
                    paymentRate: paymentRate,
                    totalAmount: 0,
                };
            }
            paymentsByTeacher[c.teacherId].completedClasses += 1;
        });
        
        const paymentDetails = Object.entries(paymentsByTeacher).map(([teacherId, p]) => ({
          id: `${selectedPeriodKey}-${teacherId}`,
          ...p,
          totalAmount: p.completedClasses * p.paymentRate,
          period: selectedPeriod.label,
        })).sort((a,b) => b.totalAmount - a.totalAmount);
        
        setTeacherPaymentDetails(paymentDetails);
        setSelectedPeriodCost(paymentDetails.reduce((acc, p) => acc + p.totalAmount, 0));
    }, [selectedPeriodKey, paymentPeriods]);

    const getUserById = (id: string): AppUser | undefined => {
        return users.find(u => u.id === id);
    }
    
    const handleDeleteTransaction = () => {
      if (!transactionToDelete) return;

      // Update payment history
      const allHistoryStr = localStorage.getItem(PAYMENT_HISTORY_STORAGE_KEY);
      const allHistory = allHistoryStr ? JSON.parse(allHistoryStr) : [];
      const updatedAllHistory = allHistory.filter(
        (t: PaymentTransaction) => t.id !== transactionToDelete.id
      );
      localStorage.setItem(
        PAYMENT_HISTORY_STORAGE_KEY,
        JSON.stringify(updatedAllHistory)
      );

      // Update user credits
      const allUsersStr = localStorage.getItem(USERS_STORAGE_KEY);
      const allUsers: AppUser[] = allUsersStr
        ? JSON.parse(allUsersStr)
        : initialUsers;
      const userIndex = allUsers.findIndex(
        (u) => u.id === transactionToDelete.studentId
      );
      if (userIndex !== -1) {
        allUsers[userIndex].classCredits = Math.max(
          0,
          (allUsers[userIndex].classCredits || 0) -
            transactionToDelete.creditsAdded
        );
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
      }

      // Dispatch storage event to notify other components (like sidebar)
      window.dispatchEvent(new Event('storage'));

      toast({
        title: 'Transação Excluída',
        description: 'A transação e os créditos correspondentes foram removidos.',
      });
      setTransactionToDelete(null);
    };

    const handlePayPeriod = () => {
        if (teacherPaymentDetails.length === 0) {
            toast({
                variant: 'destructive',
                title: "Nenhum Pagamento a Fazer",
                description: "Não há pagamentos pendentes para este período.",
            });
            return;
        }
        
        const storedHistoryStr = localStorage.getItem(TEACHER_PAYMENT_HISTORY_KEY);
        const currentHistory = storedHistoryStr ? JSON.parse(storedHistoryStr) : [];

        const newPayments = teacherPaymentDetails.map(p => ({
            teacherId: p.teacherId,
            period: p.period,
            classesDone: p.completedClasses,
            paymentRate: p.paymentRate,
            amount: p.totalAmount,
            status: 'Pago',
            paymentDate: new Date().toISOString(),
        }));
        
        const updatedHistory = [...currentHistory, ...newPayments];
        localStorage.setItem(TEACHER_PAYMENT_HISTORY_KEY, JSON.stringify(updatedHistory));
        window.dispatchEvent(new Event('storage'));

        toast({
            title: "Pagamento Realizado com Sucesso!",
            description: `R$ ${selectedPeriodCost.toFixed(2).replace('.', ',')} foram pagos aos professores.`,
        });
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
            <Card>
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
            <Card>
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
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Líquido (Mês)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ {(totalRevenue - totalMonthlyExpenses).toFixed(2).replace('.',',')}</div>
                <p className="text-xs text-muted-foreground">
                    Margem: {totalRevenue > 0 ? ((totalRevenue - totalMonthlyExpenses) / totalRevenue * 100).toFixed(1) : 0}%
                </p>
                </CardContent>
            </Card>
            <Card>
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
            <Card>
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingDown className="text-red-500" />Despesas</CardTitle>
                    <CardDescription>Distribuição dos custos operacionais.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 flex-1">
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pagamentos (Professores)</span>
                        <span className="font-bold">R$ {monthlyTeacherPaymentsCost.toFixed(2).replace('.',',')}</span>
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
            <Card>
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
                                    <TableHead className="text-center">Créditos</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map(transaction => {
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
            <Card>
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
                     <CardContent className="mt-auto">
                        <Separator className="my-4" />
                        <div className="flex items-center justify-between font-bold">
                            <span>Total de Despesas</span>
                            <span className="text-red-600">R$ {totalMonthlyExpenses.toFixed(2).replace('.',',')}</span>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
        <Collapsible open={isTeacherPaymentsOpen} onOpenChange={setIsTeacherPaymentsOpen}>
            <Card>
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
                                <SelectTrigger id="period-filter" className="w-[180px] justify-center text-center">
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
                    <CardFooter className="justify-end">
                        <Button onClick={handlePayPeriod} disabled={teacherPaymentDetails.length === 0}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar como Pago
                        </Button>
                    </CardFooter>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    </div>
    <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação de <span className="font-bold">{getUserById(transactionToDelete?.studentId || '')?.name}</span> no valor de R$ {transactionToDelete?.amount.toFixed(2).replace('.',',')} e removerá os créditos de aula correspondentes da conta do aluno.
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

    