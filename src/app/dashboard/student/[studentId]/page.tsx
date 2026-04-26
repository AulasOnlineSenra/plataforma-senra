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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, XCircle, ChevronRight, CalendarCheck, BookOpen, BookCopy, Edit, UploadCloud, Calendar as CalendarIcon, Check, Clock, Video, GraduationCap, UserCircle, File, X } from 'lucide-react';
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

// MOTOR DO BANCO PARA BUSCAR O ALUNO/PROFESSOR
import { getUserById } from '@/app/actions/users';
import { getLessonsForUser, updateLesson } from '@/app/actions/bookings';

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
    if (!value) return 'Não informado';
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Não informado';
    return format(parsed, 'dd/MM/yyyy', { locale: ptBR });
}

function StudentDetailPageComponent() {
    const params = useParams();
    const studentId = params?.studentId as string;
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

    // Estados para aulas
    const [lessons, setLessons] = useState<any[]>([]);
    const [loadingLessons, setLoadingLessons] = useState(true);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [editedTitleText, setEditedTitleText] = useState('');
    const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);

    // Helper to parse materials JSON
    const parseMaterials = (materialsStr: string | null): any[] => {
        if (!materialsStr) return [];
        try {
            return JSON.parse(materialsStr);
        } catch {
            return [];
        }
    };

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Max 5MB
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: 'Arquivo muito grande',
                    description: 'O arquivo deve ter no máximo 5MB.',
                    className: 'bg-red-600 text-white border-none'
                });
                return;
            }
            setSelectedFile(file);
        }
    };

    // Upload file to lesson
    const handleUploadFile = async () => {
        if (!selectedFile || !selectedClassForMaterial) return;
        
        setUploadingFile(true);
        
        try {
            // Read file as base64
            const reader = new FileReader();
            const fileData = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(selectedFile!);
            });
            
            // Get current materials
            const currentMaterials = parseMaterials(selectedClassForMaterial.materials);
            
            // Add new material
            const newMaterial = {
                id: Date.now().toString(),
                name: selectedFile.name,
                type: selectedFile.type,
                url: fileData,
                uploadedAt: new Date().toISOString()
            };
            
            const updatedMaterials = [...currentMaterials, newMaterial];

            // Find the lesson in the lessons array
            const lessonToUpdate = lessons.find(l => l.id === selectedClassForMaterial.id);
            
            // Update lesson in database
            const result = await updateLesson(selectedClassForMaterial.id, {
                materials: JSON.stringify(updatedMaterials)
            });
            
            if (result.success) {
                // Update local state
                setLessons(lessons.map(l => 
                    l.id === selectedClassForMaterial.id 
                        ? { ...l, materials: JSON.stringify(updatedMaterials) }
                        : l
                ));
                
                toast({
                    title: 'Arquivo Enviado!',
                    description: `${selectedFile.name} foi adicionado à aula.`,
                    className: 'bg-emerald-600 text-white border-none'
                });
            }
            
            setSelectedFile(null);
            setIsFileUploadDialogOpen(false);
        } catch (error) {
            console.error('Error uploading file:', error);
            toast({
                title: 'Erro ao enviar arquivo',
                description: 'Tente novamente com um arquivo menor.',
                className: 'bg-red-600 text-white border-none'
            });
        } finally {
            setUploadingFile(false);
        }
    };

    // Delete material from lesson
    const handleDeleteMaterial = async (lessonId: string, materialId: string) => {
        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const currentMaterials = parseMaterials(lesson.materials);
        const updatedMaterials = currentMaterials.filter((m: any) => m.id !== materialId);

        const result = await updateLesson(lessonId, {
            materials: JSON.stringify(updatedMaterials)
        });

        if (result.success) {
            setLessons(lessons.map(l => 
                l.id === lessonId 
                    ? { ...l, materials: JSON.stringify(updatedMaterials) }
                    : l
            ));
            
            toast({
                title: 'Arquivo Removido!',
                description: 'O material foi excluído da aula.',
                className: 'bg-slate-600 text-white border-none'
            });
        }
    };

    useEffect(() => {
        const updateData = async () => {
            setIsLoading(true);

            // BUSCA O USUÁRIO DIRETO DO BANCO DE DADOS
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

        // Filtro adaptado para funcionar se o perfil visualizado for Professor ou Aluno
        const baseFilter = (e: ScheduleEvent) => {
          const isParticipant = student.role === 'teacher' ? e.teacherId === student.id : e.studentId === student.id;
          return isParticipant && e.status === 'scheduled' && e.start > new Date();
        };
    
        if (currentUser.role === 'teacher') {
          return schedule
            .filter(e => baseFilter(e) && e.teacherId === currentUser.id)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
        }
    
        return schedule
          .filter(baseFilter)
          .sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [schedule, student, currentUser]);

    // Carregar aulas do aluno
    useEffect(() => {
        const loadStudentLessons = async () => {
            const result = await getLessonsForUser(studentId, 'student');
            if (result.success && result.data) {
                setLessons(result.data);
            }
            setLoadingLessons(false);
        };
        if (studentId) loadStudentLessons();
    }, [studentId]);

    // Aulas concluídas do aluno
    const completedLessons = useMemo(() => {
        return lessons
            .filter((l: any) => l.status === 'COMPLETED')
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [lessons]);

    const formatDateTimeLesson = (lesson: any) => {
        const startDate = new Date(lesson.date);
        const endDate = lesson.endDate ? new Date(lesson.endDate) : new Date(startDate.getTime() + 90 * 60 * 1000);
        const startFormatted = format(startDate, "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        const endFormatted = format(endDate, "HH:mm");
        return `${startFormatted} - ${endFormatted}`;
    };

    const completedClasses = useMemo(() => {
        if (!student || !currentUser) return [];

        const baseFilter = (e: ScheduleEvent) => {
            const isParticipant = student.role === 'teacher' ? e.teacherId === student.id : e.studentId === student.id;
            return isParticipant && e.status === 'completed';
        };

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
        if (!student || student.role === 'teacher') return []; // Professores não têm simulados atribuídos a si mesmos para resolver
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
            className: 'bg-emerald-600 text-white border-none'
        });

        setEditingClass(null);
    };

    const handleOpenMaterialDialog = (classEvent: ScheduleEvent) => {
        setSelectedClassForMaterial(classEvent);
        setIsFileUploadDialogOpen(true);
    };


    if (isLoading) {
        return <div className="flex h-[50vh] items-center justify-center text-slate-400 font-medium animate-pulse">Carregando perfil...</div>;
    }

    if (!student) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Card className="rounded-3xl border-slate-200 shadow-sm p-8 text-center">
                    <CardHeader>
                        <UserCircle className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <CardTitle className="text-2xl text-slate-800">Perfil não encontrado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.back()} className="rounded-xl bg-brand-yellow text-slate-900 font-bold hover:bg-brand-yellow/90">Voltar</Button>
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
                    <Button variant="outline" size="icon" className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50">
                        <Plus className="h-5 w-5" />
                        <span className="sr-only">Adicionar Recurso</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-2xl border-slate-100 shadow-lg w-48 p-2">
                    <DropdownMenuItem onSelect={() => handleOpenMaterialDialog(classEvent)} className="rounded-xl cursor-pointer">
                        <UploadCloud className="mr-2 h-4 w-4 text-blue-500" />
                        Anexar Arquivo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                        <Link href="/dashboard/simulados">
                           <BookCopy className="mr-2 h-4 w-4 text-brand-yellow" />
                           Criar Simulado
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="icon" className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50" onClick={() => handleEditClick(classEvent)}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Editar</span>
            </Button>
            
            {classEvent.status === 'scheduled' && (
                 <Button asChild variant="outline" size="icon" className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50">
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
            <div className="flex flex-1 flex-col gap-6 max-w-6xl mx-auto w-full pb-10">
                
                {/* BREADCRUMB INTELIGENTE */}
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Link href={student.role === 'teacher' ? "/dashboard/teachers" : "/dashboard/students"} className="hover:text-brand-yellow transition-colors">
                        {student.role === 'teacher' ? 'Professores' : 'Alunos'}
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-slate-900 font-bold">{student.name}</span>
                </div>
                
                {/* HEADER DO PERFIL - OCULTO */}
                {/*}
                <header className='relative flex flex-col md:flex-row md:items-center gap-6 rounded-3xl p-8 bg-white border border-slate-200 shadow-sm overflow-hidden'>
                    <div className="absolute top-0 left-0 w-2 h-full bg-brand-yellow"></div>
                    <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                        <AvatarImage src={student.avatarUrl} alt={student.name} className="object-cover" />
                        <AvatarFallback className="text-3xl font-bold text-slate-800 bg-slate-100">{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-slate-900 tracking-tight">{student.name}</h1>
                        <div className="flex gap-3 items-center mt-2">
                            <Badge variant="secondary" className="px-3 py-1 text-sm bg-slate-100 text-slate-600 border-none rounded-full">
                                {student.role === 'teacher' ? <><GraduationCap className="w-4 h-4 mr-1"/> Professor</> : <><UserCircle className="w-4 h-4 mr-1"/> Aluno</>}
                            </Badge>

                            <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className={cn("px-3 py-1 text-sm rounded-full shadow-none", student.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none' : 'border-none bg-slate-100')}>
                                {student.status === 'active' ? 'Ativo' : (student.status === 'pending' ? 'Pendente' : 'Inativo')}
                            </Badge>
                            
                            {student.role !== 'teacher' && (
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-none px-3 py-1 text-sm shadow-none font-bold rounded-full">
                                    {Math.max(0, student.credits || 0)} Créditos
                                </Badge>
                            )}
                        </div>
</div>
                </header>

                {/* Container de Aulas - Apenas para professor/admin */}
                {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') && (
                <div className="ml-28 mr-10">
                    <h2 className="font-headline text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 ml-0">
                        <GraduationCap className="h-6 w-6" />
                        Aulas
                    </h2>

                    {loadingLessons ? (
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <p>Carregando...</p>
                            </CardContent>
                        </Card>
                    ) : completedLessons.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <p>Nenhuma aula realizada.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16"></TableHead>
                                            <TableHead className="w-16"></TableHead>
                                            <TableHead></TableHead>
                                            <TableHead className="w-20"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {completedLessons.map((lesson: any, index: number) => (
                                            <TableRow key={lesson.id} className="-mt-10 -mb-10">
                                                <TableCell className="font-bold text-muted-foreground w-16 text-2xl py-0">
                                                    {completedLessons.length - index}
                                                </TableCell>
                                                <TableCell className="w-16">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={lesson.student?.avatarUrl || undefined} alt={lesson.student?.name} />
                                                        <AvatarFallback>{lesson.student?.name?.charAt(0) || 'A'}</AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell className="pt-10">
                                                    {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') ? (
                                                        <div className="mb-1">
                                                            {editingLessonId === lesson.id ? (
                                                                <input
                                                                    type="text"
                                                                    value={editedTitleText}
                                                                    onChange={(e) => setEditedTitleText(e.target.value)}
                                                                    onBlur={async () => {
                                                                        if (editedTitleText.trim()) {
                                                                            const result = await updateLesson(lesson.id, { customTitle: editedTitleText.trim() });
                                                                            if (result.success) {
                                                                                setLessons(lessons.map(l => l.id === lesson.id ? { ...l, customTitle: editedTitleText.trim() } : l));
                                                                                router.refresh();
                                                                            }
                                                                        }
                                                                        setEditingLessonId(null);
                                                                    }}
                                                                    onKeyDown={async (e) => {
                                                                        if (e.key === 'Enter') {
                                                                            const newTitle = editedTitleText.trim();
                                                                            console.log('[DEBUG] Salvando título:', newTitle);
                                                                            if (newTitle) {
                                                                                const result = await updateLesson(lesson.id, { customTitle: newTitle });
                                                                                console.log('[DEBUG] Resultado:', result);
                                                                                if (result.success) {
                                                                                    setLessons(lessons.map(l => l.id === lesson.id ? { ...l, customTitle: newTitle } : l));
                                                                                    router.refresh();
                                                                                }
                                                                            }
                                                                            setEditingLessonId(null);
                                                                        }
                                                                    }}
                                                                    className="bg-amber-50 border border-amber-300 rounded px-1 py-0.5 text-2xl text-amber-600 w-full"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-2xl text-amber-600">
                                                                        {lesson.customTitle || lesson.subject || 'Adicionar título da aula'}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingLessonId(lesson.id);
                                                                            setEditedTitleText(lesson.customTitle || lesson.subject || '');
                                                                        }}
                                                                        className="text-amber-600 hover:text-amber-800 cursor-pointer"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
) : (
                                                        <div className="mb-1">
                                                            <span className="text-2xl text-amber-600">
                                                                {lesson.customTitle || lesson.subject || ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="mt-1">
                                                        <span className="font-medium text-xs">{lesson.student?.name || '-'}</span>
                                                        <span className="text-muted-foreground"> - </span>
                                                        <span className="text-muted-foreground text-xs">{formatDateTimeLesson(lesson)}</span>
                                                    </div>
                                                    {lesson.materials && parseMaterials(lesson.materials).length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {parseMaterials(lesson.materials).map((material: any) => (
                                                                <div key={material.id} className="flex items-center gap-1">
                                                                    <button 
                                                                        onClick={() => {
                                                                            if (material.url.startsWith('data:')) {
                                                                                const byteCharacters = atob(material.url.split(',')[1]);
                                                                                const byteNumbers = new Array(byteCharacters.length);
                                                                                for (let i = 0; i < byteCharacters.length; i++) {
                                                                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                                                                }
                                                                                const byteArray = new Uint8Array(byteNumbers);
                                                                                const blob = new Blob([byteArray], { type: material.type });
                                                                                const url = URL.createObjectURL(blob);
                                                                                window.open(url, '_blank');
                                                                            } else {
                                                                                window.open(material.url, '_blank');
                                                                            }
                                                                        }}
                                                                        className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 cursor-pointer"
                                                                    >
                                                                        <File className="h-3 w-3" />
                                                                        {material.name}
                                                                    </button>
                                                                    {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') && (
                                                                        <button
                                                                            onClick={() => handleDeleteMaterial(lesson.id, material.id)}
                                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') && (
                                                    <TableCell className="pt-10 text-right">
                                                        <Button 
                                                            variant="outline" 
                                                            size="icon" 
                                                            className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 h-8 w-8"
                                                            onClick={() => {
                                                                setSelectedClassForMaterial(lesson);
                                                                setIsFileUploadDialogOpen(true);
                                                            }}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            <span className="sr-only">Adicionar Material</span>
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
                )}

                {currentUser?.role === "admin" && (
                <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-5 pt-6 px-8">
                        <CardTitle className="text-xl text-slate-800">Dados Cadastrais</CardTitle>
                        <CardDescription className="text-slate-500">Informações de cadastro do usuário.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 px-8 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">CPF</p>
                                <p className="mt-1 text-base font-semibold text-slate-800">{student.cpf ? student.cpf : 'Não informado'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Data de nascimento</p>
                                <p className="mt-1 text-base font-semibold text-slate-800">{formatBirthDate(student.birthDate)}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">CEP</p>
                                <p className="mt-1 text-base font-semibold text-slate-800">{student.cep ? student.cep : 'Não informado'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Estado</p>
                                <p className="mt-1 text-base font-semibold text-slate-800">{student.state ? student.state : 'Não informado'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bairro</p>
                                <p className="mt-1 text-base font-semibold text-slate-800">{student.neighborhood ? student.neighborhood : 'Não informado'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 md:col-span-2 lg:col-span-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Rua</p>
                                <p className="mt-1 text-base font-semibold text-slate-800">{student.street ? student.street : 'Não informado'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Número</p>
                                <p className="mt-1 text-base font-semibold text-slate-800">{student.number ? student.number : 'Não informado'}</p>
                            </div>
                        </div>

                        {student.role === 'teacher' && student.videoUrl && (
                            <div className="flex justify-start mt-4">
                                <Button asChild variant="outline" className="h-12 rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50">
                                    <a href={student.videoUrl} target="_blank" rel="noopener noreferrer">
                                        <Video className="mr-2 h-5 w-5 text-blue-500" />
                                        Ver vídeo de apresentação
                                    </a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
                )}

                {/* TABS DE AULAS E SIMULADOS - OCULTO */}
                {/*
                <Tabs defaultValue="completed" className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100/80 p-1.5 rounded-2xl">
                    <TabsTrigger value="classes" className="rounded-xl data-[state=active]:bg-[#0f172a] data-[state=active]:text-white data-[state=active]:shadow-sm font-bold text-slate-500 py-2.5 transition-all">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Aulas Agendadas
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-xl data-[state=active]:bg-[#0f172a] data-[state=active]:text-white data-[state=active]:shadow-sm font-bold text-slate-500 py-2.5 transition-all">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Aulas Realizadas
                    </TabsTrigger>
                    <TabsTrigger value="simulations" disabled={student.role === 'teacher'} className="rounded-xl data-[state=active]:bg-[#0f172a] data-[state=active]:text-white data-[state=active]:shadow-sm font-bold text-slate-500 py-2.5 transition-all disabled:opacity-50">
                        <BookCopy className="mr-2 h-4 w-4" />
                        Simulados
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="classes" className="mt-6">
                    <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-5 pt-6 px-8">
                        <CardTitle className="text-xl text-slate-800">Próximas Aulas</CardTitle>
                        <CardDescription className="text-slate-500">
                        Aulas agendadas com {student.name}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6 px-8 pb-8">
                        {upcomingClasses.length > 0 ? (
                            upcomingClasses.map(c => (
                                <div key={c.id} className="flex items-start justify-between rounded-2xl border border-slate-100 p-6 bg-white hover:border-brand-yellow hover:shadow-md transition-all">
                                    <div className="flex-1">
                                        <p className="font-extrabold text-xl text-slate-900 tracking-tight">{c.title}</p>
                                        {c.description && <p className="text-sm font-medium text-slate-500 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">{c.description}</p>}
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-bold mt-4 border border-amber-100">
                                            <CalendarIcon className="h-4 w-4" />
                                            {c.subject} • {format(c.start, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })} - {format(c.end, "HH:mm")}
                                        </div>
                                    </div>
                                    {renderClassActions(c)}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <CalendarCheck className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                <p className="font-bold text-lg text-slate-600">Agenda livre!</p>
                                <p className="text-slate-500 mt-1">Nenhuma aula futura agendada com este usuário.</p>
                            </div>
                        )}
                    </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="completed" className="mt-6">
                    <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-5 pt-6 px-8">
                        <CardTitle className="text-xl text-slate-800">Histórico de Aulas Realizadas</CardTitle>
                        <CardDescription className="text-slate-500">Aulas que já foram concluídas com {student.name}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6 px-8 pb-8">
                        {completedClasses.length > 0 ? (
                            completedClasses.map(c => (
                                <div key={c.id} className="flex items-start justify-between rounded-2xl border border-slate-100 p-6 bg-white shadow-sm hover:shadow-md transition-all">
                                    <div className="flex-1">
                                        <p className="font-extrabold text-xl text-slate-900 tracking-tight">{c.title}</p>
                                        {c.description && <p className="text-sm font-medium text-slate-500 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">{c.description}</p>}
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold mt-4 border border-emerald-100">
                                            <Check className="h-4 w-4" />
                                            {c.subject} • Concluída em {format(c.start, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        </div>
                                    </div>
                                    {renderClassActions(c)}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                <p className="font-bold text-lg text-slate-600">Histórico vazio.</p>
                                <p className="text-slate-500 mt-1">Nenhuma aula foi concluída com este usuário ainda.</p>
                            </div>
                        )}
                    </CardContent>
                    </Card>
                </TabsContent>

                {student.role !== 'teacher' && (
                    <TabsContent value="simulations" className="mt-6">
                        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-5 pt-6 px-8">
                                <CardTitle className="text-xl text-slate-800">Simulados</CardTitle>
                                <CardDescription className="text-slate-500">Desempenho nos simulados propostos para {student.name}.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6 px-8 pb-8">
                                {studentSimulados.length > 0 ? (
                                    studentSimulados.map(simulado => {
                                        const results = calculateSimuladoResults(simulado);
                                        return (
                                            <div key={simulado.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-slate-100 p-6 bg-white shadow-sm gap-6 hover:border-brand-yellow hover:shadow-md transition-all">
                                                <div className="flex-1">
                                                    <p className="font-extrabold text-xl text-slate-900 tracking-tight">{simulado.title}</p>
                                                    <p className="text-sm text-slate-500 mt-1 font-semibold flex items-center gap-2">
                                                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">{getSubjectName(simulado.subjectId)}</span>
                                                        <span>• {simulado.questions.length} questões</span>
                                                        {simulado.timeLimitMinutes && <span>• {simulado.timeLimitMinutes} min</span>}
                                                    </p>
                                                </div>
                                                {simulado.status === 'Concluído' ? (
                                                    <div className="flex flex-wrap items-center gap-4 text-sm w-full sm:w-auto justify-between bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                                                <Check className="h-4 w-4" /> <span>{results.correct} Acertos</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md">
                                                                <XCircle className="h-4 w-4" /> <span>{results.incorrect} Erros</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 border-l border-slate-200 pl-4 ml-2">
                                                            {results.durationSeconds !== undefined && (
                                                                <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                                                                    <Clock className="h-4 w-4" /> <span>{formatDuration(results.durationSeconds)}</span>
                                                                </div>
                                                            )}
                                                            <Badge variant={results.score >= 70 ? 'secondary' : 'destructive'} className={cn("text-base px-3 py-1 shadow-none", results.score >= 70 && 'bg-emerald-100 text-emerald-800 border-none')}>
                                                                {results.score.toFixed(0)}%
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-800 border-none px-4 py-1.5 text-sm font-bold shadow-none">Pendente</Badge>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                        <BookCopy className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                        <p className="font-bold text-lg text-slate-600">Nenhum simulado disponível.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
                </Tabs>
                */}
            </div>

            {/* MODAL EDITAR AULA */}
            <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl border-slate-100 shadow-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-900">Editar Aula</DialogTitle>
                        <DialogDescription className="text-slate-500 mt-1">Atualize o título e a descrição da aula de <span className="font-bold text-slate-700">{editingClass?.subject}</span>.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="class-title" className="font-bold text-slate-700">Título da Aula</Label>
                            <Input id="class-title" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow font-medium" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="class-description" className="font-bold text-slate-700">Descrição da Aula</Label>
                            <Textarea id="class-description" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} placeholder="Adicione observações, tópicos a serem abordados ou links importantes..." rows={5} className="rounded-xl border-slate-200 focus-visible:ring-brand-yellow resize-none" />
                        </div>
                    </div>
                    <DialogFooter className="mt-4 gap-3 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="ghost" className="rounded-xl font-bold text-slate-500 hover:text-slate-700 h-11">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleSaveChanges} className="h-11 rounded-xl bg-brand-yellow px-6 font-bold text-slate-900 shadow-sm hover:bg-brand-yellow/90">Salvar Alterações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

{/* MODAL ANEXAR ARQUIVO */}
             <Dialog open={isFileUploadDialogOpen} onOpenChange={(open) => {
                 setIsFileUploadDialogOpen(open);
                 if (!open) setSelectedFile(null);
             }}>
                 <DialogContent className="sm:max-w-md rounded-3xl border-slate-100 shadow-2xl p-8">
                     <DialogHeader>
                         <DialogTitle className="text-2xl font-bold text-slate-900">Anexar Material</DialogTitle>
                         <DialogDescription className="text-slate-500 mt-1">Anexe um arquivo para a aula de <span className="font-bold text-slate-700">{selectedClassForMaterial?.subject}</span>.</DialogDescription>
                     </DialogHeader>
                     <div className="grid gap-5 py-4">
                         <div className="grid gap-3">
                             <Label htmlFor="file-upload" className="font-bold text-slate-700">Selecione o arquivo</Label>
                             <div className="flex items-center gap-3">
                                 <Input 
                                    id="file-upload" 
                                    type="file" 
                                    onChange={handleFileSelect}
                                    className="flex-1 cursor-pointer h-12 rounded-xl border-slate-200 file:bg-slate-100 file:text-slate-700 file:border-0 file:rounded-lg file:px-4 file:py-1 hover:file:bg-slate-200"
                                 />
                             </div>
                             {selectedFile && (
                                 <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                     <File className="h-5 w-5 text-amber-600" />
                                     <span className="text-sm font-medium text-amber-700 flex-1">{selectedFile.name}</span>
                                     <button 
                                        onClick={() => setSelectedFile(null)}
                                        className="text-amber-600 hover:text-amber-800"
                                     >
                                         <X className="h-4 w-4" />
                                     </button>
                                 </div>
                             )}
                             <p className="text-xs font-medium text-slate-400">Suporta PDFs, planilhas e imagens. Tamanho máx: 5MB.</p>
                         </div>
                     </div>
                     <DialogFooter className="mt-4 gap-3 sm:gap-0">
                         <DialogClose asChild>
                             <Button variant="ghost" className="rounded-xl font-bold text-slate-500 hover:text-slate-700 h-11">Cancelar</Button>
                         </DialogClose>
                          <Button 
                            className="h-11 rounded-xl bg-brand-yellow px-6 font-bold text-slate-900 shadow-sm hover:bg-brand-yellow/90" 
                            onClick={handleUploadFile}
                            disabled={!selectedFile || uploadingFile}
                          >
                              {uploadingFile ? 'Enviando...' : 'Fazer Upload'}
                          </Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>
        </>
    );
}

export default function StudentDetailPage() {
    return (
        <Suspense fallback={<div className="flex h-[50vh] items-center justify-center text-slate-400 font-medium animate-pulse">Carregando perfil...</div>}>
            <StudentDetailPageComponent />
        </Suspense>
    )
}