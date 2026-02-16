'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStudents, getUserById } from '@/app/actions/users';
import { deleteSimulado, listSimuladosForUser, upsertSimulado } from '@/app/actions/simulados';

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

const SUBJECTS = ['Matematica', 'Fisica', 'Quimica', 'Portugues', 'Redacao', 'Biologia', 'Historia', 'Geografia', 'Ingles'];

export default function SimuladosPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentUserId, setCurrentUserId] = useState('');
  const [currentRole, setCurrentRole] = useState<'admin' | 'teacher' | 'student' | ''>('');
  const [simulados, setSimulados] = useState<SimuladoItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [studentId, setStudentId] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOptionIndex, setCorrectOptionIndex] = useState<'0' | '1' | '2' | '3'>('0');

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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSubject('');
    setStudentId('');
    setMaxAttempts(1);
    setTimeLimitMinutes(60);
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOptionIndex('0');
  };

  const handleCreate = async () => {
    if (!title || !subject || !studentId || !questionText || !optionA || !optionB || !optionC || !optionD) {
      toast({ variant: 'destructive', title: 'Campos obrigatorios', description: 'Preencha todos os dados do simulado.' });
      return;
    }

    const options = [optionA, optionB, optionC, optionD].map((text, index) => ({
      id: `opt-${index}-${Date.now()}`,
      text,
      isCorrect: String(index) === correctOptionIndex,
    }));

    const questions: Question[] = [
      {
        id: `q-${Date.now()}`,
        title: questionText,
        type: 'multiple-choice',
        options,
        isRequired: true,
      },
    ];

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
      toast({ variant: 'destructive', title: 'Erro ao criar', description: result.error || 'Falha ao criar simulado.' });
      return;
    }

    toast({ title: 'Simulado criado', description: 'O simulado foi salvo no banco de dados.' });
    resetForm();
    setIsCreating(false);
    await loadAll();
  };

  const handleDelete = async (simuladoId: string) => {
    const result = await deleteSimulado(simuladoId);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Falha ao excluir simulado.' });
      return;
    }
    toast({ title: 'Simulado excluido', description: 'Registro removido com sucesso.' });
    await loadAll();
  };

  if (isLoading) {
    return <div className="flex h-[40vh] items-center justify-center text-slate-500">Carregando simulados...</div>;
  }

  if (currentRole === 'student') {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h1 className="font-headline text-3xl font-bold text-slate-900">Meus Simulados</h1>
          <p className="text-sm text-slate-600">Seus simulados em andamento e concluídos.</p>
        </div>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50">
            <CardTitle>Pendentes</CardTitle>
            <CardDescription>Simulados prontos para iniciar.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {pendingSimulados.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum simulado pendente.</p>
              ) : (
                pendingSimulados.map((simulado) => (
                  <div key={simulado.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{simulado.title}</p>
                      <p className="text-sm text-slate-500">{simulado.subject}</p>
                    </div>
                    <Button
                      className="rounded-2xl bg-[#FFC107] font-bold text-slate-900 hover:bg-amber-300"
                      onClick={() => router.push(`/dashboard/simulados/start?id=${simulado.id}`)}
                    >
                      Iniciar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-slate-900">Simulados</h1>
          <p className="text-sm text-slate-600">Gestão de provas com persistência real no banco.</p>
        </div>
        <Button className="rounded-2xl bg-slate-900 font-bold text-white hover:bg-slate-800" onClick={() => setIsCreating((v) => !v)}>
          <Plus className="mr-2 h-4 w-4" />
          {isCreating ? 'Cancelar' : 'Novo Simulado'}
        </Button>
      </div>

      {isCreating && (
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50">
            <CardTitle>Criar Simulado</CardTitle>
            <CardDescription>Template rápido para criação com 1 questão objetiva.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Aluno</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Disciplina</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tentativas máximas</Label>
              <Input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label>Tempo limite (min)</Label>
              <Input
                type="number"
                min={1}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Descrição</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Pergunta</Label>
              <Input value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Alternativa A</Label>
              <Input value={optionA} onChange={(e) => setOptionA(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Alternativa B</Label>
              <Input value={optionB} onChange={(e) => setOptionB(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Alternativa C</Label>
              <Input value={optionC} onChange={(e) => setOptionC(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Alternativa D</Label>
              <Input value={optionD} onChange={(e) => setOptionD(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Resposta correta</Label>
              <Select value={correctOptionIndex} onValueChange={(value) => setCorrectOptionIndex(value as '0' | '1' | '2' | '3')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">A</SelectItem>
                  <SelectItem value="1">B</SelectItem>
                  <SelectItem value="2">C</SelectItem>
                  <SelectItem value="3">D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Button className="rounded-2xl bg-[#FFC107] font-bold text-slate-900 hover:bg-amber-300" onClick={handleCreate}>
                Salvar Simulado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#FFC107]" />
            Simulados Cadastrados
          </CardTitle>
          <CardDescription>Histórico completo de criação e execução.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ScrollArea className="h-80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                      Nenhum simulado cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  simulados.map((simulado) => (
                    <TableRow key={simulado.id}>
                      <TableCell className="font-medium">{simulado.title}</TableCell>
                      <TableCell>{simulado.student?.name || '-'}</TableCell>
                      <TableCell>{simulado.subject}</TableCell>
                      <TableCell>
                        <Badge className={simulado.status.toLowerCase().startsWith('pend') ? 'bg-[#FFC107] text-slate-900' : ''}>
                          {simulado.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{format(new Date(simulado.createdAt), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/simulados/start?id=${simulado.id}`)}>
                            Abrir
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDelete(simulado.id)}>
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
          {answeredSimulados.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              {answeredSimulados.length} simulado(s) concluído(s) já possuem tentativas registradas.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

