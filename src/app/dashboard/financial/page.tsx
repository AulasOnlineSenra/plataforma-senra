
'use client';
import { useEffect, useState } from 'react';
import { UserRole, User } from '@/lib/types';
import { getMockUser } from '@/lib/data';
import AdminFinancials from '@/components/admin-financials';
import TeacherFinancials from '@/components/teacher-financials';
import StudentFinancials from '@/components/student-financials';

export default function FinancialPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    if (role) {
      setUser(getMockUser(role));
    }
  }, []);

  if (!user) {
    return null; // or a loading spinner
  }

  const renderContent = () => {
    switch (user.role) {
      case 'admin':
        return <AdminFinancials />;
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
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Painel Financeiro
        </h1>
      </div>
      {renderContent()}
    </div>
  );
}
