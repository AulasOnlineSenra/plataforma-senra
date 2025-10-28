
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { teachers as initialTeachers, scheduleEvents as initialSchedule, getMockUser, users as initialUsers, subjects } from '@/lib/data';
import { Teacher, ScheduleEvent, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, FileText, BookCopy, CalendarCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function TeacherDetailPageComponent() {
    const params = useParams();
    const teacherId = params.teacherId as string;

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [schedule, setSchedule] = useState<ScheduleEvent[]>(initialSchedule);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

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
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">{teacher.name}</h1>
                     <div className="flex flex-wrap items-center gap-2 mt-2">
                        {teacherSubjects.map((subject) => (
                            <Badge key={subject} variant="secondary">{subject}</Badge>
                        ))}
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
                                        {format(c.start, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                                 <Button variant="outline" size="sm" asChild>
                                    <Link href="/dashboard/schedule">Ver na Agenda</Link>
                                </Button>
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
                        <CardDescription>Simulados e exercícios propostos.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-10 text-muted-foreground">
                        <p>Nenhum simulado disponível no momento.</p>
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
