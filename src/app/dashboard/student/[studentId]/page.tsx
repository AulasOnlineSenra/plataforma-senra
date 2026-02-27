'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getMockUser, scheduleEvents as initialSchedule, subjects, simulados as initialSimulados } from '@/lib/data';
import { ScheduleEvent, Simulado } from '@/lib/types';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, XCircle, ChevronRight, CalendarCheck, BookOpen, BookCopy, Edit, UploadCloud, Calendar as CalendarIcon, Check, Clock, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// MOTOR DO BANCO PARA BUSCAR O ALUNO
import { getUserById } from '@/app/actions/users';

const SIMULADOS_STORAGE_KEY = 'simuladosList';

function formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds > 0 ? `${remainingSeconds} s` : ''}`.trim();
}

function formatBirthDate(value?: string | Date | null): string {
    if (!value) return 'Nao informado';
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Nao informado';
    return format(parsed, 'dd/MM/yyyy', { locale: ptBR });
}

function StudentDetailPageComponent() {
    const params = useParams();
    const studentId = params.studentId as string;
    const router = useRouter();
    const { toast } = useToast();

    // ESTADOS
    const [student, setStudent] = useState<any | null>(null);
    const [schedule, setSchedule] = useState<ScheduleEvent[]>(initialSchedule);
    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const [simulados, setSimulados] = useState<Simulado[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [editingClass, setEditingClass] = useState<ScheduleEvent | null>(null);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [isFileUploadDialogOpen, setIsFileUploadDialogOpen] = useState(false);
    const [selectedClassForMaterial, setSelectedClassForMaterial] = useState<ScheduleEvent | null>(null);


    useEffect(() => {
        const updateData = async () => {
            setIsLoading(true);

            // BUSCA O ALUNO DIRETO DO BANCO DE DADOS
            const result = await getUserById(studentId);
            if (result.success && result.data) {
                setStudent(result.data);
            } else {
                setStudent(null);
            }

            const storedSchedule = localStorage.getItem('scheduleEvents');
            const currentSchedule: ScheduleEvent[] = storedSchedule 
                ? JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })) 
                : initialSchedule;
            setSchedule(currentSchedule);
            
            const storedUser = localStorage.getItem('currentUser');
            setCurrentUser(storedUser ? JSON.parse(storedUser) : getMockUser('teacher'));

            const storedSimulados = localStorage.getItem(SIMULADOS_STORAGE_KEY);
            setSimulados(storedSimulados ? JSON.parse(storedSimulados).map((s:any) => ({...s, createdAt: new Date(s.createdAt), completedAt: s.completedAt ? new Date(s.completedAt) : undefined})) : initialSimulados);
            
            setIsLoading(false);
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
    
        if (currentUser.role === 'teacher') {
          return schedule
            .filter(e => baseFilter(e) && e.teacherId === currentUser.id)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
        }
    
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

    const studentSimulados = useMemo(() => {
        if (!student) return [];
        return simulados
          .filter(s => s.studentId === student.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [simulados, student]);
    
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
        setIsFileUploadDialogOpen(true);
    };


    if (isLoading) {
        return <div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse">Carregando perfil do aluno...</div>;
    }

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
    
    const getSubjectName = (subjectId: string) => {
        return subjects.find(s => s.id === subjectId)?.name || 'Disciplina Desconhecida';
    };
    
    const calculateSimuladoResults = (simulado: Simulado) => {
        const latestAttempt = simulado.attempts.length > 0 ? simulado.attempts[simulado.attempts.length - 1] : null;
        if (!latestAttempt) return { correct: 0, incorrect: simulado.questions.length, score: 0, durationSeconds: 0 };
    
        let correct = 0;
        simulado.questions.forEach(q => {
            const correctOption = q.options.find(opt => opt.isCorrect);
            if (correctOption && latestAttempt.userAnswers[q.id] === correctOption.id) {
                correct++;
            }
        });
        return {
            correct,
            incorrect: simulado.questions.length - correct,
            score: latestAttempt.score,
            durationSeconds: latestAttempt.durationSeconds
        };
    };

    const renderClassActions = (classEvent: ScheduleEvent) => (
        <div className="flex items-center gap-2 ml-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Adicionar Recurso</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleOpenMaterialDialog(classEvent)}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Anexar Arquivo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/simulados">
                           <BookCopy className="mr-2 h-4 w-4" />
                           Criar Simulado
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="icon" onClick={() => handleEditClick(classEvent)}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Editar</span>
            </Button>
            
            {classEvent.status === 'scheduled' && (
                 <Button asChild variant="outline" size="icon">
                    <Link href={`/dashboard/schedule`}>
                        <CalendarIcon className="h-4 w-4" />
                        <span className="sr-only">Agenda</span>
                    </Link>
                 </Button>
            )}
        </div>
    );

    
    return (
        <>
            <div className="flex flex-1 flex-col gap-4 md:gap-8 max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/dashboard/students" className="hover:underline">Alunos</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="font-medium text-foreground">{student.name}</span>
                </div>
                
                <header className='flex items-center gap-4 rounded-xl p-4 bg-white border shadow-sm'>
    <Avatar className="h-16 w-16 border-2 border-brand-yellow">
        <AvatarImage src={student.avatarUrl} alt={student.name} />
        <AvatarFallback className="font-bold text-slate-800 bg-amber-100">{student.name.charAt(0)}</AvatarFallback>
    </Avatar>
    <div>
        <h1 className="text-2xl font-bold font-headline text-slate-800">{student.name}</h1>
        <div className="flex gap-2 items-center mt-1">
            <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className={student.status === 'active' ? 'bg-green-100 text-green-800 border-none' : ''}>
                {student.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 shadow-sm font-bold">
                {student.credits || 0} Créditos
            </Badge>
        </div>
    </div>
</header>
                
                <Card className="border-none shadow-md mt-2">
                    <CardHeader className="bg-slate-50 border-b pb-4">
                        <CardTitle className="text-xl text-slate-800">Dados Cadastrais</CardTitle>
                        <CardDescription>Informacoes de cadastro do usuario.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-lg border bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CPF</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{student.cpf ? student.cpf : 'Nao informado'}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Data de nascimento</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{formatBirthDate(student.birthDate)}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CEP</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{student.cep ? student.cep : 'Nao informado'}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{student.state ? student.state : 'Nao informado'}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bairro</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{student.neighborhood ? student.neighborhood : 'Nao informado'}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-4 md:col-span-2 lg:col-span-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rua</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{student.street ? student.street : 'Nao informado'}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Numero</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{student.number ? student.number : 'Nao informado'}</p>
                            </div>
                        </div>

                        {student.role === 'teacher' && student.videoUrl && (
                            <div className="flex justify-start">
                                <Button asChild variant="outline" className="font-semibold">
                                    <a href={student.videoUrl} target="_blank" rel="noopener noreferrer">
                                        <Video className="mr-2 h-4 w-4" />
                                        Ver vídeo de apresentação
                                    </a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Tabs defaultValue="classes" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
                    <TabsTrigger value="classes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Aulas Agendadas
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Aulas Realizadas
                    </TabsTrigger>
                    <TabsTrigger value="simulations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <BookCopy className="mr-2 h-4 w-4" />
                        Simulados
                    </TabsTrigger>
                </TabsList>

                {/* TAB DE AULAS AGENDADAS */}
                <TabsContent value="classes" className="mt-4">
                    <Card className="border-none shadow-md">
                    <CardHeader className="bg-slate-50 border-b pb-4">
                        <CardTitle className="text-xl text-slate-800">Próximas Aulas</CardTitle>
                        <CardDescription>
                        Aulas agendadas com {student.name}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {upcomingClasses.length > 0 ? (
                            upcomingClasses.map(c => (
                                <div key={c.id} className="flex items-start justify-between rounded-xl border p-5 bg-white hover:border-brand-yellow transition-colors shadow-sm">
                                    <div className="flex-1">
                                        <p className="font-bold text-lg text-slate-800">{c.title}</p>
                                        {c.description && <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border">{c.description}</p>}
                                        <p className="text-sm font-medium text-amber-700 mt-3 flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            {c.subject} • {format(c.start, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })} - {format(c.end, "HH:mm")}
                                        </p>
                                    </div>
                                    {renderClassActions(c)}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl">
                                <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p className="font-medium text-slate-600">Nenhuma aula futura agendada com este aluno.</p>
                            </div>
                        )}
                    </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB DE AULAS REALIZADAS */}
                <TabsContent value="completed" className="mt-4">
                    <Card className="border-none shadow-md">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-xl text-slate-800">Histórico de Aulas Realizadas</CardTitle>
                            <CardDescription>Aulas que você já concluiu com {student.name}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {completedClasses.length > 0 ? (
                                completedClasses.map(c => (
                                    <div key={c.id} className="flex items-start justify-between rounded-xl border p-5 bg-white shadow-sm">
                                        <div className="flex-1">
                                            <p className="font-bold text-lg text-slate-800">{c.title}</p>
                                            {c.description && <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border">{c.description}</p>}
                                            <p className="text-sm font-medium text-slate-500 mt-3 flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-500" />
                                                {c.subject} • Concluída em {format(c.start, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                        {renderClassActions(c)}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl">
                                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-medium text-slate-600">Nenhuma aula foi concluída com este aluno ainda.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB DE SIMULADOS */}
                <TabsContent value="simulations" className="mt-4">
                    <Card className="border-none shadow-md">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-xl text-slate-800">Simulados</CardTitle>
                            <CardDescription>Simulados e exercícios propostos para {student.name}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {studentSimulados.length > 0 ? (
                                studentSimulados.map(simulado => {
                                    const results = calculateSimuladoResults(simulado);
                                    return (
                                        <div key={simulado.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border p-5 bg-white shadow-sm gap-4 hover:border-brand-yellow transition-colors">
                                            <div className="flex-1">
                                                <p className="font-bold text-lg text-slate-800">{simulado.title}</p>
                                                <p className="text-sm text-slate-500 mt-1 font-medium">
                                                    {getSubjectName(simulado.subjectId)} • {simulado.questions.length} questões {simulado.timeLimitMinutes && `• ${simulado.timeLimitMinutes} min`}
                                                </p>
                                            </div>
                                            {simulado.status === 'Concluído' ? (
                                                <div className="flex items-center gap-4 text-sm w-full sm:w-auto justify-between bg-slate-50 p-3 rounded-lg border">
                                                    <div className="flex items-center gap-2 text-green-600 font-bold">
                                                        <Check className="h-4 w-4" />
                                                        <span>{results.correct} Acertos</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-red-500 font-bold">
                                                        <XCircle className="h-4 w-4" />
                                                        <span>{results.incorrect} Erros</span>
                                                    </div>
                                                    {results.durationSeconds !== undefined && (
                                                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                            <Clock className="h-4 w-4" /> 
                                                            <span>{formatDuration(results.durationSeconds)}</span>
                                                        </div>
                                                    )}
                                                     <Badge variant={results.score >= 70 ? 'secondary' : 'destructive'} className={cn("text-sm", results.score >= 70 && 'bg-green-100 text-green-800 border-none')}>
                                                        {results.score.toFixed(0)}%
                                                    </Badge>
                                                    <Button variant="outline" size="sm" className="font-bold hover:bg-slate-200 border-slate-300" onClick={() => router.push(`/dashboard/simulados/start?id=${simulado.id}`)}>Ver Gabarito</Button>
                                                </div>
                                            ) : (
                                                 <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none px-3 py-1">Pendente</Badge>
                                            )}
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl">
                                    <BookCopy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-medium text-slate-600">Nenhum simulado disponível no momento.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                </Tabs>
            </div>

            <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Aula</DialogTitle>
                        <DialogDescription>Atualize o título e a descrição da aula de {editingClass?.subject}.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="class-title">Título da Aula</Label>
                            <Input id="class-title" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="class-description">Descrição da Aula</Label>
                            <Textarea id="class-description" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} placeholder="Adicione observações, tópicos a serem abordados ou links importantes..." rows={5} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleSaveChanges} className="bg-brand-yellow text-slate-900 font-bold hover:bg-amber-400">Salvar Alterações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog open={isFileUploadDialogOpen} onOpenChange={setIsFileUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Anexar Arquivo</DialogTitle>
                        <DialogDescription>Anexe um material para a aula de <span className="font-semibold">{selectedClassForMaterial?.subject}</span> do dia {selectedClassForMaterial && format(selectedClassForMaterial.start, 'dd/MM/yy')}.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="file-upload">Arquivo</Label>
                            <div className="flex items-center gap-2">
                                <Input id="file-upload" type="file" className="flex-1 cursor-pointer"/>
                                <Button size="icon" variant="outline"><UploadCloud className="h-4 w-4" /></Button>
                            </div>
                            <p className="text-xs text-muted-foreground">PDFs, planilhas, vídeos, imagens, etc.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancelar</Button>
                        </DialogClose>
                         <Button className="bg-brand-yellow text-slate-900 font-bold hover:bg-amber-400" onClick={() => {
                            toast({ title: 'Arquivo Anexado!', description: 'O material foi adicionado à aula.' });
                            setIsFileUploadDialogOpen(false);
                         }}>Anexar Material</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function StudentDetailPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center animate-pulse">Carregando...</div>}>
            <StudentDetailPageComponent />
        </Suspense>
    )
}
