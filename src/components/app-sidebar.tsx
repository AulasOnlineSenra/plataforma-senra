
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpenCheck,
  MessageSquare,
  WalletCards,
  UserCircle,
  Settings,
  KeyRound,
  FileText,
  LogOut,
  Users,
  Banknote,
  History,
  Briefcase,
  TrendingUp,
  HeartHandshake,
  DollarSign,
  Package,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole, User } from '@/lib/types';
import { getMockUser } from '@/lib/data';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter } from 'next/navigation';

const navItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    href: '/dashboard/schedule',
    icon: CalendarDays,
    label: 'Agenda',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    href: '/dashboard/booking',
    icon: BookOpenCheck,
    label: 'Agendar Aula',
    roles: ['student'],
  },
  {
    href: '/dashboard/chat',
    icon: MessageSquare,
    label: 'Chat',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    href: '/dashboard/students',
    icon: Users,
    label: 'Alunos',
    roles: ['teacher', 'admin'],
  },
  {
    href: '/dashboard/teachers',
    icon: Briefcase,
    label: 'Professores',
    roles: ['admin', 'student'],
  },
    {
    href: '/dashboard/my-teachers',
    icon: Briefcase,
    label: 'Meus Professores',
    roles: ['student'],
  },
  {
    href: '/dashboard/packages',
    icon: WalletCards,
    label: 'Pacotes',
    roles: ['student'],
  },
  {
    href: '/dashboard/financial',
    icon: DollarSign,
    label: 'Financeiro',
    roles: ['student', 'teacher', 'admin'],
  },
  {
    href: '/dashboard/activity-history',
    icon: History,
    label: 'Histórico de Atividades',
    roles: ['student', 'teacher'],
  },
];

const adminNavItems = [
  {
    href: '/dashboard/admin/packages',
    icon: Package,
    label: 'Planos',
    roles: ['admin'],
  },
  {
    href: '/dashboard/admin/feedback-analysis',
    icon: FileText,
    label: 'Análise de Feedback',
    roles: ['admin'],
  },
  {
    href: '/dashboard/admin/settings',
    icon: KeyRound,
    label: 'Credenciais',
    roles: ['admin'],
  },
  {
    href: '/dashboard/admin/marketing',
    icon: TrendingUp,
    label: 'Marketing',
    roles: ['admin'],
  },
  {
    href: '/dashboard/admin/crm',
    icon: HeartHandshake,
    label: 'CRM',
    roles: ['admin'],
  },
  {
    href: '/dashboard/admin/aos-agents',
    icon: Bot,
    label: 'AOS Agents',
    roles: ['admin'],
  },
];

export function AppSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const updateUser = useCallback(() => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    if (role) {
      setUserRole(role);
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        const newUser = getMockUser(role);
        setUser(newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    updateUser();

    // Listen for storage changes to update the sidebar in real-time
    const handleStorageChange = () => {
      updateUser();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateUser]);

  if (!userRole || !user) {
    return null; // Or a loading spinner
  }

  const roleLabels: Record<UserRole, string> = {
    student: 'Aluno',
    teacher: 'Professor',
    admin: 'Administrador',
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(userRole)
  ).map(item => {
    if (item.href === '/dashboard/students' && userRole === 'teacher') {
      return { ...item, label: 'Meus Alunos' };
    }
    return item;
  });

  const filteredAdminNavItems =
    userRole === 'admin'
      ? adminNavItems.filter(item => item.roles.includes(userRole))
      : [];

  const renderLink = (item: {href: string, icon: React.ElementType, label: string, roles: string[]}, isLogout = false) => {
    const isActive = pathname === item.href;
    const LinkContent = (
      <div
        className={cn(
          'flex items-center gap-4 rounded-lg px-3 py-2 transition-all hover:text-primary-foreground hover:bg-sidebar-accent',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground/80',
          'text-base'
        )}
      >
        <item.icon className="h-5 w-5" />
        <span className={'font-medium'}>{item.label}</span>
      </div>
    );

    if (isLogout) {
        return (
            <button key={item.href} onClick={handleLogout} className="w-full text-left">
                {LinkContent}
            </button>
        )
    }

     return (
        <Link key={item.href} href={item.href}>
          {LinkContent}
        </Link>
     );
  };

  return (
    <aside className={cn("flex h-full max-h-screen flex-col gap-2", isMobile ? '' : 'hidden sm:flex bg-sidebar text-sidebar-foreground')}>
        <Link href="/dashboard/profile" className="block border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors">
          <div className="flex h-auto items-center p-4 lg:h-auto">
              <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col'>
                      <span className="font-semibold text-lg text-sidebar-foreground">{user.name}</span>
                      <span className="text-sm text-sidebar-foreground/80">{roleLabels[user.role]}</span>
                  </div>
              </div>
          </div>
        </Link>
        <div className="flex-1 overflow-y-auto">
                <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium lg:px-4", isMobile ? 'py-4' : '')}>
                    {filteredNavItems.map(item => renderLink(item))}
                    {filteredAdminNavItems.length > 0 && (
                        <>
                            <div className="my-2 mx-3 h-px bg-sidebar-border" />
                            {filteredAdminNavItems.map(item => renderLink(item))}
                        </>
                    )}
                </nav>
        </div>
        <div className="mt-auto p-4 border-t border-sidebar-border">
                <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
                    {renderLink({ href: '#', icon: Settings, label: 'Configurações', roles: []})}
                    {renderLink({ href: '/login', icon: LogOut, label: 'Sair', roles: []}, true)}
                </nav>
        </div>
    </aside>
  );
}
