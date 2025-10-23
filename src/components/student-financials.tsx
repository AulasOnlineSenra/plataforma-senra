
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import Link from 'next/link';

export default function StudentFinancials() {
  return (
      <Card>
        <CardHeader>
          <CardTitle>Minhas Finanças</CardTitle>
          <CardDescription>
            Gerencie seus pacotes de aulas e histórico de pagamentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum pacote de aulas ativo no momento.</p>
          </div>
           <Button asChild>
              <Link href="/dashboard/packages">Ver Pacotes</Link>
            </Button>
        </CardContent>
      </Card>
  );
}
