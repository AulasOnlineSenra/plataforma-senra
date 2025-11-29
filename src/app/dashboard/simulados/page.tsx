
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical, CheckCircle, Copy, Circle, X, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getMockUser,
  subjects as initialSubjects,
  users as initialUsers,
  scheduleEvents as initialSchedule,
  simulados as initialSimulados
} from '@/lib/data';
import { User, Teacher, Subject, ScheduleEvent, UserRole, Simulado, Question, QuestionOption } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const SIMULADOS_STORAGE_KEY = 'simuladosList';

export default function SimuladosPage() {
  const [currentUser, setCurrentUser] = useState<User | Teacher | null>(null);
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState('list');
  const [viewingSimulado, setViewingSimulado] = useState<Simulado | null>(null);
  const [editingSimulado, setEditingSimulado] = useState<Simulado | null>(null);

  // State for the new/edit simulado form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  const { toast } = useToast();
  
  const optionRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  useEffect(() => {
    optionRefs.current.forEach((inputElement, id) => {
      if (!document.body.contains(inputElement)) {
        optionRefs.current.delete(id);
      }
    });
  }, [questions]);


  useEffect(() => {
    const updateData = () => {
      const role = localStorage.getItem('userRole') as UserRole;
      const storedUser = localStorage.getItem('currentUser');
      setCurrentUser(storedUser ? JSON.parse(storedUser) : getMockUser(role));

      const storedSimulados = localStorage.getItem(SIMULADOS_STORAGE_KEY);
      setSimulados(storedSimulados ? JSON.parse(storedSimulados).map((s: any) => ({...s, createdAt: new Date(s.createdAt), completedAt: s.completedAt ? new Date(s.completedAt) : undefined})) : initialSimulados);
      
      const storedUsers = localStorage.getItem('userList');
      setStudents(storedUsers ? JSON.parse(storedUsers).filter((u:User) => u.role === 'student') : initialUsers.filter(u => u.role === 'student'));

      setAllSubjects(initialSubjects);
    };

    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, []);

  const myStudents = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return students;
    if (currentUser.role === 'teacher') {
      const storedSchedule = localStorage.getItem('scheduleEvents');
      const schedule: ScheduleEvent[] = storedSchedule ? JSON.parse(storedSchedule) : initialSchedule;
      const myStudentIds = new Set(schedule.filter(e => e.teacherId === currentUser.id).map(e => e.studentId));
      return students.filter(s => myStudentIds.has(s.id));
    }
    return [];
  }, [currentUser, students]);

  const availableSubjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return allSubjects;
    if (currentUser.role === 'teacher') {
        const teacherUser = currentUser as Teacher;
        return allSubjects.filter(sub => teacherUser.subjects.includes(sub.id));
    }
    return [];
  }, [currentUser, allSubjects]);

  useEffect(() => {
    if (availableSubjects.length === 1 && !editingSimulado) {
      setSelectedSubject(availableSubjects[0].id);
    }
  }, [availableSubjects, editingSimulado]);

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      title: '',
      type: 'multiple-choice',
      options: [{ id: `opt-${Date.now()}`, text: '', isCorrect: true }],
      isRequired: false,
    };
    setQuestions([...questions, newQuestion]);
  };
  
  const handleQuestionChange = (qIndex: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[qIndex] as any)[field] = value;
    setQuestions(newQuestions);
  };
  
  const handleOptionChange = (qIndex: number, oIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex].text = text;
    setQuestions(newQuestions);
  };

  const handleCorrectOptionChange = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.forEach((opt, index) => {
      opt.isCorrect = index === oIndex;
    });
    setQuestions(newQuestions);
  };
  
  const handleAddOption = (qIndex: number) => {
    const newOptionId = `opt-${Date.now()}`;
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push({ id: newOptionId, text: '', isCorrect: false });
    setQuestions(newQuestions);

    // Focus the new input after it has rendered
    setTimeout(() => {
      const input = optionRefs.current.get(newOptionId);
      if (input) {
        input.focus();
      }
    }, 0);
  };
  
  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length <= 1) return; // Must have at least one option
    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(qIndex, 1);
    setQuestions(newQuestions);
  };

  const handleDuplicateQuestion = (qIndex: number) => {
    const questionToDuplicate = questions[qIndex];
    const duplicatedQuestion: Question = {
      ...questionToDuplicate,
      id: `q-${Date.now()}`,
      options: questionToDuplicate.options.map(opt => ({
        ...opt,
        id: `opt-${Date.now()}-${Math.random()}`
      }))
    };

    const newQuestions = [...questions];
    newQuestions.splice(qIndex + 1, 0, duplicatedQuestion);
    setQuestions(newQuestions);
    toast({
      title: 'Questão Duplicada!',
      description: 'Uma cópia da questão foi criada logo abaixo.',
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedSubject(availableSubjects.length === 1 ? availableSubjects[0].id : '');
    setSelectedStudent('');
    setQuestions([]);
    setEditingSimulado(null);
    setActiveTab('list');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedSubject || !selectedStudent || !currentUser) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha título, disciplina e aluno.',
      });
      return;
    }

    if (editingSimulado) {
      // Update existing simulado
      const updatedSimulado: Simulado = {
        ...editingSimulado,
        title,
        description,
        subjectId: selectedSubject,
        studentId: selectedStudent,
        questions,
      };
      const updatedSimulados = simulados.map(s => s.id === editingSimulado.id ? updatedSimulado : s);
      setSimulados(updatedSimulados);
      localStorage.setItem(SIMULADOS_STORAGE_KEY, JSON.stringify(updatedSimulados));
      toast({
        title: 'Simulado Atualizado!',
        description: 'As alterações no simulado foram salvas.',
      });
    } else {
      // Create new simulado
      const newSimulado: Simulado = {
        id: `sim-${Date.now()}`,
        title,
        description,
        subjectId: selectedSubject,
        studentId: selectedStudent,
        creatorId: currentUser.id,
        createdAt: new Date(),
        status: 'Pendente',
        questions,
      };
      const updatedSimulados = [...simulados, newSimulado];
      setSimulados(updatedSimulados);
      localStorage.setItem(SIMULADOS_STORAGE_KEY, JSON.stringify(updatedSimulados));
      toast({
        title: 'Simulado Criado!',
        description: 'O novo simulado foi adicionado à lista.',
      });
    }
    
    window.dispatchEvent(new Event('storage'));
    resetForm();
  };

  const handleDeleteSimulado = (id: string) => {
    const updatedSimulados = simulados.filter(s => s.id !== id);
    setSimulados(updatedSimulados);
    localStorage.setItem(SIMULADOS_STORAGE_KEY, JSON.stringify(updatedSimulados));
    window.dispatchEvent(new Event('storage'));
    toast({
      variant: 'destructive',
      title: 'Simulado Excluído',
      description: 'O simulado foi removido da lista.',
    });
  };

  const handleEditClick = (simuladoToEdit: Simulado) => {
    setEditingSimulado(simuladoToEdit);
    setTitle(simuladoToEdit.title);
    setDescription(simuladoToEdit.description);
    setSelectedSubject(simuladoToEdit.subjectId);
    setSelectedStudent(simuladoToEdit.studentId);
    setQuestions(simuladoToEdit.questions);
    setActiveTab('create');
  }

  const getSubjectName = (id: string) => allSubjects.find(s => s.id === id)?.name || 'Desconhecida';
  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Desconhecido';

  const displayedSimulados = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return simulados;
    if (currentUser.role === 'teacher') {
        return simulados.filter(s => s.creatorId === currentUser.id);
    }
    return simulados.filter(s => s.studentId === currentUser.id);
  }, [currentUser, simulados]);

  const answeredSimulados = useMemo(() => {
    return displayedSimulados.filter(s => s.status === 'Concluído').sort((a,b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));
  }, [displayedSimulados]);

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) {
     return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="flex items-center">
                <h1 className="font-headline text-2xl md:text-3xl font-bold">Simulados</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Meus Simulados</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Você não tem permissão para criar simulados. Aqui você verá os simulados que foram designados a você.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Simulados Atribuídos</CardTitle>
                    <CardDescription>Lista de simulados que você precisa concluir.</CardDescription>
                </CardHeader>
                <CardContent>
                    {displayedSimulados.length > 0 ? (
                        <div className="space-y-4">
                        {displayedSimulados.map(sim => (
                            <div key={sim.id} className="rounded-lg border p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">{sim.title}</h3>
                                    <p className="text-sm text-muted-foreground">{getSubjectName(sim.subjectId)} • {sim.questions.length} questões</p>
                                </div>
                                <Button>Iniciar</Button>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Nenhum simulado atribuído a você no momento.</p>
                        </div>
                    )}
                </CardContent>
             </Card>
        </div>
     )
  }

  return (
    <>
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Simulados
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Simulados Criados</TabsTrigger>
          <TabsTrigger value="create">{editingSimulado ? 'Editar Simulado' : 'Criar Novo'}</TabsTrigger>
          <TabsTrigger value="answers">Respostas</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-6">
           <Card>
            <CardHeader>
            <CardTitle>Seus Simulados</CardTitle>
            <CardDescription>Lista de todos os simulados que você já criou. Clique em uma linha para ver os detalhes.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {displayedSimulados.length > 0 ? (
                    displayedSimulados.map((sim) => (
                    <TableRow key={sim.id} onClick={() => setViewingSimulado(sim)} className="cursor-pointer">
                        <TableCell className="font-medium max-w-xs truncate">{sim.title}</TableCell>
                        <TableCell>{getStudentName(sim.studentId)}</TableCell>
                        <TableCell>{getSubjectName(sim.subjectId)}</TableCell>
                        <TableCell>{format(sim.createdAt, 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell>
                            <Badge variant={sim.status === 'Concluído' ? 'secondary' : 'default'} className={cn(sim.status === 'Concluído' && 'bg-green-100 text-green-800')}>
                                {sim.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {sim.status === 'Pendente' && (
                            <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={(e) => { e.stopPropagation(); handleEditClick(sim); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteSimulado(sim.id); }}>
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum simulado criado ainda.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        </TabsContent>
        <TabsContent value="create" className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                <CardHeader>
                    <CardTitle>{editingSimulado ? 'Editar Simulado' : 'Informações Gerais'}</CardTitle>
                    <CardDescription>
                    {editingSimulado ? 'Altere as informações do simulado abaixo.' : 'Crie um novo conjunto de exercícios para um aluno específico.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título do Simulado</Label>
                        <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Revisão de Funções de 2º Grau"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Disciplina</Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger id="subject">
                            <SelectValue placeholder="Selecione uma disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableSubjects.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                                {sub.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="student">Aluno</Label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                        <SelectTrigger id="student">
                            <SelectValue placeholder="Selecione um aluno" />
                        </SelectTrigger>
                        <SelectContent>
                            {myStudents.map((stu) => (
                            <SelectItem key={stu.id} value={stu.id}>
                                {stu.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    </div>
                    <div className="grid gap-2">
                    <Label htmlFor="description">Descrição/Instruções</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Adicione instruções, links ou o conteúdo do exercício aqui."
                        rows={2}
                    />
                    </div>
                </CardContent>
                </Card>

                {questions.map((q, qIndex) => (
                <Card key={q.id}>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <GripVertical className="cursor-move text-muted-foreground mt-2" />
                        <Input 
                            value={q.title} 
                            onChange={(e) => handleQuestionChange(qIndex, 'title', e.target.value)} 
                            placeholder="Pergunta sem título"
                            className="flex-1 text-base mx-4 border-0 shadow-none focus-visible:ring-0"
                        />
                        <Select value={q.type} onValueChange={(val) => handleQuestionChange(qIndex, 'type', val)}>
                            <SelectTrigger className="w-[180px]">
                            <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="multiple-choice">Múltipla escolha</SelectItem>
                                <SelectItem value="short-answer" disabled>Resposta curta</SelectItem>
                                <SelectItem value="paragraph" disabled>Parágrafo</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 pl-8">
                        {q.options.map((opt, oIndex) => (
                            <div key={opt.id} className="flex items-center gap-3">
                                <input type="radio" name={`correct-opt-${q.id}`} checked={opt.isCorrect} onChange={() => handleCorrectOptionChange(qIndex, oIndex)} className="form-radio h-4 w-4 text-primary focus:ring-primary" />
                                <Input
                                    ref={(el) => {
                                      if (el) optionRefs.current.set(opt.id, el);
                                    }}
                                    value={opt.text}
                                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                    placeholder="Nova Opção"
                                    className="flex-1"
                                />
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(qIndex, oIndex)}>
                                    <X className="h-4 w-4 text-muted-foreground"/>
                                </Button>
                            </div>
                        ))}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <input type="radio" disabled className="form-radio h-4 w-4" />
                            <Button variant="link" type="button" onClick={() => handleAddOption(qIndex)} className="p-0 h-auto">
                                Adicionar opção
                            </Button>
                        </div>
                        </div>
                    </CardContent>
                    <Separator />
                    <CardContent className="p-4 flex justify-end items-center gap-4">
                        <Button variant="ghost" size="icon" title="Copiar" onClick={() => handleDuplicateQuestion(qIndex)}><Copy className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" title="Excluir Pergunta" onClick={() => handleRemoveQuestion(qIndex)}><Trash2 className="h-5 w-5 text-destructive" /></Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-2">
                            <Label htmlFor={`required-${q.id}`}>Obrigatória</Label>
                            <Switch id={`required-${q.id}`} checked={q.isRequired} onCheckedChange={(checked) => handleQuestionChange(qIndex, 'isRequired', checked)} />
                        </div>
                    </CardContent>
                </Card>
                ))}

                <Card>
                    <CardContent className="p-4 flex justify-center">
                        <Button type="button" variant="outline" onClick={handleAddQuestion}>
                            <Plus className="mr-2"/> Adicionar Pergunta
                        </Button>
                    </CardContent>
                </Card>
                
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
                    <Button type="submit">{editingSimulado ? 'Atualizar Simulado' : 'Salvar Simulado'}</Button>
                </div>
            </form>
        </TabsContent>
        <TabsContent value="answers" className="mt-6">
           <Card>
            <CardHeader>
                <CardTitle>Respostas dos Simulados</CardTitle>
                <CardDescription>Acompanhe o desempenho dos alunos nos simulados concluídos.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Simulado</TableHead>
                            <TableHead>Aluno</TableHead>
                            <TableHead>Data de Conclusão</TableHead>
                            <TableHead className="text-center">Acertos</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {answeredSimulados.length > 0 ? (
                            answeredSimulados.map(sim => (
                                <TableRow key={`ans-${sim.id}`} onClick={() => setViewingSimulado(sim)} className="cursor-pointer">
                                    <TableCell className="font-medium max-w-xs truncate">{sim.title}</TableCell>
                                    <TableCell>{getStudentName(sim.studentId)}</TableCell>
                                    <TableCell>{sim.completedAt ? format(new Date(sim.completedAt), 'dd/MM/yyyy HH:mm') : '-'}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={sim.score && sim.score >= 70 ? 'secondary' : 'destructive'} className={cn(sim.score && sim.score >= 70 && 'bg-green-100 text-green-800')}>
                                            {sim.score?.toFixed(0) || 'N/A'}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">Ver Respostas</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                         ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum simulado foi respondido ainda.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
           </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
    <Dialog open={!!viewingSimulado} onOpenChange={() => setViewingSimulado(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingSimulado?.title}</DialogTitle>
            <DialogDescription>
              {viewingSimulado?.description || 'Simulado sem descrição.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-6">
            <div className="space-y-6 py-4">
              {viewingSimulado?.questions.map((q, qIndex) => {
                const userAnswerId = viewingSimulado.userAnswers ? viewingSimulado.userAnswers[q.id] : undefined;
                return (
                    <div key={q.id} className="space-y-3">
                    <p className="font-semibold">{qIndex + 1}. {q.title} {q.isRequired && <span className="text-destructive">*</span>}</p>
                    <div className="pl-4 space-y-2">
                        {q.options.map(opt => {
                            const isSelected = userAnswerId === opt.id;
                            const isCorrect = opt.isCorrect;
                            
                            return (
                                <div key={opt.id} className={cn(
                                    "flex items-center gap-2 text-muted-foreground p-2 rounded-md",
                                    isSelected && isCorrect && "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200",
                                    isSelected && !isCorrect && "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200",
                                    !isSelected && isCorrect && "bg-green-50 dark:bg-green-900/20"
                                )}>
                                    { isSelected ? (
                                        isCorrect ? <CheckCircle className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />
                                    ) : (
                                        isCorrect ? <CheckCircle className="h-4 w-4 text-green-500/50" /> : <Circle className="h-3 w-3" />
                                    )}
                                    <span>{opt.text}</span>
                                    {isSelected && <Badge variant="outline" className="ml-auto bg-transparent">{isCorrect ? 'Sua Resposta (Correta)' : 'Sua Resposta'}</Badge>}
                                    {!isSelected && isCorrect && <Badge variant="outline" className="ml-auto bg-transparent">Resposta Correta</Badge>}
                                </div>
                            )
                        })}
                    </div>
                    </div>
                );
              })}
              {viewingSimulado?.questions.length === 0 && (
                <p className="text-muted-foreground text-center">Este simulado não tem nenhuma questão.</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
