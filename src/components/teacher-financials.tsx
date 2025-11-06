
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
import { getMockUser, scheduleEvents as initialSchedule, teacherPayments as initialTeacherPayments } from '@/lib/data';
import { ScheduleEvent, Teacher, PaymentTransaction } from '@/lib/types';
import { format, startOfWeek, endOfWeek, isWithinInterval, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, addWeeks, addMonths, getWeek, startOfMonth } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { DollarSign, BookOpen, Calendar, TrendingUp } from 'lucide-react';

const SCHEDULE_STORAGE_KEY = 'scheduleEvents';
const TEACHER_PAYMENT_RATE_KEY = 'teacherPaymentRate';
const TEACHER_PAYMENT_DAY_KEY = 'teacherPaymentDay';
const TEACHER_PAYMENT_FREQUENCY_KEY = 'teacherPaymentFrequency';

export default function TeacherFinancials() {
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>(initialSchedule);
  const [paymentRate, setPaymentRate] = useState(50); // Default value
  const [paymentDay, setPaymentDay] = useState('friday');
  const [paymentFrequency, setPaymentFrequency] = useState('weekly');
  const [teacherPayments, setTeacherPayments] = useState(initialTeacherPayments);


  useEffect(() => {
    const updateData = () => {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'teacher') {
          setCurrentUser(user);
          // For new teachers, there might be no payment history yet.
          if (!user.lastAccess || new Date().getTime() - new Date(user.lastAccess).getTime() < 5 * 60 * 1000) {
            setTeacherPayments([]);
          }
        }
      }

      const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (storedSchedule) {
        setSchedule(JSON.parse(storedSchedule).map((e: any) => ({...e, start: new Date(e.start)})));
      }

      const storedRate = localStorage.getItem(TEACHER_PAYMENT_RATE_KEY);
      if (storedRate) {
        setPaymentRate(parseFloat(storedRate));
      }
      
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
  }, []);

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
    
    const dayIndexMap = {
        monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5,
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

      // If the next payment date is in an odd week, and we pay on even weeks (or vice versa)
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
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Um registro de todos os pagamentos recebidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período de Referência</TableHead>
                <TableHead className="text-center">Aulas Concluídas</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Valor Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherPayments.length > 0 ? (
                teacherPayments.map((payment, index) => (
                    <TableRow key={index}>
                    <TableCell className="font-medium">{payment.period}</TableCell>
                    <TableCell className="text-center">{payment.classesDone}</TableCell>
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
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Nenhum histórico de pagamento encontrado.
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
