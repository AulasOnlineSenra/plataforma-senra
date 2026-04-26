
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
import { Teacher } from '@/lib/types';
import { getSettings } from '@/app/actions/settings';
import { getLessonsForUser } from '@/app/actions/bookings';
import { format, startOfWeek, endOfWeek, isWithinInterval, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, addWeeks, addMonths, getWeek, startOfMonth, parse, endOfMonth } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { DollarSign, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const TEACHER_PAYMENT_RATE_KEY = 'teacherPaymentRate';
const TEACHER_PAYMENT_DAY_KEY = 'teacherPaymentDay';
const TEACHER_PAYMENT_FREQUENCY_KEY = 'teacherPaymentFrequency';

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


interface LessonFromDB {
  id: string;
  teacherId: string;
  studentId: string;
  subject: string;
  date: Date;
  status: string;
}

export default function TeacherFinancials({ selectedMonth }: TeacherFinancialsProps) {
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [lessons, setLessons] = useState<LessonFromDB[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [paymentRate, setPaymentRate] = useState(50);
  const [paymentDay, setPaymentDay] = useState('friday');
  const [paymentFrequency, setPaymentFrequency] = useState('weekly');
  const [teacherPayments, setTeacherPayments] = useState<TeacherPaymentRecord[]>([]);

  const [paymentPeriods, setPaymentPeriods] = useState<{ label: string, value: string, start: Date, end: Date }[]>([]);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | undefined>();
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'teacher') {
          setCurrentUser(user);
        }
      }
    };

    const loadAllData = async () => {
      setIsLoadingSettings(true);
      
      const storedRate = localStorage.getItem(TEACHER_PAYMENT_RATE_KEY);
      if (!storedRate) {
        const settingsResult = await getSettings();
        if (settingsResult.success && settingsResult.data) {
          const classValue = settingsResult.data.classValue;
          if (classValue) {
            setPaymentRate(parseFloat(classValue));
          }
        }
      }
      
      const storedPaymentDay = localStorage.getItem(TEACHER_PAYMENT_DAY_KEY);
      const currentPaymentDay = storedPaymentDay || 'friday';
      
      const storedPaymentFrequency = localStorage.getItem(TEACHER_PAYMENT_FREQUENCY_KEY);
      const currentPaymentFrequency = storedPaymentFrequency || 'weekly';
      
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
          } else {
              periodStart = addMonths(periodStart, 1);
          }
      }
      setPaymentPeriods(periods.reverse());

      if (periods.length > 0 && !selectedPeriodKey) {
          setSelectedPeriodKey(periods[0].value);
      }
      
      setIsLoadingSettings(false);
    };

    loadUser();
    loadAllData();
  }, [selectedMonth, selectedPeriodKey]);

  useEffect(() => {
    const loadLessonsFromDB = async () => {
      if (!currentUser) return;
      
      setLoadingLessons(true);
      
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const result = await getLessonsForUser(userId || currentUser.id, userRole || 'teacher');
      
      if (result.success && result.data) {
        setLessons((result.data as any[]).map(l => ({
          id: l.id,
          teacherId: l.teacherId,
          studentId: l.studentId,
          subject: l.subject,
          date: l.date,
          status: l.status,
        })));
      }
      
      setLoadingLessons(false);
    };
    
    loadLessonsFromDB();
  }, [currentUser]);

  const completedLessons = useMemo(() => {
    return lessons.filter(l => l.status === 'COMPLETED');
  }, [lessons]);

  useEffect(() => {
    if (!currentUser || completedLessons.length === 0 || paymentPeriods.length === 0) return;

    const now = new Date();
    const allPastPeriods = paymentPeriods.filter(p => now > p.end);
    const paymentsByPeriod: TeacherPaymentRecord[] = [];

    allPastPeriods.forEach(period => {
      const classesInPeriod = completedLessons.filter(lesson =>
        isWithinInterval(new Date(lesson.date), { start: period.start, end: period.end })
      );

      if (classesInPeriod.length > 0) {
        paymentsByPeriod.push({
          teacherId: currentUser.id,
          period: period.label,
          classesDone: classesInPeriod.length,
          paymentRate: paymentRate,
          amount: classesInPeriod.length * paymentRate,
          status: 'Pago',
          paymentDate: format(period.end, 'yyyy-MM-dd'),
        });
      }
    });
    
    setTeacherPayments(paymentsByPeriod.sort((a,b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime()));

  }, [currentUser, completedLessons, paymentRate, paymentPeriods, selectedMonth]);
  
  const filteredPayments = useMemo(() => {
    if (!selectedPeriodKey) {
        return teacherPayments.filter(p => {
            const monthDate = parse(selectedMonth, 'yyyy-MM', new Date());
            const paymentDate = p.paymentDate ? new Date(p.paymentDate) : new Date(0);
            return paymentDate.getMonth() === monthDate.getMonth() && paymentDate.getFullYear() === monthDate.getFullYear();
        })
    }

    const selectedPeriod = paymentPeriods.find(pp => pp.value === selectedPeriodKey);
    return teacherPayments.filter(p => p.period === selectedPeriod?.label);
  }, [selectedPeriodKey, teacherPayments, paymentPeriods, selectedMonth]);


  const weeklyStats = useMemo(() => {
    if (!currentUser) return { count: 0, earnings: 0 };
    const now = new Date();
    const start = startOfWeek(now, { locale: ptBR });
    const end = endOfWeek(now, { locale: ptBR });

    const weeklyClasses = completedLessons.filter(lesson => 
      isWithinInterval(new Date(lesson.date), { start, end })
    );

    return {
      count: weeklyClasses.length,
      earnings: weeklyClasses.length * paymentRate,
    };
  }, [currentUser, completedLessons, paymentRate]);

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
      const currentWeek = getWeek(zonedNow, { weekStartsOn: 1 });
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

}, [paymentDay, paymentFrequency, currentUser]);

  if (!currentUser || isLoadingSettings || loadingLessons) {
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
        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor por Aula</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {paymentRate.toFixed(2).replace('.',',')}</div>
            <p className="text-xs text-muted-foreground">Definido pelo administrador</p>
          </CardContent>
        </Card>
        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Concluídas (Semana)</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.count}</div>
            <p className="text-xs text-muted-foreground">Nos últimos 7 dias</p>
          </CardContent>
        </Card>
        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos (Semana)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {weeklyStats.earnings.toFixed(2).replace('.',',')}</div>
            <p className="text-xs text-muted-foreground">Total a receber nesta semana</p>
          </CardContent>
        </Card>
        <Card className="min-h-[120px]">
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
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Label htmlFor="period-filter-teacher" className="sr-only">Filtrar Período</Label>
                <Select value={selectedPeriodKey} onValueChange={setSelectedPeriodKey}>
                  <SelectTrigger id="period-filter-teacher" className="w-full justify-center text-center sm:w-[180px]">
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
                <TableHead>Período</TableHead>
                <TableHead className="text-center">Aulas Concluídas</TableHead>
                <TableHead className="text-center">Valor por Aula</TableHead>
                <TableHead className="text-right">Total Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment, index) => (
                    <TableRow key={index}>
                    <TableCell className="font-medium">{payment.period}</TableCell>
                    <TableCell className="text-center">{payment.classesDone}</TableCell>
                    <TableCell className="text-center font-mono">R$ {payment.paymentRate.toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell className="text-right font-mono text-green-600 font-semibold">
                        R$ {payment.amount.toFixed(2).replace('.', ',')}
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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

    

    
