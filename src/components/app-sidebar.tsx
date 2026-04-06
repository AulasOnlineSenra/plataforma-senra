'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem, UserRole } from '@/lib/types';
import { navItems as defaultNavItems, adminNavItems as defaultAdminNavItems } from '@/lib/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getChatMessagesForUser } from '@/app/actions/chat';
import { getUserById, getUserNotifications } from '@/app/actions/users';
import { safeLocalStorage } from '@/lib/safe-storage';

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Aluno',
  teacher: 'Professor',
  admin: 'Administrador',
};

export function AppSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let timeout: NodeJS.Timeout;
    const onScroll = () => {
      el.classList.add('scrolling');
      clearTimeout(timeout);
      timeout = setTimeout(() => el.classList.remove('scrolling'), 1500);
    };
    el.addEventListener('scroll', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearTimeout(timeout);
    };
  }, []);

  const filteredNavItems = useMemo(() => {
    if (!userRole) return [];
    return defaultNavItems
      .filter((item) => item.roles.includes(userRole))
      .map((item) => {
        if (item.href === '/dashboard/students' && userRole === 'teacher') {
          return { ...item, label: 'Meus Alunos' };
        }
        return item;
      });
  }, [userRole]);

  const filteredAdminNavItems = useMemo(() => {
    if (userRole !== 'admin') return [];
    return defaultAdminNavItems.filter((item) => item.roles.includes(userRole));
  }, [userRole]);

  const settingsLink: NavItem =
    userRole === 'admin'
      ? { href: '/dashboard/admin/settings', icon: Settings, label: 'Configurações', roles: ['admin'] }
      : { href: '/dashboard/profile', icon: UserIcon, label: 'Meu Perfil', roles: ['student', 'teacher'] };

  useEffect(() => {
    const loadUser = async () => {
      const role = localStorage.getItem('userRole') as UserRole | null;
      const userId = localStorage.getItem('userId');
      if (!role || !userId) {
        router.push('/login');
        return;
      }

      setUserRole(role);
      const result = await getUserById(userId);
      if (!result.success || !result.data) {
        localStorage.clear();
        router.push('/login');
        return;
      }

      setUser(result.data);
      localStorage.setItem('currentUser', JSON.stringify(result.data));
    };

    loadUser();
  }, [router]);

  useEffect(() => {
    if (!user?.id) return;
    const pollUnread = async () => {
      const result = await getChatMessagesForUser(user.id);
      if (!result.success || !result.data) return;
      const unread = result.data.some((message: any) => message.receiverId === user.id && !message.readAt);
      setHasNewMessages(unread);
    };

    pollUnread();
    const interval = setInterval(pollUnread, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const pollNotifications = async () => {
      const result = await getUserNotifications(user.id);
      if (!result.success || !result.data) return;
      const unread = result.data.some((n: any) => !n.read);
      setHasNewNotifications(unread);
    };

    pollNotifications();
    const interval = setInterval(pollNotifications, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!userRole) return;
    const allowed = [...filteredNavItems, ...filteredAdminNavItems, settingsLink].some((item) =>
      pathname.startsWith(item.href)
    );
    if (!allowed && pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  }, [filteredAdminNavItems, filteredNavItems, pathname, router, settingsLink, userRole]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const renderLink = (item: NavItem, isLogout = false) => {
    const isActive = pathname === item.href;
    const isChat = item.href === '/dashboard/chat';
    const isNotifications = item.href === '/dashboard/notifications';
    const content = (
      <div
        className={cn(
          'relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all',
          isActive
            ? 'bg-brand-yellow text-slate-900 shadow-sm'
            : 'text-slate-200 hover:bg-slate-800 hover:text-brand-yellow'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="font-semibold">{item.label}</span>
        {isChat && hasNewMessages && (
          <span className="absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-brand-yellow" />
        )}
        {isNotifications && hasNewNotifications && (
          <span className="absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-brand-yellow" />
        )}
      </div>
    );

    return (
      <div key={item.href}>
        {isLogout ? (
          <button onClick={handleLogout} className="w-full text-left">
            {content}
          </button>
        ) : (
          <Link href={item.href}>{content}</Link>
        )}
      </div>
    );
  };

  if (!userRole || !user) return null;

  return (
    <aside
      className={cn(
        'flex h-full max-h-screen w-full flex-col',
        isMobile ? '' : 'hidden border-r border-slate-800 bg-slate-900 text-slate-100 sm:flex'
      )}
    >
      <Link href="/dashboard/profile" className="border-b border-slate-800 p-4 transition-colors hover:bg-slate-800/60">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-brand-yellow">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
            <AvatarFallback className="bg-slate-700 text-brand-yellow">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-100">{user.name}</p>
            <p className="text-xs text-slate-400">{ROLE_LABELS[user.role as UserRole]}</p>
          </div>
        </div>
      </Link>

      <div ref={scrollRef} className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
        <nav className="grid gap-1">
          {filteredNavItems.map((item) => renderLink(item))}
          {filteredAdminNavItems.length > 0 && <div className="my-2 border-t border-slate-800" />}
          {filteredAdminNavItems.map((item) => renderLink(item))}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-3">
        <nav className="grid gap-1">
          {renderLink(settingsLink)}
          {renderLink({ href: '/login', icon: LogOut, label: 'Sair', roles: [] }, true)}
        </nav>
      </div>
    </aside>
  );
}
