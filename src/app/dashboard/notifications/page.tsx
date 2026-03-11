"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  UserPlus,
  CalendarCheck,
  Package,
  XCircle,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { NotificationType, User } from "@/lib/types";
import { notifications as initialNotifications, getMockUser } from "@/lib/data";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getUserNotifications,
  markNotificationAsRead,
} from "@/app/actions/users";

const NOTIFICATIONS_STORAGE_KEY = "notificationsList";

const notificationIcons: Record<NotificationType | string, React.ElementType> =
  {
    class_scheduled: CalendarCheck,
    class_cancelled: XCircle,
    class_rescheduled: CalendarCheck,
    package_purchased: Package,
    new_user_registered: UserPlus,
    group_class_scheduled: CalendarCheck,
    REFERRAL: UserPlus,
  };

const notificationColors: Record<NotificationType | string, string> = {
  new_user_registered: "bg-blue-100 text-blue-600 border-blue-100",
  class_scheduled: "bg-amber-100 text-amber-600 border-amber-100",
  group_class_scheduled: "bg-amber-100 text-amber-600 border-amber-100",
  package_purchased: "bg-emerald-100 text-emerald-600 border-emerald-100",
  class_cancelled: "bg-red-100 text-red-600 border-red-100",
  class_rescheduled: "bg-purple-100 text-purple-600 border-purple-100",
  REFERRAL: "bg-emerald-100 text-emerald-600 border-emerald-100",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    setCurrentUser(
      storedUser ? JSON.parse(storedUser) : getMockUser("student"),
    );
  }, []);

  const relevantNotifications = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "admin") return notifications;

    return notifications.filter(
      (n) => n.userId === currentUser.id || !n.userId,
    );
  }, [currentUser, notifications]);

  useEffect(() => {
    const updateNotifications = async () => {
      if (currentUser?.id) {
        const response = await getUserNotifications(currentUser.id);
        if (response.success && response.data) {
          const dbNotifications = response.data.map((n: any) => ({
            ...n,
            description: n.message, // Correção: Mapeia o campo do banco para a tela
            timestamp: new Date(n.createdAt),
          }));
          setNotifications(dbNotifications);
          return;
        }
      }

      const storedNotifications = localStorage.getItem(
        NOTIFICATIONS_STORAGE_KEY,
      );
      const notificationsData = storedNotifications
        ? JSON.parse(storedNotifications)
        : initialNotifications;

      setNotifications(
        notificationsData.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          events: n.events?.map((e: any) => ({ ...e, date: new Date(e.date) })),
        })),
      );
    };

    updateNotifications();

    const interval = setInterval(updateNotifications, 5000);
    window.addEventListener("storage", updateNotifications);

    return () => {
      window.removeEventListener("storage", updateNotifications);
      clearInterval(interval);
    };
  }, [currentUser]);

  const handleToggleRead = async (id: string) => {
    const updatedNotifications = notifications.map((n) =>
      n.id === id ? { ...n, read: !n.read } : n,
    );
    setNotifications(updatedNotifications);
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    if (!currentUser) return;
    const updatedNotifications = notifications.map((n) => ({
      ...n,
      read: true,
    }));
    setNotifications(updatedNotifications);
  };

  const handleDeleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter((n) => n.id !== id);
    setNotifications(updatedNotifications);
  };

  const formatDescription = (description: string) => {
    if (!currentUser || !description) return description;
    return description.replace(currentUser.name, "Você");
  };

  const filteredNotifications = useMemo(() => {
    return relevantNotifications
      .filter((n) => !showUnreadOnly || !n.read)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [relevantNotifications, showUnreadOnly]);

  const unreadCount = useMemo(
    () => relevantNotifications.filter((n) => !n.read).length,
    [relevantNotifications],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 md:gap-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center mt-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-3xl font-bold text-slate-900 tracking-tight">
              Central de Notificações
            </h1>
            {unreadCount > 0 && (
              <Badge className="border-none bg-brand-yellow px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-900 shadow-sm">
                {unreadCount} Novas
              </Badge>
            )}
          </div>
          <p className="mt-1 text-slate-500">
            Acompanhe as atualizações, agendamentos e avisos da plataforma.
          </p>
        </div>

        <div className="flex w-full gap-3 sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className="w-1/2 sm:w-auto h-11 rounded-xl border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 shadow-sm transition-all"
          >
            {showUnreadOnly ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {showUnreadOnly ? "Ver Todas" : "Apenas Não Lidas"}
          </Button>
          <Button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="w-1/2 sm:w-auto h-11 rounded-xl bg-brand-yellow font-bold text-slate-900 shadow-sm hover:scale-105 hover:bg-brand-yellow/90 transition-all"
          >
            Marcar todas lidas
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification, index) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const isGrouped =
                  notification.type === "group_class_scheduled" &&
                  notification.events?.length > 0;

                return (
                  <Collapsible
                    key={notification.id}
                    open={openCollapsible === notification.id}
                    onOpenChange={(isOpen) =>
                      setOpenCollapsible(isOpen ? notification.id : null)
                    }
                    className={cn(
                      "flex flex-col items-start gap-4 transition-colors hover:bg-slate-50/80 px-4 md:px-8",
                      !notification.read && "bg-amber-50/30",
                      index < filteredNotifications.length - 1 &&
                        "border-b border-slate-100",
                    )}
                  >
                    <div className="flex w-full items-start py-6">
                      <div
                        className={cn(
                          "hidden h-14 w-14 items-center justify-center rounded-2xl border sm:flex shadow-sm shrink-0",
                          notificationColors[notification.type] ||
                            "bg-gray-100 text-gray-600 border-gray-100",
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="ml-0 sm:ml-5 flex-1 pt-1">
                        <p className="text-base font-bold text-slate-800 tracking-tight leading-snug">
                          {notification.title}
                        </p>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                          {formatDescription(notification.description)}
                        </p>
                      </div>

                      <div className="flex self-stretch flex-col items-end justify-between pl-4 gap-2 text-right">
                        <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-slate-400">
                          {formatDistanceToNow(notification.timestamp, {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleRead(notification.id);
                            }}
                          >
                            {notification.read ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>

                          {isGrouped && (
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full text-slate-400 hover:bg-slate-200"
                              >
                                {openCollapsible === notification.id ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          )}
                        </div>
                      </div>
                    </div>

                    {isGrouped && (
                      <CollapsibleContent className="w-full pb-6 sm:pl-20">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-inner">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-3">
                            Aulas Agendadas:
                          </h4>
                          <ul className="space-y-2 text-sm text-slate-600">
                            {notification.events?.map(
                              (event: any, i: number) => (
                                <li key={i} className="flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow"></div>
                                  <span>
                                    <strong className="font-bold text-slate-900">
                                      {event.subject}
                                    </strong>{" "}
                                    com {event.teacher} em{" "}
                                    <strong className="font-bold text-slate-800">
                                      {format(
                                        event.date,
                                        "dd/MM/yyyy 'às' HH:mm",
                                        { locale: ptBR },
                                      )}
                                    </strong>
                                  </span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
                <div className="rounded-full bg-slate-50 p-6 mb-4">
                  <Bell className="h-12 w-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">
                  Tudo limpo por aqui!
                </h3>
                <p className="mt-2 text-slate-500 max-w-sm">
                  Você não tem nenhuma notificação no momento.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
