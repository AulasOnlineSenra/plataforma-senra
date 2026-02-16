'use client';
import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { getMockUser } from '@/lib/data';
import { format, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isTomorrow, isYesterday } from 'date-fns';
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

// NOSSOS MOTORES DE BANCO DE DADOS
import { getTeachers, getStudents } from '@/app/actions/users';
import { getLessons } from '@/app/actions/bookings';

function SchedulePageComponent() {
  const searchParams = useSearchParams();
  const teacherIdFilterParam = searchParams.get('teacherId');

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]); 
  const [teachers, setTeachers] = useState<any[]>([]); 
  const [currentUser, setCurrentUser] = useState<any | null>(null); 
  const [isClient, setIsClient] = useState(false);
  const [userIdFilter, setUserIdFilter] = useState<string>('all');

  useEffect(() => {
    setIsClient(true);
    setDate(new Date());
  }, []);

  const { toast } = useToast();
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('week');

  const updateData = useCallback(async () => {
    // 1. Busca Professores e Alunos Reais
    const resTeachers = await getTeachers();
    if (resTeachers.success && resTeachers.data) setTeachers(resTeachers.data);

    const resStudents = await getStudents();
    if (resStudents.success && resStudents.data) setUsers(resStudents.data);

    // 2. Busca Aulas Reais (Mágica acontecendo aqui)
    const resLessons = await getLessons();
    if (resLessons.success && resLessons.data) {
        const dbEvents = resLessons.data.map((lesson: any) => ({
             id: lesson.id,
             title: `Aula de ${lesson.subject}`,
             start: new Date(lesson.date),
             end: new Date(lesson.endDate),
             studentId: lesson.studentId,
             teacherId: lesson.teacherId,
             subject: lesson.subject,
             status: lesson.status,
             isExperimental: lesson.isExperimental,
        }));
        setEvents(dbEvents);
    }
    
    // 3. Identifica quem tá logado
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

  const allAppUsers = useMemo(() => [...users, ...teachers], [users, teachers]);

  const filterEventsByUser = useCallback((eventsToFilter: any[]) => {
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
      <div className="flex flex-1 flex-col gap-4 md:gap-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-slate-900">Agenda de Aulas</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-3 flex flex-col justify-center border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-800">Calendário</CardTitle>
              <CardDescription>Selecione um dia para ver os detalhes.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex justify-center items-center p-0">
              {isClient ? (
                <Calendar mode="single" selected={date} onSelect={setDate} className="p-0 sm:p-3 w-full" locale={ptBR} modifiers={{ scheduled: calendarMarkedDays }} modifiersClassNames={{ scheduled: "relative font-bold text-brand-yellow underline decoration-brand-yellow decoration-2 underline-offset-4" }} />
              ) : (
                <div className="p-0 sm:p-3 w-full h-[345px] flex items-center justify-center bg-muted/50 rounded-md animate-pulse">Carregando...</div>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-4 flex flex-col border-slate-200 shadow-sm" id="scheduled-classes">
            <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)} className="w-full flex flex-col flex-1">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="grid gap-1">
                  <CardTitle className="text-slate-800">Aulas Agendadas</CardTitle>
                  <CardDescription>Visualização detalhada</CardDescription>
                </div>
                <TabsList className="grid w-full grid-cols-3 sm:w-auto bg-white shadow-sm border border-slate-200">
                    <TabsTrigger value="day">Dia</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
              <ScrollArea className="h-full max-h-[350px] pr-4">
                <div className="grid gap-4">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => {
                      const teacher = getTeacherById(event.teacherId);
                      const student = getStudentById(event.studentId);
                      
                      const personToShow = (currentUser?.role === 'teacher') ? student : teacher;
                      const fallback = personToShow ? personToShow.name.charAt(0) : '?';
                      
                      return (
                          <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 bg-white shadow-sm hover:border-brand-yellow transition-colors">
                              <div className="flex items-center gap-4 flex-1">
                                  <Avatar className='h-14 w-14 border shadow-sm'>
                                      <AvatarImage src={personToShow?.avatarUrl} alt={personToShow?.name} />
                                      <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-lg">{fallback}</AvatarFallback>
                                  </Avatar>
                                  <div className="grid gap-1.5">
                                      <div className="flex flex-wrap items-center gap-x-2">
                                          <p className="font-bold text-slate-800 text-lg">{personToShow?.name || "Usuário"}</p>
                                          <p className="text-sm font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{currentUser?.role === 'teacher' ? 'Aluno(a)' : 'Professor(a)'}</p>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm font-semibold">
                                          <span className="text-slate-600">{event.subject}</span>
                                          <span className="text-slate-400">•</span>
                                          <span className="text-brand-yellow">{formatScheduledDate(event.start, event.end)}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center text-slate-400 h-full min-h-[200px] border-2 border-dashed rounded-xl bg-slate-50/50">
                      <p className="font-medium text-slate-600">Nenhuma aula agendada para este período.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            </Tabs>
          </Card>
        </div>

        <Card id="completed-history" className="shadow-sm border-slate-200 mt-4">
          <CardHeader className="bg-slate-50 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-800"><BookOpen className="h-5 w-5 text-slate-600" /> Histórico de Aulas</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
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
                            {currentUser?.role !== 'teacher' && <TableCell className="font-semibold text-slate-800">{teacher?.name || 'N/A'}</TableCell>}
                            {currentUser?.role !== 'student' && <TableCell className="font-semibold text-slate-800">{student?.name || 'N/A'}</TableCell>}
                            <TableCell className="font-medium text-slate-600">{event.subject}</TableCell>
                            <TableCell className="text-right text-slate-500 font-medium">{formatHistoryDate(event.start, event.end)}</TableCell>
                        </TableRow>
                        );
                    })
                    ) : (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-slate-400 font-medium">Nenhuma aula concluída ainda.</TableCell></TableRow>
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
        <Suspense fallback={<div className="flex h-[50vh] items-center justify-center animate-pulse">Carregando agenda...</div>}>
            <SchedulePageComponent />
        </Suspense>
    )
}
