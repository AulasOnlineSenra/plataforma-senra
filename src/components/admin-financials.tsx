
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, ArrowDown, Landmark, TrendingUp, TrendingDown, Banknote, Trash2, ChevronDown, ChevronUp, User } from 'lucide-react';
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
import { paymentHistory as initialPaymentHistory, users as initialUsers, marketingCosts as initialMarketingCosts, scheduleEvents as initialScheduleEvents, teachers as initialTeachers } from '@/lib/data';
import { PaymentTransaction, User as AppUser, MarketingCosts, ScheduleEvent, Teacher } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format, parse, isWithinInterval, startOfMonth, endOfMonth, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, getWeek, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { toZonedTime } from 'date-fns-tz';


const PAYMENT_HISTORY_STORAGE_KEY = 'paymentHistory';
const USERS_STORAGE_KEY = 'userList';
const TEACHERS_STORAGE_KEY = 'teacherList';
const MONTHLY_MARKETING_COSTS_STORAGE_KEY = 'monthlyMarketingCosts';
const TEACHER_PAYMENT_RATE_KEY = 'teacherPaymentRate';
const TEACHER_PAYMENT_DAY_KEY = 'teacherPaymentDay';
const TEACHER_PAYMENT_FREQUENCY_KEY = 'teacherPaymentFrequency';
const SCHEDULE_STORAGE_KEY = 'scheduleEvents';

const DEFAULT_COSTS = { ads: 0, team: 0, organicCommissions: 0, paidCommissions: 0 };


interface AdminFinancialsProps {
  selectedMonth: string;
}

interface TeacherPaymentDetails {
  teacherId: string;
  teacherName: string;
  teacherAvatarUrl?: string;
  completedClasses: number;
  paymentRate: number;
  totalAmount: number;
}


export default function AdminFinancials({ selectedMonth }: AdminFinancialsProps) {
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [marketingCosts, setMarketingCosts] = useState<MarketingCosts>(DEFAULT_COSTS);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [packageRevenue, setPackageRevenue] = useState(0);
    const [singleClassRevenue, setSingleClassRevenue] = useState(0);
    const [transactionToDelete, setTransactionToDelete] = useState<PaymentTransaction | null>(null);
    const [isReceiptsOpen, setIsReceiptsOpen] = useState(true);
    const [isExpensesOpen, setIsExpensesOpen] = useState(true);
    const [isTeacherPaymentsOpen, setIsTeacherPaymentsOpen] = useState(true);
    const { toast } = useToast();
    const [teacherPaymentsCost, setTeacherPaymentsCost] = useState(0);
    const [teacherPaymentDetails, setTeacherPaymentDetails] = useState<TeacherPaymentDetails[]>([]);
    const [paymentDay, setPaymentDay] = useState('friday');
    const [paymentFrequency, setPaymentFrequency] = useState('weekly');


    const totalMarketingExpenses = marketingCosts.ads + marketingCosts.team + marketingCosts.organicCommissions + marketingCosts.paidCommissions;
    const totalExpenses = totalMarketingExpenses + teacherPaymentsCost;
    
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
            if (storedMonthlyCosts) {
                const allCosts = JSON.parse(storedMonthlyCosts);
                setMarketingCosts(allCosts[selectedMonth] || DEFAULT_COSTS);
            } else {
                const initialData = { [format(new Date(), 'yyyy-MM')]: initialMarketingCosts };
                localStorage.setItem(MONTHLY_MARKETING_COSTS_STORAGE_KEY, JSON.stringify(initialData));
                setMarketingCosts(selectedMonth === format(new Date(), 'yyyy-MM') ? initialMarketingCosts : DEFAULT_COSTS);
            }

            const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
            const schedule: ScheduleEvent[] = storedSchedule ? JSON.parse(storedSchedule).map((e: any) => ({...e, start: new Date(e.start)})) : initialScheduleEvents;
            
            const storedTeachers = localStorage.getItem(TEACHERS_STORAGE_KEY);
            const teachers: Teacher[] = storedTeachers ? JSON.parse(storedTeachers) : initialTeachers;
            
            const monthCompletedClasses = schedule.filter(e => e.status === 'completed' && isWithinInterval(new Date(e.start), monthInterval));
            
            const storedRate = localStorage.getItem(TEACHER_PAYMENT_RATE_KEY);
            const paymentRate = storedRate ? parseFloat(storedRate) : 50;

            const paymentsByTeacher: Record<string, TeacherPaymentDetails> = {};

            monthCompletedClasses.forEach(c => {
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
            
            const paymentDetails = Object.values(paymentsByTeacher).map(p => ({
              ...p,
              totalAmount: p.completedClasses * p.paymentRate,
            })).sort((a,b) => b.totalAmount - a.totalAmount);
            
            setTeacherPaymentDetails(paymentDetails);

            setTeacherPaymentsCost(paymentDetails.reduce((acc, p) => acc + p.totalAmount, 0));

             const storedPaymentDay = localStorage.getItem(TEACHER_PAYMENT_DAY_KEY);
            if (storedPaymentDay) {
                setPaymentDay(storedPaymentDay);
            }
            
            const storedPaymentFrequency = localStorage.getItem(TEACHER_PAYMENT_FREQUENCY_KEY);
            if (storedPaymentFrequency) {
                setPaymentFrequency(storedPaymentFrequency);
            }
        };

        updateData();
        
        window.addEventListener('storage', updateData);
        return () => window.removeEventListener('storage', updateData);
    }, [selectedMonth]);

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

    const expenseItems = [
      { id: 'exp-1', date: new Date(), category: 'Pagamentos', description: 'Professores (aulas concluídas)', amount: teacherPaymentsCost },
      { id: 'exp-2', date: new Date(), category: 'Pagamentos', description: 'Comissões (Marketing)', amount: marketingCosts.organicCommissions + marketingCosts.paidCommissions },
      { id: 'exp-3', date: new Date(), category: 'Custos de Marketing', description: 'Anúncios', amount: marketingCosts.ads },
      { id: 'exp-4', date: new Date(), category: 'Custos de Marketing', description: 'Equipe', amount: marketingCosts.team },
    ];


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
                <div className="text-2xl font-bold text-green-600">R$ {(totalRevenue - totalExpenses).toFixed(2).replace('.',',')}</div>
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
                        <span className="font-bold">R$ {teacherPaymentsCost.toFixed(2).replace('.',',')}</span>
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
                        <span className="text-red-600">R$ {totalExpenses.toFixed(2).replace('.',',')}</span>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign />Patrimônio Líquido</CardTitle>
                    <CardDescription>Demonstração do resultado.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total de Receitas</span>
                        <span className="font-bold text-green-600">R$ {totalRevenue.toFixed(2).replace('.',',')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total de Despesas</span>
                        <span className="font-bold text-red-600">- R$ {totalExpenses.toFixed(2).replace('.',',')}</span>
                    </div>
                </CardContent>
                <CardContent className="mt-auto">
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between font-bold text-lg">
                        <span>Resultado Líquido</span>
                        <span className={(totalRevenue - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            R$ {(totalRevenue - totalExpenses).toFixed(2).replace('.',',')}
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
                            <span className="text-red-600">R$ {totalExpenses.toFixed(2).replace('.',',')}</span>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>

        <Collapsible open={isTeacherPaymentsOpen} onOpenChange={setIsTeacherPaymentsOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                        <div>
                            <CardTitle>Pagamentos de Professores</CardTitle>
                            <CardDescription>
                                Detalhes para aulas concluídas no mês. Próximo pagamento em: {format(nextPaymentDate, 'dd/MM/yyyy')}
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                            {isTeacherPaymentsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </Button>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Professor</TableHead>
                                    <TableHead className="text-center">Aulas Concluídas</TableHead>
                                    <TableHead className="text-center">Valor por Aula</TableHead>
                                    <TableHead className="text-right">Total a Pagar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teacherPaymentDetails.map(payment => (
                                    <TableRow key={payment.teacherId}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={payment.teacherAvatarUrl} alt={payment.teacherName} />
                                                    <AvatarFallback>{payment.teacherName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="font-medium">{payment.teacherName}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-medium">{payment.completedClasses}</TableCell>
                                        <TableCell className="text-center font-mono">R$ {payment.paymentRate.toFixed(2).replace('.', ',')}</TableCell>
                                        <TableCell className="text-right font-bold">R$ {payment.totalAmount.toFixed(2).replace('.', ',')}</TableCell>
                                    </TableRow>
                                ))}
                                {teacherPaymentDetails.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">Nenhum pagamento de professor para este mês.</TableCell>
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
