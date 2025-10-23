import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function CrmPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">CRM</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Relacionamento com o Cliente</CardTitle>
          <CardDescription>
            Informações e interações com seus clientes em um só lugar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>
              A funcionalidade de CRM ainda não foi implementada.
            </p>
            <p className="text-sm">
              Em breve, você poderá gerenciar leads, clientes e comunicações aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
