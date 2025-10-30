
'use client';
import { useEffect, useState } from 'react';
import { UserRole, User } from '@/lib/types';
import { getMockUser } from '@/lib/data';
import AdminFinancials from '@/components/admin-financials';
import TeacherFinancials from '@/components/teacher-financials';
import StudentFinancials from '@/components/student-financials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { eachMonthOfInterval, format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FinancialPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    if (role) {
      setUser(getMockUser(role));
    }
  }, []);

  const monthOptions = eachMonthOfInterval({
    start: subMonths(new Date(), 12),
    end: new Date(),
  }).map(date => ({
    value: format(date, 'yyyy-MM'),
    label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
  })).reverse();


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
         {user.role === 'admin' && (
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
        )}
      </div>
      {renderContent()}
    </div>
  );
}
