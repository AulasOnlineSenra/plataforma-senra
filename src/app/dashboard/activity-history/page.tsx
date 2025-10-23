import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const activities = [
  { action: 'Agendou uma aula de Matemática', date: new Date() },
  { action: 'Enviou uma mensagem para Ana Silva', date: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { action: 'Atualizou o perfil', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
];

export default function ActivityHistoryPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl">
          Histórico de Atividades
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Suas Atividades Recentes</CardTitle>
          <CardDescription>
            Um registro de todas as ações realizadas na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ação</TableHead>
                <TableHead className="text-right">Data e Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{activity.action}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {format(activity.date, "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
