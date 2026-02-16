'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ClipboardList, BookCopy, Clock, User, CheckCircle2, ChevronRight, BarChart3, AlertCircle, X, ListPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getStudents, getUserById } from '@/app/actions/users';
import { deleteSimulado, listSimuladosForUser, upsertSimulado } from '@/app/actions/simulados';
import { cn } from '@/lib/utils';

// TIPAGENS
type QuestionOption = { id: string; text: string; isCorrect: boolean };
type Question = {
  id: string;
  title: string;
  type: 'multiple-choice';
  options: QuestionOption[];
  isRequired: boolean;
};

type SimuladoItem = {
  id: string;
  title: string;
  description: string;
  subject: string;
  studentId: string;
  creatorId: string;
  status: string;
  maxAttempts: number;
  timeLimitMinutes?: number | null;
  questions: Question[];
  attempts: Array<{ score: number }>;
  createdAt: string | Date;
  student?: { id: string; name: string } | null;
};

type StudentItem = { id: string; name: string };

// Tipo temporário para o formulário de criação
type DraftQuestion = {
  text: string;
  options: [string, string, string, string]; // A, B, C, D
  correctIndex: '0' | '1' | '2' | '3';
};

const SUBJECTS = ['Matemática', 'Física', 'Química', 'Português', 'Redação', 'Biologia', 'História', 'Geografia', 'Inglês'];

export default function SimuladosPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentUserId, setCurrentUserId] = useState('');
  const [currentRole, setCurrentRole] = useState<'admin' | 'teacher' | 'student' | ''>('');
  const [simulados, setSimulados] = useState<SimuladoItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados do Formulário Geral
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [studentId, setStudentId] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);

  // O NOVO ESTADO: Um array com quantas questões o professor quiser
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([
    { text: '', options: ['', '', '', ''], correctIndex: '0' }
  ]);

  const loadAll = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
      return;
    }

    const userResult = await getUserById(userId);
    if (!userResult.success || !userResult.data) {
      router.push('/login');
      return;
    }

    const dbUser = userResult.data as any;
    setCurrentUserId(dbUser.id);
    setCurrentRole(dbUser.role);

    const [simuladosResult, studentsResult] = await Promise.all([
      listSimuladosForUser(dbUser.id),
      getStudents(),
    ]);

    if (simuladosResult.success && simuladosResult.data) {
      setSimulados(simuladosResult.data as SimuladoItem[]);
    }
    if (studentsResult.success && studentsResult.data) {
      setStudents((studentsResult.data as any[]).map((s) => ({ id: s.id, name: s.name })));
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const pendingSimulados = useMemo(
    () => simulados.filter((simulado) => simulado.status.toLowerCase().startsWith('pend')),
    [simulados]
  );

  const answeredSimulados = useMemo(
    () => simulados.filter((simulado) => !simulado.status.toLowerCase().startsWith('pend')),
    [simulados]
  );

  // FUNÇÕES DO CONSTRUTOR DE QUESTÕES
  const addQuestion = () => {
    setDraftQuestions([...draftQuestions, { text: '', options: ['', '', '', ''], correctIndex: '0' }]);
  };

  const removeQuestion = (indexToRemove: number) => {
    setDraftQuestions(draftQuestions.filter((_, idx) => idx !== indexToRemove));
  };

  const updateQuestionText = (idx: number, newText: string) => {
    const newDrafts = [...draftQuestions];
    newDrafts[idx].text = newText;
    setDraftQuestions(newDrafts);
  };

  const updateOptionText = (qIdx: number, optIdx: number, newText: string) => {
    const newDrafts = [...draftQuestions];
    newDrafts[qIdx].options[optIdx] = newText;
    setDraftQuestions(newDrafts);
  };

  const updateCorrectIndex = (qIdx: number, newIndex: '0' | '1' | '2' | '3') => {
    const newDrafts = [...draftQuestions];
    newDrafts[qIdx].correctIndex = newIndex;
    setDraftQuestions(newDrafts);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSubject('');
    setStudentId('');
    setMaxAttempts(1);
    setTimeLimitMinutes(60);
    setDraftQuestions([{ text: '', options: ['', '', '', ''], correctIndex: '0' }]);
  };

  const handleCreate = async () => {
    if (!title || !subject || !studentId) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha o título, o aluno e a matéria.' });
      return;
    }

    // Validação das questões
    for (let i = 0; i < draftQuestions.length; i++) {
        const q = draftQuestions[i];
        if (!q.text || !q.options[0] || !q.options[1] || !q.options[2] || !q.options[3]) {
            toast({ variant: 'destructive', title: 'Questão incompleta', description: `Preencha todos os campos da Questão ${i + 1}.` });
            return;
        }
    }

    setIsSubmitting(true);

    // Montando o array final pro Prisma
    const questions: Question[] = draftQuestions.map((dq, qIndex) => ({
        id: `q-${Date.now()}-${qIndex}`,
        title: dq.text,
        type: 'multiple-choice',
        isRequired: true,
        options: dq.options.map((optText, optIndex) => ({
            id: `opt-${qIndex}-${optIndex}-${Date.now()}`,
            text: optText,
            isCorrect: String(optIndex) === dq.correctIndex,
        }))
    }));

    const result = await upsertSimulado({
      title,
      description,
      subject,
      creatorId: currentUserId,
      studentId,
      maxAttempts,
      timeLimitMinutes,
      questions,
    });

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Erro ao criar', description: result.error || 'Falha ao criar simulado no banco de dados.' });
      setIsSubmitting(false);
      return;
    }

    toast({ title: 'Simulado Criado! 🎉', description: `A prova com ${questions.length} questões foi salva e enviada.` });
    resetForm();
    setIsCreating(false);
    setIsSubmitting(false);
    await loadAll();
  };

  const handleDelete = async (simuladoId: string) => {
    if(!confirm('Tem certeza que deseja excluir permanentemente este simulado?')) return;
    
    const result = await deleteSimulado(simuladoId);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Falha ao excluir simulado.' });
      return;
    }
    toast({ title: 'Simulado Excluído', description: 'O registro foi removido com sucesso.' });
    await loadAll();
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse font-medium">Carregando seus simulados...</div>;
  }

  // VISÃO DO ALUNO
  if (currentRole === 'student') {
    return (
      <div className="flex flex-1 flex-col gap-6 max-w-6xl mx-auto w-full">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
            <h1 className="font-headline text-3xl font-bold text-slate-900 flex items-center gap-3">
                <BookCopy className="h-8 w-8 text-brand-yellow" />
                Meus Simulados
            </h1>
            <p className="text-slate-500 mt-2 text-lg">Teste seus conhecimentos e acompanhe sua evolução.</p>
            </div>
            <div className="flex gap-4">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center px-6">
                    <span className="block text-3xl font-black text-amber-700">{pendingSimulados.length}</span>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pendentes</span>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center px-6">
                    <span className="block text-3xl font-black text-green-700">{answeredSimulados.length}</span>
                    <span className="text-xs font-bold text-green-800 uppercase tracking-wider">Concluídos</span>
                </div>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            {/* COLUNA: PENDENTES */}
            <div className="flex flex-col gap-4">
                <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2 px-2">
                    <AlertCircle className="h-5 w-5 text-brand-yellow" /> Aguardando Você
                </h2>
                {pendingSimulados.length === 0 ? (
                    <Card className="rounded-3xl border-dashed border-2 bg-slate-50 shadow-none text-center p-10 h-full flex flex-col items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">Você não tem simulados pendentes.</p>
                        <p className="text-sm text-slate-400 mt-1">Ótimo trabalho!</p>
                    </Card>
                ) : (
                    pendingSimulados.map((simulado) => (
                    <Card key={simulado.id} className="rounded-3xl border-slate-200 shadow-sm hover:border-brand-yellow transition-all hover:shadow-md overflow-hidden group">
                        <CardHeader className="bg-slate-50/50 border-b pb-4">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <Badge variant="secondary" className="mb-2 bg-white border shadow-sm font-semibold">{simulado.subject}</Badge>
                                    <CardTitle className="text-xl text-slate-800 leading-tight">{simulado.title}</CardTitle>
                                </div>
                                <Badge className="bg-brand-yellow text-slate-900 font-bold border-none shrink-0">Pendente</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 pb-2">
                            <p className="text-sm text-slate-600 line-clamp-2">{simulado.description}</p>
                            <div className="flex items-center gap-4 mt-4 text-sm font-medium text-slate-500">
                                <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {simulado.timeLimitMinutes || 'Sem limite'} min</div>
                                <div className="flex items-center gap-1.5"><ClipboardList className="h-4 w-4" /> {simulado.questions.length} questões</div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 pt-4">
                            <Button className="w-full rounded-xl bg-slate-900 text-white hover:bg-brand-yellow hover:text-slate-900 font-bold text-base h-12 transition-colors" onClick={() => router.push(`/dashboard/simulados/start?id=${simulado.id}`)}>
                            Iniciar Simulado <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardFooter>
                    </Card>
                    ))
                )}
            </div>

            {/* COLUNA: CONCLUÍDOS */}
            <div className="flex flex-col gap-4">
                <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2 px-2">
                    <BarChart3 className="h-5 w-5 text-green-500" /> Resultados Anteriores
                </h2>
                {answeredSimulados.length === 0 ? (
                    <Card className="rounded-3xl border-dashed border-2 bg-slate-50 shadow-none text-center p-10 h-full flex flex-col items-center justify-center">
                        <p className="text-slate-500 font-medium">Nenhum histórico disponível.</p>
                    </Card>
                ) : (
                    answeredSimulados.map((simulado) => {
                        const lastAttempt = simulado.attempts[simulado.attempts.length - 1];
                        const isGoodScore = lastAttempt && lastAttempt.score >= 70;
                        return (
                        <Card key={simulado.id} className="rounded-3xl border-slate-200 shadow-sm opacity-90 hover:opacity-100 transition-opacity">
                            <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
                                <div className={cn("flex-shrink-0 h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-black", isGoodScore ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                    {lastAttempt ? `${Math.round(lastAttempt.score)}%` : '-'}
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="font-bold text-slate-800 text-lg">{simulado.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium">{simulado.subject} • {simulado.questions.length} Questões</p>
                                </div>
                                <Button variant="outline" className="rounded-xl border-slate-300 font-bold w-full sm:w-auto hover:bg-slate-100" onClick={() => router.push(`/dashboard/simulados/start?id=${simulado.id}`)}>
                                    Gabarito
                                </Button>
                            </CardContent>
                        </Card>
                    )})
                )}
            </div>
        </div>
      </div>
    );
  }

  // VISÃO DO PROFESSOR / ADMIN
  return (
    <div className="flex flex-1 flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
             <BookCopy className="h-8 w-8 text-brand-yellow" /> Central de Simulados
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1 font-medium">Crie provas com múltiplas questões, envie aos alunos e acompanhe o desempenho.</p>
        </div>
        <Button className={cn("rounded-xl font-bold h-12 px-6 shadow-md w-full md:w-auto transition-colors", isCreating ? 'bg-red-50 text-red-600 border-red-200 border hover:bg-red-100 shadow-none' : 'bg-slate-900 text-white hover:bg-slate-800')} onClick={() => setIsCreating((v) => !v)}>
          {isCreating ? <><X className="mr-2 h-5 w-5" /> Cancelar Criação</> : <><Plus className="mr-2 h-5 w-5" /> Novo Simulado</>}
        </Button>
      </div>

      {isCreating && (
        <Card className="rounded-3xl border-brand-yellow/50 shadow-md border-2 overflow-hidden animate-in fade-in slide-in-from-top-4">
          <CardHeader className="bg-amber-50 border-b border-amber-100 pb-5 flex flex-row items-start justify-between">
            <div>
                <CardTitle className="text-2xl text-slate-800">Montar Nova Prova</CardTitle>
                <CardDescription className="text-amber-800 font-medium">Configure a prova e adicione quantas questões quiser no construtor abaixo.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 bg-white space-y-6">
            
            {/* BLOCO 1: CONFIGURAÇÕES */}
            <div className="grid gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2"><Settings className="h-4 w-4"/> 1. Configurações da Prova</h3>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div className="grid gap-2">
                        <Label className="font-bold text-slate-700">Título do Simulado</Label>
                        <Input className="bg-white h-12" placeholder="Ex: Simulado ENEM 2026 - Matemática" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label className="font-bold text-slate-700">Disciplina Principal</Label>
                        <Select value={subject} onValueChange={setSubject}>
                            <SelectTrigger className="bg-white h-12">
                            <SelectValue placeholder="Selecione a disciplina" />
                            </SelectTrigger>
                            <SelectContent>
                            {SUBJECTS.map((item) => (
                                <SelectItem key={item} value={item} className="font-medium">{item}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label className="font-bold text-slate-700">Atribuir ao Aluno</Label>
                        <Select value={studentId} onValueChange={setStudentId}>
                            <SelectTrigger className="bg-white h-12">
                            <SelectValue placeholder="Selecione o aluno que fará a prova" />
                            </SelectTrigger>
                            <SelectContent>
                            {students.map((student) => (
                                <SelectItem key={student.id} value={student.id} className="font-medium">
                                <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400"/> {student.name}</div>
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label className="font-bold text-slate-700">Tentativas (Máx)</Label>
                            <Input className="bg-white h-12 text-center text-lg font-bold" type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
                        </div>
                        <div className="grid gap-2">
                            <Label className="font-bold text-slate-700">Tempo (Minutos)</Label>
                            <Input className="bg-white h-12 text-center text-lg font-bold" type="number" min={1} value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label className="font-bold text-slate-700">Instruções para o Aluno (Opcional)</Label>
                        <Textarea className="bg-white" placeholder="Mensagem ou dicas antes de começar..." rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* BLOCO 2: CONSTRUTOR DE QUESTÕES (ARRAY) */}
            <div className="grid gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                        <ListPlus className="h-5 w-5"/> 2. Construtor de Questões ({draftQuestions.length})
                    </h3>
                </div>

                <div className="space-y-6">
                    {draftQuestions.map((q, qIndex) => (
                        <div key={qIndex} className="relative p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm hover:border-brand-yellow/50 transition-colors group">
                            <div className="flex items-center justify-between mb-4">
                                <Badge className="bg-slate-800 text-white font-black text-sm px-3 py-1">Questão {qIndex + 1}</Badge>
                                {draftQuestions.length > 1 && (
                                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8" onClick={() => removeQuestion(qIndex)} title="Remover Questão">
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label className="font-bold text-slate-700 text-base">Enunciado da Pergunta</Label>
                                    <Textarea className="bg-slate-50 text-base font-medium border-slate-300 focus:border-brand-yellow" rows={3} placeholder={`Digite a pergunta ${qIndex + 1} aqui...`} value={q.text} onChange={(e) => updateQuestionText(qIndex, e.target.value)} />
                                </div>
                                <div className="grid gap-3 mt-2">
                                    <Label className="font-bold text-slate-700">Alternativas</Label>
                                    {['A', 'B', 'C', 'D'].map((letter, optIndex) => (
                                        <div key={letter} className="flex items-center gap-3">
                                            <Badge className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-700 text-lg shadow-none">{letter}</Badge> 
                                            <Input className="h-12 bg-white" placeholder={`Opção ${letter}`} value={q.options[optIndex]} onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                                <div className="grid gap-2 mt-2 p-4 bg-green-50/50 rounded-2xl border border-green-100">
                                    <Label className="font-black text-green-800 uppercase tracking-wider text-xs">Resposta Correta (Gabarito da Q.{qIndex + 1})</Label>
                                    <Select value={q.correctIndex} onValueChange={(value) => updateCorrectIndex(qIndex, value as '0' | '1' | '2' | '3')}>
                                        <SelectTrigger className="h-12 bg-white border-green-200 font-bold text-green-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0" className="font-bold">Alternativa A</SelectItem>
                                            <SelectItem value="1" className="font-bold">Alternativa B</SelectItem>
                                            <SelectItem value="2" className="font-bold">Alternativa C</SelectItem>
                                            <SelectItem value="3" className="font-bold">Alternativa D</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <Button variant="outline" className="w-full h-14 border-2 border-dashed border-slate-300 text-slate-500 hover:border-brand-yellow hover:text-brand-yellow hover:bg-amber-50 font-black uppercase tracking-wider rounded-2xl transition-all" onClick={addQuestion}>
                    <Plus className="h-5 w-5 mr-2" /> Adicionar Nova Questão
                </Button>
            </div>

            <div className="pt-6 border-t mt-4">
              <Button disabled={isSubmitting} className="w-full h-16 rounded-2xl bg-brand-yellow font-black text-slate-900 text-xl shadow-lg hover:-translate-y-1 hover:bg-amber-400 transition-all" onClick={handleCreate}>
                {isSubmitting ? 'Salvando Prova...' : `Finalizar e Enviar Prova (${draftQuestions.length} Questões)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-white pb-5">
          <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
            <ClipboardList className="h-6 w-6 text-slate-500" />
            Histórico de Simulados
          </CardTitle>
          <CardDescription className="text-base">Todas as provas criadas e seus status atuais.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 px-6">Título</TableHead>
                  <TableHead className="font-bold text-slate-700">Aluno</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Questões</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Data</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right px-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                            <BookCopy className="h-10 w-10 mb-2 opacity-30" />
                            <p className="font-medium text-slate-600">Nenhum simulado cadastrado.</p>
                            <p className="text-sm mt-1">Clique em "Novo Simulado" para começar.</p>
                        </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  simulados.map((simulado) => (
                    <TableRow key={simulado.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-bold text-slate-800 px-6">
                        {simulado.title}
                        <p className="font-normal text-sm text-slate-500">{simulado.subject}</p>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                             <Avatar className="h-6 w-6"><AvatarFallback className="bg-amber-100 text-xs text-amber-800 font-bold">{simulado.student?.name?.charAt(0) || '-'}</AvatarFallback></Avatar>
                             {simulado.student?.name || 'Não atribuído'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-600">{simulado.questions.length}</TableCell>
                      <TableCell>
                        <Badge className={simulado.status.toLowerCase().startsWith('pend') ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-none' : 'bg-green-100 text-green-800 hover:bg-green-200 border-none'}>
                          {simulado.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-500">{format(new Date(simulado.createdAt), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="font-bold text-slate-600 hover:text-slate-900 border-slate-300" onClick={() => router.push(`/dashboard/simulados/start?id=${simulado.id}`)}>
                            Visualizar
                          </Button>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(simulado.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

function Settings(props: any) { return <div {...props} />; }