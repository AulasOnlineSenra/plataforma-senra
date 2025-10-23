'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { scheduleEvents, ScheduleEvent, users } from '@/lib/data';
import { format, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { XCircle, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('day');


  useEffect(() => {
    // This now safely runs only on the client
    if (typeof window !== 'undefined') {
      setDate(new Date());
    }
  }, []);

  const filteredEvents = useMemo(() => {
    if (!date) return [];

    if (filterType === 'day') {
        return scheduleEvents.filter(
            (e) =>
              e.start.getDate() === date.getDate() &&
              e.start.getMonth() === date.getMonth() &&
              e.start.getFullYear() === date.getFullYear()
        ).sort((a,b) => a.start.getTime() - b.start.getTime());
    }

    let interval;
    if (filterType === 'week') {
        interval = {
            start: startOfWeek(date, { locale: ptBR }),
            end: endOfWeek(date, { locale: ptBR }),
        };
    } else { // month
        interval = {
            start: startOfMonth(date),
            end: endOfMonth(date),
        };
    }
    
    return scheduleEvents
        .filter(e => isWithinInterval(e.start, interval))
        .sort((a,b) => a.start.getTime() - b.start.getTime());

  }, [date, filterType]);

  const handleCancelClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedEvent) {
        // Here you would typically call an API to cancel the event.
        console.log("Cancelling event:", selectedEvent.id);
        toast({
            title: "Aula Cancelada",
            description: `A aula de ${selectedEvent.subject} foi cancelada.`,
        });
        // You might want to update the state to reflect the cancellation
    }
    setIsCancelDialogOpen(false);
    setSelectedEvent(null);
  };

  const getStudentById = (studentId: string): User | undefined => {
    // This is a mock function. In a real app, you'd fetch this from your data source.
    const allUsers = [...users];
    return allUsers.find(u => u.id === studentId);
  }

  const getCardDescription = () => {
    if (!date) return 'Resumo das suas aulas para o período selecionado.';
    const classCount = filteredEvents.length;
    const pluralize = (count: number) => count === 1 ? 'aula agendada' : 'aulas agendadas';

    if (filterType === 'day') return `${classCount} ${pluralize(classCount)} para ${format(date, 'dd/MM/yyyy')}`;
    if (filterType === 'week') {
      const start = startOfWeek(date, { locale: ptBR });
      const end = endOfWeek(date, { locale: ptBR });
      return `${classCount} ${pluralize(classCount)} de ${format(start, 'dd/MM')} a ${format(end, 'dd/MM/yyyy')}`;
    }
    if (filterType === 'month') {
      return `${classCount} ${pluralize(classCount)} para ${format(date, 'MMMM \'de\' yyyy', { locale: ptBR })}`;
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex items-center">
          <h1 className="font-headline text-2xl md:text-3xl">Agenda de Aulas</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-3 flex flex-col justify-center">
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
              <CardDescription>
                Selecione um dia para ver os detalhes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex justify-center items-center p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-0 sm:p-3"
                classNames={{
                  root: 'w-full',
                  months: 'w-full',
                  month: 'w-full',
                  table: 'w-full',
                  caption_label: 'font-headline text-lg mb-4',
                  head_row: 'w-full flex',
                  head_cell: 'flex-1',
                  row: 'w-full flex mt-2',
                  cell: 'flex-1',
                }}
                locale={ptBR}
                modifiers={{
                  scheduled: scheduleEvents.map((e) => e.start),
                }}
                modifiersStyles={{
                  scheduled: {
                    color: 'hsl(var(--primary-foreground))',
                    backgroundColor: 'hsl(var(--primary))',
                  },
                }}
              />
            </CardContent>
          </Card>
          <Card className="lg:col-span-4">
            <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)} className="w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="grid gap-1">
                  <CardTitle>
                    Resumo de Aulas
                  </CardTitle>
                  <CardDescription>
                    {getCardDescription()}
                  </CardDescription>
                </div>
                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                    <TabsTrigger value="day">Dia</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
                    const student = getStudentById(event.studentId);
                    return (
                        <div
                        key={event.id}
                        className="flex items-center gap-4 rounded-lg border p-3"
                      >
                        <Avatar className='h-12 w-12'>
                            <AvatarImage src={student?.avatarUrl} alt={student?.name} />
                            <AvatarFallback>{student ? student.name.charAt(0) : '?'}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 gap-1">
                          <p className="font-semibold">{event.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{student?.name}</span>
                          </div>
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{format(event.start, 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleCancelClick(event)}>
                            <XCircle className="h-5 w-5" />
                            <span className="sr-only">Cancelar Aula</span>
                        </Button>
                      </div>
                    )
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                  <p>Nenhuma aula agendada para este período.</p>
                </div>
              )}
            </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
                  <AlertDialogDescription>
                      Você tem certeza que deseja cancelar esta aula?
                      Se o cancelamento for feito até 2 horas antes do início da aula, não haverá custo para reagendá-la.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Sim, cancelar
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
