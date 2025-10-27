
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SimuladosPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Simulados
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Criar e Gerenciar Simulados</CardTitle>
          <CardDescription>
            Crie simulados personalizados para seus alunos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>
              A funcionalidade de simulados ainda não foi implementada.
            </p>
            <p className="text-sm">
              Em breve, você poderá criar e gerenciar simulados para seus alunos aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
