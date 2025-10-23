
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function TeacherFinancials() {
  return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Receitas</CardTitle>
          <CardDescription>
            Aqui você pode ver um resumo de suas receitas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>A funcionalidade de receitas ainda não foi implementada.</p>
          </div>
        </CardContent>
      </Card>
  );
}
