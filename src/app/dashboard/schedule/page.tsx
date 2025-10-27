
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
import { scheduleEvents as initialScheduleEvents, ScheduleEvent, users, teachers } from '@/lib/data';
import { format, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ToastAction } from "@/components/ui/toast"
import { useToast } from '@/hooks/use-toast';
import { XCircle, Pencil, BookOpen, Archive, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SCHEDULE_STORAGE_KEY = 'scheduleEvents';

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('day');
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<ScheduleEvent | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState<string | undefined>();

  useEffect(() => {
    const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (storedSchedule) {
      // Dates are stored as strings in JSON, so we need to convert them back to Date objects
      const parsedSchedule = JSON.parse(storedSchedule).map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      setEvents(parsedSchedule);
    } else {
      setEvents(initialScheduleEvents);
    }

    // Handle hash for highlighting
    const hash = window.location.hash;
    if (hash === '#cancelled-history' || hash === '#scheduled-classes') {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.classList.add('animate-highlight');
        setTimeout(() => {
          element.classList.remove('animate-highlight');
        }, 2000); // Animation duration + buffer
      }
    }
  }, []);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDate(new Date());
    }
  }, []);

  const filteredEvents = useMemo(() => {
    if (!date) return [];
    
    let relevantEvents = events.filter(e => e.status === 'scheduled');

    if (filterType === 'day') {
        return relevantEvents.filter(
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
    
    return relevantEvents
        .filter(e => isWithinInterval(e.start, interval))
        .sort((a,b) => a.start.getTime() - b.start.getTime());

  }, [date, filterType, events]);
  
  const completedEvents = useMemo(() => {
    return events
      .filter(e => e.status === 'completed')
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [events]);

  const cancelledEvents = useMemo(() => {
    return events
      .filter(e => e.status === 'cancelled')
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [events]);


  const handleConfirmCancel = (eventId: string) => {
    const updatedEvents = events.map(e => 
      e.id === eventId ? { ...e, status: 'cancelled' } : e
    );
    setEvents(updatedEvents);
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updatedEvents));
    window.dispatchEvent(new Event('storage'));

    const event = events.find(e => e.id === eventId);
    toast({
        title: "Aula Cancelada",
        description: `A aula de ${event?.subject} foi cancelada.`,
    });
  };

  const handleCancelClick = (event: ScheduleEvent) => {
    toast({
      title: `Cancelar aula de ${event.subject}?`,
      description: 'A ação será confirmada em 5 segundos.',
      variant: 'destructive',
      duration: 5000,
      action: (
        <ToastAction altText="Confirmar" onClick={() => handleConfirmCancel(event.id)}>
          Confirmar
        </ToastAction>
      ),
    });
  };

  const handlePermanentDeleteEvent = () => {
    if (!eventToDelete) return;
    
    const updatedEvents = events.filter(e => e.id !== eventToDelete.id);
    setEvents(updatedEvents);
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updatedEvents));
    window.dispatchEvent(new Event('storage'));

    toast({
      variant: 'destructive',
      title: 'Aula Excluída',
      description: `A aula de ${eventToDelete.subject} foi excluída permanentemente.`,
    });
    setEventToDelete(null);
  };

  const getStudentById = (studentId: string): User | undefined => {
    const allUsers = [...users];
    return allUsers.find(u => u.id === studentId);
  }
  
  const getTeacherById = (teacherId: string): User | undefined => {
    return teachers.find(t => t.id === teacherId);
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
      return `${classCount} ${pluralize(classCount)} para ${format(date, "MMMM 'de' yyyy", { locale: ptBR })}`;
    }
  };
  
  const handleEditClick = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setNewDate(event.start);
    setNewTime(format(event.start, 'HH:mm'));
  };

  const handleUpdateEvent = () => {
    if (!editingEvent || !newDate || !newTime) return;

    const [hours, minutes] = newTime.split(':').map(Number);
    const updatedStartDate = new Date(newDate);
    updatedStartDate.setHours(hours, minutes, 0, 0);

    const updatedEndDate = addMinutes(updatedStartDate, 90); // Assuming 90-minute classes

    const updatedEvents = events.map(e =>
      e.id === editingEvent.id
        ? { ...e, start: updatedStartDate, end: updatedEndDate, status: 'scheduled' as 'scheduled' }
        : e
    );
    setEvents(updatedEvents);
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updatedEvents));
    window.dispatchEvent(new Event('storage'));


    toast({
      title: 'Aula Remarcada!',
      description: `A aula de ${editingEvent.subject} foi remarcada para ${format(updatedStartDate, "dd/MM/yyyy 'às' HH:mm")}.`,
    });

    setEditingEvent(null);
    setNewDate(undefined);
    setNewTime(undefined);
  };
  
  const availableTimes = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'];

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex items-center">
          <h1 className="font-headline text-2xl md:text-3xl font-bold">Agenda de Aulas</h1>
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
                  caption_label: 'font-headline text-lg mb-2',
                  head_row: 'w-full flex',
                  head_cell: 'flex-1',
                  row: 'w-full flex mt-2',
                  cell: 'flex-1',
                }}
                locale={ptBR}
                modifiers={{
                  scheduled: events.filter(e => e.status === 'scheduled').map((e) => e.start),
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
          <Card className="lg:col-span-4" id="scheduled-classes">
            <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)} className="w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="grid gap-1">
                  <CardTitle>
                    Aulas Agendadas
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
                        <div className="flex items-center gap-3 flex-1">
                            <Avatar className='h-12 w-12'>
                                <AvatarImage src={student?.avatarUrl} alt={student?.name} />
                                <AvatarFallback>{student ? student.name.charAt(0) : '?'}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1">
                              <p className="font-semibold">{student?.name}</p>
                               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{format(event.start, 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}</span>
                              </div>
                            </div>
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                          {event.title}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(event)}>
                              <Pencil className="h-5 w-5 text-muted-foreground" />
                              <span className="sr-only">Editar Aula</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleCancelClick(event)}>
                              <XCircle className="h-5 w-5" />
                              <span className="sr-only">Cancelar Aula</span>
                          </Button>
                        </div>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Histórico de Aulas Realizadas
            </CardTitle>
            <CardDescription>
              Um espelho de todas as aulas realizadas entre alunos e professores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor(a)</TableHead>
                  <TableHead>Aluno(a)</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Título da Aula</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedEvents.length > 0 ? (
                  completedEvents.map((event) => {
                    const student = getStudentById(event.studentId);
                    const teacher = getTeacherById(event.teacherId);
                    return (
                      <TableRow key={event.id}>
                        <TableCell>{teacher?.name || 'N/A'}</TableCell>
                        <TableCell>{student?.name || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{event.subject}</TableCell>
                        <TableCell>{event.title}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {format(event.start, 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhuma aula concluída ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card id="cancelled-history">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-6 w-6" />
              Histórico de Aulas Canceladas
            </CardTitle>
            <CardDescription>
              Um registro de todas as aulas que foram canceladas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor(a)</TableHead>
                  <TableHead>Aluno(a)</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Data Original</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancelledEvents.length > 0 ? (
                  cancelledEvents.map((event) => {
                    const student = getStudentById(event.studentId);
                    const teacher = getTeacherById(event.teacherId);
                    return (
                      <TableRow key={event.id}>
                        <TableCell>{teacher?.name || 'N/A'}</TableCell>
                        <TableCell>{student?.name || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{event.subject}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(event.start, 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(event)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Remarcar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setEventToDelete(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhuma aula foi cancelada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {editingEvent && (
        <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Agendamento</DialogTitle>
              <DialogDescription>
                Selecione a nova data e horário para a aula de {editingEvent.subject}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Data
                </Label>
                <div className="col-span-3">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    className="rounded-md border"
                    locale={ptBR}
                    disabled={{ before: new Date() }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Horário
                </Label>
                <div className="col-span-3">
                  <Select value={newTime} onValueChange={setNewTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimes.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleUpdateEvent}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
       <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              registro da aula cancelada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDeleteEvent}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    