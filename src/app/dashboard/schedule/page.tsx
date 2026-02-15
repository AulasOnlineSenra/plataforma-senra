'use client';
import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { scheduleEvents as initialScheduleEvents, users as initialUsers, getMockUser } from '@/lib/data';
import type { ScheduleEvent } from '@/lib/types';
import { format, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMinutes, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { XCircle, Pencil, BookOpen, Archive, Trash2, ArrowRightLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// INJEÇÃO DOS PROFESSORES REAIS
import { getTeachers } from '@/app/actions/users';

const SCHEDULE_STORAGE_KEY = 'scheduleEvents';
const USERS_STORAGE_KEY = 'userList';

function SchedulePageComponent() {
  const searchParams = useSearchParams();
  const teacherIdFilterParam = searchParams.get('teacherId');

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [users, setUsers] = useState<any[]>([]); // CORRIGIDO PARA ANY
  const [teachers, setTeachers] = useState<any[]>([]); 
  const [currentUser, setCurrentUser] = useState<any | null>(null); // CORRIGIDO PARA ANY
  const [isClient, setIsClient] = useState(false);
  const [userIdFilter, setUserIdFilter] = useState<string>('all');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { toast } = useToast();
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('week');

  const updateData = useCallback(async () => {
    // Busca professores reais
    const res = await getTeachers();
    if (res.success && res.data) {
        setTeachers(res.data);
    }

    const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    let scheduleToProcess: ScheduleEvent[] = [];
    if (storedSchedule) {
        scheduleToProcess = JSON.parse(storedSchedule).map((event: any) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
        }));
    } else {
        scheduleToProcess = initialScheduleEvents;
    }
    
    setEvents(scheduleToProcess);
    
    const storedUsersStr = localStorage.getItem(USERS_STORAGE_KEY);
    let currentUsers: any[] = storedUsersStr ? JSON.parse(storedUsersStr) : initialUsers;
    setUsers(currentUsers);

    const storedCurrentUser = localStorage.getItem('currentUser');
    if (storedCurrentUser) {
        setCurrentUser(JSON.parse(storedCurrentUser));
    } else {
        setCurrentUser(getMockUser('student'));
    }
  }, []);

  useEffect(() => {
    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, [updateData]);

  useEffect(() => {
    setDate(new Date());
  }, []); 
  
  const allAppUsers = useMemo(() => [...users, ...teachers], [users, teachers]);

  const filterEventsByUser = useCallback((eventsToFilter: ScheduleEvent[]) => {
    if (currentUser?.role === 'student') return eventsToFilter.filter(e => e.studentId === currentUser.id);
    if (currentUser?.role === 'teacher') return eventsToFilter.filter(e => e.teacherId === currentUser.id);
    
    if (userIdFilter !== 'all') {
        const selectedUser = allAppUsers.find(u => u.id === userIdFilter);
        if (selectedUser?.role === 'teacher') return eventsToFilter.filter(e => e.teacherId === userIdFilter);
        else return eventsToFilter.filter(e => e.studentId === userIdFilter);
    }
    return eventsToFilter;
  }, [currentUser, userIdFilter, allAppUsers]);

  const filteredEvents = useMemo(() => {
    let relevantEvents = filterEventsByUser(events.filter(e => e.status === 'scheduled'));
    if (teacherIdFilterParam) relevantEvents = relevantEvents.filter(e => e.teacherId === teacherIdFilterParam);
    if (!date) return relevantEvents.sort((a,b) => a.start.getTime() - b.start.getTime());

    if (filterType === 'day') {
        return relevantEvents.filter((e) => e.start.getDate() === date.getDate() && e.start.getMonth() === date.getMonth() && e.start.getFullYear() === date.getFullYear()).sort((a,b) => a.start.getTime() - b.start.getTime());
    }

    let interval = filterType === 'week' ? { start: startOfWeek(date, { locale: ptBR }), end: endOfWeek(date, { locale: ptBR }) } : { start: startOfMonth(date), end: endOfMonth(date) };
    return relevantEvents.filter(e => isWithinInterval(e.start, interval)).sort((a,b) => a.start.getTime() - b.start.getTime());
  }, [date, filterType, events, teacherIdFilterParam, filterEventsByUser]);
  
  const completedEvents = useMemo(() => filterEventsByUser(events.filter(e => e.status === 'completed')).sort((a, b) => b.start.getTime() - a.start.getTime()), [events, filterEventsByUser]);
  const cancelledEvents = useMemo(() => filterEventsByUser(events.filter(e => e.status === 'cancelled')).sort((a, b) => b.start.getTime() - a.start.getTime()), [events, filterEventsByUser]);
  const calendarMarkedDays = useMemo(() => filterEventsByUser(events.filter(e => e.status === 'scheduled')).map(e => e.start), [events, filterEventsByUser]);

  const getStudentById = (studentId: string): any | undefined => users.find(u => u.id === studentId);
  const getTeacherById = (teacherId: string): any | undefined => teachers.find(t => t.id === teacherId);

  const formatScheduledDate = (start: Date, end: Date) => {
    const timeFormat = `'às' HH:mm - ${format(end, 'HH:mm')}`;
    if (isToday(start)) return `Hoje, ${format(start, timeFormat)}`;
    if (isTomorrow(start)) return `Amanhã, ${format(start, timeFormat)}`;
    return format(start, `EEEE, dd/MM/yyyy ${timeFormat}`, { locale: ptBR });
  };

  const formatHistoryDate = (start: Date, end: Date) => {
    const timeFormat = `'às' HH:mm - ${format(end, 'HH:mm')}`;
    if (isToday(start)) return `Hoje, ${timeFormat}`;
    if (isYesterday(start)) return `Ontem, ${timeFormat}`;
    return `${format(start, "EEEE, dd/MM " + timeFormat, { locale: ptBR })}`;
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="font-headline text-2xl md:text-3xl font-bold">Agenda de Aulas</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-3 flex flex-col justify-center">
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
              <CardDescription>Selecione um dia para ver os detalhes.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex justify-center items-center p-0">
              {isClient ? (
                <Calendar mode="single" selected={date} onSelect={setDate} className="p-0 sm:p-3" locale={ptBR} modifiers={{ scheduled: calendarMarkedDays }} modifiersClassNames={{ scheduled: "relative border-2 border-brand-yellow shadow-md" }} />
              ) : (
                <div className="p-0 sm:p-3 w-full h-[345px] flex items-center justify-center bg-muted/50 rounded-md">Carregando calendário...</div>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-4 flex flex-col" id="scheduled-classes">
            <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)} className="w-full flex flex-col flex-1">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="grid gap-1">
                  <CardTitle>Aulas Agendadas</CardTitle>
                  <CardDescription>Visualização detalhada</CardDescription>
                </div>
                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                    <TabsTrigger value="day">Dia</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ScrollArea className="h-full max-h-[300px] pr-4">
                <div className="grid gap-4">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => {
                      const teacher = getTeacherById(event.teacherId);
                      const student = getStudentById(event.studentId);
                      
                      const personToShow = (currentUser?.role === 'teacher') ? student : teacher;
                      const fallback = personToShow ? personToShow.name.charAt(0) : '?';
                      
                      return (
                          <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3">
                              <div className="flex items-center gap-3 flex-1">
                                  <Avatar className='h-12 w-12'>
                                      <AvatarImage src={personToShow?.avatarUrl} alt={personToShow?.name} />
                                      <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">{fallback}</AvatarFallback>
                                  </Avatar>
                                  <div className="grid gap-1">
                                      <div className="flex flex-wrap items-center gap-x-2">
                                          <p className="font-semibold text-slate-800">{personToShow?.name || "Professor não encontrado"}</p>
                                          <p className="text-sm text-muted-foreground">•</p>
                                          <p className="text-sm text-muted-foreground">{currentUser?.role === 'teacher' ? 'Aluno(a)' : 'Professor(a)'}</p>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                          <span>{event.subject}</span>
                                          <span>•</span>
                                          <span className="text-brand-yellow font-bold">{formatScheduledDate(event.start, event.end)}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full min-h-[150px]">
                      <p>Nenhuma aula agendada para este período.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            </Tabs>
          </Card>
        </div>

        <Card id="completed-history">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-6 w-6 text-slate-700" /> Histórico de Aulas</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
                <Table>
                <TableHeader>
                    <TableRow>
                    {currentUser?.role !== 'teacher' && <TableHead>Professor(a)</TableHead>}
                    {currentUser?.role !== 'student' && <TableHead>Aluno(a)</TableHead>}
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {completedEvents.length > 0 ? (
                    completedEvents.map((event) => {
                        const student = getStudentById(event.studentId);
                        const teacher = getTeacherById(event.teacherId);
                        return (
                        <TableRow key={event.id}>
                            {currentUser?.role !== 'teacher' && <TableCell className="font-medium text-slate-800">{teacher?.name || 'N/A'}</TableCell>}
                            {currentUser?.role !== 'student' && <TableCell>{student?.name || 'N/A'}</TableCell>}
                            <TableCell>{event.subject}</TableCell>
                            <TableCell className="text-right text-slate-600 font-medium">{formatHistoryDate(event.start, event.end)}</TableCell>
                        </TableRow>
                        );
                    })
                    ) : (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-slate-500">Nenhuma aula concluída ainda.</TableCell></TableRow>
                    )}
                </TableBody>
                </Table>
            </ScrollArea>
          </CardContent>
        </Card>

      </div>
    </>
  );
}

export default function SchedulePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <SchedulePageComponent />
        </Suspense>
    )
}