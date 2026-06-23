"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  ClipboardList,
  BookCopy,
  Clock,
  User,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  AlertCircle,
  X,
  ListPlus,
  BookOpen,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getStudents, getUserById, getMyStudents } from "@/app/actions/users";
import {
  deleteSimulado,
  listSimuladosForUser,
  upsertSimulado,
} from "@/app/actions/simulados";
import { cn } from "@/lib/utils";

// TIPAGENS
type QuestionOption = { id: string; text: string; isCorrect: boolean };
type Question = {
  id: string;
  title: string;
  type: "multiple-choice";
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

const SUBJECTS = [
  "Matemática",
  "Física",
  "Química",
  "Português",
  "Redação",
  "Biologia",
  "História",
  "Geografia",
  "Inglês",
];

export default function SimuladosPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentRole, setCurrentRole] = useState<
    "admin" | "teacher" | "student" | ""
  >("");
  const [simulados, setSimulados] = useState<SimuladoItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teacherSubject, setTeacherSubject] = useState<string | null>(null);

  const loadAll = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
      return;
    }

    const userResult = await getUserById(userId);
    if (!userResult.success || !userResult.data) {
      router.push("/login");
      return;
    }

    const dbUser = userResult.data as any;
    setCurrentUserId(dbUser.id);
    setCurrentRole(dbUser.role);
    setTeacherSubject(
      dbUser.role === "teacher" ? dbUser.subject || null : null,
    );

    const [simuladosResult, studentsResult] = await Promise.all([
      listSimuladosForUser(dbUser.id),
      dbUser.role === "teacher" ? getMyStudents(dbUser.id) : getStudents(),
    ]);

    if (simuladosResult.success && simuladosResult.data) {
      setSimulados(simuladosResult.data as SimuladoItem[]);
    }
    if (studentsResult.success && studentsResult.data) {
      setStudents(
        (studentsResult.data as any[]).map((s) => ({ id: s.id, name: s.name })),
      );
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const pendingSimulados = useMemo(
    () =>
      simulados.filter((simulado) =>
        simulado.status.toLowerCase().startsWith("pend"),
      ),
    [simulados],
  );

  const answeredSimulados = useMemo(
    () =>
      simulados.filter(
        (simulado) => !simulado.status.toLowerCase().startsWith("pend"),
      ),
    [simulados],
  );

  const availableSubjects = useMemo(() => {
    if (currentRole === "teacher" && teacherSubject) {
      return SUBJECTS.filter((s) => s === teacherSubject);
    }
    return SUBJECTS;
  }, [currentRole, teacherSubject]);

  const handleDelete = async (simuladoId: string) => {
    if (
      !confirm("Tem certeza que deseja excluir permanentemente este simulado?")
    )
      return;

    const result = await deleteSimulado(simuladoId);
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Falha ao excluir simulado.",
      });
      return;
    }
    toast({
      title: "Simulado Excluído",
      description: "O registro foi removido com sucesso.",
    });
    await loadAll();
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse font-medium">
        Carregando seus simulados...
      </div>
    );
  }

  // VISÃO DO ALUNO
  if (currentRole === "student") {
    return (
      <div className="flex flex-1 flex-col gap-6 max-w-6xl mx-auto w-full">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-headline text-3xl font-bold text-slate-900 flex items-center gap-3">
              <BookCopy className="h-8 w-8 text-brand-yellow" />
              Meus Simulados
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Teste seus conhecimentos e acompanhe sua evolução.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center px-6">
              <span className="block text-3xl font-black text-amber-700">
                {pendingSimulados.length}
              </span>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Pendentes
              </span>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center px-6">
              <span className="block text-3xl font-black text-green-700">
                {answeredSimulados.length}
              </span>
              <span className="text-xs font-bold text-green-800 uppercase tracking-wider">
                Concluídos
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* COLUNA: PENDENTES */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2 px-2">
              <AlertCircle className="h-5 w-5 text-brand-yellow" /> Aguardando
              Você
            </h2>
            {pendingSimulados.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-2 bg-slate-50 shadow-none text-center p-10 h-full flex flex-col items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">
                  Você não tem simulados pendentes.
                </p>
                <p className="text-sm text-slate-400 mt-1">Ótimo trabalho!</p>
              </Card>
            ) : (
              pendingSimulados.map((simulado) => (
                <Card
                  key={simulado.id}
                  className="rounded-3xl border-slate-200 shadow-sm hover:border-brand-yellow transition-all hover:shadow-md overflow-hidden group"
                >
                  <CardHeader className="bg-slate-50/50 border-b pb-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Badge
                          variant="secondary"
                          className="mb-2 bg-white border shadow-sm font-semibold"
                        >
                          {simulado.subject}
                        </Badge>
                        <CardTitle className="text-xl text-slate-800 leading-tight">
                          {simulado.title}
                        </CardTitle>
                      </div>
                      <Badge className="bg-brand-yellow text-slate-900 font-bold border-none shrink-0">
                        Pendente
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 pb-2">
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {simulado.description}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm font-medium text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />{" "}
                        {simulado.timeLimitMinutes || "Sem limite"} min
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="h-4 w-4" />{" "}
                        {simulado.questions.length} questões
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 pt-4">
                    <Button
                      className="w-full rounded-xl bg-slate-900 text-white hover:bg-brand-yellow hover:text-slate-900 font-bold text-base h-12 transition-colors"
                      onClick={() =>
                        router.push(
                          `/dashboard/simulados/start?id=${simulado.id}`,
                        )
                      }
                    >
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
              <BarChart3 className="h-5 w-5 text-green-500" /> Resultados
              Anteriores
            </h2>
            {answeredSimulados.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-2 bg-slate-50 shadow-none text-center p-10 h-full flex flex-col items-center justify-center">
                <p className="text-slate-500 font-medium">
                  Nenhum histórico disponível.
                </p>
              </Card>
            ) : (
              answeredSimulados.map((simulado) => {
                const lastAttempt =
                  simulado.attempts[simulado.attempts.length - 1];
                const isGoodScore = lastAttempt && lastAttempt.score >= 70;
                return (
                  <Card
                    key={simulado.id}
                    className="rounded-3xl border-slate-200 shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
                      <div
                        className={cn(
                          "flex-shrink-0 h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-black",
                          isGoodScore
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700",
                        )}
                      >
                        {lastAttempt
                          ? `${Math.round(lastAttempt.score)}%`
                          : "-"}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-bold text-slate-800 text-lg">
                          {simulado.title}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                          {simulado.subject} • {simulado.questions.length}{" "}
                          Questões
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-xl border-slate-300 font-bold w-full sm:w-auto hover:bg-slate-100"
                        onClick={() =>
                          router.push(
                            `/dashboard/simulados/start?id=${simulado.id}`,
                          )
                        }
                      >
                        Gabarito
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
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
            <BookCopy className="h-8 w-8 text-brand-yellow" /> Central de
            Simulados
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1 font-medium">
            Crie provas com múltiplas questões, envie aos alunos e acompanhe o
            desempenho.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            className="rounded-xl border-slate-300 font-bold h-12 px-6 hover:bg-slate-100 w-full sm:w-auto"
            onClick={() => router.push("/dashboard/simulados/banco-questoes")}
          >
            <BookOpen className="mr-2 h-5 w-5 text-brand-yellow" /> Banco de
            Questões
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-white pb-5">
          <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
            <ClipboardList className="h-6 w-6 text-slate-500" />
            Histórico de Simulados
          </CardTitle>
          <CardDescription className="text-base">
            Todas as provas criadas e seus status atuais.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 px-6">
                    Título
                  </TableHead>
                  <TableHead className="font-bold text-slate-700">
                    Aluno
                  </TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">
                    Questões
                  </TableHead>
                  <TableHead className="font-bold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">
                    Data
                  </TableHead>
                  <TableHead className="font-bold text-slate-700 text-right px-6">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <BookCopy className="h-10 w-10 mb-2 opacity-30" />
                        <p className="font-medium text-slate-600">
                          Nenhum simulado cadastrado.
                        </p>
                        <p className="text-sm mt-1">
                          Acesse o "Banco de Questões" para começar.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  simulados.map((simulado) => (
                    <TableRow
                      key={simulado.id}
                      className="hover:bg-slate-50/50"
                    >
                      <TableCell className="font-bold text-slate-800 px-6">
                        {simulado.title}
                        <p className="font-normal text-sm text-slate-500">
                          {simulado.subject}
                        </p>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-amber-100 text-xs text-amber-800 font-bold">
                              {simulado.student?.name?.charAt(0) || "-"}
                            </AvatarFallback>
                          </Avatar>
                          {simulado.student?.name || "Não atribuído"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-600">
                        {simulado.questions.length}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            simulado.status.toLowerCase().startsWith("pend")
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-none"
                              : "bg-green-100 text-green-800 hover:bg-green-200 border-none"
                          }
                        >
                          {simulado.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-500">
                        {format(new Date(simulado.createdAt), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="font-bold text-slate-600 hover:text-slate-900 border-slate-300"
                            onClick={() =>
                              router.push(
                                `/dashboard/simulados/start?id=${simulado.id}`,
                              )
                            }
                          >
                            Visualizar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(simulado.id)}
                          >
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

function Settings(props: any) {
  return <div {...props} />;
}
