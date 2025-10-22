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
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { scheduleEvents } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const todayEvents = scheduleEvents.filter(
    (e) =>
      date &&
      e.start.getDate() === date.getDate() &&
      e.start.getMonth() === date.getMonth()
  );

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl">Agenda de Aulas</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
            <CardDescription>
              Selecione um dia para ver os detalhes.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0 pt-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="p-0"
              classNames={{
                root: 'w-full',
                months: 'w-full',
                month: 'w-full',
                table: 'w-full',
                caption_label: 'font-headline',
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <span className="font-bold">
                      {format(event.start, 'HH:mm')}
                    </span>
                  </div>
                  <div className="grid gap-1">
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      com Prof.{' '}
                      {event.teacherId === 'teacher-1'
                        ? 'Ana Silva'
                        : 'Carlos Lima'}
                    </p>
                  </div>
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
  );
}
