
'use client';
import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { classPackages } from '@/lib/data';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClassPackage } from '@/lib/types';

const packageFeatures = [
  'Duração de 90 minutos por aula',
  'Acesso a todos os professores',
  'Material de apoio incluso',
  'Agendamento flexível',
  'Suporte via chat',
];

export default function PackagesPage() {
  const [customClasses, setCustomClasses] = useState<number>(10);

  const tiers = useMemo(() => {
    const sortedPackages = [...classPackages].sort((a, b) => a.numClasses - b.numClasses);
    return sortedPackages.map((pkg) => ({
      minClasses: pkg.numClasses,
      pricePerClass: pkg.pricePerClass,
    }));
  }, []);

  const getPriceTier = (numClasses: number): ClassPackage | undefined => {
    let bestTier = tiers[0];
    for (const tier of tiers) {
      if (numClasses >= tier.minClasses) {
        bestTier = tier;
      } else {
        break;
      }
    }
    const fullPackageInfo = classPackages.find(p => p.pricePerClass === bestTier.pricePerClass);
    return fullPackageInfo;
  };

  const calculatedPrice = useMemo(() => {
    if (customClasses <= 0) return { total: 0, pricePerClass: 0 };
    const tier = getPriceTier(customClasses);
    const pricePerClass = tier?.pricePerClass ?? tiers[0].pricePerClass;
    return {
      total: customClasses * pricePerClass,
      pricePerClass: pricePerClass,
    };
  }, [customClasses, tiers]);

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
        {classPackages.map((pkg) => (
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
              <p className="text-muted-foreground font-semibold text-lg">
                R$ {pkg.pricePerClass.toFixed(2).replace('.', ',')} / aula
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="grid gap-3 text-sm">
                <li className="flex items-center font-bold text-base">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>
                    {pkg.numClasses} {pkg.numClasses > 1 ? 'aulas' : 'aula'}
                  </span>
                </li>
                {packageFeatures.map((feature) => (
                  <li key={feature} className="flex items-center text-muted-foreground">
                    <ArrowRight className="h-4 w-4 mr-2 text-primary/50" />
                    {feature}
                  </li>
                ))}
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

      <div className="mt-12">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">Calculadora de Pacotes</CardTitle>
            <CardDescription>
              Não encontrou o pacote ideal? Monte o seu! <br/>
              O desconto é progressivo: quanto mais aulas, menor o valor por aula.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="grid gap-2 text-center sm:text-left">
                <Label htmlFor="custom-classes" className="text-lg font-medium">
                  Número de Aulas Desejado
                </Label>
                <Input
                  id="custom-classes"
                  type="number"
                  value={customClasses}
                  onChange={(e) => setCustomClasses(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-40 text-center text-lg h-12 mx-auto sm:mx-0"
                  min="1"
                />
              </div>
              <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-accent/50 text-center">
                <p className="text-muted-foreground">Valor total</p>
                <p className="text-4xl font-bold text-accent-foreground">
                  R$ {calculatedPrice.total.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-accent-foreground/80 mt-1">
                  (R$ {calculatedPrice.pricePerClass.toFixed(2).replace('.', ',')} por aula)
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button size="lg" className="w-full max-w-xs mx-auto">Comprar Pacote Personalizado</Button>
          </CardFooter>
        </Card>
      </div>

    </div>
  );
}
