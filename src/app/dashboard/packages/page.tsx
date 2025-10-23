import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { classPackages } from '@/lib/data';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const packageFeatures = [
  'Duração de 90 minutos por aula',
  'Acesso a todos os professores',
  'Material de apoio incluso',
  'Agendamento flexível',
  'Suporte via chat',
];

export default function PackagesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex flex-col items-center text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">
          Pacotes de Aulas
        </h1>
        <p className="max-w-2xl text-muted-foreground mt-2">
          Escolha o pacote que melhor se adapta às suas necessidades e comece a
          aprender hoje mesmo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {classPackages.map((pkg, index) => (
          <Card
            key={pkg.id}
            className={cn(
              'flex flex-col',
              pkg.popular ? 'border-primary ring-2 ring-primary shadow-lg' : ''
            )}
          >
            <CardHeader className="items-center text-center">
              {pkg.popular && (
                <div className="text-sm font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-full mb-4 -mt-8">
                  Mais Popular
                </div>
              )}
              <CardTitle className="font-headline text-2xl">
                {pkg.name}
              </CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  R$
                  {(pkg.numClasses * pkg.pricePerClass)
                    .toFixed(2)
                    .replace('.', ',')}
                </span>
              </div>
              <p className="text-muted-foreground">
                R$ {pkg.pricePerClass.toFixed(2).replace('.', ',')} por aula
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="grid gap-3 text-sm">
                {packageFeatures.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    {feature}
                  </li>
                ))}
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <strong>{pkg.numClasses} créditos</strong> de aula
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button className="w-full">Comprar com Mercado Pago</Button>
              <Button variant="outline" className="w-full">
                Comprar com PayPal
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
