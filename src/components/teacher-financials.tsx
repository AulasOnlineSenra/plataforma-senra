
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
import { getMockUser, scheduleEvents as initialSchedule, teacherPayments } from '@/lib/data';
import { ScheduleEvent, Teacher, PaymentTransaction } from '@/lib/types';
import { format, startOfWeek, endOfWeek, isWithinInterval, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, addWeeks, addMonths } from 'date-fns';
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

    const getNextPaymentDay = dayMap[paymentDay as keyof typeof dayMap] || nextFriday;
    
    let nextDate = getNextPaymentDay(zonedNow);

    if (paymentFrequency === 'biweekly') {
        const weekNumber = Math.ceil(zonedNow.getDate() / 7);
        if(weekNumber % 2 !== 0) { // If it's an odd week, add another week
            nextDate = addWeeks(nextDate, 1);
        }
    } else if (paymentFrequency === 'monthly') {
        // Find the first payment day of the current month
        let firstPaymentDayOfMonth = getNextPaymentDay(startOfMonth(zonedNow));
        if (firstPaymentDayOfMonth < zonedNow) {
            // If it has passed, find the next one in the next month
            nextDate = getNextPaymentDay(startOfMonth(addMonths(zonedNow, 1)));
        } else {
            nextDate = firstPaymentDayOfMonth;
        }
    }
    
    return nextDate;

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
              {teacherPayments.map((payment, index) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
