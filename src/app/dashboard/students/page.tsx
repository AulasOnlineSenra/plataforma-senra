"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Trash2,
  Wallet,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

import {
  createStudent,
  deleteStudentProfile,
  getStudents,
  getMyStudents,
} from "@/app/actions/users";
import { addTransactionAndCredits } from "@/app/actions/finance";
import { getLessons } from "@/app/actions/bookings";

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
  const normalized = String(status ?? "").toLowerCase();
  return (
    normalized === "pending" ||
    normalized === "confirmed" ||
    normalized === "scheduled"
  );
}

function formatLastAccess(student: StudentRow) {
  const sourceDate = student.lastAccess ?? student.updatedAt;
  if (!sourceDate) return "Nunca";

  const parsedDate = new Date(sourceDate);
  if (Number.isNaN(parsedDate.getTime())) return "Nunca";

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
    <Card
      id={id}
      className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      <CardHeader className="border-b border-slate-100 pb-4 pt-6 px-6 md:px-8 bg-slate-50/30">
        <CardTitle className="text-xl text-slate-900 font-bold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="divide-y divide-slate-100">
          <TableHeader>
            <TableRow className="border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="w-16 px-6 font-semibold text-slate-500">
                Foto
              </TableHead>
              <TableHead className="font-semibold text-slate-500">
                Nome
              </TableHead>
              <TableHead className="font-semibold text-slate-500">
                Email
              </TableHead>
              <TableHead className="font-semibold text-slate-500">
                Último Acesso
              </TableHead>
              <TableHead className="text-center font-semibold text-slate-500">
                Aulas Agendadas
              </TableHead>
              <TableHead className="text-right px-6 font-semibold text-slate-500">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => (
                <TableRow
                  key={student.id}
                  className="border-slate-100 hover:bg-slate-50/80 transition-colors"
                >
                  <TableCell className="px-6 py-4">
                    <Link
                      href={`/dashboard/student/${student.id}`}
                      className="inline-flex transition-transform hover:scale-105"
                      aria-label={`Abrir perfil de ${student.name}`}
                    >
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage
                          src={student.avatarUrl ?? undefined}
                          alt={student.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-slate-100 font-bold text-slate-400 text-lg">
                          {student.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </TableCell>
                  <TableCell className="py-4">
                    <Link
                      href={`/dashboard/student/${student.id}`}
                      className="font-bold text-slate-800 transition-colors hover:text-brand-yellow text-base"
                    >
                      {student.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-500 font-medium py-4">
                    {student.email}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm py-4">
                    {formatLastAccess(student)}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-50 px-4 py-1 text-amber-600 font-bold text-sm border border-amber-100">
                      <CalendarCheck className="h-4 w-4" />
                      {scheduledCountByStudent[student.id] ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Ações para ${student.name}`}
                          className="h-10 w-10 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 rounded-2xl border border-slate-100 bg-white shadow-lg p-2 gap-1 flex flex-col"
                      >
                        <DropdownMenuItem
                          onSelect={() => onAddCredits(student)}
                          className="cursor-pointer rounded-xl py-2.5 font-medium text-slate-700 focus:bg-slate-50 focus:text-slate-900"
                        >
                          <Wallet className="mr-2 h-4 w-4 text-emerald-500" />
                          Adicionar créditos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            router.push(
                              `/dashboard/chat?contactId=${student.id}`,
                            )
                          }
                          className="cursor-pointer rounded-xl py-2.5 font-medium text-slate-700 focus:bg-slate-50 focus:text-slate-900"
                        >
                          <MessageSquare className="mr-2 h-4 w-4 text-blue-500" />
                          Chat Privado
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-xl py-2.5 font-medium text-red-600 focus:bg-red-50 focus:text-red-700 mt-1 border-t border-slate-50"
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
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Users className="h-8 w-8 mb-2 opacity-50" />
                    <p className="font-medium">Nenhum aluno encontrado.</p>
                  </div>
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

  const [studentToDelete, setStudentToDelete] = useState<StudentRow | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [isAddCreditsOpen, setIsAddCreditsOpen] = useState(false);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [studentToCredit, setStudentToCredit] = useState<StudentRow | null>(
    null,
  );
  const [creditForm, setCreditForm] = useState({
    planName: "",
    amountPaid: "",
    paymentMethod: "PIX",
    credits: "1",
  });

  const { toast } = useToast();

  const fetchData = async (user: any) => {
    setIsLoading(true);
    const studentsPromise =
      user?.role === "teacher" ? getMyStudents(user.id) : getStudents();

    const [studentsResult, lessonsResult] = await Promise.all([
      studentsPromise,
      getLessons(),
    ]);

    if (studentsResult.success && studentsResult.data) {
      setAllStudents(studentsResult.data as StudentRow[]);
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: studentsResult.error,
      });
    }

    if (lessonsResult.success && lessonsResult.data) {
      setLessons(lessonsResult.data as LessonRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    const parsed = storedUser ? JSON.parse(storedUser) : null;
    if (parsed) setCurrentUser(parsed);
    fetchData(parsed);
  }, []);

  const activeStudents = useMemo(
    () =>
      allStudents.filter(
        (student) => (student.status ?? "active") === "active",
      ),
    [allStudents],
  );

  const inactiveStudents = useMemo(
    () => allStudents.filter((student) => student.status === "inactive"),
    [allStudents],
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
      toast({
        title: "Sucesso!",
        description: "Aluno cadastrado com sucesso.",
        className: "bg-emerald-600 text-white border-none",
      });
      setIsCreateOpen(false);
      setFormData({ name: "", email: "", password: "" });
      await fetchData(currentUser);
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error,
      });
    }

    setIsSubmitting(false);
  };

  const openAddCreditsModal = (student: StudentRow) => {
    setStudentToCredit(student);
    setCreditForm({
      planName: "Pacote 4 Aulas",
      amountPaid: "",
      paymentMethod: "PIX",
      credits: "4",
    });
    setIsAddCreditsOpen(true);
  };

  const handleAddCreditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToCredit || isAddingCredits) return;

    const planName = creditForm.planName.trim();
    const normalizedAmount = Number(creditForm.amountPaid.replace(",", "."));
    const normalizedCredits = Number.parseInt(creditForm.credits, 10);

    if (!planName) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Informe o nome do pacote/plano.",
      });
      return;
    }

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Informe um valor pago valido.",
      });
      return;
    }

    if (!Number.isInteger(normalizedCredits) || normalizedCredits <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Informe uma quantidade de créditos valida.",
      });
      return;
    }

    setIsAddingCredits(true);

    try {
      const result = await addTransactionAndCredits(
        studentToCredit.id,
        normalizedCredits,
        planName,
        normalizedAmount,
        creditForm.paymentMethod,
      );

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `Recibo gerado e ${normalizedCredits} aulas liberadas para ${studentToCredit.name}.`,
          className: "bg-emerald-600 text-white border-none",
        });
        setIsAddCreditsOpen(false);
        setStudentToCredit(null);
        await fetchData(currentUser);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Erro ao registrar transacao de credito:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha inesperada ao registrar transação.",
      });
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
        title: "Excluído!",
        description: `O perfil de ${studentToDelete.name} foi removido.`,
      });
      setStudentToDelete(null);
      await fetchData(currentUser);
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error,
      });
    }

    setIsDeleting(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400 font-medium animate-pulse">
        Carregando lista de alunos...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 md:gap-8">
      {/* HEADER LIMPO E MODERNO */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Gestão de Alunos
          </h1>
          <p className="mt-1 text-slate-500">
            Acompanhe matrículas, agendamentos e faturamento.
          </p>
        </div>

        {currentUser?.role === "admin" && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="w-full md:w-auto h-12 rounded-xl bg-brand-yellow px-6 text-base font-bold text-slate-900 shadow-sm transition-all hover:scale-105 hover:bg-brand-yellow/90"
          >
            <Plus className="mr-2 h-5 w-5" />
            Novo Aluno
          </Button>
        )}
      </div>

      {/* LISTAS */}
      <div className="grid gap-8">
        <StudentList
          title="Alunos Ativos"
          students={activeStudents}
          scheduledCountByStudent={scheduledCountByStudent}
          onAddCredits={openAddCreditsModal}
          onDeleteStudent={setStudentToDelete}
        />
        {inactiveStudents.length > 0 && (
          <StudentList
            title="Alunos Inativos"
            students={inactiveStudents}
            scheduledCountByStudent={scheduledCountByStudent}
            onAddCredits={openAddCreditsModal}
            onDeleteStudent={setStudentToDelete}
          />
        )}
      </div>

      {/* MODAL CADASTRAR ALUNO */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-slate-100 bg-white shadow-xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Novo Aluno
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Crie o acesso de um novo aluno manualmente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name" className="font-bold text-slate-700">
                Nome Completo
              </Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: João Silva"
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="create-email"
                className="font-bold text-slate-700"
              >
                E-mail de Acesso
              </Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="aluno@email.com"
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="create-password"
                className="font-bold text-slate-700"
              >
                Senha Temporária
              </Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="******"
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                required
              />
            </div>
            <DialogFooter className="mt-6 gap-3 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl font-bold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-brand-yellow px-8 font-bold text-slate-900 shadow-sm hover:bg-brand-yellow/90"
              >
                {isSubmitting ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL ADICIONAR CRÉDITOS (CHECKOUT) */}
      <Dialog
        open={isAddCreditsOpen}
        onOpenChange={(open) => {
          if (isAddingCredits) return;
          setIsAddCreditsOpen(open);
          if (!open) setStudentToCredit(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-3xl border border-slate-100 bg-white shadow-xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Registrar Venda
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Libere créditos para{" "}
              <span className="font-bold text-slate-700">
                {studentToCredit?.name}
              </span>{" "}
              e gere o recibo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCreditsSubmit} className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label
                htmlFor="credit-plan-name"
                className="font-bold text-slate-700"
              >
                Nome do Pacote/Plano
              </Label>
              <Input
                id="credit-plan-name"
                value={creditForm.planName}
                onChange={(e) =>
                  setCreditForm((prev) => ({
                    ...prev,
                    planName: e.target.value,
                  }))
                }
                placeholder="Ex: Pacote 4 Aulas"
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="credit-amount-paid"
                  className="font-bold text-slate-700"
                >
                  Valor Pago (R$)
                </Label>
                <Input
                  id="credit-amount-paid"
                  type="text"
                  inputMode="decimal"
                  value={creditForm.amountPaid}
                  onChange={(e) =>
                    setCreditForm((prev) => ({
                      ...prev,
                      amountPaid: e.target.value,
                    }))
                  }
                  placeholder="380,00"
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="credit-quantity"
                  className="font-bold text-slate-700"
                >
                  Qtd. de Aulas
                </Label>
                <Input
                  id="credit-quantity"
                  type="number"
                  min={1}
                  step={1}
                  value={creditForm.credits}
                  onChange={(e) =>
                    setCreditForm((prev) => ({
                      ...prev,
                      credits: e.target.value,
                    }))
                  }
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="credit-payment-method"
                className="font-bold text-slate-700"
              >
                Método de Pagamento
              </Label>
              <Select
                value={creditForm.paymentMethod}
                onValueChange={(value) =>
                  setCreditForm((prev) => ({ ...prev, paymentMethod: value }))
                }
              >
                <SelectTrigger
                  id="credit-payment-method"
                  className="h-12 rounded-xl border-slate-200 focus:ring-brand-yellow"
                >
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="PIX" className="cursor-pointer">
                    PIX
                  </SelectItem>
                  <SelectItem
                    value="Cartao de Credito"
                    className="cursor-pointer"
                  >
                    Cartão de Crédito
                  </SelectItem>
                  <SelectItem value="Transferencia" className="cursor-pointer">
                    Transferência
                  </SelectItem>
                  <SelectItem value="Dinheiro" className="cursor-pointer">
                    Dinheiro
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-6 gap-3 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddCreditsOpen(false)}
                disabled={isAddingCredits}
                className="rounded-xl font-bold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isAddingCredits}
                className="h-11 rounded-xl bg-brand-yellow px-6 font-bold text-slate-900 shadow-sm hover:bg-brand-yellow/90"
              >
                {isAddingCredits ? "Gerando..." : "Liberar e Gerar Recibo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL EXCLUIR ALUNO */}
      <AlertDialog
        open={!!studentToDelete}
        onOpenChange={(open) => !open && setStudentToDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl border-slate-100 p-8 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-slate-900">
              Excluir aluno?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-500 mt-2">
              Esta ação remove permanentemente o perfil de{" "}
              <span className="font-bold text-slate-900">
                {studentToDelete?.name}
              </span>
              . Todos os dados vinculados podem ser perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 h-11 px-6">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudent}
              className="rounded-xl bg-red-600 font-bold text-white hover:bg-red-700 h-11 px-8"
            >
              {isDeleting ? "Excluindo..." : "Sim, Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
