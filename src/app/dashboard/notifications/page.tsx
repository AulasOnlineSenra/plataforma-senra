

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, UserPlus, CalendarCheck, Package, XCircle, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Notification, NotificationType, User } from '@/lib/types';
import { notifications as initialNotifications, getMockUser } from '@/lib/data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const NOTIFICATIONS_STORAGE_KEY = 'notificationsList';

const notificationIcons: Record<NotificationType, React.ElementType> = {
  class_scheduled: CalendarCheck,
  class_cancelled: XCircle,
  class_rescheduled: CalendarCheck,
  package_purchased: Package,
  new_user_registered: UserPlus,
  group_class_scheduled: CalendarCheck,
};

const notificationColors: Record<NotificationType, string> = {
    new_user_registered: 'border-blue-500/80 bg-blue-500/10',
    class_scheduled: 'border-green-500/80 bg-green-500/10',
    group_class_scheduled: 'border-green-500/80 bg-green-500/10',
    package_purchased: 'border-purple-500/80 bg-purple-500/10',
    class_cancelled: 'border-red-500/80 bg-red-500/10',
    class_rescheduled: 'border-yellow-500/80 bg-yellow-500/10',
};


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    setCurrentUser(storedUser ? JSON.parse(storedUser) : getMockUser('student'));
  }, []);

  const relevantNotifications = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return notifications;
    }
    return notifications.filter(n => n.userId === currentUser.id || !n.userId);
  }, [currentUser, notifications]);


  useEffect(() => {
    const updateNotifications = () => {
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const notificationsData = storedNotifications ? JSON.parse(storedNotifications) : initialNotifications;
      setNotifications(notificationsData.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp), events: n.events?.map((e:any) => ({...e, date: new Date(e.date)})) })));
    };
    
    updateNotifications();

    const markAllAsReadOnLoad = () => {
        const storedNotificationsStr = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedNotificationsStr && currentUser) {
            let currentNotifications: Notification[] = JSON.parse(storedNotificationsStr);
            
            let hasChanges = false;
            const readNotifications = currentNotifications.map(n => {
                if (currentUser.role === 'admin' || n.userId === currentUser.id) {
                    if (!n.read) {
                        hasChanges = true;
                        return { ...n, read: true };
                    }
                }
                return n;
            });
            
            if (hasChanges) {
                localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(readNotifications));
                setNotifications(readNotifications.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp), events: n.events?.map((e:any) => ({...e, date: new Date(e.date)})) })));
                window.dispatchEvent(new Event('storage')); // Notify sidebar
            }
        }
    };
    
    if (currentUser) {
        markAllAsReadOnLoad();
    }

    window.addEventListener('storage', updateNotifications);
    return () => window.removeEventListener('storage', updateNotifications);
  }, [currentUser]);

  const handleToggleRead = (id: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, read: !n.read } : n
    );
    setNotifications(updatedNotifications);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    window.dispatchEvent(new Event('storage'));
  };
  
  const handleMarkAllAsRead = () => {
    if (!currentUser) return;
    const updatedNotifications = notifications.map(n => {
        if (currentUser.role === 'admin' || n.userId === currentUser.id || !n.userId) {
            return { ...n, read: true };
        }
        return n;
    });
    setNotifications(updatedNotifications);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    window.dispatchEvent(new Event('storage'));
  };
  
  const handleDeleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    window.dispatchEvent(new Event('storage'));
  };
  
  const formatDescription = (description: string) => {
    if (!currentUser || !description) return description;
    return description.replace(currentUser.name, 'Você');
  };

  const filteredNotifications = useMemo(() => {
    return relevantNotifications
      .filter(n => !showUnreadOnly || !n.read)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [relevantNotifications, showUnreadOnly]);

  const unreadCount = useMemo(() => relevantNotifications.filter(n => !n.read).length, [relevantNotifications]);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-2xl md:text-3xl font-bold">
            Notificações
            {unreadCount > 0 && <Badge className="ml-3">{unreadCount} Nova(s)</Badge>}
          </h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setShowUnreadOnly(!showUnreadOnly)} className="w-1/2 sm:w-auto">
                {showUnreadOnly ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />}
                {showUnreadOnly ? 'Mostrar Todas' : 'Mostrar Não Lidas'}
            </Button>
            <Button onClick={handleMarkAllAsRead} disabled={unreadCount === 0} className="w-1/2 sm:w-auto">
                Marcar todas como lidas
            </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification, index) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const isGrouped = notification.type === 'group_class_scheduled' && notification.events && notification.events.length > 0;

                return (
                  <Collapsible 
                    key={notification.id} 
                    open={openCollapsible === notification.id}
                    onOpenChange={(isOpen) => setOpenCollapsible(isOpen ? notification.id : null)}
                    className={cn(
                      'flex flex-col items-start gap-4 transition-colors hover:bg-accent/50',
                      !notification.read && 'bg-primary/5',
                      index < filteredNotifications.length - 1 && 'border-b'
                    )}
                  >
                    <div className="flex w-full items-start p-4">
                      <div className={cn(
                          'hidden sm:flex items-center justify-center h-12 w-12 rounded-full border',
                          notificationColors[notification.type]
                      )}>
                          <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 ml-4">
                        <p className="font-semibold">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{formatDescription(notification.description)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right self-stretch justify-between">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: ptBR })}
                        </span>
                        <div className="flex gap-1">
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title={notification.read ? 'Marcar como não lida' : 'Marcar como lida'}
                                  onClick={(e) => { e.stopPropagation(); handleToggleRead(notification.id); }}
                              >
                                  {notification.read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  title="Excluir notificação"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notification.id); }}
                              >
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                              {isGrouped && (
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        {openCollapsible === notification.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </CollapsibleTrigger>
                              )}
                        </div>
                      </div>
                    </div>
                    {isGrouped && (
                      <CollapsibleContent className="w-full px-4 pb-4 pl-20">
                          <div className="border-t pt-3 mt-2 space-y-2">
                             <h4 className="font-semibold text-sm">Aulas Agendadas no Grupo:</h4>
                             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {notification.events?.map((event, i) => (
                                    <li key={i}>
                                        <span className="font-medium text-foreground">{event.subject}</span> com {event.teacher} em {format(event.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </li>
                                ))}
                             </ul>
                          </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="mx-auto h-12 w-12" />
                <p className="mt-4">Nenhuma notificação por aqui.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
