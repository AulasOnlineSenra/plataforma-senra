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

export default function BookingPage() {
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  const { toast } = useToast();

  const handleBooking = () => {
    if (!selectedSubject || !selectedTeacher || !selectedDate || !selectedTime) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description: 'Por favor, selecione disciplina, professor, data e horário.',
      });
      return;
    }
    // Here you would typically call an API to save the booking.
    // For this example, we'll just show a success message.
    console.log({
      subject: selectedSubject,
      teacher: selectedTeacher,
      date: selectedDate,
      time: selectedTime,
    });
    toast({
      title: 'Agendamento Confirmado!',
      description: 'Sua aula foi agendada com sucesso.',
    });
    // Reset state after booking
    setSelectedSubject(undefined);
    setSelectedTeacher(undefined);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
  };

  const availableTimes = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl">Agendar Nova Aula</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Passo 1: Selecione a Disciplina e Professor</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="subject">Disciplina</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Escolha um(a) professor(a)" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                          <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
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
            <CardTitle className="font-headline">Passo 2: Escolha o Horário</CardTitle>
            <CardDescription>
              Os horários exibidos são baseados na disponibilidade do professor.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 items-start">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                locale={ptBR}
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 self-start">
              {availableTimes.map(time => (
                  <Button 
                    key={time} 
                    variant="outline"
                    onClick={() => setSelectedTime(time)}
                    className={cn(selectedTime === time ? "ring-2 ring-primary" : "")}
                  >
                    {time}
                  </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleBooking}>Confirmar Agendamento</Button>
        </div>
      </div>
    </div>
  );
}
