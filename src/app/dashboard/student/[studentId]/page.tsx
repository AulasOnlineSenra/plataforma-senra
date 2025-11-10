

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
import { Mail, Phone, BookOpen, Plus, XCircle, ChevronRight, CalendarCheck, FileText, BookCopy, Edit, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';


function StudentDetailPageComponent() {
    const params = useParams();
    const studentId = params.studentId as string;
    const router = useRouter();
    const { toast } = useToast();

    const [student, setStudent] = useState<User | null>(null);
    const [schedule, setSchedule] = useState<ScheduleEvent[]>(initialSchedule);
    const [currentUser, setCurrentUser] = useState<User | Teacher | null>(null);

    const [editingClass, setEditingClass] = useState<ScheduleEvent | null>(null);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
    const [selectedClassForMaterial, setSelectedClassForMaterial] = useState<ScheduleEvent | null>(null);


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

        const baseFilter = (e: ScheduleEvent) =>
          e.studentId === student.id &&
          e.status === 'scheduled' &&
          e.start > new Date();
    
        // If the current user is a teacher, only show classes they are teaching to this student.
        if (currentUser.role === 'teacher') {
          return schedule
            .filter(e => baseFilter(e) && e.teacherId === currentUser.id)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
        }
    
        // For admin or the student themselves, show all their upcoming classes.
        return schedule
          .filter(baseFilter)
          .sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [schedule, student, currentUser]);

    const completedClasses = useMemo(() => {
        if (!student || !currentUser) return [];

        const baseFilter = (e: ScheduleEvent) =>
          e.studentId === student.id && e.status === 'completed';

        if (currentUser.role === 'teacher') {
            return schedule
                .filter(e => baseFilter(e) && e.teacherId === currentUser.id)
                .sort((a, b) => b.start.getTime() - a.start.getTime());
        }

        return schedule
            .filter(baseFilter)
            .sort((a, b) => b.start.getTime() - a.start.getTime());
    }, [schedule, student, currentUser]);
    
    const handleEditClick = (classEvent: ScheduleEvent) => {
        setEditingClass(classEvent);
        setEditedTitle(classEvent.title);
        setEditedDescription(classEvent.description || '');
    };

    const handleSaveChanges = () => {
        if (!editingClass) return;

        const updatedSchedule = schedule.map(e => 
            e.id === editingClass.id 
                ? { ...e, title: editedTitle, description: editedDescription }
                : e
        );
        
        setSchedule(updatedSchedule);
        localStorage.setItem('scheduleEvents', JSON.stringify(updatedSchedule));
        window.dispatchEvent(new Event('storage'));

        toast({
            title: 'Aula Atualizada!',
            description: 'O título e a descrição da aula foram salvos.',
        });

        setEditingClass(null);
    };

    const handleOpenMaterialDialog = (classEvent: ScheduleEvent) => {
        setSelectedClassForMaterial(classEvent);
        setIsMaterialDialogOpen(true);
    };


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
        <>
            <div className="flex flex-1 flex-col gap-4 md:gap-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/dashboard/students" className="hover:underline">Meus Alunos</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="font-medium text-foreground">{student.name}</span>
                </div>
                
                <Link href={`/dashboard/profile?userId=${student.id}`} className="group">
                    <header className='flex items-center gap-4 rounded-lg p-2 -ml-2 group-hover:bg-accent/50 transition-colors'>
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
                </Link>
                
                <Tabs defaultValue="classes" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="classes">
                        <CalendarCheck className="mr-2" />
                        Aulas Agendadas
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        <BookOpen className="mr-2" />
                        Aulas Realizadas
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
                                <div key={c.id} className="flex items-start justify-between rounded-md border p-4">
                                    <div className="flex-1">
                                        <p className="font-semibold">{c.title}</p>
                                        {c.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{c.description}</p>}
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {c.subject} • {format(c.start, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })} - {format(c.end, "HH:mm")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Button variant="outline" size="icon" onClick={() => handleOpenMaterialDialog(c)}>
                                            <Plus className="h-4 w-4" />
                                            <span className="sr-only">Adicionar Material</span>
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(c)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar
                                        </Button>
                                    </div>
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
                <TabsContent value="completed">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Aulas Realizadas</CardTitle>
                            <CardDescription>Aulas que você já concluiu com {student.name}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {completedClasses.length > 0 ? (
                                completedClasses.map(c => (
                                    <div key={c.id} className="flex items-start justify-between rounded-md border p-4">
                                        <div className="flex-1">
                                            <p className="font-semibold">{c.title}</p>
                                            {c.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{c.description}</p>}
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {c.subject} • {format(c.start, "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenMaterialDialog(c)}>
                                                <Plus className="h-4 w-4" />
                                                <span className="sr-only">Adicionar Material</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>Nenhuma aula foi concluída com este aluno ainda.</p>
                                </div>
                            )}
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
            <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Aula</DialogTitle>
                        <DialogDescription>
                            Atualize o título e a descrição da aula de {editingClass?.subject}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="class-title">Título da Aula</Label>
                            <Input
                                id="class-title"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="class-description">Descrição da Aula</Label>
                            <Textarea
                                id="class-description"
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                placeholder="Adicione observações, tópicos a serem abordados ou links importantes..."
                                rows={5}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
             <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Recurso à Aula</DialogTitle>
                        <DialogDescription>
                            Anexe um material ou crie um simulado para a aula de <span className="font-semibold">{selectedClassForMaterial?.subject}</span> do dia {selectedClassForMaterial && format(selectedClassForMaterial.start, 'dd/MM/yy')}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="file-upload">Anexar Arquivo</Label>
                            <div className="flex items-center gap-2">
                                <Input id="file-upload" type="file" className="flex-1"/>
                                <Button size="icon" variant="outline">
                                    <UploadCloud className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">PDFs, planilhas, vídeos, imagens, etc.</p>
                        </div>
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">ou</span>
                            </div>
                        </div>
                        <div className="grid gap-2">
                             <Label>Criar Simulado</Label>
                             <Button variant="secondary" asChild>
                                <Link href="/dashboard/simulados">
                                    <BookCopy className="mr-2 h-4 w-4" />
                                    Ir para a Área de Simulados
                                </Link>
                             </Button>
                             <p className="text-xs text-muted-foreground">Você será redirecionado para criar um novo simulado e poderá associá-lo a esta aula.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Fechar</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function StudentDetailPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <StudentDetailPageComponent />
        </Suspense>
    )
}
