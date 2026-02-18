'use client';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ArrowRight, PackageOpen, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Importação do nosso motor do banco de dados
import { getPlans } from '@/app/actions/plans';

type ClassPackage = {
  id: string;
  name: string;
  numClasses: number; 
  pricePerClass: number; 
  totalPrice: number; 
  popular: boolean; 
};

const packageFeatures = [
  'Aulas individuais e personalizadas',
  'Flexibilidade de horários',
  'Professores especialistas',
  'Suporte via chat',
];

// COLOQUE O NÚMERO DO WHATSAPP AQUI (Apenas números, com o DDD)
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const url = `https://wa.me/${whatsappNumber}?text=Olá...`;

export default function PackagesPage() {
  const searchParams = useSearchParams();
  const neededCredits = searchParams.get('needed');
  
  const [classesPerWeek, setClassesPerWeek] = useState<number>(1);
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(4);
  const [classPackages, setClassPackages] = useState<ClassPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDatabasePlans = async () => {
      setIsLoading(true);
      const result = await getPlans();
      
      if (result.success && result.data) {
        const formattedPackages: ClassPackage[] = result.data.map(plan => ({
          id: plan.id,
          name: plan.name,
          numClasses: plan.lessonsCount,
          totalPrice: plan.price,
          pricePerClass: plan.price / plan.lessonsCount,
          popular: plan.isPopular
        }));
        setClassPackages(formattedPackages);
      }
      setIsLoading(false);
    };

    fetchDatabasePlans();
  }, []);

  useEffect(() => {
    if (neededCredits) {
      const credits = parseInt(neededCredits, 10);
      if (credits > 0) {
        setClassesPerWeek(credits);
        setNumberOfWeeks(1); 
        const calculator = document.getElementById('calculator');
        if (calculator) {
            setTimeout(() => calculator.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
      }
    }
  }, [neededCredits]);

  const tiers = useMemo(() => {
    const sortedPackages = [...classPackages].sort((a, b) => a.numClasses - b.numClasses);
    return sortedPackages.map((pkg, index) => ({ ...pkg, tierIndex: index }));
  }, [classPackages]);

  const getPriceTier = (numClasses: number): (ClassPackage & { tierIndex: number }) | undefined => {
    if (tiers.length === 0) return undefined;
    let bestTier = tiers[0];
    for (const tier of tiers) {
      if (numClasses >= tier.numClasses) bestTier = tier;
      else break;
    }
    return bestTier;
  };

  const calculatedPackage = useMemo(() => {
    if (classesPerWeek <= 0 || numberOfWeeks <= 0 || tiers.length === 0)
      return { total: 0, pricePerClass: 0, totalClasses: 0, tier: tiers[0] };
    const totalClasses = classesPerWeek * numberOfWeeks;
    const tier = getPriceTier(totalClasses);
    const pricePerClass = tier?.pricePerClass ?? tiers[0]?.pricePerClass ?? 0;
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

  // GERADOR DE LINK DO WHATSAPP PARA OS PACOTES NORMAIS
  const getWhatsAppLink = (pkg: ClassPackage) => {
    const text = `Olá! Gostaria de adquirir o *${pkg.name}* (${pkg.numClasses} aulas) no valor de R$ ${pkg.totalPrice.toFixed(2).replace('.', ',')}. Como faço para realizar o pagamento (PIX) e liberar meu acesso?`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  // GERADOR DE LINK DO WHATSAPP PARA A CALCULADORA
  const getCalculatorWhatsAppLink = () => {
    const text = `Olá! Fiz uma simulação na plataforma e gostaria de adquirir um *Pacote Personalizado* com ${calculatedPackage.totalClasses} aulas totais, no valor de R$ ${calculatedPackage.total.toFixed(2).replace('.', ',')}. Como faço para realizar o pagamento e liberar meu acesso?`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse">Carregando vitrine de pacotes...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex flex-col items-center text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Pacotes de Aulas</h1>
        <p className="max-w-2xl text-muted-foreground mt-2">Escolha o pacote ideal, envie uma mensagem para o nosso suporte e libere seu acesso na hora.</p>
      </div>

      {classPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl max-w-4xl mx-auto w-full">
           <PackageOpen className="w-16 h-16 opacity-20 mb-4" />
           <p className="text-lg font-medium">Os pacotes estão sendo atualizados.</p>
           <p className="text-sm">Volte em instantes para ver as novas ofertas.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8 max-w-7xl mx-auto">
            {classPackages.map((pkg) => (
              <Card key={pkg.id} className={cn('flex flex-col relative', pkg.popular ? 'border-brand-yellow border-2 ring-2 ring-brand-yellow/20 shadow-lg scale-105 z-10' : '')}>
                <CardHeader className="items-center text-center pt-8">
                  {pkg.popular && (
                    <div className="absolute -top-4 text-sm font-bold bg-brand-yellow text-slate-900 px-4 py-1 rounded-full shadow-sm uppercase tracking-wide">Mais Popular</div>
                  )}
                  <CardTitle className="font-headline text-2xl text-slate-800">{pkg.name}</CardTitle>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-5xl font-extrabold text-slate-900">R${pkg.totalPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <p className="text-slate-500 font-semibold text-lg mt-1">R$ {pkg.pricePerClass.toFixed(2).replace('.', ',')} / aula</p>
                </CardHeader>
                <CardContent className="flex-1 mt-4">
                  <ul className="grid gap-4 text-sm bg-slate-50 rounded-xl p-5">
                    <li className="flex items-center font-bold text-base text-slate-800">
                      <Check className="h-5 w-5 mr-3 text-green-500" />
                      <span>{pkg.numClasses} {pkg.numClasses > 1 ? 'aulas garantidas' : 'aula garantida'}</span>
                    </li>
                    {packageFeatures.map((feature) => (
                      <li key={feature} className="flex items-center text-slate-600 font-medium">
                        <ArrowRight className="h-4 w-4 mr-3 text-brand-yellow" />{feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-3 px-6 pb-8 pt-0">
                  <Button asChild className="w-full h-12 text-base font-bold bg-[#25D366] text-white hover:bg-[#1DA851] shadow-md transition-all">
                    <a href={getWhatsAppLink(pkg)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-5 h-5 mr-2" /> Comprar via WhatsApp
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-16" id="calculator">
            <Card className="max-w-4xl mx-auto border-slate-200 shadow-sm">
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-headline text-2xl text-slate-800">Calculadora de Pacotes</CardTitle>
                <CardDescription className="text-base mt-2">Não encontrou o pacote ideal? Monte o seu! O desconto é progressivo.</CardDescription>
              </CardHeader>
              <CardContent className="grid lg:grid-cols-2 items-center justify-center gap-8 text-center p-6 md:p-8">
                <div className="grid grid-cols-1 gap-8 items-center bg-slate-50 p-6 rounded-2xl">
                  <div className="grid gap-3 text-center">
                    <Label htmlFor="classes-per-week" className="text-sm font-bold text-slate-700 uppercase tracking-wider">Aulas por Semana</Label>
                    <Input id="classes-per-week" type="number" value={classesPerWeek} onChange={(e) => setClassesPerWeek(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-32 text-center text-xl font-bold h-14 mx-auto border-slate-300 focus:border-brand-yellow focus:ring-brand-yellow" min="1" />
                  </div>
                  <div className="grid gap-3 text-center">
                    <Label htmlFor="number-of-weeks" className="text-sm font-bold text-slate-700 uppercase tracking-wider">Durante</Label>
                    <Select value={String(numberOfWeeks)} onValueChange={(value) => setNumberOfWeeks(Number(value))}>
                      <SelectTrigger className="w-48 text-lg font-medium h-14 mx-auto justify-center border-slate-300 focus:ring-brand-yellow">
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 8, 12, 16, 24].map((w) => (
                          <SelectItem key={w} value={String(w)} className="text-base font-medium">{w} {w > 1 ? 'semanas' : 'semana'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/30 text-center min-h-[250px]">
                  <p className="text-slate-700 font-bold uppercase tracking-wider text-sm mb-2">{calculatedPackage.totalClasses} aulas no total</p>
                  <p className="text-5xl font-extrabold text-slate-900 my-2">R$ {calculatedPackage.total.toFixed(2).replace('.', ',')}</p>
                  <p className="text-slate-600 font-medium bg-white px-3 py-1 rounded-full text-sm shadow-sm">R$ {calculatedPackage.pricePerClass.toFixed(2).replace('.', ',')} por aula</p>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2 pt-2 pb-8">
                <Button asChild size="lg" className="w-full max-w-sm mx-auto h-14 text-lg font-bold bg-[#25D366] text-white hover:bg-[#1DA851] shadow-md transition-transform hover:scale-105">
                  <a href={getCalculatorWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-5 h-5 mr-2" /> Contratar via WhatsApp
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}