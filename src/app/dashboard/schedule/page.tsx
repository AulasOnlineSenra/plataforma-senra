'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { scheduleEvents, ScheduleEvent } from '@/lib/data';
import { format } from 'date-fns';
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
import { XCircle } from 'lucide-react';

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const { toast } = useToast();


  useEffect(() => {
    // This now safely runs only on the client
    if (typeof window !== 'undefined') {
      setDate(new Date());
    }
  }, []);

  const todayEvents = scheduleEvents.filter(
    (e) =>
      date &&
      e.start.getDate() === date.getDate() &&
      e.start.getMonth() === date.getMonth() &&
      e.start.getFullYear() === date.getFullYear()
  ).sort((a,b) => a.start.getTime() - b.start.getTime());

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

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex items-center">
          <h1 className="font-headline text-2xl md:text-3xl">Agenda de Aulas</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4 flex flex-col justify-center">
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
              <CardDescription>
                Selecione um dia para ver os detalhes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex justify-center items-center p-0">
              <Calendar
                mode="multiple"
                selected={scheduleEvents.map(e => e.start)}
                onSelect={(dates) => {
                  if (dates && dates.length > 0) {
                      setDate(dates[dates.length -1]);
                  } else {
                      setDate(undefined);
                  }
                }}
                className="p-0 sm:p-3"
                classNames={{
                  root: 'w-full',
                  months: 'w-full',
                  month: 'w-full',
                  table: 'w-full',
                  caption_label: 'font-headline text-lg mb-2',
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
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>
                Aulas para{' '}
                {date ? format(date, 'dd/MM/yyyy') : 'a data selecionada'}
              </CardTitle>
              <CardDescription>
                Resumo das suas aulas para o dia.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {todayEvents.length > 0 ? (
                todayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="font-bold">
                        {format(event.start, 'HH:mm')}
                      </span>
                    </div>
                    <div className="grid flex-1 gap-1">
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        com Prof.{' '}
                        {event.teacherId === 'teacher-1'
                          ? 'Ana Silva'
                          : 'Carlos Lima'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleCancelClick(event)}>
                        <XCircle className="h-5 w-5" />
                        <span className="sr-only">Cancelar Aula</span>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                  <p>Nenhuma aula agendada para este dia.</p>
                </div>
              )}
            </CardContent>
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
