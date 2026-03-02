'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck, MessageSquare, MoreHorizontal, Plus, Trash2, Wallet } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

import { createStudent, deleteStudentProfile, getStudents } from '@/app/actions/users';
import { addTransactionAndCredits } from '@/app/actions/finance';
import { getLessons } from '@/app/actions/bookings';

type StudentRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  status?: string | null;
  lastAccess?: string | Date | null;
  updatedAt?: string | Date | null;
};

type LessonRow = {
  id: string;
  studentId: string;
  status: string;
};

function isScheduledLesson(status?: string) {
  const normalized = String(status ?? '').toLowerCase();
  return normalized === 'pending' || normalized === 'confirmed' || normalized === 'scheduled';
}

function formatLastAccess(student: StudentRow) {
  const sourceDate = student.lastAccess ?? student.updatedAt;
  if (!sourceDate) return 'Nunca';

  const parsedDate = new Date(sourceDate);
  if (Number.isNaN(parsedDate.getTime())) return 'Nunca';

  return format(parsedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function StudentList({
  id,
  title,
  students,
  scheduledCountByStudent,
  onAddCredits,
  onDeleteStudent,
}: {
  id?: string;
  title: string;
  students: StudentRow[];
  scheduledCountByStudent: Record<string, number>;
  onAddCredits: (student: StudentRow) => void;
  onDeleteStudent: (student: StudentRow) => void;
}) {
  const router = useRouter();

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Último Acesso</TableHead>
              <TableHead className="text-center">Aulas Agendadas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/student/${student.id}`}
                      className="inline-flex"
                      aria-label={`Abrir perfil de ${student.name}`}
                    >
                      <Avatar className="h-10 w-10 border shadow-sm">
                        <AvatarImage src={student.avatarUrl ?? undefined} alt={student.name} />
                        <AvatarFallback className="bg-brand-yellow font-bold text-slate-800">
                          {student.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/student/${student.id}`}
                      className="font-medium text-slate-800 transition-colors hover:text-brand-yellow"
                    >
                      {student.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600">{student.email}</TableCell>
                  <TableCell className="text-slate-500">{formatLastAccess(student)}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1.5 text-amber-700">
                      <CalendarCheck className="h-4 w-4" />
                      <strong>{scheduledCountByStudent[student.id] ?? 0}</strong>
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Ações para ${student.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onSelect={() => onAddCredits(student)}>
                          <Wallet className="mr-2 h-4 w-4" />
                          Adicionar créditos
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push(`/dashboard/chat?contactId=${student.id}`)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => onDeleteStudent(student)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir perfil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum aluno encontrado no banco de dados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AdminStudentsPage() {
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [studentToDelete, setStudentToDelete] = useState<StudentRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isAddCreditsOpen, setIsAddCreditsOpen] = useState(false);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [studentToCredit, setStudentToCredit] = useState<StudentRow | null>(null);
  const [creditForm, setCreditForm] = useState({
    planName: '',
    amountPaid: '',
    paymentMethod: 'PIX',
    credits: '1',
  });

  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const [studentsResult, lessonsResult] = await Promise.all([getStudents(), getLessons()]);

    if (studentsResult.success && studentsResult.data) {
      setAllStudents(studentsResult.data as StudentRow[]);
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: studentsResult.error });
    }

    if (lessonsResult.success && lessonsResult.data) {
      setLessons(lessonsResult.data as LessonRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    fetchData();
  }, []);

  const activeStudents = useMemo(
    () => allStudents.filter((student) => (student.status ?? 'active') === 'active'),
    [allStudents]
  );

  const inactiveStudents = useMemo(
    () => allStudents.filter((student) => student.status === 'inactive'),
    [allStudents]
  );

  const scheduledCountByStudent = useMemo(() => {
    const counts: Record<string, number> = {};
    lessons.forEach((lesson) => {
      if (!isScheduledLesson(lesson.status)) return;
      counts[lesson.studentId] = (counts[lesson.studentId] ?? 0) + 1;
    });
    return counts;
  }, [lessons]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createStudent(formData);

    if (result.success) {
      toast({ title: 'Sucesso', description: 'Aluno cadastrado com sucesso.' });
      setIsCreateOpen(false);
      setFormData({ name: '', email: '', password: '' });
      await fetchData();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }

    setIsSubmitting(false);
  };

  const openAddCreditsModal = (student: StudentRow) => {
    setStudentToCredit(student);
    setCreditForm({
      planName: 'Pacote 4 Aulas',
      amountPaid: '',
      paymentMethod: 'PIX',
      credits: '4',
    });
    setIsAddCreditsOpen(true);
  };

  const handleAddCreditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToCredit || isAddingCredits) return;

    const planName = creditForm.planName.trim();
    const normalizedAmount = Number(creditForm.amountPaid.replace(',', '.'));
    const normalizedCredits = Number.parseInt(creditForm.credits, 10);

    if (!planName) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Informe o nome do pacote/plano.' });
      return;
    }

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Informe um valor pago valido.' });
      return;
    }

    if (!Number.isInteger(normalizedCredits) || normalizedCredits <= 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Informe uma quantidade de creditos valida.' });
      return;
    }

    setIsAddingCredits(true);

    try {
      const result = await addTransactionAndCredits(
        studentToCredit.id,
        normalizedCredits,
        planName,
        normalizedAmount,
        creditForm.paymentMethod
      );

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: `Transacao registrada e ${normalizedCredits} creditos adicionados para ${studentToCredit.name}.`,
        });
        setIsAddCreditsOpen(false);
        setStudentToCredit(null);
        await fetchData();
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error });
      }
    } catch (error) {
      console.error('Erro ao registrar transacao de credito:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha inesperada ao registrar transacao.' });
    } finally {
      setIsAddingCredits(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete || isDeleting) return;
    setIsDeleting(true);

    const result = await deleteStudentProfile(studentToDelete.id);
    if (result.success) {
      toast({
        title: 'Aluno excluído',
        description: `O perfil de ${studentToDelete.name} foi removido da listagem.`,
      });
      setStudentToDelete(null);
      await fetchData();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }

    setIsDeleting(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse">
        Carregando alunos...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8">
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <h1 className="font-headline text-2xl font-bold text-slate-900 md:text-3xl">
            Gestão de Alunos
          </h1>
          <p className="mt-1 text-slate-500">
            Gerencie os alunos, acompanhe acessos e acesse ações rápidas.
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-brand-yellow font-bold text-slate-900 hover:bg-amber-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Aluno
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        <StudentList
          id="active-students"
          title="Alunos Ativos"
          students={activeStudents}
          scheduledCountByStudent={scheduledCountByStudent}
          onAddCredits={openAddCreditsModal}
          onDeleteStudent={setStudentToDelete}
        />
        <StudentList
          id="inactive-students"
          title="Alunos Inativos"
          students={inactiveStudents}
          scheduledCountByStudent={scheduledCountByStudent}
          onAddCredits={openAddCreditsModal}
          onDeleteStudent={setStudentToDelete}
        />
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
            <DialogDescription>Crie o acesso de um novo aluno manualmente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Nome Completo</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Joao Silva"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-email">E-mail de Acesso</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="aluno@email.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-password">Senha Temporária</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="******"
                required
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">
                {isSubmitting ? 'Salvando...' : 'Salvar Aluno'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddCreditsOpen}
        onOpenChange={(open) => {
          if (isAddingCredits) return;
          setIsAddCreditsOpen(open);
          if (!open) {
            setStudentToCredit(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Creditos</DialogTitle>
            <DialogDescription>
              Registre a transacao da compra via WhatsApp para liberar creditos para{' '}
              <span className="font-semibold">{studentToCredit?.name || 'o aluno'}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCreditsSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="credit-plan-name">Nome do Pacote/Plano</Label>
              <Input
                id="credit-plan-name"
                value={creditForm.planName}
                onChange={(e) => setCreditForm((prev) => ({ ...prev, planName: e.target.value }))}
                placeholder="Ex: Pacote 4 Aulas"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="credit-amount-paid">Valor Pago em R$</Label>
              <Input
                id="credit-amount-paid"
                type="text"
                inputMode="decimal"
                value={creditForm.amountPaid}
                onChange={(e) => setCreditForm((prev) => ({ ...prev, amountPaid: e.target.value }))}
                placeholder="Ex: 380.00"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="credit-payment-method">Metodo de Pagamento</Label>
              <Select
                value={creditForm.paymentMethod}
                onValueChange={(value) => setCreditForm((prev) => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger id="credit-payment-method">
                  <SelectValue placeholder="Selecione o metodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartao de Credito">Cartao de Credito</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="credit-quantity">Quantidade de Creditos a adicionar</Label>
              <Input
                id="credit-quantity"
                type="number"
                min={1}
                step={1}
                value={creditForm.credits}
                onChange={(e) => setCreditForm((prev) => ({ ...prev, credits: e.target.value }))}
                required
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddCreditsOpen(false)} disabled={isAddingCredits}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isAddingCredits} className="bg-slate-900 text-white hover:bg-slate-800">
                {isAddingCredits ? 'Registrando...' : 'Registrar Transacao'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o perfil de <span className="font-semibold">{studentToDelete?.name}</span> da listagem
              de alunos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
