import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Target, Users, Percent } from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Marketing
        </h1>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custos com Anúncios
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 12.543,00</div>
              <p className="text-xs text-muted-foreground">
                +20.1% em relação ao mês passado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custos com Equipe de Marketing
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 8.750,00</div>
              <p className="text-xs text-muted-foreground">
                Salários e ferramentas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Comissões Pagas
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 4.890,50</div>
              <p className="text-xs text-muted-foreground">
                Equipes orgânico e pago
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                ROI de Campanhas
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">350%</div>
              <p className="text-xs text-muted-foreground">
                Retorno sobre o investimento
              </p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes das Comissões</CardTitle>
            <CardDescription>
              Valores pagos por categoria de equipe de marketing.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Equipe de Marketing Orgânico</h3>
              <p className="text-2xl font-bold mt-1">R$ 2.150,00</p>
              <p className="text-xs text-muted-foreground">
                Baseado em performance e metas atingidas.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Equipe de Marketing Pago</h3>
              <p className="text-2xl font-bold mt-1">R$ 2.740,50</p>
              <p className="text-xs text-muted-foreground">
                Comissões sobre o resultado das campanhas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
