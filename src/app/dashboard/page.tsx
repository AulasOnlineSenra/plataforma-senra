import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, BookCopy, Star, ArrowUpRight } from 'lucide-react';
import { getMockUser, scheduleEvents } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const user = getMockUser('student');
  const upcomingEvents = scheduleEvents
    .filter((e) => e.status === 'scheduled' && e.start > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 3);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl">
          Bem-vindo(a) de volta, {user.name.split(' ')[0]}!
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/booking">Agendar Nova Aula</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Agendadas</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 na última semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos de Aulas</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Pacote de 12 aulas ativo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Médio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8/5.0</div>
            <p className="text-xs text-muted-foreground">Baseado nas últimas 5 aulas</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Próximas Aulas</CardTitle>
              <CardDescription>
                Suas aulas agendadas para os próximos dias.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/schedule">
                Ver Todas
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disciplina</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Professor(a)
                  </TableHead>
                  <TableHead className="text-right">Data e Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="font-medium">{event.subject}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {event.teacherId === 'teacher-1' ? 'Ana Silva' : 'Carlos Lima'}
                    </TableCell>
                    <TableCell className="text-right">
                      {format(event.start, "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Feedback da Última Aula</CardTitle>
                <CardDescription>Avalie sua última aula para nos ajudar a melhorar.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center gap-4">
                <p className="font-medium">Aula de Matemática com Ana Silva</p>
                 <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                        <Button key={rating} variant="outline" size="icon" className="h-12 w-12 rounded-full text-lg hover:bg-accent">
                            {rating}
                        </Button>
                    ))}
                </div>
                 <p className="text-xs text-muted-foreground">1 (Ruim) a 5 (Excelente)</p>
            </CardContent>
            <CardFooter>
                 <Button className="w-full">Enviar Feedback</Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
