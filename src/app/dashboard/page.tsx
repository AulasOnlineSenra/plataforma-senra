
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
} from 'lucide-react';
import { getMockUser, scheduleEvents as initialScheduleEvents, users as initialUsers, teachers as initialTeachers } from '@/lib/data';
import { format } from 'date-fns';
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

import { RevenueChart } from '@/components/charts/revenue-chart';
import { SubjectsChart } from '@/components/charts/subjects-chart';
import { NewUsersChart } from '@/components/charts/new-users-chart';
import { useRouter } from 'next/navigation';

const TEACHERS_STORAGE_KEY = 'teacherList';
const SCHEDULE_STORAGE_KEY = 'scheduleEvents';
const USERS_STORAGE_KEY = 'userList';


export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [filter, setFilter] = useState('day');
  const [teacherCount, setTeacherCount] = useState(initialTeachers.length);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(initialScheduleEvents);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const router = useRouter();


  useEffect(() => {
    const updateData = () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        const role = localStorage.getItem('userRole') as UserRole | null;
        if (role) {
          const mockUser = getMockUser(role);
          setUser(mockUser);
          localStorage.setItem('currentUser', JSON.stringify(mockUser));
        } else {
          router.push('/login');
        }
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
      
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if(storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        setUsers(initialUsers);
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
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 3);
  }, [scheduleEvents, user]);
  
  const allUpcomingEvents = useMemo(() => {
    return scheduleEvents
    .filter((e) => e.status === 'scheduled' && e.start > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 3);
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
    
  if (!user) {
    return null; // Or a loading spinner
  }

  const renderAdminDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
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
                  <div className="flex justify-between items-center">
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
                  <CardTitle>Aulas por Disciplina</CardTitle>
                  <CardDescription>Distribuição das aulas agendadas.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <SubjectsChart />
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem>
               <Card>
                <CardHeader>
                   <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Aquisição de Novos Usuários</CardTitle>
                        <CardDescription>Novos usuários por período.</CardDescription>
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
                  <NewUsersChart filter={filter} />
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
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/schedule">
                Ver Todas
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor(a)</TableHead>
                  <TableHead>Aluno(a)</TableHead>
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
                    <TableCell className="text-right">
                      {format(event.start, "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderStudentTeacherDashboard = () => {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
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
          <Link href="/dashboard/packages">
            <Card className="hover:ring-2 hover:ring-brand-yellow transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Créditos de Aulas</CardTitle>
                <BookCopy className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Pacote de 12 aulas ativo</p>
              </CardContent>
            </Card>
          </Link>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback Médio</CardTitle>
              <Star className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8/5.0</div>
              <p className="text-xs text-muted-foreground">Baseado nas últimas 5 aulas</p>
            </CardContent>
          </Card>
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
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/dashboard/schedule">
                  Ver Todas
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {user.role === 'student' ? 'Professor(a)' : 'Aluno(a)'}
                    </TableHead>
                    <TableHead className="text-right">Data e Horário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">{event.subject}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {user.role === 'student' ? 
                          (teachers.find(t => t.id === event.teacherId)?.name || 'N/A') :
                          (users.find(u => u.id === event.studentId)?.name || 'N/A')
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {format(event.start, "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>Feedback da Última Aula</CardTitle>
                  <CardDescription>Avalie sua última aula para nos ajudar a melhorar.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center text-center gap-4">
                  <p className="font-medium">Aula de Matemática com Ana Silva</p>
                   <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                          <Button key={rating} variant="outline" size="icon" className="h-12 w-12 rounded-full text-lg hover:bg-accent">
                              {rating}
                          </Button>
                      ))}
                  </div>
                   <p className="text-xs text-muted-foreground">1 (Ruim) a 5 (Excelente)</p>
              </CardContent>
              <CardFooter>
                   <Button className="w-full">Enviar Feedback</Button>
              </CardFooter>
          </Card>
        </div>
      </>
    );
  }


  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Bem-vindo(a) de volta, {user.name.split(' ')[0]}!
        </h1>
      </div>
      {user.role === 'admin' ? renderAdminDashboard() : renderStudentTeacherDashboard()}
    </div>
  );
}
