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
} from "@/app/actions/simulados";
import { cn } from "@/lib/utils";

type QuestionOption = { id: string; text: string; isCorrect: boolean };
type Question = { id: string; title: string; options: QuestionOption[] };
type Attempt = {
  score: number;
  durationSeconds: number;
  userAnswers: Record<string, string>;
};
type Simulado = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimitMinutes?: number | null;
  attempts: Attempt[];
  maxAttempts: number;
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    // Se ele já respondeu, mostra o resultado direto
    if (dbSimulado.attempts && dbSimulado.attempts.length > 0) {
      setSubmittedAttempt(dbSimulado.attempts[dbSimulado.attempts.length - 1]);
    } else {
      setStartTime(new Date());
      if (dbSimulado.timeLimitMinutes) {
        setRemainingSeconds(dbSimulado.timeLimitMinutes * 60);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (user?.role === "teacher" || user?.role === "admin") {
      router.replace("/dashboard/simulados");
      return;
    }

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

  const handleFinish = async () => {
    if (!simulado || !startTime) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSubmitting(true);
    const endTime = new Date();
    const result = await submitSimuladoAttempt({
      simuladoId: simulado.id,
      startedAt: startTime.toISOString(),
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

  // ===============================================
  // 🏆 TELA DE RESULTADO (GABARITO)
  // ===============================================
  if (submittedAttempt) {
    const isGoodScore = submittedAttempt.score >= 70;

    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
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
              isGoodScore ? "bg-green-50" : "bg-red-50",
            )}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <Badge
                  variant="outline"
                  className={cn(
                    "mb-2 border-2 bg-white",
                    isGoodScore
                      ? "border-green-200 text-green-700"
                      : "border-red-200 text-red-700",
                  )}
                >
                  Simulado Finalizado
                </Badge>
                <CardTitle className="text-2xl text-slate-900">
                  {simulado.title}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {simulado.description}
                </CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="bg-white p-4 rounded-2xl border text-center px-6 shadow-sm">
                  <span className="block text-3xl font-black text-slate-800">
                    {formatDuration(submittedAttempt.durationSeconds)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1 mt-1">
                    <Clock className="h-3 w-3" /> Tempo
                  </span>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-2xl border text-center px-6 shadow-sm",
                    isGoodScore
                      ? "bg-green-100 border-green-200"
                      : "bg-red-100 border-red-200",
                  )}
                >
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
                      "text-xs font-bold uppercase tracking-wider mt-1",
                      isGoodScore ? "text-green-800" : "text-red-800",
                    )}
                  >
                    Acertos
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 px-2 mt-4">
            Gabarito da Prova
          </h2>
          {simulado.questions.map((question, questionIndex) => {
            const selectedId = submittedAttempt.userAnswers[question.id];

            // Lógica para saber se a questão inteira foi acertada
            const correctOption = question.options.find((opt) => opt.isCorrect);
            const questionIsCorrect = correctOption?.id === selectedId;

            return (
              <Card
                key={question.id}
                className={cn(
                  "rounded-3xl border-2 shadow-sm overflow-hidden",
                  questionIsCorrect ? "border-green-100" : "border-red-100",
                )}
              >
                <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg text-slate-800 leading-relaxed font-medium">
                      <span className="font-black text-slate-400 mr-2">
                        {questionIndex + 1}.
                      </span>{" "}
                      {question.title}
                    </CardTitle>
                    {questionIsCorrect ? (
                      <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-6 pb-6">
                  {question.options.map((option, idx) => {
                    const isCorrect = option.isCorrect;
                    const isSelected = selectedId === option.id;
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D...

                    return (
                      <div
                        key={option.id}
                        className={cn(
                          "flex items-center gap-4 rounded-2xl border-2 p-4 transition-colors",
                          isCorrect
                            ? "border-green-400 bg-green-50"
                            : isSelected
                              ? "border-red-400 bg-red-50"
                              : "border-slate-100 bg-white",
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-bold",
                            isCorrect
                              ? "bg-green-200 text-green-800"
                              : isSelected
                                ? "bg-red-200 text-red-800"
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
                                ? "text-red-900"
                                : "text-slate-700",
                          )}
                        >
                          {option.text}
                        </span>
                        {isCorrect && (
                          <span className="text-xs font-bold text-green-600 uppercase bg-green-100 px-2 py-1 rounded-md">
                            Correta
                          </span>
                        )}
                        {isSelected && !isCorrect && (
                          <span className="text-xs font-bold text-red-600 uppercase bg-red-100 px-2 py-1 rounded-md">
                            Sua Resposta
                          </span>
                        )}
                      </div>
                    );
                  })}
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
                {simulado.title}
              </CardTitle>
              <CardDescription className="mt-1 text-base">
                {simulado.description}
              </CardDescription>
            </div>
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
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-xl sm:text-2xl font-semibold text-slate-800 leading-relaxed">
                {currentQuestion.title}
              </p>
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
