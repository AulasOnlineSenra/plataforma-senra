
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { subjects, teachers as initialTeachers, getMockUser, scheduleEvents as initialSchedule, users as initialUsers } from '@/lib/data';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, addMinutes, isBefore, startOfToday, getDay, setHours, setMinutes } from 'date-fns';
import { Plus, Trash2, Repeat, X, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User, Teacher, ScheduleEvent } from '@/lib/types';

interface Booking {
  id: string;
  subjectId: string;
  teacherId: string;
  start: Date;
  end: Date;
}

type Recurrence = 'none' | 'weekly' | 'biweekly' | 'monthly';

const CLASS_DURATION_MINUTES = 90;

function BookingPageComponent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');
  const studentName = searchParams.get('studentName');
  const teacherIdParam = searchParams.get('teacherId');
  const pageTitle = studentName ? `Agendar Nova Aula - ${studentName}` : 'Agendar Nova Aula';
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>(teacherIdParam || undefined);
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [timezoneDifference, setTimezoneDifference] = useState<string | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(initialSchedule);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [users, setUsers] = useState<User[]>(initialUsers);


  const { toast } = useToast();
  
  useEffect(() => {
    const updateData = () => {
        const storedSchedule = localStorage.getItem('scheduleEvents');
        if (storedSchedule) {
            setScheduleEvents(JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
        } else {
            setScheduleEvents(initialSchedule);
        }

        const storedTeachers = localStorage.getItem('teacherList');
        if (storedTeachers) {
            setTeachers(JSON.parse(storedTeachers));
        } else {
            setTeachers(initialTeachers);
        }

        const storedUsers = localStorage.getItem('userList');
        if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
        } else {
            setUsers(initialUsers);
        }
        
        if (studentId) {
            const studentUser = (JSON.parse(localStorage.getItem('userList') || '[]') as User[]).find(u => u.id === studentId);
            setCurrentUser(studentUser || getMockUser('student'));
        } else {
            const loggedInUserStr = localStorage.getItem('currentUser');
            if (loggedInUserStr) {
                setCurrentUser(JSON.parse(loggedInUserStr));
            } else {
                setCurrentUser(getMockUser('student'));
            }
        }
    };

    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, [studentId]);

  const handleClearSelections = () => {
    setSelectedSubject(undefined);
    setSelectedTeacher(undefined);
    setSelectedDates([]);
    setSelectedTime(undefined);
    setRecurrence('none');
  };

  const isConflict = (newBooking: Booking, studentId: string): boolean => {
    const allExistingEvents: (Booking | ScheduleEvent)[] = [...scheduleEvents, ...bookings];

    return allExistingEvents.some(existingBooking => {
      // Check if the event is relevant (involves the same teacher or student)
      const isTeacherBusy = 'teacherId' in existingBooking && existingBooking.teacherId === newBooking.teacherId;
      const isStudentBusy = ('studentId' in existingBooking && existingBooking.studentId === studentId);
      
      if (!isTeacherBusy && !isStudentBusy) {
        return false;
      }

      const newStarts = newBooking.start.getTime();
      const newEnds = newBooking.end.getTime();
      const existingStarts = new Date((existingBooking as any).start).getTime();
      const existingEnds = new Date((existingBooking as any).end).getTime();

      // Check for overlap: (StartA < EndB) and (EndA > StartB)
      return (newStarts < existingEnds && newEnds > existingStarts);
    });
  }

  const handleAddBooking = () => {
    if (
      !selectedSubject ||
      !selectedTeacher ||
      !selectedDates ||
      selectedDates.length === 0 ||
      !selectedTime ||
      !currentUser
    ) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description:
          'Por favor, selecione disciplina, professor, pelo menos uma data e um horário.',
      });
      return;
    }

    const newBookings: Booking[] = [];
    const today = startOfToday();
    let conflictFound = false;

    // Create bookings for all selected dates first
    selectedDates.forEach(date => {
        if (conflictFound) return;
        
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const startDate = new Date(date);
        startDate.setHours(hours, minutes, 0, 0);

        if (isBefore(startDate, new Date())) {
            toast({
                variant: 'destructive',
                title: 'Data/Horário Inválido',
                description: `Não é possível agendar aulas em horários passados. (${format(startDate, 'dd/MM/yyyy HH:mm')})`,
            });
            conflictFound = true;
            return;
        }

        const endDate = addMinutes(startDate, CLASS_DURATION_MINUTES);

        const newBooking: Booking = {
            id: `booking-${startDate.getTime()}-${Math.random()}`,
            subjectId: selectedSubject,
            teacherId: selectedTeacher,
            start: startDate,
            end: endDate,
        };

        if (isConflict(newBooking, currentUser.id)) {
             toast({
                variant: 'destructive',
                title: 'Conflito de Horário',
                description: `Já existe uma aula agendada (sua ou do professor) que entra em conflito com ${format(startDate, "dd/MM 'às' HH:mm")}.`,
            });
            conflictFound = true;
        } else {
             newBookings.push(newBooking);
        }
    });

    if (conflictFound) {
        return; // Stop if any initial conflict is found
    }

    // Handle recurrence if selected
    if (recurrence !== 'none') {
      const repeatCount = 4; // Add 4 more weeks/months of classes
      const originalDates = [...newBookings];
      let recurrenceConflictFound = false;

      for (let i = 1; i <= repeatCount; i++) {
        if (recurrenceConflictFound) break;

        originalDates.forEach((booking) => {
          if (recurrenceConflictFound) return;

          const newStartDate = new Date(booking.start);
          if (recurrence === 'weekly') {
            newStartDate.setDate(newStartDate.getDate() + 7 * i);
          } else if (recurrence === 'biweekly') {
            newStartDate.setDate(newStartDate.getDate() + 14 * i);
          } else if (recurrence === 'monthly') {
            newStartDate.setMonth(newStartDate.getMonth() + i);
          }
           const newEndDate = addMinutes(newStartDate, CLASS_DURATION_MINUTES);
           const recurringBooking: Booking = {
             ...booking,
             id: `booking-${newStartDate.getTime()}-${Math.random()}`,
             start: newStartDate,
             end: newEndDate,
           };

           if (isConflict(recurringBooking, currentUser.id) || newBookings.some(b => b.start.getTime() === recurringBooking.start.getTime())) {
                toast({
                    variant: 'destructive',
                    title: 'Conflito de Horário na Recorrência',
                    description: `Não foi possível agendar a aula recorrente em ${format(newStartDate, "dd/MM 'às' HH:mm")}.`,
                });
                recurrenceConflictFound = true;
           } else {
               newBookings.push(recurringBooking);
           }
        });
      }
    }


    setBookings((prev) => [...prev, ...newBookings].sort((a, b) => a.start.getTime() - b.start.getTime()));
    handleClearSelections();

    toast({
      title: 'Aula(s) Adicionada(s)!',
      description: `${newBookings.length} aula(s) foram adicionadas ao resumo.`,
    });
  };

  const handleRemoveBooking = (id: string) => {
    setBookings(bookings.filter((b) => b.id !== id));
  };

  const handleRepeatBooking = (booking: Booking) => {
    if (!currentUser) return;
    const newStartDate = addMinutes(booking.end, 15); // Add a small buffer
    const newBooking: Booking = {
      ...booking,
      id: `booking-${newStartDate.getTime()}-${Math.random()}`,
      start: newStartDate,
      end: addMinutes(newStartDate, CLASS_DURATION_MINUTES)
    };

    if(isConflict(newBooking, currentUser.id)) {
        toast({
            variant: 'destructive',
            title: 'Conflito de Horário',
            description: `Não foi possível duplicar a aula para ${format(newStartDate, "dd/MM 'às' HH:mm")}.`,
        });
        return;
    }

    setBookings((prev) => [...prev, newBooking].sort((a, b) => a.start.getTime() - b.start.getTime()));
    toast({
      title: 'Aula Duplicada!',
      description: 'Um novo agendamento idêntico foi adicionado.',
    });
  };

  const handleConfirmAllBookings = () => {
    if (bookings.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma aula no resumo',
        description: 'Adicione pelo menos uma aula antes de confirmar.',
      });
      return;
    }
    const newScheduleEvents = bookings.map(b => ({
      id: b.id,
      title: `Aula de ${subjects.find(s => s.id === b.subjectId)?.name}`,
      start: b.start,
      end: b.end,
      studentId: currentUser!.id,
      teacherId: b.teacherId,
      subject: subjects.find(s => s.id === b.subjectId)?.name || 'Desconhecida',
      status: 'scheduled' as 'scheduled',
    }));
    
    const updatedSchedule = [...scheduleEvents, ...newScheduleEvents];
    localStorage.setItem('scheduleEvents', JSON.stringify(updatedSchedule));
    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Agendamentos Confirmados!',
      description: `Suas ${bookings.length} aulas foram agendadas com sucesso.`,
    });
    setBookings([]);
  };

  const availableTimes = useMemo(() => {
    if (!selectedTeacher || !selectedDates || selectedDates.length === 0) {
      return [];
    }
    
    const teacher = teachers.find(t => t.id === selectedTeacher);
    if (!teacher) return [];

    const times: { start: string; end: string }[] = [];
    const date = new Date();
    // Generate time slots from 08:00, incrementing by 30 mins
    for (let h = 8; h <= 21; h++) {
        for (let m = 0; m < 60; m += 30) {
             date.setHours(h, m, 0, 0);
             const endDate = addMinutes(date, CLASS_DURATION_MINUTES);

             if(endDate.getHours() > 22 || (endDate.getHours() === 22 && endDate.getMinutes() > 0)) {
                break;
             }

             times.push({
                start: format(date, 'HH:mm'),
                end: format(endDate, 'HH:mm')
             });
        }
    }
    
    return times;
  }, [selectedTeacher, selectedDates, teachers]);
  
  useEffect(() => {
    if (!selectedTeacher || !currentUser) {
      setTimezoneDifference(null);
      return;
    }

    const teacher = teachers.find(t => t.id === selectedTeacher);
    const studentTimezone = currentUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const teacherTimezone = teacher?.timezone;

    if (teacherTimezone && studentTimezone !== teacherTimezone) {
      const now = new Date();
      const studentTime = now.toLocaleString('pt-BR', { timeZone: studentTimezone, hour: '2-digit', minute: '2-digit', hour12: false });
      const teacherTime = now.toLocaleString('pt-BR', { timeZone: teacherTimezone, hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' });
      
      setTimezoneDifference(`Atualmente são ${studentTime} para você e ${teacherTime} para o professor(a) ${teacher.name}. Os horários são mostrados na hora local do professor.`);
    } else {
      setTimezoneDifference(null);
    }
  }, [selectedTeacher, currentUser, teachers]);


  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">{pageTitle}</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Passo 1: Selecione a Disciplina e Professor
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="subject">Disciplina</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Escolha uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teacher">Professor(a) de Preferência</Label>
              <Select
                value={selectedTeacher}
                onValueChange={setSelectedTeacher}
              >
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Escolha um(a) professor(a)" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={teacher.avatarUrl}
                            alt={teacher.name}
                          />
                          <AvatarFallback>
                            {teacher.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{teacher.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             {timezoneDifference && (
              <div className="md:col-span-2">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atenção ao Fuso Horário!</AlertTitle>
                  <AlertDescription>
                    {timezoneDifference}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Passo 2: Escolha as Datas e Horários
            </CardTitle>
            <CardDescription>
              Você pode selecionar múltiplos dias no calendário. Os horários
              exibidos são baseados na disponibilidade do professor. A duração de cada aula é de {CLASS_DURATION_MINUTES} minutos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 items-start">
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={setSelectedDates}
                className="rounded-md border p-0 sm:p-3"
                locale={ptBR}
                disabled={{ before: startOfToday() }}
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
              />
            </div>
            <div className="grid gap-4 self-start">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time.start}
                    variant="outline"
                    onClick={() => setSelectedTime(time.start)}
                    className={cn(
                      'text-sm',
                      selectedTime === time.start ? 'ring-2 ring-primary' : ''
                    )}
                    disabled={!selectedTeacher || (selectedDates || []).length === 0}
                  >
                    {time.start} - {time.end}
                  </Button>
                ))}
                {availableTimes.length === 0 && selectedTeacher && (selectedDates || []).length > 0 && (
                    <p className='col-span-full text-sm text-muted-foreground'>Não há horários disponíveis para este professor no dia selecionado.</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recurrence">Repetir Agendamento</Label>
                <Select
                  value={recurrence}
                  onValueChange={(value) => setRecurrence(value as Recurrence)}
                >
                  <SelectTrigger id="recurrence">
                    <SelectValue placeholder="Não repetir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não repetir</SelectItem>
                    <SelectItem value="weekly">
                      Semanalmente (próximas 4 semanas)
                    </SelectItem>
                    <SelectItem value="biweekly">
                      Quinzenalmente (próximas 4 ocorrências)
                    </SelectItem>
                    <SelectItem value="monthly">
                      Mensalmente (próximos 4 meses)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardContent className="flex justify-end pt-4 gap-2">
            <Button variant="ghost" onClick={handleClearSelections}>
              <X className="mr-2" />
              Limpar
            </Button>
            <Button onClick={handleAddBooking}>
              Adicionar aula <Plus className="ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Passo 3: Resumo dos Agendamentos
            </CardTitle>
            <CardDescription>
              Confira as aulas adicionadas antes de confirmar. Você pode remover
              ou duplicar aulas da lista.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings
                  .sort((a, b) => a.start.getTime() - b.start.getTime())
                  .map((booking) => {
                    const subject = subjects.find(
                      (s) => s.id === booking.subjectId
                    );
                    const teacher = teachers.find(
                      (t) => t.id === booking.teacherId
                    );
                    return (
                      <div
                        key={booking.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4"
                      >
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <Label>Disciplina</Label>
                            <p className="font-semibold">{subject?.name}</p>
                          </div>
                          <div>
                            <Label>Professor(a)</Label>
                            <p className="font-semibold">{teacher?.name}</p>
                          </div>
                          <div>
                            <Label>Data e Horário</Label>
                            <p className="font-semibold">
                              {format(booking.start, 'dd/MM/yyyy', {
                                locale: ptBR,
                              })}{' '}
                              às {format(booking.start, 'HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRepeatBooking(booking)}
                            title="Repetir agendamento"
                          >
                            <Repeat className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveBooking(booking.id)}
                            title="Remover agendamento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma aula adicionada ao resumo ainda.</p>
                <p className="text-sm">
                  Use o formulário acima para começar a agendar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleConfirmAllBookings}
            disabled={bookings.length === 0}
          >
            Confirmar Todos os Agendamentos ({bookings.length})
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <BookingPageComponent />
        