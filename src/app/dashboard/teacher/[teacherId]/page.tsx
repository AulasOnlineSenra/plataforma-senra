

'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { teachers as initialTeachers, scheduleEvents as initialSchedule, getMockUser, users as initialUsers, subjects, simulados as initialSimulados } from '@/lib/data';
import { Teacher, ScheduleEvent, User, Simulado } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, FileText, BookCopy, CalendarCheck, Pencil, XCircle, Star, StarHalf, Check, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { cn } from '@/lib/utils';


const SIMULADOS_STORAGE_KEY = 'simuladosList';

function formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds > 0 ? `${remainingSeconds} s` : ''}`.trim();
}

function TeacherDetailPageComponent() {
    const params = useParams();
    const router = useRouter();
    const teacherId = params.teacherId as string;
    const { toast } = useToast();

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [schedule, setSchedule] = useState<ScheduleEvent[]>(initialSchedule);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [simulados, setSimulados] = useState<Simulado[]>([]);

    useEffect(() => {
        const updateData = () => {
            const storedTeachers = localStorage.getItem('teacherList');
            const currentTeachers: Teacher[] = storedTeachers ? JSON.parse(storedTeachers) : initialTeachers;
            const foundTeacher = currentTeachers.find(t => t.id === teacherId);
            setTeacher(foundTeacher || null);

            const storedSchedule = localStorage.getItem('scheduleEvents');
            const currentSchedule: ScheduleEvent[] = storedSchedule 
                ? JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })) 
                : initialSchedule;
            setSchedule(currentSchedule);

            const storedUser = localStorage.getItem('currentUser');
            setCurrentUser(storedUser ? JSON.parse(storedUser) : getMockUser('student'));
            
            const storedSimulados = localStorage.getItem(SIMULADOS_STORAGE_KEY);
            setSimulados(storedSimulados ? JSON.parse(storedSimulados) : initialSimulados);
        };

        updateData();
        window.addEventListener('storage', updateData);
        return () => window.removeEventListener('storage', updateData);
    }, [teacherId]);

    const upcomingClasses = useMemo(() => {
        if (!teacher || !currentUser) return [];
        return schedule.filter(e => 
            e.teacherId === teacher.id && 
            e.studentId === currentUser.id &&
            e.status === 'scheduled' &&
            e.start > new Date()
        ).sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [schedule, teacher, currentUser]);
    
    const teacherSimuladosForStudent = useMemo(() => {
        if (!teacher || !currentUser) return [];
        return simulados.filter(s => s.creatorId === teacher.id && s.studentId === currentUser.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [simulados, teacher, currentUser]);

    const handleConfirmCancel = (eventId: string) => {
        const updatedEvents = schedule.map(e => 
        e.id === eventId ? { ...e, status: 'cancelled' as 'cancelled' } : e
        );
        setSchedule(updatedEvents);
        localStorage.setItem('scheduleEvents', JSON.stringify(updatedEvents));
        window.dispatchEvent(new Event('storage'));

        const event = schedule.find(e => e.id === eventId);
        toast({
            title: "Aula Cancelada",
            description: `A aula de ${event?.subject} foi cancelada.`,
        });
    };

    const handleCancelClick = (event: ScheduleEvent) => {
        toast({
        title: `Cancelar aula de ${event.subject}?`,
        description: 'A ação será confirmada em 5 segundos.',
        variant: 'destructive',
        duration: 5000,
        action: (
            <ToastAction altText="Confirmar" onClick={() => handleConfirmCancel(event.id)}>
            Confirmar
            </ToastAction>
        ),
        });
    };
    
    const averageFeedback = useMemo(() => {
        if (!teacher || !teacher.ratings || teacher.ratings.length < 5) {
          return { score: 5.0, count: 0, text: 'Aguardando 5 avaliações' };
        }
        
        const { ratings } = teacher;
        if (ratings.length < 5) {
          return { score: 5.0, count: ratings.length, text: `Aguardando ${5 - ratings.length} ${5 - ratings.length > 1 ? 'avaliações' : 'avaliação'}` };
        }
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        return { score: avg, count: ratings.length, text: `Baseado em ${ratings.length} avaliações` };
      }, [teacher]);


    if (!teacher) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Professor não encontrado</CardTitle>
                        <CardDescription>O perfil deste professor não pôde ser carregado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/dashboard/my-teachers">Voltar para Meus Professores</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const teacherSubjects = teacher.subjects
    .map((subjectId) => subjects.find((s) => s.id === subjectId)?.name)
    .filter(Boolean);

    const getSubjectName = (subjectId: string) => {
        return subjects.find(s => s.id === subjectId)?.name || 'Disciplina Desconhecida';
    };
    
    const calculateSimuladoResults = (simulado: Simulado) => {
        if (!simulado.userAnswers) return { correct: 0, incorrect: 0 };
        let correct = 0;
        simulado.questions.forEach(q => {
            const correctOption = q.options.find(opt => opt.isCorrect);
            if (correctOption && simulado.userAnswers && simulado.userAnswers[q.id] === correctOption.id) {
                correct++;
            }
        });
        return {
            correct,
            incorrect: simulado.questions.length - correct,
        };
    };


    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard/my-teachers" className="hover:underline">Meus Professores</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-foreground">{teacher.name}</span>
            </div>

            <header className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary">
                    <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                    <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">{teacher.name}</h1>
                     <div className="flex flex-wrap items-center gap-2">
                        {teacherSubjects.map((subject) => (
                            <Badge key={subject} variant="secondary">{subject}</Badge>
                        ))}
                    </div>
                     <div className="flex items-center gap-1 pt-1">
                        {Array(5).fill(0).map((_, i) => {
                            const ratingValue = i + 1;
                            if (averageFeedback.score >= ratingValue) {
                                return <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />;
                            }
                            if (averageFeedback.score > i && averageFeedback.score < ratingValue) {
                                return <StarHalf key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />;
                            }
                            return <Star key={i} className="h-5 w-5 text-gray-300" />;
                        })}
                        <span className="text-sm font-bold ml-2">{averageFeedback.score.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground ml-1">({averageFeedback.text})</span>
                    </div>
                </div>
            </header>
            
            <Tabs defaultValue="classes" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="classes">
                    <CalendarCheck className="mr-2" />
                    Aulas Agendadas
                </TabsTrigger>
                <TabsTrigger value="materials">
                    <FileText className="mr-2" />
                    Materiais de Aula
                </TabsTrigger>
                <TabsTrigger value="simulations">
                    <BookCopy className="mr-2" />
                    Simulados
                </TabsTrigger>
              </TabsList>
              <TabsContent value="classes">
                <Card>
                  <CardHeader>
                    <CardTitle>Próximas Aulas</CardTitle>
                    <CardDescription>
                      Suas aulas agendadas com {teacher.name}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     {upcomingClasses.length > 0 ? (
                        upcomingClasses.map(c => (
                            <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
                                <div>
                                    <p className="font-semibold">{c.subject}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(c.start, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })} - {format(c.end, "HH:mm")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        toast({ title: 'Edição de Aula', description: 'A edição de aulas é feita na página principal da Agenda.' });
                                    }}>
                                        <Pencil className="h-5 w-5 text-muted-foreground" />
                                        <span className="sr-only">Editar Aula</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleCancelClick(c)}>
                                        <XCircle className="h-5 w-5" />
                                        <span className="sr-only">Cancelar Aula</span>
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>Nenhuma aula futura agendada com este professor.</p>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="materials">
                 <Card>
                    <CardHeader>
                        <CardTitle>Materiais de Aula</CardTitle>
                        <CardDescription>Materiais compartilhados pelo professor.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-10 text-muted-foreground">
                        <p>Nenhum material compartilhado ainda.</p>
                    </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="simulations">
                 <Card>
                    <CardHeader>
                        <CardTitle>Simulados</CardTitle>
                        <CardDescription>Simulados e exercícios propostos por {teacher.name}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {teacherSimuladosForStudent.length > 0 ? (
                            teacherSimuladosForStudent.map(simulado => {
                                const results = calculateSimuladoResults(simulado);
                                return (
                                <div key={simulado.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-md border p-4 gap-4">
                                    <div className="flex-1">
                                        <p className="font-semibold">{simulado.title}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {getSubjectName(simulado.subjectId)} • {simulado.questions.length} questões
                                        </p>
                                    </div>
                                    {simulado.status === 'Concluído' && simulado.score !== undefined ? (
                                        <div className="flex items-center gap-4 text-sm w-full sm:w-auto justify-between">
                                            <div className="flex items-center gap-2 text-green-600">
                                                <Check className="h-4 w-4" />
                                                <span>{results.correct} Acertos</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-destructive">
                                                <XCircle className="h-4 w-4" />
                                                <span>{results.incorrect} Erros</span>
                                            </div>
                                            {simulado.durationSeconds !== undefined && (
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Clock className="h-4 w-4" /> 
                                                    <span>{formatDuration(simulado.durationSeconds)}</span>
                                                </div>
                                            )}
                                            <Badge variant={simulado.score >= 70 ? 'secondary' : 'destructive'} className={cn(simulado.score >= 70 && 'bg-green-100 text-green-800')}>
                                                {simulado.score.toFixed(0)}%
                                            </Badge>
                                            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/simulados/start?id=${simulado.id}`)}>Ver Gabarito</Button>
                                        </div>
                                    ) : (
                                        <Button onClick={() => router.push(`/dashboard/simulados/start?id=${simulado.id}`)}>Iniciar Simulado</Button>
                                    )}
                                </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>Nenhum simulado disponível com este professor no momento.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>
    );
}


export default function TeacherDetailPage() {
    return (
        <Suspense fallback={<div>Carregando perfil do professor...</div>}>
            <TeacherDetailPageComponent />
        </Suspense>
    );
}
