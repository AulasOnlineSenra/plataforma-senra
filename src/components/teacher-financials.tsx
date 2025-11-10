
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getMockUser, scheduleEvents as initialSchedule } from '@/lib/data';
import { ScheduleEvent, Teacher } from '@/lib/types';
import { format, startOfWeek, endOfWeek, isWithinInterval, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, addWeeks, addMonths, getWeek, startOfMonth, parse, endOfMonth } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { DollarSign, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const SCHEDULE_STORAGE_KEY = 'scheduleEvents';
const TEACHER_PAYMENT_RATE_KEY = 'teacherPaymentRate';
const TEACHER_PAYMENT_DAY_KEY = 'teacherPaymentDay';
const TEACHER_PAYMENT_FREQUENCY_KEY = 'teacherPaymentFrequency';
const TEACHER_PAYMENT_HISTORY_KEY = 'teacherPaymentHistory';

interface TeacherPaymentRecord {
  teacherId: string;
  period: string;
  classesDone: number;
  paymentRate: number;
  amount: number;
  status: 'Pago' | 'Pendente';
  paymentDate?: string;
}

interface TeacherFinancialsProps {
  selectedMonth: string;
}


export default function TeacherFinancials({ selectedMonth }: TeacherFinancialsProps) {
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>(initialSchedule);
  const [paymentRate, setPaymentRate] = useState(50); // Default value
  const [paymentDay, setPaymentDay] = useState('friday');
  const [paymentFrequency, setPaymentFrequency] = useState('weekly');
  const [teacherPayments, setTeacherPayments] = useState<TeacherPaymentRecord[]>([]);

  const [paymentPeriods, setPaymentPeriods] = useState<{ label: string, value: string, start: Date, end: Date }[]>([]);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | undefined>();


  useEffect(() => {
    const updateData = () => {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'teacher') {
          setCurrentUser(user);
        }
      }

      const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (storedSchedule) {
        setSchedule(JSON.parse(storedSchedule).map((e: any) => ({...e, start: new Date(e.start)})));
      } else {
        setSchedule(initialSchedule);
      }

      const storedRate = localStorage.getItem(TEACHER_PAYMENT_RATE_KEY);
      if (storedRate) {
        setPaymentRate(parseFloat(storedRate));
      }
      
      const storedPaymentDay = localStorage.getItem(TEACHER_PAYMENT_DAY_KEY);
      const currentPaymentDay = storedPaymentDay || 'friday';
      setPaymentDay(currentPaymentDay);
      
      const storedPaymentFrequency = localStorage.getItem(TEACHER_PAYMENT_FREQUENCY_KEY);
      const currentPaymentFrequency = storedPaymentFrequency || 'weekly';
      setPaymentFrequency(currentPaymentFrequency);
      
      // --- Payment Period Generation for the filter ---
      const monthDate = parse(selectedMonth, 'yyyy-MM', new Date());
      const monthInterval = {
        start: startOfMonth(monthDate),
        end: endOfMonth(monthDate),
      };
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

      // Set default selected period to the most recent one
      if (periods.length > 0 && !selectedPeriodKey) {
          setSelectedPeriodKey(periods[0].value);
      }
    };

    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, [selectedMonth, selectedPeriodKey]);

  useEffect(() => {
    if (!currentUser) return;
    
    const storedHistory = localStorage.getItem(TEACHER_PAYMENT_HISTORY_KEY);
    const allHistory: TeacherPaymentRecord[] = storedHistory ? JSON.parse(storedHistory) : [];
    const userHistory = allHistory.filter((p: TeacherPaymentRecord) => p.teacherId === currentUser.id);

    setTeacherPayments(userHistory.sort((a: TeacherPaymentRecord, b: TeacherPaymentRecord) => new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime()));

  }, [currentUser, selectedMonth]);
  
  const filteredPayments = useMemo(() => {
    if (!selectedPeriodKey) {
        const monthDate = parse(selectedMonth, 'yyyy-MM', new Date());
        // If no period is selected (e.g. month view), show all payments for that month
        return teacherPayments.filter(p => {
             if (!p.paymentDate) return false;
             const paymentDate = new Date(p.paymentDate);
             return paymentDate.getMonth() === monthDate.getMonth() && paymentDate.getFullYear() === monthDate.getFullYear();
        });
    }

    return teacherPayments.filter(p => p.period === paymentPeriods.find(pp => pp.value === selectedPeriodKey)?.label);
  }, [selectedPeriodKey, teacherPayments, paymentPeriods, selectedMonth]);


  const weeklyStats = useMemo(() => {
    if (!currentUser) return { count: 0, earnings: 0 };
    const now = new Date();
    const start = startOfWeek(now, { locale: ptBR });
    const end = endOfWeek(now, { locale: ptBR });

    const weeklyClasses = schedule.filter(e => 
      e.teacherId === currentUser.id &&
      e.status === 'completed' &&
      isWithinInterval(e.start, { start, end })
    );

    return {
      count: weeklyClasses.length,
      earnings: weeklyClasses.length * paymentRate,
    };
  }, [currentUser, schedule, paymentRate]);

  const nextPaymentDate = useMemo(() => {
    const now = new Date();
    const userTimezone = currentUser?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
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
      // Use ISO week number which is standard
      const currentWeek = getWeek(zonedNow, { weekStartsOn: 1 });
      const nextPaymentWeek = getWeek(nextDate, { weekStartsOn: 1 });

      // This ensures payment is always on an even or odd week of the year.
      if (nextPaymentWeek % 2 !== 0) { 
        nextDate = addWeeks(nextDate, 1);
      }
      return nextDate;
    }

    if (paymentFrequency === 'monthly') {
        let firstPaymentDayOfMonth = getNextPaymentDayFunc(startOfMonth(zonedNow));
        // If the first payment day of this month has already passed
        if (firstPaymentDayOfMonth < zonedNow) {
            // Calculate the first payment day of the next month
            return getNextPaymentDayFunc(startOfMonth(addMonths(zonedNow, 1)));
        } else {
            return firstPaymentDayOfMonth;
        }
    }
    
    // Default to weekly if something is wrong
    return getNextPaymentDayFunc(zonedNow);

  }, [paymentDay, paymentFrequency, currentUser]);


  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando dados financeiros...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor por Aula</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {paymentRate.toFixed(2).replace('.',',')}</div>
            <p className="text-xs text-muted-foreground">Definido pelo administrador</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Concluídas (Semana)</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.count}</div>
            <p className="text-xs text-muted-foreground">Nos últimos 7 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos (Semana)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {weeklyStats.earnings.toFixed(2).replace('.',',')}</div>
            <p className="text-xs text-muted-foreground">Total a receber nesta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Pagamento</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(nextPaymentDate, 'dd/MM/yyyy')}</div>
            <p className="text-xs text-muted-foreground">Frequência {paymentFrequency}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription>
                  Um registro de todos os pagamentos recebidos no período selecionado.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="period-filter-teacher" className="sr-only">Filtrar Período</Label>
                <Select value={selectedPeriodKey} onValueChange={setSelectedPeriodKey}>
                  <SelectTrigger id="period-filter-teacher" className="w-[180px] justify-center text-center">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentPeriods.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
           </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período de Referência</TableHead>
                <TableHead className="text-center">Aulas Concluídas</TableHead>
                <TableHead className="text-center">Valor por Aula</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Valor Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment, index) => (
                    <TableRow key={index}>
                    <TableCell className="font-medium">{payment.period}</TableCell>
                    <TableCell className="text-center">{payment.classesDone}</TableCell>
                    <TableCell className="text-center font-mono">R$ {payment.paymentRate.toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell className="text-center">
                        <Badge className={payment.status === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {payment.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                        R$ {payment.amount.toFixed(2).replace('.', ',')}
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum histórico de pagamento encontrado para este período.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
