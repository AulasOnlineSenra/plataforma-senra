"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck,
  CheckCircle2,
  Users,
  Briefcase,
  Coins,
  ArrowRight,
  XCircle,
  Star,
  Check,
  Video,
  Pencil,
  Wallet,
  Eye,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const subjectMap: Record<string, string> = {
  'default-subj-1': 'Matemática',
  'default-subj-2': 'Português',
  'default-subj-3': 'Física',
  'default-subj-4': 'Redação',
  'default-subj-5': 'História',
  'default-subj-6': 'Química',
  'default-subj-7': 'Espanhol',
  'default-subj-8': 'Filosofia',
  'default-subj-9': 'Geografia',
  'default-subj-10': 'Inglês',
  'default-subj-11': 'Sociologia',
  'default-subj-12': 'Biologia',
};
import { getUserById } from "@/app/actions/users";
import { getLessonsForUser, updateLesson, cancelLesson } from "@/app/actions/bookings";
import { getDashboardStats } from "@/app/actions/dashboard";
import { getUnratedPeopleForUser, submitRating, getUserAverageReceivedRating } from "@/app/actions/ratings";
import { approveTransaction, rejectTransaction, getStudentPendingTransactions, getAllPendingTransactions } from "@/app/actions/finance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type DashboardUser = {
  id: string;
  name: string;
  role: "admin" | "teacher" | "student";
  credits: number;
  avatarUrl?: string | null;
};

type UnratedPerson = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type PendingTransaction = {
  id: string;
  studentId: string;
  student?: {
    name: string;
    avatarUrl: string | null;
  };
  planName: string;
  creditsAdded: number;
  amountPaid: number;
  paymentMethod: string;
  status: string;
  proofUrl: string | null;
  bookings: string | null;
  createdAt: Date;
};

type StudentPendingTransaction = {
  id: string;
  studentId?: string;
  student?: {
    name: string;
    avatarUrl: string | null;
  };
  planName: string;
  creditsAdded: number;
  amountPaid: number;
  paymentMethod: string;
  status: string;
  proofUrl: string | null;
  bookings: string | null;
  createdAt: Date;
};

type LessonItem = {
  id: string;
  subject: string;
  status: string;
  date: string | Date;
  student?: { id: string; name: string } | null;
  teacher?: { id: string; name: string; videoUrl?: string | null } | null;
};

type AdminStats = {
  students: number;
  teachers: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  revenue: number;
  upcomingLessons: LessonItem[];
  pendingTransactions: PendingTransaction[];
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  href?: string;
}) {
  const body = (
    <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#f5b000] hover:ring-2 hover:ring-[#f5b000]/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-slate-600">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-[#FFC107]" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );

  if (!href) return body;
  return <Link href={href}>{body}</Link>;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [unratedPeople, setUnratedPeople] = useState<UnratedPerson[]>([]);
  const [userRating, setUserRating] = useState<{ average: number; count: number }>({ average: 5.0, count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [lessonToEdit, setLessonToEdit] = useState<any>(null);
  const [lessonToCancel, setLessonToCancel] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    subject: "",
    date: "",
    time: "",
    duration: "90",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [pendingTxToApprove, setPendingTxToApprove] = useState<PendingTransaction | null>(null);
  const [pendingTxToReject, setPendingTxToReject] = useState<PendingTransaction | null>(null);
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [viewProofDialog, setViewProofDialog] = useState<{ open: boolean; url: string | null }>({ open: false, url: null });
  const [studentPendingTransactions, setStudentPendingTransactions] = useState<StudentPendingTransaction[]>([]);
  const [viewBookingDetails, setViewBookingDetails] = useState<StudentPendingTransaction | null>(null);

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        window.location.href = "/login";
        return;
      }

      const [userResult] = await Promise.all([getUserById(userId)]);
      if (!userResult.success || !userResult.data) {
        window.location.href = "/login";
        return;
      }

      const dbUser = userResult.data as DashboardUser;
      setUser(dbUser);
      localStorage.setItem("currentUser", JSON.stringify(dbUser));
      localStorage.setItem("userRole", dbUser.role);

      const [lessonsResult, statsResult] = await Promise.all([
        getLessonsForUser(dbUser.id, dbUser.role),
        dbUser.role === "admin"
          ? getDashboardStats()
          : Promise.resolve({ success: true, data: null }),
      ]);

      if (lessonsResult.success && lessonsResult.data) {
        setLessons(lessonsResult.data as LessonItem[]);
      }

      if (dbUser.role === "admin" && statsResult.success && statsResult.data) {
        setAdminStats(statsResult.data as AdminStats);
      }

      if (dbUser.role === "student") {
        const pendingResult = await getStudentPendingTransactions(dbUser.id);
        if (pendingResult.success && pendingResult.data) {
          setStudentPendingTransactions(pendingResult.data as StudentPendingTransaction[]);
        }
      }

      if (dbUser.role === "admin") {
        const allPendingResult = await getAllPendingTransactions();
        if (allPendingResult.success && allPendingResult.data) {
          setStudentPendingTransactions(allPendingResult.data as StudentPendingTransaction[]);
        }
      }

      if (dbUser.role !== "admin") {
        const [unratedResult, ratingResult] = await Promise.all([
          getUnratedPeopleForUser(dbUser.id, dbUser.role),
          getUserAverageReceivedRating(dbUser.id, dbUser.role),
        ]);
        if (unratedResult.success && unratedResult.data) {
          setUnratedPeople(unratedResult.data as UnratedPerson[]);
        }
        if (ratingResult.success && ratingResult.data) {
          setUserRating(ratingResult.data);
        }
      }

      setIsLoading(false);
    };

    load();
  }, []);

  const now = new Date();

  const scheduled = useMemo(
    () =>
      lessons.filter(
        (l) =>
          ["PENDING", "CONFIRMED", "scheduled"].includes(l.status) &&
          new Date(l.date) >= now,
      ),
    [lessons],
  );

  const completed = useMemo(
    () => 
      lessons.filter(
        (l) => l.status === "COMPLETED"
      ),
    [lessons],
  );

  const cancelled = useMemo(
    () => lessons.filter((l) => l.status === "CANCELLED"),
    [lessons],
  );

  const completedThisMonth = useMemo(() => {
    return lessons.filter((l) => {
      const d = new Date(l.date);
      return (
        l.status === "COMPLETED" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
  }, [lessons]);

  const handleOpenEditDialog = (lesson: any) => {
    const lessonDate = new Date(lesson.date);
    setLessonToEdit(lesson);
    setEditFormData({
      subject: lesson.subject,
      date: format(lessonDate, "yyyy-MM-dd"),
      time: format(lessonDate, "HH:mm"),
      duration: "90",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenCancelDialog = (lesson: any) => {
    setLessonToCancel(lesson);
    setIsCancelDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!lessonToEdit) return;
    
    setIsSaving(true);
    
    const newDate = new Date(`${editFormData.date}T${editFormData.time}`);
    const durationMinutes = parseInt(editFormData.duration);
    const endDate = new Date(newDate.getTime() + durationMinutes * 60 * 1000);
    
    const result = await updateLesson(lessonToEdit.id, {
      subject: editFormData.subject,
      date: newDate,
      endDate: endDate,
    });

    setIsSaving(false);

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Aula atualizada com sucesso.",
      });
      setIsEditDialogOpen(false);
      setLessonToEdit(null);
      
      if (user?.id && user?.role) {
        const response = await getLessonsForUser(user.id, user.role);
        if (response.success && response.data) {
          setLessons(response.data as LessonItem[]);
        }
      }
      
      const statsResult = await getDashboardStats();
      if (statsResult.success && statsResult.data) {
        setAdminStats(statsResult.data as AdminStats);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Não foi possível atualizar a aula.",
      });
    }
  };

  const handleConfirmCancel = async () => {
    if (!lessonToCancel) return;

    const result = await cancelLesson(lessonToCancel.id);

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Aula cancelada com sucesso.",
      });
      setIsCancelDialogOpen(false);
      setLessonToCancel(null);
      
      if (user?.id && user?.role) {
        const response = await getLessonsForUser(user.id, user.role);
        if (response.success && response.data) {
          setLessons(response.data as LessonItem[]);
        }
      }
      
      const statsResult = await getDashboardStats();
      if (statsResult.success && statsResult.data) {
        setAdminStats(statsResult.data as AdminStats);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Não foi possível cancelar a aula.",
      });
    }
  };

  const handleApproveTransaction = async () => {
    if (!pendingTxToApprove) return;
    setIsProcessingTx(true);
    const result = await approveTransaction(pendingTxToApprove.id);
    setIsProcessingTx(false);
    if (result.success) {
      toast({
        title: "Pagamento Aprovado",
        description: `Créditos adicionados e ${result.data?.bookingsCreated ? 'agendamentos criados' : 'transação atualizada'} com sucesso.`,
      });
      setPendingTxToApprove(null);
      // Atualizar lista local - remover transação aprovada
      setStudentPendingTransactions(prev => prev.filter(tx => tx.id !== pendingTxToApprove.id));
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Não foi possível aprovar o pagamento.",
      });
    }
  };

  const handleRejectTransaction = async () => {
    if (!pendingTxToReject) return;
    setIsProcessingTx(true);
    const result = await rejectTransaction(pendingTxToReject.id);
    setIsProcessingTx(false);
    if (result.success) {
      toast({
        title: "Pagamento Rejeitado",
        description: "Transação rejeitada. O aluno será notificado.",
      });
      setPendingTxToReject(null);
      // Atualizar lista local - remover transação rejeitada
      setStudentPendingTransactions(prev => prev.filter(tx => tx.id !== pendingTxToReject.id));
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Não foi possível rejeitar o pagamento.",
      });
    }
  };

  const openProofDialog = (url: string | null) => {
    setViewProofDialog({ open: !!url, url });
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-[40vh] items-center justify-center text-slate-500">
        Carregando dashboard...
      </div>
    );
  }

  const handleRate = async (targetId: string, score: number) => {
    if (!user) return;
    const givenBy = user.role as "student" | "teacher";
    const studentId = user.role === "student" ? user.id : targetId;
    const teacherId = user.role === "teacher" ? user.id : targetId;
    
    const result = await submitRating(studentId, teacherId, score, givenBy);
    
    if (result.success) {
      toast({
        title: "Avaliação enviada",
        description: "Obrigado pelo seu feedback!",
        variant: "default",
      });
      setUnratedPeople((prev) => prev.filter((p) => p.id !== targetId));
    } else {
      toast({
        title: "Erro ao enviar avaliação",
        description: result.error || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 bg-slate-50">
      <div>
        <h1 className="font-headline text-3xl font-bold text-slate-900">
          Bem-vindo(a), {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-slate-600">
          Painel em tempo real conectado ao banco de dados.
        </p>
      </div>

      {user.role === "admin" ? (
        <>
          <div className="grid grid-cols-5 gap-2">
            <StatCard
              title="Alunos Ativos"
              value={adminStats?.students ?? 0}
              description="Contas de aluno ativas"
              icon={Users}
              href="/dashboard/students"
            />
            <StatCard
              title="Professores Ativos"
              value={adminStats?.teachers ?? 0}
              description="Equipe disponível"
              icon={Briefcase}
              href="/dashboard/teachers"
            />
            <StatCard
              title="Aulas Agendadas"
              value={adminStats?.scheduled ?? 0}
              description="Total no sistema"
              icon={CalendarCheck}
              href="/dashboard/minhas-aulas"
            />
            <StatCard
              title="Aulas Concluídas"
              value={adminStats?.completed ?? 0}
              description="Histórico finalizado"
              icon={CheckCircle2}
              href="/dashboard/minhas-aulas#completed-history"
            />
            <StatCard
              title="Aulas Canceladas"
              value={adminStats?.cancelled ?? 0}
              description="Aulas canceladas"
              icon={XCircle}
              href="/dashboard/minhas-aulas#cancelled-history"
            />
          </div>

          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-slate-900">
                Próximas Aulas da Plataforma
              </CardTitle>
              <CardDescription>
                Visão operacional para o time administrativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(adminStats?.upcomingLessons || []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-slate-500"
                        >
                          Nenhuma aula agendada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (adminStats?.upcomingLessons || []).map((lesson) => (
                        <TableRow key={lesson.id}>
                          <TableCell>{lesson.student?.name || "N/A"}</TableCell>
                          <TableCell>{lesson.teacher?.name || "N/A"}</TableCell>
                          <TableCell>
                            <Badge className="bg-[#FFC107] text-slate-900">
                              {subjectMap[lesson.subject] || lesson.subject}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {(() => {
                              const lessonDate = new Date(lesson.date);
                              const endDate = new Date(lessonDate.getTime() + 90 * 60 * 1000);
                              return format(lessonDate, "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) + ' - ' + format(endDate, "HH:mm");
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditDialog(lesson)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenCancelDialog(lesson)}
                                className="h-8 w-8 text-red-600 hover:text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4" />
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

          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Wallet className="h-5 w-5 text-amber-500" />
                Pagamentos Pendentes
                <Badge variant="outline" className="ml-2 border-amber-200 bg-amber-50 text-amber-700">
                  {studentPendingTransactions.length} aguardando
                </Badge>
              </CardTitle>
              <CardDescription>
                {user.role === "admin" ? "Valide ou rejeite os pagamentos pendentes de créditos." : "Aguardando aprovação do administrador."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {user.role === "admin" && <TableHead>Aluno</TableHead>}
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-center">Créditos</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                      {user.role === "admin" && <TableHead className="text-center">Comprovante</TableHead>}
                      {user.role === "admin" && <TableHead className="text-center">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentPendingTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={user.role === "admin" ? 7 : 4} className="h-24 text-center text-slate-500">
                          Nenhum pagamento pendente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentPendingTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          {user.role === "admin" && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  {tx.student?.avatarUrl && <AvatarImage src={tx.student.avatarUrl} />}
                                  <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                                    {tx.student?.name?.charAt(0) || 'A'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-slate-900">{tx.student?.name || 'Aluno'}</p>
                                  <p className="text-xs text-slate-500">ID: {(tx.studentId || tx.id)?.substring(0, 8)}...</p>
                                </div>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="font-medium text-slate-700">{tx.planName}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-amber-100 text-amber-700">+{tx.creditsAdded}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-700">
                            R$ {tx.amountPaid.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {tx.createdAt ? format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                          </TableCell>
                          {user.role === "admin" && (
                            <>
                              <TableCell className="text-center">
                                {tx.proofUrl ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => openProofDialog(tx.proofUrl)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => setPendingTxToApprove(tx)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setPendingTxToReject(tx)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {user.role === "student" ? (
              <>
                <Card className="rounded-3xl border-slate-200 bg-slate-900 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-200">
                      Créditos Disponíveis
                    </CardTitle>
                  </CardHeader>
<CardContent>
                    <p className="text-4xl font-extrabold text-[#FFC107]">
                      {Math.max(0, user.credits)}
                    </p>
                    <Button
                      asChild
                      className="mt-3 rounded-2xl bg-[#FFC107] font-bold text-slate-900 hover:bg-amber-300"
                    >
                      <Link href="/dashboard/packages">Comprar Créditos</Link>
                    </Button>
                  </CardContent>
                </Card>
                <StatCard
                  title="Aulas Agendadas"
                  value={scheduled.length}
                  description="Compromissos futuros"
                  icon={CalendarCheck}
                  href="/dashboard/minhas-aulas"
                />
                <StatCard
                  title="Aulas Concluídas"
                  value={completed.length}
                  description="Histórico total"
                  icon={CheckCircle2}
                  href="/dashboard/minhas-aulas#completed-history"
                />
                <StatCard
                  title="Concluídas no Mês"
                  value={completedThisMonth.length}
                  description={format(now, "MMMM 'de' yyyy", { locale: ptBR })}
                  icon={Coins}
                  href="/dashboard/minhas-aulas#completed-history"
                />
              </>
            ) : (
              <>
                <StatCard
                  title="Aulas Agendadas"
                  value={scheduled.length}
                  description="Compromissos futuros"
                  icon={CalendarCheck}
                  href="/dashboard/minhas-aulas"
                />
                <StatCard
                  title="Aulas Concluídas"
                  value={completed.length}
                  description="Histórico total"
                  icon={CheckCircle2}
                  href="/dashboard/minhas-aulas#completed-history"
                />
                <StatCard
                  title="Aulas Canceladas"
                  value={cancelled.length}
                  description="Total cancelado"
                  icon={XCircle}
                  href="/dashboard/minhas-aulas#cancelled-history"
                />
                <StatCard
                  title="Concluídas no Mês"
                  value={completedThisMonth.length}
                  description={format(now, "MMMM 'de' yyyy", { locale: ptBR })}
                  icon={Coins}
                  href="/dashboard/minhas-aulas#completed-history"
                />
              </>
            )}
          </div>

          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-slate-900">Próximas Aulas</CardTitle>
              <CardDescription>
                Agenda real sincronizada com o banco.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>
                        {user.role === "student" ? "Professor" : "Aluno"}
                      </TableHead>
                      <TableHead className="text-right">Data</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduled.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-24 text-center text-slate-500"
                        >
                          Nenhuma aula agendada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      scheduled.slice(0, 8).map((lesson) => (
                        <TableRow key={lesson.id}>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 text-slate-700"
                            >
                              {subjectMap[lesson.subject] || lesson.subject}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.role === "student"
                              ? lesson.teacher?.name
                              : lesson.student?.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {(() => {
                              const lessonDate = new Date(lesson.date);
                              const endDate = new Date(lessonDate.getTime() + 90 * 60 * 1000);
                              return format(lessonDate, "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) + ' - ' + format(endDate, "HH:mm");
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {lesson.teacher?.videoUrl && (
                                <Button asChild className="h-8 px-2 rounded-xl bg-slate-900 text-slate-50 hover:bg-slate-800">
                                  <a href={lesson.teacher?.videoUrl} target="_blank" rel="noreferrer">
                                    <Video className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              {((user.role === "admin") || 
                                (user.role === "teacher" && lesson.teacher?.id === user.id) || 
                                (user.role === "student" && lesson.student?.id === user.id)) && (
                                <>
                                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" onClick={() => {
                                    setLessonToEdit(lesson);
                                    setIsEditDialogOpen(true);
                                  }}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl text-red-600 hover:text-red-600 hover:bg-red-50" onClick={() => {
                                    setLessonToCancel(lesson);
                                    setIsCancelDialogOpen(true);
                                  }}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
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

          {user.role === "student" && studentPendingTransactions.length > 0 && (
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader className="border-b bg-amber-50">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Wallet className="h-5 w-5 text-amber-500" />
                  Meus Pagamentos Pendentes
                </CardTitle>
                <CardDescription>
                  Aguardando aprovação do administrador.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ScrollArea className="h-48">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plano</TableHead>
                        <TableHead className="text-center">Créditos</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Data</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentPendingTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-medium text-slate-700">{tx.planName}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-amber-100 text-amber-700">+{tx.creditsAdded}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-700">
                            R$ {tx.amountPaid.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="outline" 
                              className={
                                tx.status === 'PENDENTE' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                tx.status === 'COMPROVADO' ? 'border-green-200 bg-green-50 text-green-700' :
                                'border-red-200 bg-red-50 text-red-700'
                              }
                            >
                              {tx.status === 'PENDENTE' ? 'Aguardando' : tx.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Star className="h-5 w-5 text-[#FFC107]" />
                Feedback
              </CardTitle>
              <CardDescription>
                Avalie suas aulas e veja seu desempenho.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  {unratedPeople.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {unratedPeople.map((person) => (
                        <div
                          key={person.id}
                          className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm"
                        >
                          <Avatar className="h-20 w-20 border-2 border-brand-yellow shadow-md">
                            <AvatarImage src={person.avatarUrl || undefined} alt={person.name} />
                            <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-xl">
                              {person.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-base font-bold text-slate-800">{person.name}</p>
                          <p className="text-xs text-slate-500 mt-[-15px]">Como foi sua experiência com a aula?</p>
                          <div className="flex items-center gap-1">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleRate(person.id, i + 1)}
                                  className="transition-transform hover:scale-125 bg-transparent p-0"
                                >
                                  <Star className="h-7 w-7 text-[#FFC107] fill-none cursor-pointer" />
                                </button>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-7 w-7 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        Você não tem aulas para avaliar no momento.
                      </p>
                    </div>
                  )}
                </div>

                <div className="md:w-48 flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Seu feedback</p>
                  <Avatar className="h-16 w-16 border-2 border-brand-yellow shadow-md">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                    <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-xl">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-0.5">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5"
                          style={{
                            color: '#FFC107',
                            fill: i < Math.round(userRating.average) ? '#FFC107' : 'none',
                          }}
                        />
                      ))}
                    <span className="text-sm font-bold ml-1" style={{ color: '#FFC107' }}>
                      {userRating.average.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Aula</DialogTitle>
            <DialogDescription>
              Altere os dados da aula agendada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dashboard-subject">Matéria</Label>
              <Input
                id="dashboard-subject"
                value={editFormData.subject}
                onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                placeholder="Ex: Matemática"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dashboard-date">Data</Label>
              <Input
                id="dashboard-date"
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dashboard-time">Hora</Label>
              <Input
                id="dashboard-time"
                type="time"
                value={editFormData.time}
                onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dashboard-duration">Duração (minutos)</Label>
              <select
                id="dashboard-duration"
                value={editFormData.duration}
                onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
                <option value="90">90 minutos</option>
                <option value="120">120 minutos</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Aula</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a aula de {lessonToCancel?.subject} marcada para{" "}
              {lessonToCancel && format(new Date(lessonToCancel.date), "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-red-600 hover:bg-red-700">
              Sim, cancelar aula
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingTxToApprove} onOpenChange={(open) => !open && setPendingTxToApprove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja aprovar o pagamento de <strong>um aluno</strong>?
              <br /><br />
              Isso adicionará <strong>{pendingTxToApprove?.creditsAdded} créditos</strong> e criará os agendamentos automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveTransaction} disabled={isProcessingTx} className="bg-green-600 hover:bg-green-700">
              {isProcessingTx ? "Processando..." : "Sim, Aprovar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingTxToReject} onOpenChange={(open) => !open && setPendingTxToReject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja rejeitar o pagamento de <strong>um aluno</strong>?
              <br /><br />
              O aluno será notificado sobre a rejeição.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectTransaction} disabled={isProcessingTx} className="bg-red-600 hover:bg-red-700">
              {isProcessingTx ? "Processando..." : "Sim, Rejeitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewProofDialog.open} onOpenChange={(open) => setViewProofDialog({ open, url: viewProofDialog.url })}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
            <DialogDescription>
              Comprovante enviado pelo aluno.
            </DialogDescription>
          </DialogHeader>
          {viewProofDialog.url && (
            <div className="flex justify-center">
              <img
                src={viewProofDialog.url}
                alt="Comprovante"
                className="max-h-[400px] rounded-xl border border-slate-200 object-contain"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewProofDialog({ open: false, url: null })}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
