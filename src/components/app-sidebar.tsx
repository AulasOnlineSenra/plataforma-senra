'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/lib/types';
import { getMockUser } from '@/lib/data';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

// In a real app, this would come from an auth context
const userRole: UserRole = 'student';

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
    roles: ['student', 'teacher'],
  },
  {
    href: '/dashboard/packages',
    icon: WalletCards,
    label: 'Pacotes',
    roles: ['student'],
  },
  {
    href: '/dashboard/profile',
    icon: UserCircle,
    label: 'Meu Perfil',
    roles: ['student', 'teacher'],
  },
];

const adminNavItems = [
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
];

export function AppSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const user = getMockUser(userRole);

  const roleLabels: Record<UserRole, string> = {
    student: 'Aluno',
    teacher: 'Professor',
    admin: 'Administrador',
  };

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );
  const filteredAdminNavItems =
    userRole === 'admin'
      ? adminNavItems.filter((item) => item.roles.includes(userRole))
      : [];

  const renderLink = (item: typeof navItems[0]) => {
    const isActive = pathname === item.href;
    const linkContent = (
      <Link
        href={item.href}
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
      </Link>
    );

     return <div key={item.href}>{linkContent}</div>;
  };

  return (
    <aside className={cn("flex h-full max-h-screen flex-col gap-2", isMobile ? '' : 'hidden sm:flex bg-sidebar text-sidebar-foreground')}>
        <div className="flex h-auto items-center border-b border-sidebar-border p-4 lg:h-auto">
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
        <div className="flex-1 overflow-y-auto">
                <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium lg:px-4", isMobile ? 'py-4' : '')}>
                    {filteredNavItems.map(renderLink)}
                    {filteredAdminNavItems.length > 0 && (
                        <>
                            <div className="my-2 mx-3 h-px bg-sidebar-border" />
                            {filteredAdminNavItems.map(renderLink)}
                        </>
                    )}
                </nav>
        </div>
        <div className="mt-auto p-4 border-t border-sidebar-border">
                <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
                    {renderLink({ href: '#', icon: Settings, label: 'Configurações', roles: ['student', 'teacher', 'admin']})}
                    {renderLink({ href: '/login', icon: LogOut, label: 'Sair', roles: ['student', 'teacher', 'admin']})}
                </nav>
        </div>
    </aside>
  );
}
