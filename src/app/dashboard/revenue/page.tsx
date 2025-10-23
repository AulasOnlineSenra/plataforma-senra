import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function RevenuePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl">Receitas</h1>
      </div>
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
    </div>
  );
}
