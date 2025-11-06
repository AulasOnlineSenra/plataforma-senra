
'use client';
import { useEffect, useState, useMemo } from 'react';
import { UserRole, User, MarketingCosts, PaymentTransaction, ScheduleEvent, Teacher } from '@/lib/types';
import { getMockUser, marketingCosts as initialMarketingCosts, paymentHistory as initialPaymentHistory, scheduleEvents as initialScheduleEvents } from '@/lib/data';
import AdminFinancials from '@/components/admin-financials';
import TeacherFinancials from '@/components/teacher-financials';
import StudentFinancials from '@/components/student-financials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { eachMonthOfInterval, format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

const MONTHLY_MARKETING_COSTS_STORAGE_KEY = 'monthlyMarketingCosts';
const PAYMENT_HISTORY_STORAGE_KEY = 'paymentHistory';
const SCHEDULE_STORAGE_KEY = 'scheduleEvents';
const TEACHER_PAYMENT_RATE_KEY = 'teacherPaymentRate';


export default function FinancialPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [totalCash, setTotalCash] = useState(0);


  useEffect(() => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    if (role) {
      const storedUser = localStorage.getItem('currentUser');
      setUser(storedUser ? JSON.parse(storedUser) : getMockUser(role));
    }
  }, []);
  
  useEffect(() => {
    if (user?.role !== 'admin') return;

    // This logic calculates the total cash across all time.
    const updateData = () => {
        const storedHistory = localStorage.getItem(PAYMENT_HISTORY_STORAGE_KEY);
        const allHistory: PaymentTransaction[] = storedHistory ? JSON.parse(storedHistory).map((p: any) => ({ ...p, date: new Date(p.date) })) : initialPaymentHistory;
        
        const storedMonthlyCosts = localStorage.getItem(MONTHLY_MARKETING_COSTS_STORAGE_KEY);
        let allCosts = {};
        if (storedMonthlyCosts) {
            allCosts = JSON.parse(storedMonthlyCosts);
        } else {
            const initialData = { [format(new Date(), 'yyyy-MM')]: initialMarketingCosts };
            localStorage.setItem(MONTHLY_MARKETING_COSTS_STORAGE_KEY, JSON.stringify(initialData));
            allCosts = initialData;
        }

        const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        const schedule: ScheduleEvent[] = storedSchedule ? JSON.parse(storedSchedule).map((e: any) => ({...e, start: new Date(e.start)})) : initialScheduleEvents;
        
        const storedRate = localStorage.getItem(TEACHER_PAYMENT_RATE_KEY);
        const paymentRate = storedRate ? parseFloat(storedRate) : 50;
        
        const totalRevenueAllTime = allHistory.reduce((acc, t) => acc + t.amount, 0);

        const allCompletedClasses = schedule.filter(e => e.status === 'completed');
        const totalTeacherPaymentsAllTime = allCompletedClasses.length * paymentRate;
        
        const totalMarketingExpensesAllTime = Object.values(allCosts as Record<string, MarketingCosts>).reduce((acc, monthlyCost) => {
            return acc + monthlyCost.ads + monthlyCost.team + monthlyCost.organicCommissions + monthlyCost.paidCommissions;
        }, 0);

        const totalExpensesAllTime = totalTeacherPaymentsAllTime + totalMarketingExpensesAllTime;
        
        setTotalCash(totalRevenueAllTime - totalExpensesAllTime);
    };

    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);

  }, [user]);

  const monthOptions = useMemo(() => eachMonthOfInterval({
    start: subMonths(new Date(), 12),
    end: new Date(),
  }).map(date => ({
    value: format(date, 'yyyy-MM'),
    label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
  })).reverse(), []);


  if (!user) {
    return null; // or a loading spinner
  }

  const renderContent = () => {
    switch (user.role) {
      case 'admin':
        return <AdminFinancials selectedMonth={selectedMonth} />;
      case 'teacher':
        return <TeacherFinancials />;
      case 'student':
        return <StudentFinancials />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Painel Financeiro
        </h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            {user.role === 'admin' && (
                <>
                   <Button variant="outline" className="w-full sm:w-auto h-10 px-4 py-2 flex items-center justify-between gap-3 text-base">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Caixa:</span>
                        </div>
                        <span className="text-sm font-bold">R$ {totalCash.toFixed(2).replace('.',',')}</span>
                    </Button>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full sm:w-[220px]">
                        <SelectValue placeholder="Selecione um mês" />
                        </SelectTrigger>
                        <SelectContent>
                        {monthOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </>
            )}
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
