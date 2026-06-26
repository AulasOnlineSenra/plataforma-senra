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
  ChevronDown,
  ChevronUp,
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
  const [expandedSimulados, setExpandedSimulados] = useState<Record<number, boolean>>({});
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>("all");
  const [expandedAdminSimulados, setExpandedAdminSimulados] = useState<Record<string, boolean>>({});

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

  const pendingRegularSimulados = useMemo(() => {
    return simulados.filter((s) => {
      const isEnem = s.subject.startsWith("ENEM_") || s.subject === "ENEM";
      if (isEnem) return false;
      
      const attempts = s.attempts || [];
      const activeAttempt = attempts.find((a) => !a.completedAt);
      let isRetamable = false;
      if (activeAttempt) {
        if (!s.timeLimitMinutes) {
          isRetamable = true;
        } else {
          const startedTime = new Date(activeAttempt.startedAt).getTime();
          const elapsed = Math.floor((new Date().getTime() - startedTime) / 1000);
          isRetamable = (s.timeLimitMinutes * 60) - elapsed > 0;
        }
      }
      
      const isPending = s.status.toLowerCase().startsWith("pend");
      return isPending || isRetamable;
    });
  }, [simulados]);

  const answeredRegularSimulados = useMemo(() => {
    return simulados.filter((s) => {
      const isEnem = s.subject.startsWith("ENEM_") || s.subject === "ENEM";
      if (isEnem) return false;
      
      const attempts = s.attempts || [];
      const activeAttempt = attempts.find((a) => !a.completedAt);
      let isRetamable = false;
      if (activeAttempt) {
        if (!s.timeLimitMinutes) {
          isRetamable = true;
        } else {
          const startedTime = new Date(activeAttempt.startedAt).getTime();
          const elapsed = Math.floor((new Date().getTime() - startedTime) / 1000);
          isRetamable = (s.timeLimitMinutes * 60) - elapsed > 0;
        }
      }
      
      return !s.status.toLowerCase().startsWith("pend") && !isRetamable;
    });
  }, [simulados]);

  const enemGroups = useMemo(() => {
    const allEnem = [...pendingEnemSimulados, ...answeredEnemSimulados];

    const dia1List = allEnem
      .filter((sim) => {
        const title = (sim.title || "").toLowerCase();
        const subject = (sim.subject || "").toUpperCase();
        return (
          subject === "ENEM_DIA1" ||
          title.includes("dia 1") ||
          title.includes("sábado") ||
          title.includes("sabado")
        );
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const dia2List = allEnem
      .filter((sim) => {
        const title = (sim.title || "").toLowerCase();
        const subject = (sim.subject || "").toUpperCase();
        return (
          subject === "ENEM_DIA2" ||
          title.includes("dia 2") ||
          title.includes("domingo")
        );
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const maxLen = Math.max(dia1List.length, dia2List.length);
    const groups: {
      number: number;
      dia1?: SimuladoItem;
      dia2?: SimuladoItem;
      createdAt: Date;
    }[] = [];

    for (let i = 0; i < maxLen; i++) {
      const d1 = dia1List[i];
      const d2 = dia2List[i];
      
      const createdAt = d1 
        ? new Date(d1.createdAt) 
        : d2 
          ? new Date(d2.createdAt) 
          : new Date();

      groups.push({
        number: i + 1,
        dia1: d1,
        dia2: d2,
        createdAt,
      });
    }

    return groups.sort((a, b) => b.number - a.number);
  }, [pendingEnemSimulados, answeredEnemSimulados]);

  const availableSubjects = useMemo(() => {
    if (currentRole === "teacher" && teacherSubject) {
      return SUBJECTS.filter((s) => s === teacherSubject);
    }
    return SUBJECTS;
  }, [currentRole, teacherSubject]);

  const displayItems = useMemo(() => {
    // 1. Filtrar pelo aluno selecionado
    let filtered = simulados;
    if (selectedStudentFilter !== "all") {
      filtered = simulados.filter((s) => s.studentId === selectedStudentFilter);
    }

    // 2. Separar ENEM e Regulares
    const enemSims = filtered.filter(
      (s) => s.subject.startsWith("ENEM_") || s.subject === "ENEM"
    );
    const regularSims = filtered.filter(
      (s) => !(s.subject.startsWith("ENEM_") || s.subject === "ENEM")
    );

    // 3. Agrupar ENEM por aluno
    const enemGroupsByStudent: Record<string, SimuladoItem[]> = {};
    enemSims.forEach((sim) => {
      const sId = sim.studentId;
      if (!enemGroupsByStudent[sId]) {
        enemGroupsByStudent[sId] = [];
      }
      enemGroupsByStudent[sId].push(sim);
    });

    const enemGroupsList: any[] = [];
    Object.entries(enemGroupsByStudent).forEach(([studentId, studentSims]) => {
      // Ordena e pareia
      const dia1List = studentSims
        .filter((sim) => {
          const title = (sim.title || "").toLowerCase();
          const subject = (sim.subject || "").toUpperCase();
          return (
            subject === "ENEM_DIA1" ||
            title.includes("dia 1") ||
            title.includes("sábado") ||
            title.includes("sabado")
          );
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const dia2List = studentSims
        .filter((sim) => {
          const title = (sim.title || "").toLowerCase();
          const subject = (sim.subject || "").toUpperCase();
          return (
            subject === "ENEM_DIA2" ||
            title.includes("dia 2") ||
            title.includes("domingo")
          );
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const maxLen = Math.max(dia1List.length, dia2List.length);
      for (let i = 0; i < maxLen; i++) {
        const d1 = dia1List[i];
        const d2 = dia2List[i];
        const studentInfo = d1?.student || d2?.student || null;

        const createdAt = d1 
          ? new Date(d1.createdAt) 
          : d2 
            ? new Date(d2.createdAt) 
            : new Date();

        enemGroupsList.push({
          id: `enem-group-${studentId}-${i + 1}`,
          number: i + 1,
          student: studentInfo,
          dia1: d1,
          dia2: d2,
          createdAt,
          isEnemGroup: true,
        });
      }
    });

    // 4. Mapear os simulados regulares para termos uma estrutura comum
    const mappedRegulars = regularSims.map((sim) => ({
      id: sim.id,
      title: sim.title,
      subject: sim.subject,
      student: sim.student,
      questionsCount: sim.questions.length,
      status: sim.status,
      createdAt: new Date(sim.createdAt),
      rawSimulado: sim,
      isEnemGroup: false,
    }));

    // 5. Unificar e ordenar por data de criação decrescente
    const combined = [
      ...enemGroupsList,
      ...mappedRegulars,
    ];

    return combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [simulados, selectedStudentFilter]);

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
    // Calcula pendentes e concluídos considerando a aba ativa e agrupamento do ENEM
    const enemPendingCount = enemGroups.filter(
      (g) =>
        (g.dia1 && g.dia1.status.toLowerCase().startsWith("pend")) ||
        (g.dia2 && g.dia2.status.toLowerCase().startsWith("pend"))
    ).length;

    const enemCompletedCount = enemGroups.filter(
      (g) =>
        (!g.dia1 || !g.dia1.status.toLowerCase().startsWith("pend")) &&
        (!g.dia2 || !g.dia2.status.toLowerCase().startsWith("pend"))
    ).length;

    const pendingCountToShow = activeTab === "enem" 
      ? enemPendingCount
      : pendingRegularSimulados.length;

    const completedCountToShow = activeTab === "enem"
      ? enemCompletedCount
      : answeredRegularSimulados.length;

    return (
      <div className="flex flex-1 flex-col gap-6 max-w-4xl mx-auto w-full">
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
                {pendingCountToShow}
              </span>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Pendentes
              </span>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center px-6">
              <span className="block text-3xl font-black text-green-700">
                {completedCountToShow}
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
            {enemPendingCount > 0 && (
              <span className="bg-brand-yellow text-slate-900 text-xs px-2 py-0.5 rounded-full font-black">
                {enemPendingCount}
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

        {activeTab === "enem" ? (
          /* ABA ENEM: VISUALIZAÇÃO EM LISTA SANFONA (ACCORDION) */
          <div className="flex flex-col gap-4 w-full">
            {enemGroups.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-2 bg-slate-50 shadow-none text-center p-10 h-[250px] flex flex-col items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Você não tem simulados ENEM disponíveis.</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {enemGroups.map((group, index) => {
                  const isExpanded = expandedSimulados[group.number] ?? (index === 0);
                  
                  // Verifica quantos dias estão pendentes
                  const dia1Pending = group.dia1 ? group.dia1.status.toLowerCase().startsWith("pend") : false;
                  const dia2Pending = group.dia2 ? group.dia2.status.toLowerCase().startsWith("pend") : false;
                  
                  const hasPending = dia1Pending || dia2Pending;
                  const totalDays = (group.dia1 ? 1 : 0) + (group.dia2 ? 1 : 0);
                  const completedDays = (group.dia1 && !dia1Pending ? 1 : 0) + (group.dia2 && !dia2Pending ? 1 : 0);

                  // Calcula o resultado/score do simulado
                  const getSimuladoScore = () => {
                    const scores: number[] = [];
                    if (group.dia1) {
                      const isPending = group.dia1.status.toLowerCase().startsWith("pend");
                      const lastAttempt = group.dia1.attempts?.[group.dia1.attempts.length - 1];
                      if (!isPending && lastAttempt) {
                        scores.push(lastAttempt.score);
                      }
                    }
                    if (group.dia2) {
                      const isPending = group.dia2.status.toLowerCase().startsWith("pend");
                      const lastAttempt = group.dia2.attempts?.[group.dia2.attempts.length - 1];
                      if (!isPending && lastAttempt) {
                        scores.push(lastAttempt.score);
                      }
                    }
                    if (scores.length === 0) return null;
                    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
                    return `${Math.round(average)}%`;
                  };

                  const simuladoScore = getSimuladoScore();

                  const toggleExpand = () => {
                    setExpandedSimulados((prev) => ({
                      ...prev,
                      [group.number]: !isExpanded,
                    }));
                  };

                  const cleanTitle = (t: string) => {
                    return t.replace(/nº\s*\d+\s*[-—–]\s*/i, "")
                            .replace(/nº\s*\d+\s*/i, "")
                            .trim();
                  };

                  return (
                    <div
                      key={group.number}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200"
                    >
                      {/* Cabeçalho do Accordion */}
                      <button
                        onClick={toggleExpand}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900">
                              {group.number === 999 ? "Simulado ENEM Especial" : `Simulado ${group.number}`}
                            </h3>
                            <p className="text-xs text-slate-400 font-bold mt-0.5">
                              Liberação: {format(new Date(group.createdAt), "dd/MM/yyyy")}
                            </p>
                          </div>
                        </div>

                        {/* Coluna de Resultado */}
                        <div className="hidden sm:flex flex-col items-start min-w-[120px]">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Resultado
                          </span>
                          <span className="text-sm font-extrabold text-slate-700 mt-0.5">
                            {simuladoScore || "Aguardando"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge
                            className={cn(
                              "font-bold text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border-none",
                              hasPending
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                            )}
                          >
                            {hasPending 
                              ? `${completedDays}/${totalDays} Concluído` 
                              : "Concluído"
                            }
                          </Badge>
                          
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Conteúdo do Accordion com animação suave de expansão */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/30 p-6 space-y-4">
                          {/* Bloco do Dia 1 */}
                          {group.dia1 && (() => {
                            const attempts = group.dia1.attempts || [];
                            const activeAttempt = attempts.find((a) => !a.completedAt);
                            let isRetamable = false;
                            if (activeAttempt) {
                              if (!group.dia1.timeLimitMinutes) {
                                isRetamable = true;
                              } else {
                                const startedTime = new Date(activeAttempt.startedAt).getTime();
                                const elapsed = Math.floor((new Date().getTime() - startedTime) / 1000);
                                isRetamable = (group.dia1.timeLimitMinutes * 60) - elapsed > 0;
                              }
                            }
                            
                            const isPending = group.dia1.status.toLowerCase().startsWith("pend");
                            const lastAttempt = group.dia1.attempts?.[group.dia1.attempts.length - 1];

                            return (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-xs">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-800 text-sm">
                                      {cleanTitle(group.dia1.title)}
                                    </h4>
                                    <Badge className={cn(
                                      "font-bold text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 border-none",
                                      isRetamable
                                        ? "bg-amber-100 text-amber-800"
                                        : isPending 
                                          ? "bg-slate-100 text-slate-700" 
                                          : "bg-green-100 text-green-800"
                                    )}>
                                      {isRetamable ? "Em Andamento" : isPending ? "Pendente" : `${Math.round(lastAttempt?.score || 0)}%`}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-slate-400 font-medium mt-1">
                                    {group.dia1.questions.length} questões • {group.dia1.timeLimitMinutes || 330} min
                                  </p>
                                </div>
                                
                                <Button
                                  className={cn(
                                    "rounded-[10px] font-bold text-xs px-5 h-9 transition-colors w-full sm:w-auto shrink-0",
                                    isRetamable
                                      ? "bg-amber-500 text-slate-950 hover:bg-amber-600 border border-amber-600"
                                      : isPending 
                                        ? "bg-slate-900 text-white hover:bg-brand-yellow hover:text-slate-900" 
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                                  )}
                                  onClick={() => router.push(`/dashboard/simulados/start?id=${group.dia1!.id}`)}
                                >
                                  {isRetamable ? "Retomar Dia 1" : isPending ? "Iniciar Dia 1" : "Visualizar Gabarito"}
                                </Button>
                              </div>
                            );
                          })()}

                          {/* Bloco do Dia 2 */}
                          {group.dia2 && (() => {
                            const attempts = group.dia2.attempts || [];
                            const activeAttempt = attempts.find((a) => !a.completedAt);
                            let isRetamable = false;
                            if (activeAttempt) {
                              if (!group.dia2.timeLimitMinutes) {
                                isRetamable = true;
                              } else {
                                const startedTime = new Date(activeAttempt.startedAt).getTime();
                                const elapsed = Math.floor((new Date().getTime() - startedTime) / 1000);
                                isRetamable = (group.dia2.timeLimitMinutes * 60) - elapsed > 0;
                              }
                            }
                            
                            const isPending = group.dia2.status.toLowerCase().startsWith("pend");
                            const lastAttempt = group.dia2.attempts?.[group.dia2.attempts.length - 1];

                            return (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-xs">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-800 text-sm">
                                      {cleanTitle(group.dia2.title)}
                                    </h4>
                                    <Badge className={cn(
                                      "font-bold text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 border-none",
                                      isRetamable
                                        ? "bg-amber-100 text-amber-800"
                                        : isPending 
                                          ? "bg-slate-100 text-slate-700" 
                                          : "bg-green-100 text-green-800"
                                    )}>
                                      {isRetamable ? "Em Andamento" : isPending ? "Pendente" : `${Math.round(lastAttempt?.score || 0)}%`}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-slate-400 font-medium mt-1">
                                    {group.dia2.questions.length} questões • {group.dia2.timeLimitMinutes || 300} min
                                  </p>
                                </div>
                                
                                <Button
                                  className={cn(
                                    "rounded-[10px] font-bold text-xs px-5 h-9 transition-colors w-full sm:w-auto shrink-0",
                                    isRetamable
                                      ? "bg-amber-500 text-slate-950 hover:bg-amber-600 border border-amber-600"
                                      : isPending 
                                        ? "bg-slate-900 text-white hover:bg-brand-yellow hover:text-slate-900" 
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                                  )}
                                  onClick={() => router.push(`/dashboard/simulados/start?id=${group.dia2!.id}`)}
                                >
                                  {isRetamable ? "Retomar Dia 2" : isPending ? "Iniciar Dia 2" : "Visualizar Gabarito"}
                                </Button>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ABA DISCIPLINAS: VISUALIZAÇÃO PADRÃO DE DUAS COLUNAS */
          <div className="grid gap-6 md:grid-cols-2">
            {/* COLUNA: PENDENTES */}
            <div className="flex flex-col gap-4">
              <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2 px-2">
                <AlertCircle className="h-5 w-5 text-brand-yellow" /> Aguardando Você
              </h2>
              {pendingRegularSimulados.length === 0 ? (
                <Card className="rounded-3xl border-dashed border-2 bg-slate-50 shadow-none text-center p-10 h-[250px] flex flex-col items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">Você não tem simulados pendentes por disciplina.</p>
                  <p className="text-sm text-slate-400 mt-1">Ótimo trabalho!</p>
                </Card>
              ) : (
                pendingRegularSimulados.map((simulado) => {
                  const attempts = simulado.attempts || [];
                  const activeAttempt = attempts.find((a) => !a.completedAt);
                  let isRetamable = false;
                  if (activeAttempt) {
                    if (!simulado.timeLimitMinutes) {
                      isRetamable = true;
                    } else {
                      const startedTime = new Date(activeAttempt.startedAt).getTime();
                      const elapsed = Math.floor((new Date().getTime() - startedTime) / 1000);
                      isRetamable = (simulado.timeLimitMinutes * 60) - elapsed > 0;
                    }
                  }

                  return (
                    <Card
                      key={simulado.id}
                      className="rounded-3xl border-slate-200 shadow-sm hover:border-brand-yellow transition-all hover:shadow-md overflow-hidden group"
                    >
                      <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <Badge variant="secondary" className="mb-2 bg-white border shadow-sm font-semibold">
                              {simulado.subject}
                            </Badge>
                            <CardTitle className="text-xl text-slate-800 leading-tight">
                              {simulado.title}
                            </CardTitle>
                          </div>
                          <Badge className={cn(
                            "font-bold border-none shrink-0",
                            isRetamable 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-brand-yellow text-slate-900"
                          )}>
                            {isRetamable ? "Em Andamento" : "Pendente"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 pb-2">
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {simulado.description}
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-sm font-medium text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" /> {simulado.timeLimitMinutes || "Sem limite"} min
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ClipboardList className="h-4 w-4" /> {simulado.questions.length} questões
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50 pt-4">
                        <Button
                          className={cn(
                            "w-full rounded-xl font-bold text-base h-12 transition-colors",
                            isRetamable
                              ? "bg-amber-500 text-slate-950 hover:bg-amber-600"
                              : "bg-slate-900 text-white hover:bg-brand-yellow hover:text-slate-900"
                          )}
                          onClick={() => router.push(`/dashboard/simulados/start?id=${simulado.id}`)}
                        >
                          {isRetamable ? "Retomar Simulado" : "Iniciar Simulado"} <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>

            {/* COLUNA: CONCLUÍDOS */}
            <div className="flex flex-col gap-4">
              <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2 px-2">
                <BarChart3 className="h-5 w-5 text-green-500" /> Resultados Anteriores
              </h2>
              {answeredRegularSimulados.length === 0 ? (
                <Card className="rounded-3xl border-dashed border-2 bg-slate-50 shadow-none text-center p-10 h-[250px] flex flex-col items-center justify-center">
                  <p className="text-slate-500 font-medium">Nenhum histórico por disciplina disponível.</p>
                </Card>
              ) : (
                answeredRegularSimulados.map((simulado) => {
                  const lastAttempt = simulado.attempts[simulado.attempts.length - 1];
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
                            isGoodScore ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}
                        >
                          {lastAttempt ? `${Math.round(lastAttempt.score)}%` : "-"}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="font-bold text-slate-800 text-lg">
                            {simulado.title}
                          </h3>
                          <p className="text-sm text-slate-500 font-medium">
                            {simulado.subject} • {simulado.questions.length} Questões
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="rounded-xl border-slate-300 font-bold w-full sm:w-auto hover:bg-slate-100"
                          onClick={() => router.push(`/dashboard/simulados/start?id=${simulado.id}`)}
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
        )}
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
        <CardHeader className="border-b bg-white pb-5 flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
              <ClipboardList className="h-6 w-6 text-slate-500" />
              Histórico de Simulados
            </CardTitle>
            <CardDescription className="text-base">
              Todas as provas criadas e seus status atuais.
            </CardDescription>
          </div>
          <div className="w-64">
            <Select value={selectedStudentFilter} onValueChange={setSelectedStudentFilter}>
              <SelectTrigger className="h-10 bg-white rounded-lg border-slate-200">
                <SelectValue placeholder="Filtrar por Aluno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👥 Todos os Alunos</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="p-6 space-y-4">
              {displayItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-400 py-16">
                  <BookCopy className="h-10 w-10 mb-2 opacity-30" />
                  <p className="font-medium text-slate-600">
                    Nenhum simulado cadastrado.
                  </p>
                  <p className="text-sm mt-1">
                    Acesse o "Banco de Questões" para começar.
                  </p>
                </div>
              ) : (
                displayItems.map((item) => {
                  if (item.isEnemGroup) {
                    const isExpanded = expandedAdminSimulados[item.id] ?? false;
                    const dia1Pending = item.dia1 ? item.dia1.status.toLowerCase().startsWith("pend") : false;
                    const dia2Pending = item.dia2 ? item.dia2.status.toLowerCase().startsWith("pend") : false;
                    const hasPending = dia1Pending || dia2Pending;
                    const totalDays = (item.dia1 ? 1 : 0) + (item.dia2 ? 1 : 0);
                    const completedDays = (item.dia1 && !dia1Pending ? 1 : 0) + (item.dia2 && !dia2Pending ? 1 : 0);

                    const toggleExpand = () => {
                      setExpandedAdminSimulados((prev) => ({
                        ...prev,
                        [item.id]: !isExpanded,
                      }));
                    };

                    const cleanTitle = (t: string) => {
                      return t.replace(/nº\s*\d+\s*[-—–]\s*/i, "")
                              .replace(/nº\s*\d+\s*/i, "")
                              .trim();
                    };

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200"
                      >
                        {/* Cabeçalho do Accordion */}
                        <div
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-left flex-wrap md:flex-nowrap gap-4 cursor-pointer"
                          onClick={toggleExpand}
                        >
                          <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-slate-900">
                                Simulado {item.number} (ENEM)
                              </h3>
                              <p className="text-xs text-slate-400 font-bold mt-0.5">
                                Liberação: {format(new Date(item.createdAt), "dd/MM/yyyy")}
                              </p>
                            </div>
                          </div>

                          {/* Coluna do Aluno */}
                          <div className="flex items-center gap-2 min-w-[180px]">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-amber-100 text-xs text-amber-800 font-bold">
                                {item.student?.name?.charAt(0) || "-"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold text-slate-700">
                              {item.student?.name || "Não atribuído"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 ml-auto md:ml-0">
                            <Badge
                              className={cn(
                                "font-bold text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border-none",
                                hasPending
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                              )}
                            >
                              {hasPending 
                                ? `${completedDays}/${totalDays} Concluído` 
                                : "Concluído"
                              }
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Conteúdo do Accordion */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/30 p-6 space-y-3">
                            {item.dia1 && (
                              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white shadow-xs gap-4 flex-wrap sm:flex-nowrap">
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-800 text-sm">
                                    {cleanTitle(item.dia1.title)}
                                  </h4>
                                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    {item.dia1.questions.length} questões • {item.dia1.timeLimitMinutes || 330} min
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge
                                    className={cn(
                                      "font-bold text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 border-none",
                                      item.dia1.status.toLowerCase().startsWith("pend")
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-green-100 text-green-800"
                                    )}
                                  >
                                    {item.dia1.status}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="font-bold text-xs text-slate-600 hover:text-slate-900 border-slate-200 h-8"
                                      onClick={() => router.push(`/dashboard/simulados/start?id=${item.dia1.id}`)}
                                    >
                                      Visualizar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-slate-400 hover:bg-red-50 hover:text-red-600 h-8 w-8 rounded-lg"
                                      onClick={() => handleDelete(item.dia1.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {item.dia2 && (
                              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white shadow-xs gap-4 flex-wrap sm:flex-nowrap">
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-800 text-sm">
                                    {cleanTitle(item.dia2.title)}
                                  </h4>
                                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    {item.dia2.questions.length} questões • {item.dia2.timeLimitMinutes || 300} min
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge
                                    className={cn(
                                      "font-bold text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 border-none",
                                      item.dia2.status.toLowerCase().startsWith("pend")
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-green-100 text-green-800"
                                    )}
                                  >
                                    {item.dia2.status}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="font-bold text-xs text-slate-600 hover:text-slate-900 border-slate-200 h-8"
                                      onClick={() => router.push(`/dashboard/simulados/start?id=${item.dia2.id}`)}
                                    >
                                      Visualizar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-slate-400 hover:bg-red-50 hover:text-red-600 h-8 w-8 rounded-lg"
                                      onClick={() => handleDelete(item.dia2.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                            <ClipboardList className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-800">
                              {item.title}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                              {item.subject} • {item.questionsCount} questões • Liberação: {format(new Date(item.createdAt), "dd/MM/yyyy")}
                            </p>
                          </div>
                        </div>

                        {/* Coluna do Aluno */}
                        <div className="flex items-center gap-2 min-w-[180px]">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-amber-100 text-xs text-amber-800 font-bold">
                              {item.student?.name?.charAt(0) || "-"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold text-slate-700">
                            {item.student?.name || "Não atribuído"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 ml-auto md:ml-0">
                          <Badge
                            className={cn(
                              "font-bold text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border-none",
                              item.status.toLowerCase().startsWith("pend")
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                            )}
                          >
                            {item.status}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="font-bold text-xs text-slate-600 hover:text-slate-900 border-slate-200 h-8"
                              onClick={() => router.push(`/dashboard/simulados/start?id=${item.id}`)}
                            >
                              Visualizar
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:bg-red-50 hover:text-red-600 h-8 w-8 rounded-lg"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })
              )}
            </div>
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
