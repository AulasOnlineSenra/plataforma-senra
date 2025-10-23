import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AosAgentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          AOS Agents
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Agentes de IA</CardTitle>
          <CardDescription>
            Crie, configure e monitore seus agentes de inteligência artificial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>A funcionalidade de Agentes de IA ainda não foi implementada.</p>
            <p className="text-sm">
              Em breve, você poderá gerenciar seus agentes aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
