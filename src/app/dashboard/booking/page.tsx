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

export default function BookingPage() {
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
              <Select>
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
              <Select>
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
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <Calendar
                mode="single"
                className="rounded-md border"
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 self-start">
              <Button variant="outline">09:00</Button>
              <Button variant="outline">10:00</Button>
              <Button variant="outline">11:00</Button>
              <Button variant="outline" disabled>12:00</Button>
              <Button variant="outline">14:00</Button>
              <Button variant="outline" className="ring-2 ring-primary">15:00</Button>
              <Button variant="outline">16:00</Button>
              <Button variant="outline" disabled>17:00</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg">Confirmar Agendamento</Button>
        </div>
      </div>
    </div>
  );
}
