
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const packageFeatures = [
  'Duração de 90 minutos por aula',
  'Acesso a todos os professores',
  'Material de apoio incluso',
  'Agendamento flexível',
  'Suporte via chat',
];

export default function PackagesPage() {
  const [classesPerWeek, setClassesPerWeek] = useState<number>(1);
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(4);

  const tiers = useMemo(() => {
    const sortedPackages = [...classPackages].sort(
      (a, b) => a.numClasses - b.numClasses
    );
    return sortedPackages.map((pkg, index) => ({
      ...pkg,
      tierIndex: index,
    }));
  }, []);

  const getPriceTier = (numClasses: number): (ClassPackage & { tierIndex: number }) | undefined => {
    let bestTier = tiers[0];
    for (const tier of tiers) {
      if (numClasses >= tier.numClasses) {
        bestTier = tier;
      } else {
        break;
      }
    }
    return bestTier;
  };

  const calculatedPackage = useMemo(() => {
    if (classesPerWeek <= 0 || numberOfWeeks <= 0)
      return { total: 0, pricePerClass: 0, totalClasses: 0, tier: tiers[0] };
    const totalClasses = classesPerWeek * numberOfWeeks;
    const tier = getPriceTier(totalClasses);
    const pricePerClass = tier?.pricePerClass ?? tiers[0].pricePerClass;
    return {
      total: totalClasses * pricePerClass,
      pricePerClass: pricePerClass,
      totalClasses: totalClasses,
      tier: tier,
    };
  }, [classesPerWeek, numberOfWeeks, tiers]);
  
  const getPeriodLabel = () => {
    if (numberOfWeeks % 4 === 0) {
      const months = numberOfWeeks / 4;
      return `${months} ${months > 1 ? 'meses' : 'mês'}`;
    }
    return `${numberOfWeeks} ${numberOfWeeks > 1 ? 'semanas' : 'semana'}`;
  }

  const getDiscountMessage = () => {
    if (!calculatedPackage.tier) return null;
  
    const currentTier = calculatedPackage.tier;
    const nextTierIndex = currentTier.tierIndex + 1;
  
    if (nextTierIndex < tiers.length) {
      const nextTier = tiers[nextTierIndex];
      const classesNeeded = nextTier.numClasses - calculatedPackage.totalClasses;
  
      if (classesNeeded > 0) {
        if (currentTier.numClasses === 1) {
           return (
            <span>
              Adicione mais {classesNeeded} {classesNeeded > 1 ? 'aulas' : 'aula'} para economizar{' '}
              <span className="font-bold text-green-600">
                R$ {(currentTier.pricePerClass - nextTier.pricePerClass).toFixed(2).replace('.',',')}
              </span> por aula!
            </span>
          );
        }
        return (
          <span>
            Você está no nível <span className="font-bold">{currentTier.name}</span>. Adicione mais {classesNeeded} {classesNeeded > 1 ? 'aulas' : 'aula'} para o próximo desconto!
          </span>
        );
      }
    }
  
    if (currentTier.tierIndex > 0) {
      return (
        <span className="text-green-600 font-semibold">
          Ótimo! Você atingiu um dos nossos melhores descontos!
        </span>
      );
    }
  
    return 'Nenhum desconto aplicado para aulas avulsas.';
  };

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
                  <li
                    key={feature}
                    className="flex items-center text-muted-foreground"
                  >
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
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">
              Calculadora de Pacotes
            </CardTitle>
            <CardDescription>
              Não encontrou o pacote ideal? Monte o seu! <br />
              O desconto é progressivo: quanto mais aulas, menor o valor por
              aula.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid lg:grid-cols-2 items-center justify-center gap-8 text-center p-6 md:p-8">
            <div className="grid sm:grid-cols-2 gap-6 items-center">
              <div className="grid gap-2 text-center">
                <Label htmlFor="classes-per-week" className="text-base font-bold">
                  Aulas por Semana
                </Label>
                <Input
                  id="classes-per-week"
                  type="number"
                  value={classesPerWeek}
                  onChange={(e) =>
                    setClassesPerWeek(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="w-40 text-center text-lg h-12 mx-auto"
                  min="1"
                />
              </div>
              <div className="grid gap-2 text-center">
                <Label htmlFor="number-of-weeks" className="text-base font-bold">
                  Durante
                </Label>
                <Select
                  value={String(numberOfWeeks)}
                  onValueChange={(value) => setNumberOfWeeks(Number(value))}
                >
                  <SelectTrigger className="w-40 text-lg h-12 mx-auto justify-center">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 8, 12, 16, 24].map((w) => (
                      <SelectItem key={w} value={String(w)}>
                        {w} {w > 1 ? 'semanas' : 'semana'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-accent/50 text-center min-h-[200px]">
              <p className="text-muted-foreground font-semibold">
                {calculatedPackage.totalClasses} aulas totais
              </p>
              <p className="text-4xl font-bold text-accent-foreground mt-1">
                R$ {calculatedPackage.total.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-accent-foreground/80 mt-1">
                (R$ {calculatedPackage.pricePerClass.toFixed(2).replace('.', ',')} por aula)
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Frequência: {classesPerWeek}x por semana por {getPeriodLabel()}
              </p>
              <p className="text-xs text-muted-foreground mt-3 px-2">
                {getDiscountMessage()}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 pt-6">
            <Button size="lg" className="w-full max-w-xs mx-auto">
              Comprar Pacote Personalizado
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
