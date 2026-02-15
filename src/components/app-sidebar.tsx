'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, BookOpenCheck, MessageSquare,
  WalletCards, Settings, KeyRound, FileText, LogOut, Users,
  Banknote, History, Briefcase, TrendingUp, HeartHandshake,
  DollarSign, Package, Bot, Lightbulb, Gift, GripVertical,
  User as UserIcon, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole, User, NavItem, Teacher, ChatContact, Suggestion, Notification, ScheduleEvent } from '@/lib/types';
import { getMockUser, navItems as defaultNavItems, adminNavItems as defaultAdminNavItems, users as initialUsers, teachers as initialTeachers, chatContacts as initialChatContacts, suggestions as initialSuggestions, notifications as initialNotifications, logNotification, scheduleEvents as initialScheduleEvents } from '@/lib/data';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter } from 'next/navigation';
import { isToday, format } from 'date-fns';

const USERS_STORAGE_KEY = 'userList';
const TEACHERS_STORAGE_KEY = 'teacherList';
const CHAT_CONTACTS_STORAGE_KEY = 'chatContacts';
const SUGGESTIONS_STORAGE_KEY = 'suggestionsList';
const LAST_SUGGESTIONS_VIEW_KEY = 'lastSuggestionsViewTimestamp';
const NOTIFICATIONS_STORAGE_KEY = 'notificationsList';
const LAST_NOTIFICATIONS_VIEW_KEY = 'lastNotificationsViewTimestamp';
const SCHEDULE_STORAGE_KEY = 'scheduleEvents';
const DAILY_REMINDER_STORAGE_KEY = 'dailyReminderSent';

const checkAndSendDailyReminder = (user: User | Teacher) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const reminderKey = `${DAILY_REMINDER_STORAGE_KEY}_${user.id}_${todayStr}`;

    if (localStorage.getItem(reminderKey)) return;

    const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    const schedule: ScheduleEvent[] = storedSchedule
        ? JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start) }))
        : initialScheduleEvents;
    
    const userField = user.role === 'teacher' ? 'teacherId' : 'studentId';
    const todaysClasses = schedule.filter(e => e[userField] === user.id && e.status === 'scheduled' && isToday(e.start));

    if (todaysClasses.length > 0) {
        let description = `Você tem ${todaysClasses.length} ${todaysClasses.length > 1 ? 'aulas agendadas' : 'aula agendada'} para hoje. Não se esqueça!`;
        
        if (user.role === 'teacher') {
            const storedUsersStr = localStorage.getItem(USERS_STORAGE_KEY);
            const allStudents: User[] = storedUsersStr ? JSON.parse(storedUsersStr) : initialUsers;
            const studentIds = new Set(todaysClasses.map(c => c.studentId));
            const studentNames = Array.from(studentIds).map(id => allStudents.find(s => s.id === id)?.name).filter(Boolean);
            
            if (studentNames.length > 0) {
                description = `Você tem ${todaysClasses.length} ${todaysClasses.length > 1 ? 'aulas agendadas' : 'aula agendada'} hoje com: ${studentNames.join(', ')}.`;
            }
        }

        logNotification({
            type: 'class_scheduled',
            title: 'Lembrete de Aula(s) Hoje!',
            description: description,
            userId: user.id,
        });
        localStorage.setItem(reminderKey, 'true');
    }
};

export function AppSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  // CORREÇÃO DO TYPESCRIPT AQUI: Aceita User ou Teacher
  const [user, setUser] = useState<User | Teacher | null>(null);
  
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const updateUserAndNotifications = useCallback(() => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    const userId = localStorage.getItem('userId');

    if (role && userId) {
      setUserRole(role);
      
      const storedUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || JSON.stringify(initialUsers));
      const storedTeachers = JSON.parse(localStorage.getItem(TEACHERS_STORAGE_KEY) || JSON.stringify(initialTeachers));
      const allPersistedUsers: (User | Teacher)[] = [...storedUsers, ...storedTeachers];

      const foundUser = allPersistedUsers.find(u => u.id === userId);

      if (foundUser) {
        setUser(foundUser);
        
        const currentUserInStorage = localStorage.getItem('currentUser');
        if (!currentUserInStorage) {
           localStorage.setItem('currentUser', JSON.stringify(foundUser));
        }
        checkAndSendDailyReminder(foundUser);
      } else {
        const mockUser = getMockUser(role);
        setUser(mockUser);
        localStorage.setItem('currentUser', JSON.stringify(mockUser));
      }
      
      const userContactsKey = `chatContacts_${userId}`;
      const storedContactsStr = localStorage.getItem(userContactsKey);
      const contacts: ChatContact[] = storedContactsStr ? JSON.parse(storedContactsStr) : initialChatContacts.filter(c => c.id !== userId);
      const unread = contacts.some(c => c.unreadCount > 0);
      setHasNewMessages(unread);

      const storedNotificationsStr = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const notifications: Notification[] = storedNotificationsStr ? JSON.parse(storedNotificationsStr).map((n:any) => ({...n, timestamp: new Date(n.timestamp)})) : initialNotifications;
      
      let relevantNotifications = notifications;
      if (role !== 'admin') {
          relevantNotifications = notifications.filter(n => n.userId === userId || !n.userId);
      }
      const unreadNotifications = relevantNotifications.some(n => !n.read);
      setHasUnreadNotifications(unreadNotifications);

      if (role === 'admin') {
        const storedSuggestionsStr = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
        const suggestions: Suggestion[] = storedSuggestionsStr ? JSON.parse(storedSuggestionsStr).map((s: any) => ({...s, timestamp: new Date(s.timestamp)})) : initialSuggestions;
        const lastViewTimestamp = localStorage.getItem(LAST_SUGGESTIONS_VIEW_KEY);
        const lastViewDate = lastViewTimestamp ? new Date(parseInt(lastViewTimestamp)) : new Date(0);
        const newSuggestions = suggestions.some(s => s.status === 'received' && s.timestamp > lastViewDate);
        setHasNewSuggestions(newSuggestions);
      } else {
        setHasNewSuggestions(false);
      }

    } else {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    updateUserAndNotifications();

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === `chatContacts_${user?.id}` || e.key === SUGGESTIONS_STORAGE_KEY || e.key === NOTIFICATIONS_STORAGE_KEY) {
            updateUserAndNotifications();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateUserAndNotifications, user?.id]);
  
  if (!userRole || !user) return null; 

  const roleLabels: Record<UserRole, string> = {
    student: 'Aluno',
    teacher: 'Professor',
    admin: 'Administrador',
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    router.push('/login');
  };

  const filteredNavItems = defaultNavItems.filter(item =>
    item.roles.includes(userRole)
  ).map(item => {
    if (item.href === '/dashboard/students' && userRole === 'teacher') {
      return { ...item, label: 'Meus Alunos' };
    }
    return item;
  });

  const filteredAdminNavItems = userRole === 'admin' ? defaultAdminNavItems.filter(item => item.roles.includes(userRole)) : [];

  const settingsLink: NavItem = userRole === 'admin'
      ? { href: '/dashboard/admin/settings', icon: Settings, label: 'Configurações', roles: ['admin'] }
      : { href: '/dashboard/profile', icon: UserIcon, label: 'Meu Perfil', roles: ['student', 'teacher'] };

  const renderLink = (item: NavItem, isLogout = false) => {
    const isActive = pathname === item.href;
    const isChat = item.href === '/dashboard/chat';
    const isSuggestions = item.href === '/dashboard/suggestions';
    const isNotifications = item.href === '/dashboard/notifications';

    const handleLinkClick = () => {
      if (isSuggestions && userRole === 'admin') {
        localStorage.setItem(LAST_SUGGESTIONS_VIEW_KEY, Date.now().toString());
        setHasNewSuggestions(false);
      }
      if (isNotifications) {
        setHasUnreadNotifications(false);
        const storedNotificationsStr = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedNotificationsStr && user) {
            let currentNotifications: Notification[] = JSON.parse(storedNotificationsStr);
            const readNotifications = currentNotifications.map(n => {
                if(user.role === 'admin' || n.userId === user.id || !n.userId) return {...n, read: true };
                return n;
            });
            localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(readNotifications));
        }
      }
    };
    
    const LinkContent = (
      <div className={cn('relative flex items-center gap-4 rounded-lg px-3 py-2 transition-all text-base group', isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 hover:text-brand-yellow hover:bg-sidebar-accent')}>
        <item.icon className="h-5 w-5 shrink-0" />
        <span className={cn('font-medium')}>{item.label}</span>
        {isChat && hasNewMessages && <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-brand-yellow" />}
        {isSuggestions && hasNewSuggestions && userRole === 'admin' && <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-brand-yellow" />}
        {isNotifications && hasUnreadNotifications && <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-brand-yellow" />}
      </div>
    );

    return (
        <div key={item.href} data-href={item.href}>
        { isLogout ? (
            <button onClick={handleLogout} className="w-full text-left">{LinkContent}</button>
        ) : (
             <Link href={item.href} onClick={handleLinkClick}>{LinkContent}</Link>
        )}
      </div>
    );
  };

  return (
    <aside className={cn("flex h-full max-h-screen flex-col w-full group", isMobile ? '' : 'hidden sm:flex bg-sidebar text-sidebar-foreground')}>
        <Link href="/dashboard/profile" className={cn("block border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors")}>
          <div className={cn("flex h-auto items-center p-4 lg:h-auto")}>
              <div className={cn("flex items-center gap-3")}>
                  <Avatar className={cn("h-12 w-12 border-2 border-primary")}>
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={cn('flex flex-col')}>
                      <span className="font-semibold text-lg text-sidebar-foreground">{user.name}</span>
                      <span className="text-sm text-sidebar-foreground/80">{roleLabels[user.role as UserRole]}</span>
                  </div>
              </div>
          </div>
        </Link>
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium lg:px-4 py-4", isMobile ? 'py-4' : '')}>
                    {filteredNavItems.map(item => renderLink(item))}
                    {filteredAdminNavItems.length > 0 && (
                        <>
                            <div className="my-2 mx-3 h-px bg-sidebar-border" />
                            {filteredAdminNavItems.map(item => renderLink(item))}
                        </>
                    )}
                </nav>
        </div>
        <div className="mt-auto border-t border-sidebar-border py-2">
            <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
                {renderLink(settingsLink)}
                {renderLink({ href: '/login', icon: LogOut, label: 'Sair', roles: []}, true)}
            </nav>
        </div>
    </aside>
  );
}