'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getSimuladoById, submitSimuladoAttempt } from '@/app/actions/simulados';

type QuestionOption = { id: string; text: string; isCorrect: boolean };
type Question = { id: string; title: string; options: QuestionOption[] };
type Attempt = { score: number; durationSeconds: number; userAnswers: Record<string, string> };
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
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function StartSimuladoPageComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const simuladoId = searchParams.get('id');

  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [submittedAttempt, setSubmittedAttempt] = useState<Attempt | null>(null);
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
    setStartTime(new Date());
    if (dbSimulado.timeLimitMinutes) {
      setRemainingSeconds(dbSimulado.timeLimitMinutes * 60);
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

  const handleFinish = async () => {
    if (!simulado || !startTime) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const endTime = new Date();
    const result = await submitSimuladoAttempt({
      simuladoId: simulado.id,
      startedAt: startTime.toISOString(),
      completedAt: endTime.toISOString(),
      userAnswers: answers,
    });

    if (!result.success || !result.data) {
      toast({ variant: 'destructive', title: 'Erro ao enviar', description: result.error || 'Falha ao enviar tentativa.' });
      return;
    }

    const nextAttempt: Attempt = {
      score: result.data.score,
      durationSeconds: result.data.durationSeconds,
      userAnswers: answers,
    };
    setSubmittedAttempt(nextAttempt);
    toast({ title: 'Simulado finalizado', description: `Pontuacao: ${nextAttempt.score.toFixed(0)}%` });
  };

  if (isLoading) {
    return <div className="flex h-[40vh] items-center justify-center text-slate-500">Carregando simulado...</div>;
  }

  if (!simulado) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Simulado não encontrado</CardTitle>
            <CardDescription>O item solicitado não existe ou foi removido.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard/simulados')}>Voltar</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (submittedAttempt) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4">
        <Button variant="ghost" className="w-fit rounded-2xl" onClick={() => router.push('/dashboard/simulados')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50">
            <CardTitle className="text-slate-900">{simulado.title}</CardTitle>
            <CardDescription>{simulado.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
              <span className="text-sm text-slate-600">Pontuação final</span>
              <Badge className="bg-[#FFC107] text-slate-900">{submittedAttempt.score.toFixed(0)}%</Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
              <span className="text-sm text-slate-600">Duração</span>
              <span className="font-semibold text-slate-900">{formatDuration(submittedAttempt.durationSeconds)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {simulado.questions.map((question, questionIndex) => {
            const selectedId = submittedAttempt.userAnswers[question.id];
            return (
              <Card key={question.id} className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-slate-900">
                    {questionIndex + 1}. {question.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {question.options.map((option) => {
                    const isCorrect = option.isCorrect;
                    const isSelected = selectedId === option.id;
                    return (
                      <div
                        key={option.id}
                        className={`flex items-center gap-2 rounded-xl border p-2 ${
                          isCorrect
                            ? 'border-green-300 bg-green-50'
                            : isSelected
                              ? 'border-red-300 bg-red-50'
                              : 'border-slate-200'
                        }`}
                      >
                        {isCorrect ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-500" />}
                        <span className="text-sm text-slate-700">{option.text}</span>
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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center">
      <Card className="w-full rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-slate-900">{simulado.title}</CardTitle>
              <CardDescription>{simulado.description}</CardDescription>
            </div>
            {remainingSeconds !== null && (
              <div className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-700">
                <Clock className="h-4 w-4 text-[#FFC107]" />
                {formatDuration(remainingSeconds)}
              </div>
            )}
          </div>
          <div className="pt-2">
            <p className="mb-1 text-sm text-slate-600">
              Questão {currentIndex + 1} de {simulado.questions.length}
            </p>
            <Progress value={progress} />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {currentQuestion ? (
            <div className="space-y-4">
              <p className="text-lg font-semibold text-slate-900">{currentQuestion.title}</p>
              <RadioGroup value={answers[currentQuestion.id]} onValueChange={(value) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))}>
                <div className="space-y-2">
                  {currentQuestion.options.map((option) => (
                    <div key={option.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="cursor-pointer text-slate-700">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Sem questões cadastradas.</p>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t bg-slate-50">
          <Button variant="outline" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          {currentIndex < simulado.questions.length - 1 ? (
            <Button className="bg-slate-900 font-bold text-white hover:bg-slate-800" onClick={() => setCurrentIndex((index) => index + 1)}>
              Próxima
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button className="bg-[#FFC107] font-bold text-slate-900 hover:bg-amber-300" onClick={handleFinish}>
              Finalizar
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function StartSimuladoPage() {
  return (
    <Suspense fallback={<div className="flex h-[40vh] items-center justify-center text-slate-500">Carregando...</div>}>
      <StartSimuladoPageComponent />
    </Suspense>
  );
}

