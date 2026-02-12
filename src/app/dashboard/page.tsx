

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CalendarCheck,
  BookCopy,
  Star,
  ArrowUpRight,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  StarHalf,
  Video,
} from 'lucide-react';
import { getMockUser, scheduleEvents as initialScheduleEvents, users as initialUsers, teachers as initialTeachers } from '@/lib/data';
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth, isWithinInterval, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState, useMemo } from 'react';
import { UserRole, User, Teacher, ScheduleEvent } from '@/lib/types';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { RevenueChart } from '@/components/charts/revenue-chart';
import { SubjectsChart } from '@/components/charts/subjects-chart';
import { NewUsersChart } from '@/components/charts/new-users-chart';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const TEACHERS_STORAGE_KEY = 'teacherList';
const SCHEDULE_STORAGE_KEY = 'scheduleEvents';
const USERS_STORAGE_KEY = 'userList';


export default function DashboardPage() {
  const [user, setUser] = useState<User | Teacher | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [filter, setFilter] = useState('day');
  const [teacherCount, setTeacherCount] = useState(initialTeachers.length);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(initialScheduleEvents);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const router = useRouter();
  const [subjectsMonthFilter, setSubjectsMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [newUsersMonthFilter, setNewUsersMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const { toast } = useToast();


  const monthOptions = useMemo(() => eachMonthOfInterval({
    start: subMonths(new Date(), 12),
    end: new Date(),
  }).map(date => ({
    value: format(date, 'yyyy-MM'),
    label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
  })).reverse(), []);


  useEffect(() => {
    const updateData = () => {
      const role = localStorage.getItem('userRole') as UserRole | null;
      if (role) {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          const mockUser = getMockUser('student');
          setUser(mockUser);
          localStorage.setItem('currentUser', JSON.stringify(mockUser));
        }
      } else {
        router.push('/login');
      }

      const storedTeachers = localStorage.getItem(TEACHERS_STORAGE_KEY);
      if (storedTeachers) {
        try {
          const teacherList: Teacher[] = JSON.parse(storedTeachers);
          const activeTeachers = teacherList.filter(t => t.status !== 'deleted');
          setTeacherCount(activeTeachers.length);
          setTeachers(teacherList);
        } catch (e) {
          console.error("Failed to parse teachers from localStorage", e);
          setTeacherCount(initialTeachers.filter(t => t.status !== 'deleted').length);
          setTeachers(initialTeachers);
        }
      } else {
        setTeacherCount(initialTeachers.filter(t => t.status !== 'deleted').length);
        setTeachers(initialTeachers);
      }

      const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (storedSchedule) {
        try {
          const parsedSchedule = JSON.parse(storedSchedule).map((event: any) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          }));
          setScheduleEvents(parsedSchedule);
        } catch (e) {
            console.error("Failed to parse schedule from localStorage", e);
            setScheduleEvents(initialScheduleEvents);
        }
      } else {
        setScheduleEvents(initialScheduleEvents);
      }
      
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      setUsers(storedUsers ? JSON.parse(storedUsers) : initialUsers);
    };
    
    updateData();
    
    window.addEventListener('storage', updateData);
    
    return () => {
        window.removeEventListener('storage', updateData);
    }

  }, [router]);
  
  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap());

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', onSelect);

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  const upcomingEvents = useMemo(() => {
    if (!user) return [];
    
    const filterField = user.role === 'teacher' ? 'teacherId' : 'studentId';

    return scheduleEvents
    .filter((e) => e.status === 'scheduled' && e.start > new Date() && e[filterField] === user.id)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [scheduleEvents, user]);
  
  const allUpcomingEvents = useMemo(() => {
    return scheduleEvents
    .filter((e) => e.status === 'scheduled' && e.start > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [scheduleEvents]);

  const userScheduledClasses = useMemo(() => {
    if (!user) return 0;
    
    const filterField = user.role === 'teacher' ? 'teacherId' : 'studentId';

    return scheduleEvents.filter(
      (e) => e[filterField] === user.id && e.status === 'scheduled'
    ).length;
  }, [user, scheduleEvents]);
  
  const userCompletedClasses = useMemo(() => {
    if (!user) return 0;
    const filterField = user.role === 'teacher' ? 'teacherId' : 'studentId';
    return scheduleEvents.filter(
      (e) => e[filterField] === user.id && e.status === 'completed'
    ).length;
  }, [user, scheduleEvents]);

  const userCancelledClasses = useMemo(() => {
    if (!user) return 0;
    const filterField = user.role === 'teacher' ? 'teacherId' : 'studentId';
    return scheduleEvents.filter(
      (e) => e[filterField] === user.id && e.status === 'cancelled'
    ).length;
  }, [user, scheduleEvents]);
    
  const teacherCompletedClassesThisMonth = useMemo(() => {
    if (!user || user.role !== 'teacher') return 0;
    const now = new Date();
    const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) };
    return scheduleEvents.filter(
      (e) =>
        e.teacherId === user.id &&
        e.status === 'completed' &&
        isWithinInterval(e.start, monthInterval)
    ).length;
  }, [user, scheduleEvents]);

  const averageFeedback = useMemo(() => {
    if (!user || !user.ratings) {
      return { score: 5.0, count: 0, text: 'Aguardando 5 avaliações' };
    }
    
    const { ratings } = user;
    if (ratings.length < 5) {
      return { score: 5.0, count: ratings.length, text: `Aguardando ${5 - ratings.length} ${5 - ratings.length > 1 ? 'avaliações' : 'avaliação'}` };
    }
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return { score: avg, count: ratings.length, text: `Baseado em ${ratings.length} avaliações` };
  }, [user]);

  const lastUnratedClass = useMemo(() => {
    if (!user) return null;
  
    const completedClasses = scheduleEvents
      .filter(e => e.status === 'completed')
      .sort((a, b) => b.end.getTime() - a.end.getTime());
  
    if (user.role === 'student') {
      return completedClasses.find(e => e.studentId === user.id && !e.studentHasRated);
    }
    if (user.role === 'teacher') {
      return completedClasses.find(e => e.teacherId === user.id && !e.teacherHasRated);
    }
  
    return null;
  }, [user, scheduleEvents]);

  const handleRating = (rating: number) => {
    if (!user || !lastUnratedClass) return;

    let userToUpdateId: string;
    let userToUpdateRole: UserRole;
    let userToUpdateStorageKey: string;
    let eventUpdateField: 'studentHasRated' | 'teacherHasRated';

    if (user.role === 'student') {
      userToUpdateId = lastUnratedClass.teacherId;
      userToUpdateRole = 'teacher';
      userToUpdateStorageKey = TEACHERS_STORAGE_KEY;
      eventUpdateField = 'studentHasRated';
    } else { // teacher
      userToUpdateId = lastUnratedClass.studentId;
      userToUpdateRole = 'student';
      userToUpdateStorageKey = USERS_STORAGE_KEY;
      eventUpdateField = 'teacherHasRated';
    }

    // Update user/teacher ratings
    const storedUsers = localStorage.getItem(userToUpdateStorageKey);
    const userList: (User | Teacher)[] = storedUsers ? JSON.parse(storedUsers) : (userToUpdateRole === 'student' ? initialUsers : initialTeachers);
    
    const updatedUserList = userList.map(u => {
      if (u.id === userToUpdateId) {
        const newRatings = [...(u.ratings || []), rating];
        return { ...u, ratings: newRatings };
      }
      return u;
    });

    localStorage.setItem(userToUpdateStorageKey, JSON.stringify(updatedUserList));

    // Update schedule event to mark as rated
    const updatedSchedule = scheduleEvents.map(e => {
      if (e.id === lastUnratedClass.id) {
        return { ...e, [eventUpdateField]: true };
      }
      return e;
    });
    setScheduleEvents(updatedSchedule);
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updatedSchedule));
    
    window.dispatchEvent(new Event('storage'));

    toast({
        title: "Avaliação Enviada!",
        description: `Obrigado pelo seu feedback de ${rating} estrelas.`,
    });
  };

  const formatDate = (start: Date, end: Date) => {
    if (isToday(start)) {
      return `Hoje, às ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
    }
    if (isTomorrow(start)) {
      return `Amanhã, às ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
    }
    if (isYesterday(start)) {
      return `Ontem, às ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
    }
    return format(start, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR }) + ` - ${format(end, 'HH:mm')}`;
  };


  if (!user) {
    return null; // Or a loading spinner
  }

  const renderAdminDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
        <Link href="/dashboard/schedule#scheduled-classes">
          <Card className="hover:ring-2 hover:ring-brand-yellow transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aulas Agendadas</CardTitle>
              <CalendarCheck className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduleEvents.filter(e => e.status === 'scheduled').length}</div>
              <p className="text-xs text-muted-foreground">Total de aulas na plataforma</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/schedule#completed-history">
          <Card className="hover:ring-2 hover:ring-brand-yellow transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aulas Realizadas</CardTitle>
              <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduleEvents.filter(e => e.status === 'completed').length}</div>
              <p className="text-xs text-muted-foreground">Total de aulas concluídas</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/schedule#cancelled-history">
          <Card className="hover:ring-2 hover:ring-brand-yellow transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aulas Canceladas</CardTitle>
              <XCircle className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduleEvents.filter(e => e.status === 'cancelled').length}</div>
              <p className="text-xs text-muted-foreground">Total de cancelamentos</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/teachers#teacher-list">
          <Card className="hover:ring-2 hover:ring-brand-yellow transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores</CardTitle>
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherCount}</div>
              <p className="text-xs text-muted-foreground">Total de professores cadastrados</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/students#active-students">
          <Card className="hover:ring-2 hover:ring-brand-yellow transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
              <Users className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter(u => u.role === 'student' && u.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">+5 na última semana</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      <div>
        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent>
            <CarouselItem>
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Visão Geral da Receita</CardTitle>
                      <CardDescription>Receita por período.</CardDescription>
                    </div>
                     <Tabs defaultValue="day" value={filter} onValueChange={setFilter} className="hidden sm:block">
                        <TabsList>
                          <TabsTrigger value="day">Dia</TabsTrigger>
                          <TabsTrigger value="week">Semana</TabsTrigger>
                          <TabsTrigger value="month">Mês</TabsTrigger>
                          <TabsTrigger value="year">Ano</TabsTrigger>
                        </TabsList>
                      </Tabs>
                  </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <RevenueChart filter={filter} />
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem>
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Aulas por Disciplina</CardTitle>
                      <CardDescription>Distribuição das aulas agendadas.</CardDescription>
                    </div>
                    <Select value={subjectsMonthFilter} onValueChange={setSubjectsMonthFilter}>
                      <SelectTrigger className="w-full sm:w-[220px]">
                        <SelectValue placeholder="Selecione um mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <SubjectsChart selectedMonth={subjectsMonthFilter} />
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem>
               <Card>
                <CardHeader>
                   <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle>Aquisição de Novos Usuários</CardTitle>
                        <CardDescription>Novos usuários por dia no mês selecionado.</CardDescription>
                      </div>
                      <Select value={newUsersMonthFilter} onValueChange={setNewUsersMonthFilter}>
                        <SelectTrigger className="w-full sm:w-[220px]">
                          <SelectValue placeholder="Selecione um mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <NewUsersChart selectedMonth={newUsersMonthFilter} />
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: slideCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => carouselApi?.scrollTo(index)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                currentSlide === index ? 'w-4 bg-primary' : 'bg-muted-foreground/50'
              )}
              aria-label={`Ir para o slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
       <div className="grid gap-4 md:gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Próximas Aulas (Geral)</CardTitle>
              <CardDescription>
                Aulas agendadas para os próximos dias em toda a plataforma.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1 bg-sidebar text-sidebar-foreground hover:bg-brand-yellow hover:text-black">
              <Link href="/dashboard/schedule">
                Ver Todas
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
             <ScrollArea className="h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Professor(a)</TableHead>
                      <TableHead>Aluno(a)</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead className="text-right">Data e Horário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUpcomingEvents.map((event) => (
                      <TableRow key={event.id}>
                         <TableCell>
                          {teachers.find(t => t.id === event.teacherId)?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {users.find(u => u.id === event.studentId)?.name || 'N/A'}
                        </TableCell>
                         <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{event.subject}</span>
                            {event.isExperimental && (
                              <Badge variant="secondary" className="bg-brand-yellow text-black hover:bg-brand-yellow/90">Experimental</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {format(event.start, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })} - {format(event.end, "HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderStudentTeacherDashboard = () => {
    const score = averageFeedback.score;
    const personToRate = lastUnratedClass
      ? user.role === 'student'
        ? teachers.find(t => t.id === lastUnratedClass.teacherId)
        : users.find(s => s.id === lastUnratedClass.studentId)
      : null;

    const teacherMeetLink = user.role === 'teacher' ? (user as Teacher).googleMeetLink : undefined;

    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Link href="/dashboard/schedule#scheduled-classes">
            <Card className="hover:ring-2 hover:ring-brand-yellow transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aulas Agendadas</CardTitle>
                <CalendarCheck className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userScheduledClasses}</div>
                <p className="text-xs text-muted-foreground">+2 na última semana</p>
              </CardContent>
            </Card>
          </Link>
           <Link href="/dashboard/schedule#completed-history">
            <Card className="hover:ring-2 hover:ring-brand-yellow transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aulas Realizadas</CardTitle>
                <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userCompletedClasses}</div>
                <p className="text-xs text-muted-foreground">Total de aulas concluídas</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/schedule#cancelled-history">
            <Card className="hover:ring-2 hover:ring-brand-yellow transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aulas Canceladas</CardTitle>
                <XCircle className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userCancelledClasses}</div>
                <p className="text-xs text-muted-foreground">Total de cancelamentos</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/financial">
            <Card className="hover:ring-2 hover:ring-brand-yellow transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {user.role === 'student' ? 'Créditos de Aulas' : 'Aulas Realizadas no Mês'}
                </CardTitle>
                <BookCopy className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {user.role === 'student' ? (user as User).classCredits ?? 0 : teacherCompletedClassesThisMonth}
                </div>
                <p className="text-xs text-muted-foreground">{(user as User).activePackage ?? 'Nenhum pacote ativo'}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
        <div className="grid gap-4 md:gap-8">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Próximas Aulas</CardTitle>
                <CardDescription>
                  Suas aulas agendadas para os próximos dias.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1 bg-sidebar text-sidebar-foreground hover:bg-brand-yellow hover:text-black">
                 <Link href="/dashboard/schedule">
                    Ver Todas
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disciplina</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        {user.role === 'student' ? 'Professor(a)' : 'Aluno(a)'}
                      </TableHead>
                      <TableHead>Data e Horário</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingEvents.map((event) => {
                      const teacherForEvent = teachers.find(t => t.id === event.teacherId);
                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="font-medium flex items-center gap-2">
                              <span>{event.subject}</span>
                              {event.isExperimental && (
                                  <Badge variant="secondary" className="bg-brand-yellow text-black hover:bg-brand-yellow/90">Experimental</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {user.role === 'student' ? 
                              (teacherForEvent?.name || 'N/A') :
                              (users.find(u => u.id === event.studentId)?.name || 'N/A')
                            }
                          </TableCell>
                          <TableCell>
                            {formatDate(event.start, event.end)}
                          </TableCell>
                          <TableCell className="text-right">
                              {user.role === 'teacher' && teacherMeetLink ? (
                                  <Button asChild size="sm">
                                      <Link href={teacherMeetLink} target="_blank" rel="noopener noreferrer">
                                          <Video className="mr-2 h-4 w-4" />
                                          Acessar Aula
                                      </Link>
                                  </Button>
                              ) : (
                                  <Button asChild size="sm" variant="outline">
                                      <Link href={`/dashboard/teacher/${event.teacherId}`}>
                                          Ver Detalhes
                                      </Link>
                                  </Button>
                              )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>Feedback</CardTitle>
                  <CardDescription>Avalie suas aulas e veja seu desempenho.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 items-center gap-6">
                   <div className="flex flex-col items-center justify-center text-center gap-4 border-r-0 md:border-r md:pr-6">
                        {lastUnratedClass && personToRate ? (
                            <>
                                <Avatar className="w-16 h-16 mb-2">
                                  <AvatarImage src={personToRate.avatarUrl} alt={personToRate.name} />
                                  <AvatarFallback>{personToRate.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-medium">
                                    Avalie sua última aula de {lastUnratedClass.subject} com {personToRate.name}
                                </p>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <Button key={rating} variant="outline" size="icon" className="h-12 w-12 rounded-full text-lg hover:bg-accent" onClick={() => handleRating(rating)}>
                                            {rating}
                                        </Button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">1 (Ruim) a 5 (Excelente)</p>
                            </>
                        ) : (
                            <div className="text-muted-foreground text-center h-full flex flex-col justify-center items-center">
                                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                                <p>Você não tem aulas para avaliar no momento.</p>
                            </div>
                        )}
                   </div>
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                        <p className="font-medium">Seu Feedback Médio</p>
                        <div className="flex items-center gap-1">
                          {Array(5).fill(0).map((_, i) => {
                              const ratingValue = i + 1;
                              if (score >= ratingValue) {
                                  return <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />;
                              }
                              if (score > i && score < ratingValue) {
                                  return <StarHalf key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />;
                              }
                              return <Star key={i} className="h-5 w-5 text-gray-300" />;
                          })}
                          <span className="text-xl font-bold ml-2">{score.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{averageFeedback.text}</p>
                    </div>
              </CardContent>
          </Card>
        </div>
      </>
    );
  }


  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl md:text-3xl font-bold">
            Bem-vindo(a) de volta, {user.nickname || user.name.split(' ')[0]}!
            </h1>
        </div>
        {user.role === 'admin' ? renderAdminDashboard() : renderStudentTeacherDashboard()}
    </div>
  );
}
