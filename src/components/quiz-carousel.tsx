'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { getSettings } from '@/app/actions/settings';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id: string;
  question: string;
  questionPt?: string;
  type: 'text' | 'select' | 'multiselect' | 'radio';
  options?: string[];
  placeholder?: string;
  isRequired: boolean;
  order: number;
}

interface QuizCarouselProps {
  questions: QuizQuestion[];
  onComplete?: (answers: Record<string, string | string[]>) => void;
  defaultWhatsappNumber?: string;
}

export default function QuizCarousel({
  questions,
  onComplete,
  defaultWhatsappNumber,
}: QuizCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(defaultWhatsappNumber || '');
  const [showSuccess, setShowSuccess] = useState(false);
  const [carouselApi, setCarouselApi] = useState<any>(null);

  useEffect(() => {
    const loadWhatsapp = async () => {
      const result = await getSettings();
      if (result.success && result.data) {
        const cleanNumber = (result.data.whatsapp || '').replace(/\D/g, '');
        setWhatsappNumber(cleanNumber);
      }
    };
    loadWhatsapp();
  }, []);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      const index = carouselApi.selectedScrollSnap();
      setCurrentIndex(index);
    };

    carouselApi.on('select', onSelect);

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  const canProceed = () => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    if (currentQuestion.isRequired) {
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return !!answer && answer.trim() !== '';
    }
    return true;
  };

  const handleAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    carouselApi.scrollNext();
  };

  const handlePrev = () => {
    carouselApi.scrollPrev();
  };

  const handleComplete = async () => {
    setIsLoading(true);

    const message = `Olá! Gostaria de agendar minha aula experimental grátis.\n\n${questions
      .map((q) => {
        const answer = answers[q.id];
        let answerText = '';

        if (Array.isArray(answer)) {
          answerText = answer.join(', ');
        } else if (answer) {
          answerText = answer;
        } else {
          answerText = 'Não informado';
        }

        const questionText = q.questionPt || q.question;
        return `*${questionText}:* ${answerText}`;
      })
      .join('\n\n')}`;

    if (whatsappNumber) {
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }

    setShowSuccess(true);
    setIsLoading(false);

    if (onComplete) {
      onComplete(answers);
    }
  };

  const renderQuestion = (question: QuizQuestion) => {
    const answer = answers[question.id];

    switch (question.type) {
      case 'text':
        return (
          <Input
            type="text"
            placeholder={question.placeholder || 'Digite sua resposta'}
            value={(answer as string) || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            className="h-12 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-[10px]"
          />
        );

      case 'radio':
        return (
          <RadioGroup
            value={(answer as string) || ''}
            onValueChange={(value) => handleAnswer(question.id, value)}
            className="flex flex-col gap-3"
          >
            {question.options?.map((option) => (
              <div
                key={option}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                  answer === option
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                )}
                onClick={() => handleAnswer(question.id, option)}
              >
                <RadioGroupItem value={option} id={option} className="border-white/50" />
                <Label htmlFor={option} className="cursor-pointer text-white text-base">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiselect':
        const selectedOptions = (answer as string[]) || [];
        return (
          <div className="h-[220px] overflow-y-auto grid grid-cols-2 gap-2 pr-2">
            {question.options?.map((option) => {
              const isSelected = selectedOptions.includes(option);
              return (
                <div
                  key={option}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer text-xs',
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  )}
                  onClick={() => {
                    let newOptions: string[];
                    if (isSelected) {
                      newOptions = selectedOptions.filter((o) => o !== option);
                    } else {
                      newOptions = [...selectedOptions, option];
                    }
                    handleAnswer(question.id, newOptions);
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    className="h-3 w-3 border-white/50 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400"
                  />
                  <Label className="cursor-pointer text-white text-xs leading-tight">{option}</Label>
                </div>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Parabéns!</h3>
        <p className="text-white/70 mb-4">
          Você será redirecionado para o WhatsApp para finalizar seu agendamento.
        </p>
        <Button
          onClick={() => {
            setShowSuccess(false);
            setCurrentIndex(0);
            setAnswers({});
          }}
          variant="ghost"
          className="text-white hover:bg-transparent hover:text-amber-400"
        >
          Refazer questionário
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <Carousel
        opts={{
          align: 'start',
          loop: false,
          watchDrag: false,
        }}
        className="w-full"
        setApi={setCarouselApi}
      >
        <CarouselContent>
          {questions.map((question, index) => (
            <CarouselItem key={question.id}>
              <div className="p-2 flex flex-col justify-center transition-all duration-300 min-h-[200px]">
                <div className="mb-2 flex-shrink-0">
                  <span className="text-amber-400 text-sm font-medium">
                    {index + 1} de {questions.length}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    {question.questionPt || question.question}
                    {question.isRequired && <span className="text-red-400 ml-1">*</span>}
                  </h3>
                </div>

                <div className="flex-1">{renderQuestion(question)}</div>
                
                <div className="flex items-center justify-between px-2 mt-auto pt-2">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={isFirstQuestion}
                    className="text-white hover:bg-transparent hover:text-amber-400 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>

                  {isLastQuestion ? (
                    <Button
                      onClick={handleComplete}
                      disabled={!canProceed() || isLoading}
                      className="bg-[#25D366] hover:bg-[#1DA851] text-white font-bold px-4 py-1 h-8 text-sm"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>Enviar via WhatsApp</>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="text-white hover:bg-transparent hover:text-amber-400 disabled:opacity-30"
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}