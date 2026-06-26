"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getSimuladoById,
  submitSimuladoAttempt,
  checkEnemGabaritoRelease,
  startSimuladoAttempt,
} from "@/app/actions/simulados";
import { cn } from "@/lib/utils";

type QuestionOption = { id: string; text: string; isCorrect: boolean };
type Question = {
  id: string;
  title: string;
  options: QuestionOption[];
  discipline?: string;
  subject?: string;
  context?: string;
  localTitle?: string;
  enemYear?: number;
  enemIndex?: number;
  isEnemApi?: boolean;
  isLocal?: boolean;
};
type Attempt = {
  score: number;
  durationSeconds: number;
  userAnswers: Record<string, string>;
  startedAt?: string;
  completedAt?: string | null;
};
type Simulado = {
  id: string;
  title: string;
  description: string;
  subject: string;
  questions: Question[];
  timeLimitMinutes?: number | null;
  attempts: Attempt[];
  maxAttempts: number;
  studentId: string;
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function cleanTitle(t: string) {
  if (!t) return "";
  return t.replace(/n[º°]\s*\d+\s*[-—–]\s*/i, "")
          .replace(/n[º°]\s*\d+/i, "")
          .replace(/\s*[-—–]\s*Dia/i, " — Dia")
          .trim();
}

function StartSimuladoPageComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const simuladoId = searchParams.get("id");

  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [submittedAttempt, setSubmittedAttempt] = useState<Attempt | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingGabarito, setCheckingGabarito] = useState(false);
  const [gabaritoReleaseInfo, setGabaritoReleaseInfo] = useState<{
    released: boolean;
    reason?: string;
    stats?: {
      totalQuestions: number;
      totalCorrect: number;
      totalWrong: number;
      score: number;
      areaStats: Record<string, { correct: number; wrong: number; total: number }>;
      subjectStats: Record<string, { correct: number; wrong: number; total: number }>;
    };
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isUserAdminOrTeacher = useMemo(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
    const u = stored ? JSON.parse(stored) : null;
    return u?.role === "teacher" || u?.role === "admin";
  }, []);

  const isAttemptActive = useMemo(() => {
    if (!simulado) return false;
    if (isUserAdminOrTeacher) {
      const attempts = simulado.attempts || [];
      const active = attempts.find((a) => !a.completedAt);
      return !!active;
    }
    return !submittedAttempt;
  }, [simulado, isUserAdminOrTeacher, submittedAttempt]);

  const [adminRemainingSeconds, setAdminRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!isUserAdminOrTeacher || !simulado || !isAttemptActive) return;

    const attempts = simulado.attempts || [];
    const active = attempts.find((a) => !a.completedAt);
    if (!active || !active.startedAt) return;

    const updateTimer = () => {
      const startedTime = new Date(active.startedAt);
      const elapsedSeconds = Math.floor((new Date().getTime() - startedTime.getTime()) / 1000);
      const totalLimitSeconds = (simulado.timeLimitMinutes || 0) * 60;
      const remaining = totalLimitSeconds - elapsedSeconds;
      setAdminRemainingSeconds(remaining > 0 ? remaining : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isUserAdminOrTeacher, simulado, isAttemptActive]);

  const loadSimulado = async () => {
    if (!simuladoId) {
      setIsLoading(false);
      return;
    }
    const result = await getSimuladoById(simuladoId);
    if (!result.success || !result.data) {
      setIsLoading(false);
      return;
    }

    const dbSimulado = result.data as unknown as Simulado;
    setSimulado(dbSimulado);

    // Verificar se o usuário atual é professor ou administrador
    const isUserAdminOrTeacher = (() => {
      const stored = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
      const u = stored ? JSON.parse(stored) : null;
      return u?.role === "teacher" || u?.role === "admin";
    })();

    if (isUserAdminOrTeacher) {
      // Admin/Teacher visualiza o gabarito. Se não houver tentativas do aluno, simulamos uma tentativa vazia para renderizar as questões
      const hasAttempts = dbSimulado.attempts && dbSimulado.attempts.length > 0;
      const lastAtt = hasAttempts
        ? dbSimulado.attempts[dbSimulado.attempts.length - 1]
        : { score: 100, durationSeconds: 0, userAnswers: {} }; // Mock de visualização para Admin
      
      setSubmittedAttempt(lastAtt);
      setGabaritoReleaseInfo({ released: true }); // Ignora travas de gabarito para Admin
    } else {
      const attempts = dbSimulado.attempts || [];
      const completedAtts = attempts.filter((a) => a.completedAt);
      const activeAtt = attempts.find((a) => !a.completedAt);

      if (completedAtts.length > 0) {
        // Aluno já completou a tentativa, exibe gabarito
        const lastAtt = completedAtts[completedAtts.length - 1];
        setSubmittedAttempt(lastAtt);
        
        const isEnem = dbSimulado.subject && dbSimulado.subject.startsWith("ENEM_");
        if (isEnem) {
          setCheckingGabarito(true);
          const releaseRes = await checkEnemGabaritoRelease(dbSimulado.id);
          if (releaseRes.success) {
            setGabaritoReleaseInfo({
              released: releaseRes.released || false,
              reason: releaseRes.reason,
              stats: releaseRes.stats,
            });
          }
          setCheckingGabarito(false);
        } else {
          setGabaritoReleaseInfo({ released: true });
        }
      } else {
        // Aluno está realizando a prova
        if (activeAtt && activeAtt.startedAt) {
          // Já existe uma tentativa ativa! Recupera o tempo dela
          const startedTime = new Date(activeAtt.startedAt);
          setStartTime(startedTime);

          const elapsedSeconds = Math.floor((new Date().getTime() - startedTime.getTime()) / 1000);
          const totalLimitSeconds = (dbSimulado.timeLimitMinutes || 0) * 60;
          const remaining = totalLimitSeconds - elapsedSeconds;

          if (remaining <= 0) {
            // Estourou o tempo enquanto estava fora! Finaliza a prova passando o startedTime correto
            setRemainingSeconds(0);
            handleFinish(startedTime);
          } else {
            setRemainingSeconds(remaining);
          }
        } else {
          // Não há tentativa ativa: inicia uma nova agora!
          const now = new Date();
          setStartTime(now);
          if (dbSimulado.timeLimitMinutes) {
            setRemainingSeconds(dbSimulado.timeLimitMinutes * 60);
          }

          // Salva no banco que a tentativa começou em background
          startSimuladoAttempt(dbSimulado.id);
        }
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadSimulado();
  }, [simuladoId]);

  useEffect(() => {
    if (remainingSeconds === null || submittedAttempt) return;

    if (remainingSeconds <= 0) {
      handleFinish();
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => (prev ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingSeconds, submittedAttempt]);

  const currentQuestion = simulado?.questions[currentIndex];
  const progress = useMemo(() => {
    if (!simulado || simulado.questions.length === 0) return 0;
    return ((currentIndex + 1) / simulado.questions.length) * 100;
  }, [currentIndex, simulado]);

  const handleFinish = async (forcedStartTime?: Date) => {
    const activeStartTime = forcedStartTime || startTime;
    if (!simulado || !activeStartTime) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSubmitting(true);
    const endTime = new Date();
    const result = await submitSimuladoAttempt({
      simuladoId: simulado.id,
      startedAt: activeStartTime.toISOString(),
      completedAt: endTime.toISOString(),
      userAnswers: answers,
    });

    if (!result.success || !result.data) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: result.error || "Falha ao enviar tentativa.",
      });
      setIsSubmitting(false);
      return;
    }

    const nextAttempt: Attempt = {
      score: result.data.score,
      durationSeconds: result.data.durationSeconds,
      userAnswers: answers,
    };
    setSubmittedAttempt(nextAttempt);

    const isEnem = simulado.subject && simulado.subject.startsWith("ENEM_");
    if (isEnem) {
      setCheckingGabarito(true);
      const releaseRes = await checkEnemGabaritoRelease(simulado.id);
      if (releaseRes.success) {
        setGabaritoReleaseInfo({
          released: releaseRes.released || false,
          reason: releaseRes.reason,
          stats: releaseRes.stats,
        });
      }
      setCheckingGabarito(false);
    } else {
      setGabaritoReleaseInfo({ released: true });
    }

    toast({
      title: "Simulado Finalizado! 🏆",
      description: `Sua pontuação foi gravada com sucesso.`,
    });
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse font-medium">
        Carregando prova...
      </div>
    );
  }

  if (!simulado) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Card className="rounded-3xl border-slate-200 shadow-sm p-6 text-center max-w-sm">
          <AlertCircle className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <CardTitle className="mb-2">Simulado não encontrado</CardTitle>
          <CardDescription className="mb-6">
            O item solicitado não existe ou foi removido pelo professor.
          </CardDescription>
          <Button
            className="w-full rounded-xl bg-slate-900 text-white"
            onClick={() => router.push("/dashboard/simulados")}
          >
            Voltar para Meus Simulados
          </Button>
        </Card>
      </div>
    );
  }

  if (checkingGabarito) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse font-medium">
        Verificando liberação do gabarito...
      </div>
    );
  }

  if (submittedAttempt && gabaritoReleaseInfo && !gabaritoReleaseInfo.released) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center p-6 text-center min-h-[50vh]">
        <Card className="rounded-[2rem] border-slate-200 shadow-md p-8 bg-white w-full space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border-2 border-brand-yellow flex items-center justify-center text-brand-yellow">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-black text-slate-800">
              Gabarito Temporariamente Bloqueado
            </CardTitle>
            <CardDescription className="text-base text-slate-500 font-medium leading-relaxed">
              {gabaritoReleaseInfo.reason || "O gabarito estará disponível após a conclusão do simulado."}
            </CardDescription>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border text-sm text-slate-600 font-medium">
            ⚠️ Para manter a integridade do exame, as respostas e correções do simulado só são liberadas 60 minutos após a finalização do Dia 2 da prova.
          </div>
          <Button
            className="w-full rounded-2xl bg-slate-900 text-white font-bold h-12 hover:bg-slate-800"
            onClick={() => router.push("/dashboard/simulados")}
          >
            Voltar para Meus Simulados
          </Button>
        </Card>
      </div>
    );
  }

  // ===============================================
  // 🏆 TELA DE RESULTADO (GABARITO LIBERADO)
  // ===============================================
  if (submittedAttempt && gabaritoReleaseInfo?.released) {
    const isGoodScore = submittedAttempt.score >= 70;

    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 pb-12">
        <Button
          variant="ghost"
          className="w-fit rounded-full text-slate-500 hover:bg-slate-100"
          onClick={() => router.push("/dashboard/simulados")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader
            className={cn(
              "border-b pb-6",
              isAttemptActive
                ? "bg-amber-50/40"
                : isGoodScore
                  ? "bg-green-50"
                  : "bg-red-50",
            )}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <Badge
                  variant="outline"
                  className={cn(
                    "mb-2 border-2 bg-white",
                    isAttemptActive
                      ? "border-amber-200 text-amber-700 font-bold"
                      : isGoodScore
                        ? "border-green-200 text-green-700 font-bold"
                        : "border-red-200 text-red-700 font-bold",
                  )}
                >
                  {isAttemptActive ? "Simulado em Andamento" : "Simulado Finalizado"}
                </Badge>
                <CardTitle className="text-2xl text-slate-900 font-black">
                  {cleanTitle(simulado.title)}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {simulado.description}
                </CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="bg-white p-4 rounded-2xl border text-center px-6 shadow-sm">
                  <span className="block text-3xl font-black text-slate-800">
                    {isAttemptActive
                      ? formatDuration(adminRemainingSeconds ?? (simulado.timeLimitMinutes || 0) * 60)
                      : formatDuration(submittedAttempt.durationSeconds)
                    }
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1 mt-1">
                    <Clock className="h-3 w-3" /> Tempo {isAttemptActive ? "Restante" : ""}
                  </span>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-2xl border text-center px-6 shadow-sm",
                    isAttemptActive
                      ? "bg-amber-100 border-amber-200"
                      : isGoodScore
                        ? "bg-green-100 border-green-200"
                        : "bg-red-100 border-red-200",
                  )}
                >
                  {isAttemptActive ? (
                    <>
                      <span className="block text-2xl font-black text-amber-800 font-headline h-[36px] flex items-center justify-center">
                        Realizando
                      </span>
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider mt-1 block">
                        Status
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className={cn(
                          "block text-3xl font-black",
                          isGoodScore ? "text-green-700" : "text-red-700",
                        )}
                      >
                        {submittedAttempt.score.toFixed(0)}%
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold uppercase tracking-wider mt-1 block",
                          isGoodScore ? "text-green-800" : "text-red-800",
                        )}
                      >
                        Acertos
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 📊 PAINEL DE ANALYTICS DETALHADO */}
        {gabaritoReleaseInfo?.stats && !isAttemptActive && (
          <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden p-6 bg-slate-50/50 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                📊 Análise Detalhada de Desempenho
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Confira seus resultados consolidados por área de conhecimento e disciplina.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Desempenho por Área de Conhecimento */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Por Área de Conhecimento
                </h4>
                <div className="space-y-3">
                  {Object.entries(gabaritoReleaseInfo.stats.areaStats).map(([area, stat]) => {
                    const percent = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
                    return (
                      <div key={area} className="space-y-1">
                        <div className="flex justify-between text-sm font-semibold text-slate-700">
                          <span className="truncate max-w-[200px] md:max-w-xs">{area}</span>
                          <span>{stat.correct}/{stat.total} ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              percent >= 70 ? "bg-green-500" : percent >= 40 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desempenho por Matéria/Disciplina */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Por Disciplina
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {Object.entries(gabaritoReleaseInfo.stats.subjectStats).map(([subject, stat]) => {
                    const percent = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
                    return (
                      <div key={subject} className="space-y-1">
                        <div className="flex justify-between text-sm font-semibold text-slate-700">
                          <span>{subject}</span>
                          <span>{stat.correct}/{stat.total} ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              percent >= 70 ? "bg-green-500" : percent >= 40 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 px-2 mt-4">
            Gabarito da Prova
          </h2>
          {simulado.questions.map((question, questionIndex) => {
            const selectedId = submittedAttempt.userAnswers[question.id];

            const correctOption = question.options.find((opt) => opt.isCorrect);
            const questionIsCorrect = correctOption?.id === selectedId;

            return (
              <Card
                key={question.id}
                className={cn(
                  "rounded-3xl border-2 shadow-sm overflow-hidden",
                  isAttemptActive
                    ? "border-slate-200"
                    : questionIsCorrect
                      ? "border-green-100"
                      : "border-red-100",
                )}
              >
                <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        Questão {questionIndex + 1}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="italic">
                          {(() => {
                            const id = question.id || "";
                            const parts = id.split("-");
                            
                            if (question.enemIndex && question.enemYear) {
                              return `(Questão ${question.enemIndex} - ENEM ${question.enemYear})`;
                            } else if (parts[0] === 'enem' && parts[1] === 'api') {
                              const year = parts[2];
                              const index = parts[3];
                              return `(Questão ${index} - ENEM ${year})`;
                            }
                            
                            if (question.localTitle) {
                              return `(${question.localTitle})`;
                            }
                            
                            const yearMatch = question.title?.match(/ENEM\s*(\d{4})/i);
                            const indexMatch = question.title?.match(/Questão\s*(\d+)/i);
                            if (yearMatch && indexMatch) {
                              return `(Questão ${indexMatch[1]} - ENEM ${yearMatch[1]})`;
                            }
                            
                            if (question.title && question.title.length <= 80) {
                              return `(${question.title})`;
                            }
                            
                            return "(Questão Autoral)";
                          })()}
                        </span>
                        
                        {question.discipline && (
                          <Badge className="bg-slate-900 text-white font-bold rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-wider">
                            {question.discipline === "Matemática e suas Tecnologias" ? "matemática" :
                             question.discipline === "Ciências da Natureza e suas Tecnologias" ? "ciências da natureza" :
                             question.discipline === "Ciências Humanas e suas Tecnologias" ? "ciências humanas" : "linguagens"}
                          </Badge>
                        )}
                        {question.subject && (
                          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white font-semibold rounded-full px-2.5 py-0.5 text-[9px]">
                            {question.subject.toLowerCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isAttemptActive ? (
                        questionIsCorrect ? (
                          <CheckCircle className="h-7 w-7 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-7 w-7 text-red-500 shrink-0" />
                        )
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px] uppercase tracking-wider rounded-full px-3 py-1">
                          Aguardando Envio
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {(() => {
                    const titleIsShort = question.title && question.title.length <= 80;
                    let rawEnunciado = question.title;
                    if (titleIsShort && question.context) {
                      rawEnunciado = question.context;
                    }

                    const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
                    const imageUrls: string[] = [];
                    let match;
                    while ((match = markdownImageRegex.exec(rawEnunciado)) !== null) {
                      if (match[1]) imageUrls.push(match[1]);
                    }

                    const cleanEnunciado = rawEnunciado.replace(markdownImageRegex, '').trim();

                    return (
                      <div className="space-y-4">
                        <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed whitespace-pre-line">
                          {cleanEnunciado}
                        </p>
                        
                        {imageUrls.map((url, uIdx) => (
                          <div key={uIdx} className="flex justify-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <img
                              src={url}
                              alt={`Ilustração da questão ${uIdx + 1}`}
                              className="max-h-60 rounded-xl object-contain border bg-white shadow-sm p-1"
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="space-y-3 pt-2">
                    {question.options.map((option, idx) => {
                      const isCorrect = option.isCorrect;
                      const isSelected = selectedId === option.id;
                      const letter = String.fromCharCode(65 + idx);

                      return (
                        <div
                          key={option.id}
                          className={cn(
                            "flex items-center gap-4 rounded-2xl border-2 p-4 transition-colors",
                            isCorrect
                              ? "border-green-400 bg-green-50"
                              : isSelected
                                ? isAttemptActive
                                  ? "border-amber-400 bg-amber-50/20"
                                  : "border-red-400 bg-red-50"
                                : "border-slate-100 bg-white",
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                              isCorrect
                                ? "bg-green-200 text-green-800"
                                : isSelected
                                  ? isAttemptActive
                                    ? "bg-amber-200 text-amber-800"
                                    : "bg-red-200 text-red-800"
                                  : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {letter}
                          </div>
                          <span
                            className={cn(
                              "text-base font-medium flex-1",
                              isCorrect
                                ? "text-green-900"
                                : isSelected
                                  ? isAttemptActive
                                    ? "text-amber-900"
                                    : "text-red-900"
                                  : "text-slate-700",
                            )}
                          >
                            {option.text}
                          </span>
                          {isCorrect && (
                            <span className="text-[10px] font-black text-green-700 uppercase bg-green-100 px-2.5 py-1 rounded-lg">
                              Correta
                            </span>
                          )}
                          {isSelected && (
                            <span
                              className={cn(
                                "text-[10px] font-black uppercase px-2.5 py-1 rounded-lg",
                                isCorrect
                                  ? "text-green-700 bg-green-100"
                                  : isAttemptActive
                                    ? "text-amber-700 bg-amber-100"
                                    : "text-red-700 bg-red-100",
                              )}
                            >
                              {isAttemptActive ? "Marcada pelo Aluno" : "Resposta do Aluno"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  //  TELA DE FAZER A PROVA (EM ANDAMENTO)
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 items-start justify-center pt-4">
      <Card className="w-full rounded-[2rem] border-slate-200 shadow-md overflow-hidden">
        <CardHeader className="border-b bg-slate-50 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <CardTitle className="text-2xl font-black text-slate-900">
                {cleanTitle(simulado.title)}
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {remainingSeconds !== null && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border-2 bg-white px-6 py-3 shadow-sm",
                    remainingSeconds < 300
                      ? "border-red-200 text-red-600 animate-pulse"
                      : "border-brand-yellow text-slate-800",
                  )}
                >
                  <Clock className="h-6 w-6" />
                  <span className="text-2xl font-black tracking-wider">
                    {formatDuration(remainingSeconds)}
                  </span>
                </div>
              )}
              <Button
                variant="destructive"
                disabled={isSubmitting}
                className="h-12 px-5 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-200"
                onClick={handleFinish}
              >
                {isSubmitting ? "Finalizando..." : "Finalizar Simulado"}
              </Button>
            </div>
          </div>
          <div className="pt-8">
            <div className="flex justify-between items-end mb-2">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Questão {currentIndex + 1} de {simulado.questions.length}
              </p>
              <p className="text-xs font-bold text-slate-400">
                {Math.round(progress)}% Concluído
              </p>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <Progress
                value={progress}
                className="h-full [&>div]:bg-brand-yellow"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-10 min-h-[300px]">
          {currentQuestion ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* TÍTULO DA QUESTÃO (NUMERAÇÃO DO SIMULADO) E METADADOS */}
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Questão {currentIndex + 1}
                </h3>
                
                {/* ORIGEM E METADADOS DA QUESTÃO */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 font-medium">
                  <span className="italic">
                    {(() => {
                      const id = currentQuestion.id || "";
                      const parts = id.split("-");
                      
                      if (currentQuestion.enemIndex && currentQuestion.enemYear) {
                        return `(Questão ${currentQuestion.enemIndex} - ENEM ${currentQuestion.enemYear})`;
                      } else if (parts[0] === 'enem' && parts[1] === 'api') {
                        const year = parts[2];
                        const index = parts[3];
                        return `(Questão ${index} - ENEM ${year})`;
                      }
                      
                      if (currentQuestion.localTitle) {
                        return `(${currentQuestion.localTitle})`;
                      }
                      
                      const yearMatch = currentQuestion.title?.match(/ENEM\s*(\d{4})/i);
                      const indexMatch = currentQuestion.title?.match(/Questão\s*(\d+)/i);
                      if (yearMatch && indexMatch) {
                        return `(Questão ${indexMatch[1]} - ENEM ${yearMatch[1]})`;
                      }
                      
                      if (currentQuestion.title && currentQuestion.title.length <= 80) {
                        return `(${currentQuestion.title})`;
                      }
                      
                      return "(Questão Autoral)";
                    })()}
                  </span>
                  
                  {/* TAGS DA QUESTÃO */}
                  {currentQuestion.discipline && (
                    <Badge className="bg-slate-900 text-white font-bold rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider">
                      {currentQuestion.discipline === "Matemática e suas Tecnologias" ? "matemática" :
                       currentQuestion.discipline === "Ciências da Natureza e suas Tecnologias" ? "ciências da natureza" :
                       currentQuestion.discipline === "Ciências Humanas e suas Tecnologias" ? "ciências humanas" : "linguagens"}
                    </Badge>
                  )}
                  {currentQuestion.subject && (
                    <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white font-semibold rounded-full px-2.5 py-0.5 text-[10px]">
                      {currentQuestion.subject.toLowerCase()}
                    </Badge>
                  )}
                </div>
              </div>

              {/* ENUNCIADO E IMAGENS DE APOIO */}
              {(() => {
                const titleIsShort = currentQuestion.title && currentQuestion.title.length <= 80;
                let rawEnunciado = currentQuestion.title;
                if (titleIsShort && currentQuestion.context) {
                  rawEnunciado = currentQuestion.context;
                }

                // Regex para extrair e limpar imagens de markdown do tipo: ![](url)
                const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
                const imageUrls: string[] = [];
                let match;
                while ((match = markdownImageRegex.exec(rawEnunciado)) !== null) {
                  if (match[1]) imageUrls.push(match[1]);
                }

                // Limpar imagens do texto
                const cleanEnunciado = rawEnunciado.replace(markdownImageRegex, '').trim();

                return (
                  <div className="space-y-4">
                    <p className="text-lg sm:text-xl font-medium text-slate-800 leading-relaxed whitespace-pre-line">
                      {cleanEnunciado}
                    </p>
                    
                    {/* Renderizar as imagens de apoio extraídas da regex */}
                    {imageUrls.map((url, uIdx) => (
                      <div key={uIdx} className="flex justify-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <img
                          src={url}
                          alt={`Ilustração da questão ${uIdx + 1}`}
                          className="max-h-64 rounded-xl object-contain border bg-white shadow-sm p-1"
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}

              <RadioGroup
                value={answers[currentQuestion.id]}
                onValueChange={(value) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: value,
                  }))
                }
              >
                <div className="space-y-4">
                  {currentQuestion.options.map((option, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected =
                      answers[currentQuestion.id] === option.id;
                    return (
                      <div
                        key={option.id}
                        className={cn(
                          "relative flex items-center rounded-2xl border-2 p-1 transition-all cursor-pointer hover:border-brand-yellow/50",
                          isSelected
                            ? "border-brand-yellow bg-amber-50/30 shadow-sm"
                            : "border-slate-100 bg-white",
                        )}
                      >
                        <RadioGroupItem
                          value={option.id}
                          id={option.id}
                          className="absolute left-6 h-5 w-5 border-2 text-brand-yellow"
                        />
                        <Label
                          htmlFor={option.id}
                          className="cursor-pointer text-slate-700 font-medium text-lg w-full flex items-center pl-14 pr-6 py-4"
                        >
                          <span
                            className={cn(
                              "absolute left-4 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors",
                              isSelected
                                ? "bg-brand-yellow text-slate-900"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {letter}
                          </span>
                          <span className="pl-4">{option.text}</span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 font-medium">
              Sem questões cadastradas nesta prova.
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-slate-100 bg-slate-50 p-6 sm:p-8">
          <Button
            variant="outline"
            className="h-14 px-6 rounded-2xl font-bold text-slate-600 border-slate-300 hover:bg-slate-200"
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Anterior
          </Button>

          {currentIndex < simulado.questions.length - 1 ? (
            <Button
              className="h-14 px-8 rounded-2xl bg-slate-900 font-bold text-white text-lg hover:bg-slate-800 shadow-md transition-transform hover:scale-105"
              onClick={() => setCurrentIndex((index) => index + 1)}
            >
              Próxima <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              disabled={isSubmitting}
              className="h-14 px-8 rounded-2xl bg-brand-yellow font-black text-slate-900 text-lg hover:bg-amber-400 shadow-lg transition-transform hover:-translate-y-1"
              onClick={handleFinish}
            >
              {isSubmitting ? "Enviando..." : "Finalizar Prova"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function StartSimuladoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center text-slate-500 animate-pulse font-medium">
          Carregando ambiente de prova...
        </div>
      }
    >
      <StartSimuladoPageComponent />
    </Suspense>
  );
}
