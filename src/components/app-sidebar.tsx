

'use client';

import { useState, useEffect, useCallback, DragEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpenCheck,
  MessageSquare,
  WalletCards,
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
  Lightbulb,
  Gift,
  GripVertical,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole, User, NavItem, Teacher, ChatContact, Suggestion } from '@/lib/types';
import { getMockUser, navItems as defaultNavItems, adminNavItems as defaultAdminNavItems, users as initialUsers, teachers as initialTeachers, chatContacts as initialChatContacts, suggestions as initialSuggestions } from '@/lib/data';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

const USERS_STORAGE_KEY = 'userList';
const TEACHERS_STORAGE_KEY = 'teacherList';
const CHAT_CONTACTS_STORAGE_KEY = 'chatContacts';
const SUGGESTIONS_STORAGE_KEY = 'suggestionsList';
const LAST_SUGGESTIONS_VIEW_KEY = 'lastSuggestionsViewTimestamp';


export function AppSidebar({ isMobile = false, isCollapsed = false }: { isMobile?: boolean, isCollapsed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);
  const [adminNavItems, setAdminNavItems] = useState<NavItem[]>(defaultAdminNavItems);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);


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
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
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
  }, [router]);

  useEffect(() => {
    updateUserAndNotifications();

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'currentUser' || e.key === USERS_STORAGE_KEY || e.key === TEACHERS_STORAGE_KEY || e.key === `chatContacts_${user?.id}` || e.key === SUGGESTIONS_STORAGE_KEY || e.key === LAST_SUGGESTIONS_VIEW_KEY) {
            updateUserAndNotifications();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateUserAndNotifications, user?.id]);
  
  useEffect(() => {
    const storedNavOrder = localStorage.getItem('navOrder');
    if (storedNavOrder) {
      const orderedHrefs = JSON.parse(storedNavOrder);
      const reorderedNavItems = orderedHrefs.map((href: string) => defaultNavItems.find(item => item.href === href)).filter(Boolean);
      const remainingNavItems = defaultNavItems.filter(item => !orderedHrefs.includes(item.href));
      setNavItems([...reorderedNavItems, ...remainingNavItems]);
    }

    const storedAdminNavOrder = localStorage.getItem('adminNavOrder');
    if (storedAdminNavOrder) {
      const orderedAdminHrefs = JSON.parse(storedAdminNavOrder);
      const reorderedAdminNavItems = orderedAdminHrefs.map((href: string) => defaultAdminNavItems.find(item => item.href === href)).filter(Boolean);
      const remainingAdminNavItems = defaultAdminNavItems.filter(item => !orderedAdminHrefs.includes(item.href));
      setAdminNavItems([...reorderedAdminNavItems, ...remainingAdminNavItems]);
    }
  }, []);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, href: string) => {
    e.dataTransfer.setData('text/plain', href);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLDivElement;
    target.classList.add('dragging');
    if (e.dataTransfer) {
      const empty = new Image();
      e.dataTransfer.setDragImage(empty, 0, 0);
    }
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).classList.remove('dragging');
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, itemType: 'main' | 'admin') => {
    e.preventDefault();
    const droppedOnElement = e.currentTarget as HTMLDivElement;
    droppedOnElement.classList.remove('drag-over');

    const droppedOnHref = droppedOnElement.dataset.href;
    const draggedHref = e.dataTransfer.getData('text/plain');
    
    if (droppedOnHref === draggedHref) return;

    const currentItems = itemType === 'main' ? navItems : adminNavItems;
    const setItems = itemType === 'main' ? setNavItems : setAdminNavItems;
    const storageKey = itemType === 'main' ? 'navOrder' : 'adminNavOrder';

    const draggedItem = currentItems.find(item => item.href === draggedHref);
    if (!draggedItem) return;

    const itemsWithoutDragged = currentItems.filter(item => item.href !== draggedHref);
    let dropIndex = itemsWithoutDragged.findIndex(item => item.href === droppedOnHref);

    const targetRect = droppedOnElement.getBoundingClientRect();
    const isAfter = e.clientY > targetRect.top + targetRect.height / 2;
    if (isAfter) {
      dropIndex++;
    }

    const newItems = [
        ...itemsWithoutDragged.slice(0, dropIndex),
        draggedItem,
        ...itemsWithoutDragged.slice(dropIndex)
    ];

    setItems(newItems);
    localStorage.setItem(storageKey, JSON.stringify(newItems.map(item => item.href)));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).classList.add('drag-over');
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).classList.remove('drag-over');
  }


  if (!userRole || !user) {
    return null; 
  }

  const roleLabels: Record<UserRole, string> = {
    student: 'Aluno',
    teacher: 'Professor',
    admin: 'Administrador',
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('navOrder');
    localStorage.removeItem('adminNavOrder');
    localStorage.removeItem('userId');
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

  const settingsLink: NavItem =
    userRole === 'admin'
      ? { href: '/dashboard/admin/settings', icon: Settings, label: 'Configurações', roles: ['admin'] }
      : { href: '/dashboard/profile', icon: UserIcon, label: 'Meu Perfil', roles: ['student', 'teacher'] };

  const renderLink = (item: NavItem, isLogout = false, itemType?: 'main' | 'admin') => {
    const isActive = pathname === item.href;
    const isDraggable = userRole === 'admin' && itemType && !isMobile && !isCollapsed;
    const isChat = item.href === '/dashboard/chat';
    const isSuggestions = item.href === '/dashboard/suggestions';

    const handleLinkClick = () => {
      if (isSuggestions && userRole === 'admin') {
        localStorage.setItem(LAST_SUGGESTIONS_VIEW_KEY, Date.now().toString());
        setHasNewSuggestions(false);
      }
    };
    
    const LinkContent = (
      <div
        className={cn(
          'relative flex items-center gap-4 rounded-lg px-3 py-2 transition-all',
          'text-base group',
          isDraggable && 'cursor-grab',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground/80 hover:text-brand-yellow hover:bg-sidebar-accent',
          isCollapsed && 'justify-center'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span className={cn('font-medium', isCollapsed && 'sr-only')}>{item.label}</span>
        {isChat && hasNewMessages && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-brand-yellow" />
        )}
        {isSuggestions && hasNewSuggestions && userRole === 'admin' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-brand-yellow" />
        )}
      </div>
    );

    const WrapperComponent = (
        <div
            key={item.href}
            data-href={item.href}
            onDragStart={isDraggable ? (e) => handleDragStart(e, item.href) : undefined}
            onDragEnd={isDraggable ? handleDragEnd : undefined}
            onDrop={isDraggable ? (e) => handleDrop(e, itemType!) : undefined}
            onDragOver={isDraggable ? handleDragOver : undefined}
            onDragLeave={isDraggable ? handleDragLeave : undefined}
            draggable={isDraggable}
        >
        { isLogout ? (
            <button onClick={handleLogout} className="w-full text-left">
                {LinkContent}
            </button>
        ) : (
             <Link href={item.href} onClick={handleLinkClick} onDragStart={(e) => e.preventDefault()} draggable={false}>
              {LinkContent}
            </Link>
        )}
      </div>
    );

    return WrapperComponent;
  };

  return (
    <aside className={cn(
        "flex h-full max-h-screen flex-col w-full group", 
        isMobile ? '' : 'hidden sm:flex bg-sidebar text-sidebar-foreground',
        isCollapsed && 'is-collapsed'
    )}>
        <Link href="/dashboard/profile" className={cn("block border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors", isCollapsed && "py-4")}>
          <div className={cn("flex h-auto items-center p-4 lg:h-auto", isCollapsed && "justify-center")}>
              <div className={cn("flex items-center gap-3", isCollapsed && 'flex-col')}>
                  <Avatar className={cn("h-12 w-12 border-2 border-primary", isCollapsed && "h-10 w-10")}>
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={cn('flex flex-col', isCollapsed && 'hidden')}>
                      <span className="font-semibold text-lg text-sidebar-foreground">{user.name}</span>
                      <span className="text-sm text-sidebar-foreground/80">{roleLabels[user.role]}</span>
                  </div>
              </div>
          </div>
        </Link>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium lg:px-4 py-4", isMobile ? 'py-4' : '')}>
                    {filteredNavItems.map(item => renderLink(item, false, 'main'))}
                    {filteredAdminNavItems.length > 0 && (
                        <>
                            <div className="my-2 mx-3 h-px bg-sidebar-border" />
                            {filteredAdminNavItems.map(item => renderLink(item, false, 'admin'))}
                        </>
                    )}
                </nav>
        </div>
        <div className="mt-auto p-4 border-t border-sidebar-border">
                <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
                    {renderLink(settingsLink)}
                    {renderLink({ href: '/login', icon: LogOut, label: 'Sair', roles: []}, true)}
                </nav>
        </div>
    </aside>
  );
}
