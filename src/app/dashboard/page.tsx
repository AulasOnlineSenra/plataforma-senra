'use client';

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  CalendarCheck, CheckCircle2, XCircle, Briefcase, Users, School, RefreshCw
} from 'lucide-react';
import { scheduleEvents as initialScheduleEvents } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { User, Teacher, ScheduleEvent } from '@/lib/types';
import {
  Carousel, CarouselApi, CarouselContent, CarouselItem,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { SubjectsChart } from '@/components/charts/subjects-chart';

const SCHEDULE_STORAGE_KEY = 'scheduleEvents';

type FilterType = 'day' | 'week' | 'month' | 'year';

export default function DashboardPage() {
  const [user, setUser] = useState<User | Teacher | null>(null);
  
  // ESTADOS DO BANCO DE DADOS
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  
  const [filter, setFilter] = useState<FilterType>('day');
  const [subjectsMonthFilter, setSubjectsMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(initialScheduleEvents);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleLoadDatabaseStats = async () => {
    setIsLoadingStats(true);
    try {
        const response = await fetch('/api/dashboard/stats', { method: 'GET' });
        const stats = await response.json();
        if (stats.success) {
            setDashboardData(stats.data);
            toast({ title: 'Sucesso!', description: 'Painel sincronizado com o Banco de Dados.' });
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: stats.error || 'Falha ao sincronizar.' });
        }
    } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao sincronizar.' });
    } finally {
        setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    
    try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
    } catch(e) {
        console.error("Erro ao ler usuário", e);
    }

    const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (storedSchedule) {
      try {
        const parsedSchedule = JSON.parse(storedSchedule).map((event: any) => ({
          ...event, start: new Date(event.start), end: new Date(event.end),
        }));
        setScheduleEvents(parsedSchedule);
      } catch (e) {}
    }
  }, []); 
  
  useEffect(() => {
    if (!carouselApi) return;
    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap());
    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on('select', onSelect);
    
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  if (!user) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground animate-pulse">Carregando painel...</div>;
  }

  // ==== LÓGICA DO PAINEL DO ALUNO/PROFESSOR ====
  const isStudent = user?.role === 'student';
  const userEvents = scheduleEvents.filter((e: any) => isStudent ? e.studentId === user?.id : e.teacherId === user?.id);
  const userCompletedClasses = userEvents.filter((e: any) => e.status === 'completed').length;
  const userScheduledClasses = userEvents.filter((e: any) => e.status === 'scheduled').length;
  const upcomingEvents = userEvents.filter((e: any) => e.status === 'scheduled').sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 5);

  const renderAdminDashboard = () => (
    <>
      {/* BANNER DE SINCRONIZAÇÃO */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-amber-50 p-4 rounded-xl border border-amber-200 mb-2 gap-4">
         <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                Sincronização com Banco de Dados
            </h3>
            <p className="text-sm text-slate-600">Para poupar os servidores, o painel não atualiza sozinho.</p>
         </div>
         <Button 
            onClick={handleLoadDatabaseStats} 
            disabled={isLoadingStats} 
            className="bg-[#FFC107] text-slate-900 font-bold hover:bg-[#FFD54F] w-full sm:w-auto shadow-md"
         >
            {isLoadingStats ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {isLoadingStats ? "Buscando..." : "Sincronizar Agora"}
         </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
        <Link href="/dashboard/schedule#scheduled-classes">
          <Card className="hover:ring-2 hover:ring-brand-yellow transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aulas Agendadas</CardTitle>
              <CalendarCheck className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.scheduled || 0}</div>
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
              <div className="text-2xl font-bold">{dashboardData?.completed || 0}</div>
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
              <div className="text-2xl font-bold">{dashboardData?.cancelled || 0}</div>
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
              <div className="text-2xl font-bold">{dashboardData?.teachers || 0}</div>
              <p className="text-xs text-muted-foreground">Total de professores ativos</p>
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
              <div className="text-2xl font-bold">{dashboardData?.students || 0}</div>
              <p className="text-xs text-muted-foreground">Inscritos na plataforma</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <Carousel setApi={setCarouselApi} opts={{ align: "start" }} className="w-full">
          <CarouselContent>
            <CarouselItem>
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Visão Geral da Receita</CardTitle>
                      <CardDescription>
                          Receita Total Real: <span className="text-green-600 font-bold">R$ {dashboardData?.revenue?.toFixed(2) || '0.00'}</span>
                      </CardDescription>
                    </div>
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
                  </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <SubjectsChart selectedMonth={subjectsMonthFilter} />
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
              className={cn('h-2 w-2 rounded-full transition-all', currentSlide === index ? 'w-4 bg-primary' : 'bg-muted-foreground/50')}
              aria-label={`Ir para o slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      <div className="grid gap-4 md:gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Próximas Aulas (Banco de Dados)</CardTitle>
              <CardDescription>As 5 próximas aulas confirmadas no sistema.</CardDescription>
            </div>
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
                    {dashboardData?.upcomingLessons?.length === 0 || !dashboardData ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">Nenhuma aula confirmada ou painel não sincronizado.</TableCell>
                        </TableRow>
                    ) : (
                        dashboardData?.upcomingLessons?.map((event: any) => (
                        <TableRow key={event.id}>
                            <TableCell>{event.teacher?.name || 'N/A'}</TableCell>
                            <TableCell>{event.student?.name || 'N/A'}</TableCell>
                            <TableCell><Badge variant="secondary" className="bg-brand-yellow text-black">{event.subject}</Badge></TableCell>
                            <TableCell className="text-right">
                            {format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm")}
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderStudentTeacherDashboard = () => {
    const availableCredits = (user as any)?.credits || 0; 

    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          
          {/* CARD DE CRÉDITOS */}
          <Card className="hover:ring-2 hover:ring-brand-yellow transition-all bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <School className="w-24 h-24" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-slate-200">
                {isStudent ? 'Créditos Disponíveis' : 'Aulas no Mês'}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-extrabold text-brand-yellow mb-1">
                {isStudent ? availableCredits : userCompletedClasses}
              </div>
              <p className="text-xs text-slate-300">
                {isStudent ? 'Aulas prontas para agendamento' : 'Aulas dadas neste mês'}
              </p>
              {isStudent && (
                <Button asChild size="sm" className="w-full mt-4 bg-brand-yellow text-slate-900 hover:bg-amber-400 font-bold shadow-sm">
                  <Link href="/dashboard/packages">Comprar Mais Créditos</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="hover:ring-2 hover:ring-brand-yellow transition-all shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Aulas Agendadas</CardTitle>
              <CalendarCheck className="h-5 w-5 text-brand-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{userScheduledClasses}</div>
              <p className="text-xs text-slate-500 mt-1">Próximos compromissos</p>
            </CardContent>
          </Card>

          <Card className="hover:ring-2 hover:ring-brand-yellow transition-all shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Aulas Concluídas</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{userCompletedClasses}</div>
              <p className="text-xs text-slate-500 mt-1">Seu histórico de aprendizado</p>
            </CardContent>
          </Card>

          <Card className="hover:ring-2 hover:ring-brand-yellow transition-all shadow-sm border-dashed border-2 bg-slate-50 flex flex-col justify-center">
            <CardContent className="pt-6">
              <Button asChild className="w-full h-14 text-base font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                <Link href="/dashboard/schedule">
                  <CalendarCheck className="mr-2 h-5 w-5" /> 
                  Agendar Nova Aula
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">Minha Agenda</CardTitle>
            <CardDescription>Acompanhe e prepare-se para os seus próximos encontros.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="text-right">Data e Horário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-slate-500 h-32">
                        Você não tem nenhuma aula agendada no momento. <br/>
                        <Link href="/dashboard/schedule" className="text-brand-yellow font-bold hover:underline mt-2 inline-block">Agendar agora</Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    upcomingEvents.map((event: any) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-semibold">{event.subject}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-slate-700 font-medium">
                          {format(event.start, "dd/MM/yyyy 'às' HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl md:text-3xl font-bold">
            Bem-vindo(a) de volta, {user?.nickname || user?.name?.split(' ')[0] || 'Usuário'}!
            </h1>
        </div>
        {user?.role === 'admin' ? renderAdminDashboard() : renderStudentTeacherDashboard()}
    </div>
  );
}