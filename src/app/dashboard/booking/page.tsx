'use client';

import { useState } from 'react';
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
import { subjects, teachers } from '@/lib/data';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Plus, Trash2, Repeat, X } from 'lucide-react';

interface Booking {
  id: string;
  subjectId: string;
  teacherId: string;
  date: Date;
  time: string;
}

type Recurrence = 'none' | 'weekly' | 'biweekly' | 'monthly';

export default function BookingPage() {
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>();
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [recurrence, setRecurrence] = useState<Recurrence>('none');


  const [bookings, setBookings] = useState<Booking[]>([]);

  const { toast } = useToast();

  const handleClearSelections = () => {
    setSelectedSubject(undefined);
    setSelectedTeacher(undefined);
    setSelectedDates([]);
    setSelectedTime(undefined);
    setRecurrence('none');
  }

  const handleAddBooking = () => {
    if (
      !selectedSubject ||
      !selectedTeacher ||
      !selectedDates || selectedDates.length === 0 ||
      !selectedTime
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
    selectedDates.forEach(date => {
        newBookings.push({
             id: `booking-${date.getTime()}-${Math.random()}`,
             subjectId: selectedSubject,
             teacherId: selectedTeacher,
             date: date,
             time: selectedTime,
        });
    });

    // Handle recurrence if selected
    if (recurrence !== 'none') {
        const repeatCount = 4; // Add 4 more weeks/months of classes
        const originalDates = [...newBookings];

        for (let i = 1; i <= repeatCount; i++) {
            originalDates.forEach(booking => {
                const newDate = new Date(booking.date);
                if (recurrence === 'weekly') {
                    newDate.setDate(newDate.getDate() + 7 * i);
                } else if (recurrence === 'biweekly') {
                    newDate.setDate(newDate.getDate() + 14 * i);
                } else if (recurrence === 'monthly') {
                    newDate.setMonth(newDate.getMonth() + 1 * i);
                }

                 newBookings.push({
                    ...booking,
                    id: `booking-${newDate.getTime()}-${Math.random()}`,
                    date: newDate,
                });
            });
        }
    }


    setBookings((prev) => [...prev, ...newBookings]);
    // Reset fields for next booking
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
    const newBooking: Booking = {
      ...booking,
      id: `booking-${Date.now()}-${Math.random()}`,
    };
    setBookings((prev) => [...prev, newBooking]);
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
    // Here you would typically call an API to save the bookings.
    console.log('Confirming bookings:', bookings);
    toast({
      title: 'Agendamentos Confirmados!',
      description: `Suas ${bookings.length} aulas foram agendadas com sucesso.`,
    });
    // Reset state after booking
    setBookings([]);
  };

  const availableTimes = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl">Agendar Nova Aula</h1>
      </div>

      <div className="grid gap-6">
        {/* Step 1 & 2 */}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Passo 2: Escolha as Datas e Horários
            </CardTitle>
            <CardDescription>
              Você pode selecionar múltiplos dias no calendário. Os horários
              exibidos são baseados na disponibilidade do professor.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 items-start">
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={setSelectedDates}
                className="rounded-md border"
                locale={ptBR}
              />
            </div>
            <div className="grid gap-4 self-start">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableTimes.map((time) => (
                    <Button
                        key={time}
                        variant="outline"
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                        selectedTime === time ? 'ring-2 ring-primary' : ''
                        )}
                    >
                        {time}
                    </Button>
                    ))}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="recurrence">Repetir Agendamento</Label>
                    <Select value={recurrence} onValueChange={(value) => setRecurrence(value as Recurrence)}>
                        <SelectTrigger id="recurrence">
                            <SelectValue placeholder="Não repetir" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Não repetir</SelectItem>
                            <SelectItem value="weekly">Semanalmente (próximas 4 semanas)</SelectItem>
                            <SelectItem value="biweekly">Quinzenalmente (próximas 4 ocorrências)</SelectItem>
                            <SelectItem value="monthly">Mensalmente (próximos 4 meses)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </CardContent>
          <CardContent className="flex justify-end pt-4 gap-2">
            <Button variant="ghost" onClick={handleClearSelections}>
                <X className='mr-2' />
                Limpar
            </Button>
            <Button onClick={handleAddBooking}>
              Adicionar aula <Plus className="ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Step 3: Summary */}
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
                {bookings.sort((a,b) => a.date.getTime() - b.date.getTime()).map((booking) => {
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
                            {format(booking.date, 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}{' '}
                            às {booking.time}
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
