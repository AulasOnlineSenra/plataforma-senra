
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
import { AlertCircle, ArrowLeft, ArrowRight, Check, X, FileText } from 'lucide-react';
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

const SIMULADOS_STORAGE_KEY = 'simuladosList';

type Answers = Record<string, string>;

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
  
  useEffect(() => {
    const storedSimulados = localStorage.getItem(SIMULADOS_STORAGE_KEY);
    const allSimulados: Simulado[] = storedSimulados ? JSON.parse(storedSimulados) : initialSimulados;
    const foundSimulado = allSimulados.find(s => s.id === simuladoId);
    setSimulado(foundSimulado || null);
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
    if (!simulado) return;

    let correctAnswers = 0;
    simulado.questions.forEach(q => {
        const correctOption = q.options.find(opt => opt.isCorrect);
        if (correctOption && answers[q.id] === correctOption.id) {
            correctAnswers++;
        }
    });

    const calculatedScore = (correctAnswers / simulado.questions.length) * 100;
    setScore(calculatedScore);
    
    // Update simulado status and score in localStorage
    const storedSimulados = localStorage.getItem(SIMULADOS_STORAGE_KEY);
    let allSimulados: Simulado[] = storedSimulados ? JSON.parse(storedSimulados) : [];
    
    const updatedSimulados = allSimulados.map(s => 
      s.id === simulado.id 
        ? { ...s, status: 'Concluído' as 'Concluído', completedAt: new Date(), score: calculatedScore, userAnswers: answers } 
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
            <Button onClick={() => router.back()}>Voltar</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col p-4 md:p-6 relative">
         <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-4 left-4 z-10">
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
      <Dialog open={isFinished} onOpenChange={(open) => !open && router.back()}>
        <DialogContent>
            <DialogHeader className="text-center items-center">
                <div className={cn(
                    "rounded-full p-4 w-fit mb-4",
                    score >= 70 ? 'bg-green-100' : 'bg-red-100'
                )}>
                    <FileText className={cn("h-10 w-10", score >= 70 ? 'text-green-600' : 'text-red-600')} />
                </div>
                <DialogTitle className="text-2xl font-bold">Simulado Concluído!</DialogTitle>
                <DialogDescription>
                   Sua pontuação final foi de
                </DialogDescription>
            </DialogHeader>
            <div className="text-center">
                <p className="text-6xl font-bold">{score.toFixed(0)}%</p>
                <p className="text-muted-foreground">de acerto</p>
            </div>
            <DialogFooter className="justify-center">
                <Button onClick={() => router.back()}>Voltar para o perfil</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function StartSimuladoPage() {
    return (
        <Suspense fallback={<div>Carregando simulado...</div>}>
            <StartSimuladoPageComponent />
        </Suspense>
    )
}
