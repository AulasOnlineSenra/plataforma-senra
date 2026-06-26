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
  Settings as SettingsIcon,
  Sparkles,
  Send,
  Save,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getStudents, getUserById, getMyStudents } from "@/app/actions/users";
import {
  deleteSimulado,
  listSimuladosForUser,
  upsertSimulado,
} from "@/app/actions/simulados";
import { getEnemConfig, updateEnemConfig, listSimuladoTemplates } from "@/app/actions/enem";
import { ENEM_DIA1_MINUTES, ENEM_DIA2_MINUTES } from "@/lib/enem-utils";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const [activeTab, setActiveTab] = useState<"enem" | "disciplines">("enem");

  // Estados das Configurações do ENEM
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [enemEnabled, setEnemEnabled] = useState(false);
  const [enemDia1TemplateId, setEnemDia1TemplateId] = useState<string>("dynamic");
  const [enemDia2TemplateId, setEnemDia2TemplateId] = useState<string>("dynamic");
  const [enemReleaseHour, setEnemReleaseHour] = useState(13);
  const [enemReleaseMinute, setEnemReleaseMinute] = useState(0);
  const [enemOnlyTagged, setEnemOnlyTagged] = useState(true);
  const [enemTemplates, setEnemTemplates] = useState<any[]>([]);
  const [isSendingEnemManual, setIsSendingEnemManual] = useState<'DIA1' | 'DIA2' | null>(null);
  const [isSavingEnem, setIsSavingEnem] = useState(false);

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

    // Carregar configurações do ENEM se for admin ou professor
    if (dbUser.role === "admin" || dbUser.role === "teacher") {
      try {
        const [configRes, templatesRes] = await Promise.all([
          getEnemConfig(),
          listSimuladoTemplates()
        ]);

        if (configRes.success && configRes.data) {
          const c = configRes.data;
          setEnemEnabled(c.enemSimuladoEnabled);
          setEnemDia1TemplateId(c.enemDia1TemplateId || 'dynamic');
          setEnemDia2TemplateId(c.enemDia2TemplateId || 'dynamic');
          setEnemReleaseHour(c.enemReleaseHour);
          setEnemReleaseMinute(c.enemReleaseMinute);
          setEnemOnlyTagged(c.enemOnlyTaggedStudents);
        }
        if (templatesRes.success && templatesRes.data) {
          setEnemTemplates(templatesRes.data);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações do ENEM na página de simulados:", error);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const pendingEnemSimulados = useMemo(
    () =>
      simulados.filter(
        (s) =>
          s.status.toLowerCase().startsWith("pend") &&
          (s.subject.startsWith("ENEM_") || s.subject === "ENEM")
      ),
    [simulados],
  );

  const answeredEnemSimulados = useMemo(
    () =>
      simulados.filter(
        (s) =>
          !s.status.toLowerCase().startsWith("pend") &&
          (s.subject.startsWith("ENEM_") || s.subject === "ENEM")
      ),
    [simulados],
  );

  const pendingRegularSimulados = useMemo(
    () =>
      simulados.filter(
        (s) =>
          s.status.toLowerCase().startsWith("pend") &&
          !(s.subject.startsWith("ENEM_") || s.subject === "ENEM")
      ),
    [simulados],
  );

  const answeredRegularSimulados = useMemo(
    () =>
      simulados.filter(
        (s) =>
          !s.status.toLowerCase().startsWith("pend") &&
          !(s.subject.startsWith("ENEM_") || s.subject === "ENEM")
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

  const handleSaveEnem = async () => {
    setIsSavingEnem(true);
    const res = await updateEnemConfig({
      enemSimuladoEnabled: enemEnabled,
      enemDia1TemplateId: enemDia1TemplateId || 'dynamic',
      enemDia2TemplateId: enemDia2TemplateId || 'dynamic',
      enemReleaseHour: Number(enemReleaseHour),
      enemReleaseMinute: Number(enemReleaseMinute),
      enemOnlyTaggedStudents: enemOnlyTagged,
    });
    setIsSavingEnem(false);

    if (res.success) {
      toast({
        title: "Configurações Salvas",
        description: "As regras de agendamento do ENEM foram atualizadas com sucesso.",
        className: "border-none bg-green-600 text-white",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Houve um problema ao salvar as configurações.",
      });
    }
  };

  const handleManualSendEnem = async (dayType: 'DIA1' | 'DIA2') => {
    const adminId = localStorage.getItem('userId');
    if (!adminId) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para realizar esta ação.',
      });
      return;
    }

    setIsSendingEnemManual(dayType);

    try {
      const response = await fetch('/api/cron/enem-simulado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayType, adminId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: `Simulado ${dayType === 'DIA1' ? 'Dia 1' : 'Dia 2'} Enviado!`,
          description: `Enviado para ${data.dispatched} alunos de um total de ${data.total} elegíveis.`,
          className: 'border-none bg-green-600 text-white',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro no Envio',
          description: data.error || 'Não foi possível disparar o simulado.',
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro de Rede',
        description: 'Falha ao conectar ao servidor.',
      });
    } finally {
      setIsSendingEnemManual(null);
    }
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
    const currentPending = activeTab === "enem" ? pendingEnemSimulados : pendingRegularSimulados;
    const currentAnswered = activeTab === "enem" ? answeredEnemSimulados : answeredRegularSimulados;

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
                {currentPending.length}
              </span>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Pendentes
              </span>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center px-6">
              <span className="block text-3xl font-black text-green-700">
                {currentAnswered.length}
              </span>
              <span className="text-xs font-bold text-green-800 uppercase tracking-wider">
                Concluídos
              </span>
            </div>
          </div>
        </div>

        {/* SELETOR DE ABAS PREMIUM */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-md border border-slate-200 shadow-sm self-center md:self-start">
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-xl font-bold h-11 transition-all text-sm flex items-center justify-center gap-2",
              activeTab === "enem"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            )}
            onClick={() => setActiveTab("enem")}
          >
            🎯 Simulados ENEM
            {pendingEnemSimulados.length > 0 && (
              <span className="bg-brand-yellow text-slate-900 text-xs px-2 py-0.5 rounded-full font-black">
                {pendingEnemSimulados.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-xl font-bold h-11 transition-all text-sm flex items-center justify-center gap-2",
              activeTab === "disciplines"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            )}
            onClick={() => setActiveTab("disciplines")}
          >
            📚 Por Disciplinas
            {pendingRegularSimulados.length > 0 && (
              <span className="bg-slate-900 text-white text-xs px-2 py-0.5 rounded-full font-black">
                {pendingRegularSimulados.length}
              </span>
            )}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* COLUNA: PENDENTES */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2 px-2">
              <AlertCircle className="h-5 w-5 text-brand-yellow" /> Aguardando Você
            </h2>
            {currentPending.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-2 bg-slate-50 shadow-none text-center p-10 h-[250px] flex flex-col items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">
                  {activeTab === "enem" 
                    ? "Você não tem simulados ENEM pendentes."
                    : "Você não tem simulados pendentes por disciplina."}
                </p>
                <p className="text-sm text-slate-400 mt-1">Ótimo trabalho!</p>
              </Card>
            ) : (
              currentPending.map((simulado) => (
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
                          {simulado.subject.startsWith("ENEM_") ? "ENEM" : simulado.subject}
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
              <BarChart3 className="h-5 w-5 text-green-500" /> Resultados Anteriores
            </h2>
            {currentAnswered.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-2 bg-slate-50 shadow-none text-center p-10 h-[250px] flex flex-col items-center justify-center">
                <p className="text-slate-500 font-medium">
                  {activeTab === "enem" 
                    ? "Nenhum histórico do ENEM disponível."
                    : "Nenhum histórico por disciplina disponível."}
                </p>
              </Card>
            ) : (
              currentAnswered.map((simulado) => {
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
                          {simulado.subject.startsWith("ENEM_") ? "ENEM" : simulado.subject} • {simulado.questions.length}{" "}
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
          {(currentRole === "admin" || currentRole === "teacher") && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl border-slate-300 h-12 w-12 hover:bg-slate-100 flex items-center justify-center shrink-0"
              onClick={() => setIsSettingsOpen(true)}
            >
              <SettingsIcon className="h-5 w-5 text-slate-600" />
            </Button>
          )}
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

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl text-slate-900 font-black">
              <SettingsIcon className="h-7 w-7 text-indigo-600" />
              Configurações do ENEM
            </DialogTitle>
            <CardDescription className="text-sm">
              Gerencie as regras de agendamento automático e disparos manuais.
            </CardDescription>
          </DialogHeader>

          <div className="space-y-8 mt-4">
            {/* Simulado ENEM Automático */}
            <Card className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-5 bg-slate-50/50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
                      <BookCopy className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-bold">
                        Simulado ENEM Automático
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                          <Sparkles className="h-2.5 w-2.5 text-indigo-600" /> Recorrente
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs">Configure o disparo recorrente mensal do simulado para os alunos</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                    <Label htmlFor="enem-enabled-main" className="text-xs font-bold text-slate-700 cursor-pointer">Ativar Envio Automático</Label>
                    <Switch
                      id="enem-enabled-main"
                      checked={enemEnabled}
                      onCheckedChange={setEnemEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Quando ativado, o sistema envia automaticamente a primeira parte do simulado no <strong>último sábado de cada mês</strong> e a segunda parte no <strong>último domingo de cada mês</strong>.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="grid gap-1.5">
                    <Label className="font-bold text-xs text-slate-700">Template Dia 1 (Sábado - 5h30)</Label>
                    <Select value={enemDia1TemplateId || 'dynamic'} onValueChange={setEnemDia1TemplateId}>
                      <SelectTrigger className="h-11 bg-white rounded-lg border-slate-200">
                        <SelectValue placeholder="Selecione o simulado do Dia 1" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dynamic">🎯 Gerador Inteligente (Individualizado por Aluno)</SelectItem>
                        {enemTemplates.filter(t => t.dayType === 'DIA1' || t.dayType === 'CUSTOM').map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-400">Tempo limite recomendado: {ENEM_DIA1_MINUTES} minutos (5h30min)</p>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="font-bold text-xs text-slate-700">Template Dia 2 (Domingo - 5h)</Label>
                    <Select value={enemDia2TemplateId || 'dynamic'} onValueChange={setEnemDia2TemplateId}>
                      <SelectTrigger className="h-11 bg-white rounded-lg border-slate-200">
                        <SelectValue placeholder="Selecione o simulado do Dia 2" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dynamic">🎯 Gerador Inteligente (Individualizado por Aluno)</SelectItem>
                        {enemTemplates.filter(t => t.dayType === 'DIA2' || t.dayType === 'CUSTOM').map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-400">Tempo limite recomendado: {ENEM_DIA2_MINUTES} minutos (5h00min)</p>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="font-bold text-xs text-slate-700">Horário de Liberação</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        className="h-11 text-center font-bold text-sm w-16 rounded-lg border-slate-200"
                        value={enemReleaseHour}
                        onChange={(e) => setEnemReleaseHour(Number(e.target.value))}
                      />
                      <span className="font-bold text-slate-400">:</span>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        className="h-11 text-center font-bold text-sm w-16 rounded-lg border-slate-200"
                        value={enemReleaseMinute}
                        onChange={(e) => setEnemReleaseMinute(Number(e.target.value))}
                      />
                      <span className="text-xs text-slate-500 ml-1">horas</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 self-end h-11">
                    <Label htmlFor="enem-only-tagged" className="font-bold text-xs text-slate-700 cursor-pointer">Apenas com Tag "Foco ENEM"</Label>
                    <Switch
                      id="enem-only-tagged"
                      checked={enemOnlyTagged}
                      onCheckedChange={setEnemOnlyTagged}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t py-3 flex justify-end">
                <Button
                  className="rounded-full bg-brand-yellow hover:bg-amber-400 text-slate-900 font-bold h-10 px-5 text-sm transition-all"
                  onClick={handleSaveEnem}
                  disabled={isSavingEnem}
                >
                  {isSavingEnem ? 'Salvando...' : <><Save className="mr-2 h-4 w-4" /> Salvar Regras do ENEM</>}
                </Button>
              </CardFooter>
            </Card>

            {/* Disparo Manual de Teste */}
            <Card className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-100 p-2 text-amber-600">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-900 font-bold">Disparo Manual de Teste (ENEM)</CardTitle>
                    <CardDescription className="text-xs">
                      Envie imediatamente os simulados selecionados acima para fins de homologação.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-xl flex flex-col justify-between h-36 bg-white hover:border-slate-300 transition-all">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Enviar Dia 1 Agora</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Cria o simulado do Dia 1 na conta de todos os alunos elegíveis imediatamente.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-lg text-xs font-bold border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all mt-3"
                    onClick={() => handleManualSendEnem('DIA1')}
                    disabled={!!isSendingEnemManual}
                  >
                    {isSendingEnemManual === 'DIA1' ? 'Enviando...' : 'Disparar Dia 1'}
                  </Button>
                </div>

                <div className="p-4 border rounded-xl flex flex-col justify-between h-36 bg-white hover:border-slate-300 transition-all">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Enviar Dia 2 Agora</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Cria o simulado do Dia 2 na conta de todos os alunos elegíveis imediatamente.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-lg text-xs font-bold border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all mt-3"
                    onClick={() => handleManualSendEnem('DIA2')}
                    disabled={!!isSendingEnemManual}
                  >
                    {isSendingEnemManual === 'DIA2' ? 'Enviando...' : 'Disparar Dia 2'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="mt-6 border-t pt-4">
            <Button
              className="rounded-xl border-slate-300 hover:bg-slate-100 font-bold"
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Settings(props: any) {
  return <div {...props} />;
}
