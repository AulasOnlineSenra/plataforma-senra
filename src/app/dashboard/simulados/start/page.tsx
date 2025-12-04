

'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { simulados as initialSimulados, subjects as initialSubjects, getMockUser } from '@/lib/data';
import { Simulado, Question } from '@/lib/types';
import { AlertCircle, ArrowLeft, ArrowRight, Check, X, FileText, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const SIMULADOS_STORAGE_KEY = 'simuladosList';

type Answers = Record<string, string>;

function formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} s`;
}

function StartSimuladoPageComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const simuladoId = searchParams.get('id');
  const { toast } = useToast();

  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  useEffect(() => {
    const storedSimulados = localStorage.getItem(SIMULADOS_STORAGE_KEY);
    const allSimulados: Simulado[] = storedSimulados ? JSON.parse(storedSimulados) : initialSimulados;
    const foundSimulado = allSimulados.find(s => s.id === simuladoId);
    
    if (foundSimulado) {
        setSimulado(foundSimulado);

        if (foundSimulado.status === 'Concluído') {
          setIsFinished(true);
          setAnswers(foundSimulado.userAnswers || {});
          setScore(foundSimulado.score || 0);
        } else {
          // If not completed, set start time
          setStartTime(new Date());
        }
    } else {
        setSimulado(null);
    }
  }, [simuladoId]);
  
  const currentQuestion: Question | undefined = simulado?.questions[currentQuestionIndex];
  const progress = simulado ? ((currentQuestionIndex + 1) / simulado.questions.length) * 100 : 0;

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleNext = () => {
    if (simulado && currentQuestionIndex < simulado.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    if (!simulado || !startTime) return;

    const endTime = new Date();
    const durationInSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    let correctAnswers = 0;
    simulado.questions.forEach(q => {
        const correctOption = q.options.find(opt => opt.isCorrect);
        if (correctOption && answers[q.id] === correctOption.id) {
            correctAnswers++;
        }
    });

    const calculatedScore = (correctAnswers / simulado.questions.length) * 100;
    setScore(calculatedScore);
    
    const storedSimulados = localStorage.getItem(SIMULADOS_STORAGE_KEY);
    let allSimulados: Simulado[] = storedSimulados ? JSON.parse(storedSimulados) : [];
    
    const updatedSimulados = allSimulados.map(s => 
      s.id === simulado.id 
        ? { ...s, status: 'Concluído' as 'Concluído', startedAt: startTime, completedAt: endTime, durationSeconds: durationInSeconds, score: calculatedScore, userAnswers: answers } 
        : s
    );
    localStorage.setItem(SIMULADOS_STORAGE_KEY, JSON.stringify(updatedSimulados));
    window.dispatchEvent(new Event('storage'));

    setIsFinished(true);

    toast({
        title: "Simulado Finalizado!",
        description: `Sua pontuação foi de ${calculatedScore.toFixed(0)}%.`
    });
  };

  if (!simulado) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive" />
              Simulado não encontrado
            </CardTitle>
            <CardDescription>
              Não foi possível carregar o simulado. Verifique o link ou volte para a lista de simulados.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard/simulados')}>Voltar</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if(isFinished) {
    return (
        <div className="flex flex-1 flex-col p-4 md:p-6 relative bg-background">
            <Button variant="ghost" onClick={() => router.push('/dashboard/simulados')} className="absolute top-4 left-4 z-10 h-auto p-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Simulados
            </Button>

            <div className="mx-auto w-full max-w-4xl pt-16">
                 <Card className="mb-6 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">{simulado.title}</CardTitle>
                        <CardDescription>{simulado.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-wrap justify-between items-center bg-muted/50 p-4 gap-4">
                        <div className="flex items-center gap-4 text-sm">
                           <div>
                                <span className="font-semibold">Pontuação Final: </span>
                                <span className={cn("font-bold text-lg", score >= 70 ? "text-green-600" : "text-red-600")}>{score.toFixed(0)}%</span>
                           </div>
                           {simulado.durationSeconds !== undefined && (
                               <div className="flex items-center gap-2 text-muted-foreground">
                                   <Clock className="h-4 w-4" />
                                   <span>{formatDuration(simulado.durationSeconds)}</span>
                               </div>
                           )}
                        </div>
                         <Button onClick={() => router.push('/dashboard/simulados')}>Finalizar Revisão</Button>
                    </CardFooter>
                </Card>

                <ScrollArea className="h-[calc(100vh-20rem)]">
                    <div className="space-y-6 pr-4">
                        {simulado.questions.map((question, qIndex) => {
                            const userAnswerId = answers[question.id];
                            return (
                                <Card key={question.id} className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Questão {qIndex + 1}: {question.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                    {question.options.map((option, oIndex) => {
                                        const isCorrect = option.isCorrect;
                                        const isUserAnswer = userAnswerId === option.id;
                                        const optionLabel = String.fromCharCode(97 + oIndex); // a, b, c...

                                        return (
                                        <div key={option.id} className={cn(
                                            "flex items-start gap-3 rounded-md border p-3 text-sm transition-colors",
                                            isCorrect ? "border-green-300 bg-green-50" : "",
                                            isUserAnswer && !isCorrect ? "border-red-300 bg-red-50" : ""
                                        )}>
                                            <div className="flex items-center gap-2 h-6">
                                                {isCorrect && <Check className="h-5 w-5 text-green-600" />}
                                                {isUserAnswer && !isCorrect && <X className="h-5 w-5 text-red-600" />}
                                            </div>
                                            <span className="font-bold">{optionLabel})</span>
                                            <p className="flex-1">{option.text}</p>
                                        </div>
                                        );
                                    })}
                                    </div>
                                </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
  }

  return (
      <div className="flex flex-1 flex-col p-4 md:p-6 relative">
         <Button variant="ghost" onClick={() => router.push('/dashboard/simulados')} className="absolute top-4 left-4 z-10">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Button>
        <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-3xl">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="font-headline text-2xl">{simulado.title}</CardTitle>
                        <CardDescription>{simulado.description}</CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">Questão {currentQuestionIndex + 1} de {simulado.questions.length}</p>
                        <Progress value={progress} className="w-28 mt-2" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {currentQuestion ? (
                <div className="space-y-6">
                    <p className="text-lg font-semibold">{currentQuestion.title}</p>
                    <RadioGroup
                    value={answers[currentQuestion.id]}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    className="space-y-3"
                    >
                    {currentQuestion.options.map(opt => (
                        <div key={opt.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} />
                        <Label htmlFor={`opt-${opt.id}`} className="text-base cursor-pointer">
                            {opt.text}
                        </Label>
                        </div>
                    ))}
                    </RadioGroup>
                </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>Este simulado não contém nenhuma questão.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                    <ArrowLeft className="mr-2" /> Anterior
                </Button>
                {currentQuestionIndex < simulado.questions.length - 1 ? (
                    <Button onClick={handleNext}>
                        Próxima <ArrowRight className="ml-2" />
                    </Button>
                ) : (
                    <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
                        Finalizar Simulado
                    </Button>
                )}
            </CardFooter>
            </Card>
        </div>
      </div>
  );
}

export default function StartSimuladoPage() {
    return (
        <Suspense fallback={<div>Carregando simulado...</div>}>
            <StartSimuladoPageComponent />
        </Suspense>
    )
}
