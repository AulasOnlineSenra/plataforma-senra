
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { users as initialUsers, getMockUser, scheduleEvents as initialSchedule, teachers as initialTeachers, subjects } from '@/lib/data';
import { User, ScheduleEvent, Teacher } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, Phone, BookOpen, Plus, XCircle, ChevronRight, CalendarCheck, FileText, BookCopy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function StudentDetailPageComponent() {
    const params = useParams();
    const studentId = params.studentId as string;
    const router = useRouter();

    const [student, setStudent] = useState<User | null>(null);
    const [schedule, setSchedule] = useState<ScheduleEvent[]>(initialSchedule);
    const [currentUser, setCurrentUser] = useState<User | null>(null);


    useEffect(() => {
        const updateData = () => {
            const storedUsers = localStorage.getItem('userList');
            const currentUsers: User[] = storedUsers ? JSON.parse(storedUsers) : initialUsers;
            const foundStudent = currentUsers.find(u => u.id === studentId);
            setStudent(foundStudent || null);

            const storedSchedule = localStorage.getItem('scheduleEvents');
            const currentSchedule: ScheduleEvent[] = storedSchedule 
                ? JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })) 
                : initialSchedule;
            setSchedule(currentSchedule);
            
            const storedUser = localStorage.getItem('currentUser');
            setCurrentUser(storedUser ? JSON.parse(storedUser) : getMockUser('teacher'));
        }
        
        updateData();
        window.addEventListener('storage', updateData);
        return () => window.removeEventListener('storage', updateData);
    }, [studentId]);
    
    const upcomingClasses = useMemo(() => {
        if (!student || !currentUser) return [];
        return schedule.filter(e => 
            e.studentId === student.id &&
            e.teacherId === currentUser.id && // Assuming the current user is a teacher viewing the student
            e.status === 'scheduled' &&
            e.start > new Date()
        ).sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [schedule, student, currentUser]);


    if (!student) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Aluno não encontrado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.back()}>Voltar</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard/students" className="hover:underline">Meus Alunos</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-foreground">{student.name}</span>
            </div>
            
            <header className='flex items-center gap-4'>
                <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-2xl font-bold font-headline">{student.name}</h1>
                     <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className={student.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                        {student.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
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
                      Aulas agendadas com {student.name}.
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
                                 <Button variant="outline" size="sm" asChild>
                                    <Link href="/dashboard/schedule">Ver na Agenda</Link>
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>Nenhuma aula futura agendada com este aluno.</p>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="materials">
                 <Card>
                    <CardHeader>
                        <CardTitle>Materiais de Aula</CardTitle>
                        <CardDescription>Materiais compartilhados com o aluno.</CardDescription>
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
                        <CardDescription>Simulados e exercícios propostos para o aluno.</CardDescription>
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

export default function StudentDetailPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <StudentDetailPageComponent />
        </Suspense>
    )
}
