'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ArrowRight, PackageOpen, MessageCircle, CalendarClock, TrendingUp, Trophy, Medal, Rocket, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getPlans } from '@/app/actions/plans';
import { getSettings } from '@/app/actions/settings';

type ClassPackage = {
  id: string;
  name: string;
  numClasses: number;
  pricePerClass: number;
  totalPrice: number;
  popular: boolean;
  features: string[];
};

const DEFAULT_FEATURES = [
  'Aulas individuais e personalizadas',
  'Flexibilidade de horários',
  'Professores especialistas',
  'Suporte via chat',
];

const DEFAULT_WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

function PackagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const neededCredits = searchParams?.get('needed');

  const [classesPerWeek, setClassesPerWeek] = useState<number>(1);
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(4);
  const [classPackages, setClassPackages] = useState<ClassPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);

  useEffect(() => {
    const fetchDatabasePlans = async () => {
      setIsLoading(true);
      const [plansResult, settingsResult] = await Promise.all([getPlans(), getSettings()]);

      if (plansResult.success && plansResult.data) {
        const formattedPackages: ClassPackage[] = plansResult.data.map((plan) => {
          let planFeatures: string[] = [];
          try {
            planFeatures = JSON.parse(plan.features || '[]');
          } catch {
            planFeatures = [];
          }
          return {
            id: plan.id,
            name: plan.name,
            numClasses: plan.lessonsCount,
            totalPrice: plan.price,
            pricePerClass: plan.price / plan.lessonsCount,
            popular: plan.isPopular,
            features: planFeatures.length > 0 ? planFeatures : DEFAULT_FEATURES,
          };
        });
        setClassPackages(formattedPackages);
      }

      if (settingsResult.success && settingsResult.data) {
        const normalizedNumber = (settingsResult.data.whatsapp || '').replace(/\D/g, '');
        if (normalizedNumber) {
          setWhatsappNumber(normalizedNumber);
        }
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
    if (classesPerWeek <= 0 || numberOfWeeks <= 0 || tiers.length === 0) {
      return { total: 0, pricePerClass: 0, totalClasses: 0, tier: tiers[0] };
    }

    const totalClasses = classesPerWeek * numberOfWeeks;
    const tier = getPriceTier(totalClasses);
    const pricePerClass = tier?.pricePerClass ?? tiers[0]?.pricePerClass ?? 0;
    return {
      total: totalClasses * pricePerClass,
      pricePerClass,
      totalClasses,
      tier,
    };
  }, [classesPerWeek, numberOfWeeks, tiers]);

  const handleWhatsAppClick = (text: string) => {
    const targetWhatsapp = whatsappNumber || DEFAULT_WHATSAPP_NUMBER;
    const url = `https://wa.me/${targetWhatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const getCalculatorWhatsAppText = () => {
    return `Olá! Fiz uma simulação na plataforma e gostaria de adquirir um *Pacote Personalizado* com ${calculatedPackage.totalClasses} aulas totais, no valor de R$ ${calculatedPackage.total.toFixed(2).replace('.', ',')}. Como faço para realizar o pagamento e liberar meu acesso?`;
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center text-slate-400 font-medium animate-pulse">Carregando vitrine de pacotes...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-8 lg:gap-12">
      {/* CABEÇALHO */}
      <div className="flex flex-col items-center text-center mt-4">
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Pacotes de Aulas</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-500">
          Escolha o pacote ideal, envie uma mensagem para o nosso suporte e libere seu acesso imediatamente.
        </p>
      </div>

      {classPackages.length === 0 ? (
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-24 text-slate-500">
          <PackageOpen className="mb-4 h-16 w-16 text-slate-300" />
          <p className="text-xl font-bold text-slate-700">Vitrine em atualização</p>
          <p className="text-base text-slate-500 mt-1">Volte em instantes para ver nossas novas ofertas.</p>
        </div>
      ) : (
        <>
          {/* GRID DE PACOTES */}
          <div className="mx-auto mt-4 grid max-w-7xl gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3 items-center">
            {classPackages.map((pkg, index) => {
              const icons = [CalendarClock, TrendingUp, Trophy];
              const IconComponent = icons[index] || PackageOpen;
              const buttonTexts = ['Comprar Agora', 'Quero evoluir mais rápido', 'Quero minha aprovação'];
              const buttonText = buttonTexts[index] || 'Comprar Agora';
              return (
              <Card
                key={pkg.id}
                className={cn(
                  'relative flex flex-col rounded-3xl bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(245,176,0,0.9)]',
                  pkg.popular
                    ? 'z-10 border-2 border-brand-yellow shadow-lg scale-100 lg:scale-105'
                    : 'border border-slate-200 shadow-sm'
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand-yellow px-6 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 shadow-sm">
                    Mais Popular
                  </div>
                )}
                
                <CardHeader className="items-center pt-10 text-center pb-6">
                  <CardTitle className="font-headline text-xl text-slate-900 flex items-center gap-2">
                    <IconComponent className="w-[34px] h-[34px] text-brand-yellow" />
                    {pkg.name}
                  </CardTitle>
                  <p className="mt-2 text-sm font-semibold text-green-600 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Aulas ao vivo de 90 minutos
                  </p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      R$ {pkg.pricePerClass.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-base font-medium text-slate-500">/aula</span>
                  </div>
                  {index === 1 && (
                    <p className="mt-2 text-[10px] font-bold text-white bg-green-600 px-[calc(0.75rem+10px)] py-1 rounded-full inline-block">
                      Economize até <span className="text-[#f5b000]">R$180</span> em comparação à aula avulsa
                    </p>
                  )}
                  {index === 2 && (
                    <p className="mt-2 text-xs font-bold text-white bg-[#f5b000] px-7 py-1 rounded-full inline-block whitespace-nowrap">
                      Maior economia da plataforma
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="mt-0 flex-1 px-3 pb-2">
                  <ul className="grid gap-1 rounded-2xl bg-slate-50 p-5 text-sm border border-slate-100">
                    <li className="flex items-center font-medium text-slate-600">
                      <div className="rounded-full bg-green-100 p-1 mr-2">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      Pacote com <span className="font-bold text-slate-800 text-base mr-1 ml-1">{pkg.numClasses} aulas</span> +
                    </li>
                    {pkg.features.slice(0, 3).map((feature, featureIndex) => {
                      const adjustedFeature = (index >= 1 && featureIndex === 0) ? 'Plano personalizado de estudos' : feature;
                      return (
                      <li key={feature} className="flex items-start font-medium text-slate-600 text-xs pt-1">
                        <ArrowRight className="mr-2 h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                        {adjustedFeature}
                      </li>
                    )})}
                    {index >= 1 && (
                      <li className="flex items-start font-medium text-slate-600 text-xs pt-1">
                        <ArrowRight className="mr-2 h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                        Aulas individuais
                      </li>
                    )}
                    <li className="flex items-start font-medium text-slate-600 text-xs pt-1">
                      <ArrowRight className="mr-2 h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                      Plataforma digital privada
                    </li>
                    {index === 1 && (
                      <li className="flex items-start font-medium text-slate-600 text-xs pt-1">
                        <ArrowRight className="mr-2 h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                        Ideal para quem busca acompanhamento e evolução constante
                      </li>
                    )}
                    {index === 2 && (
                      <>
                        <li className="flex items-start font-medium text-slate-600 text-xs pt-1">
                          <ArrowRight className="mr-2 h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                          Acompanhamento recorrente e estratégico
                        </li>
                        <li className="flex items-start font-medium text-slate-600 text-xs pt-1">
                          <ArrowRight className="mr-2 h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                          Melhor custo por aula
                        </li>
                        <li className="flex items-start font-medium text-slate-600 text-xs pt-1">
                          <ArrowRight className="mr-2 h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                          Mais consistência = Melhores resultados
                        </li>
                        <li className="flex items-start font-medium text-slate-600 text-xs pt-1">
                          <ArrowRight className="mr-2 h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                          Ideal para que tem metas altas: Enem/Vestibulares e concursos
                        </li>
                      </>
                    )}
                    <li className="flex items-start font-medium text-slate-600 text-xs pt-1">
                      <ArrowRight className="mr-2 h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                      Atendimento rápido e humanizado
                    </li>
                  </ul>
                </CardContent>
                
                <CardFooter className="flex-col gap-1 px-6 pb-5 pt-1">
                  <Button 
                    className="h-10 w-full rounded-2xl text-sm font-bold text-white shadow-sm transition-transform bg-slate-900 hover:bg-slate-800 hover:scale-[1.02]"
                    onClick={() => {
                      localStorage.removeItem('checkoutBookings');
                      router.push(`/dashboard/checkout?needed=${pkg.numClasses}&current=0`);
                    }}
                  >
                    {index === 2 ? <><Medal className="mr-2 h-6 w-6" />Quero minha aprovação</> : index === 1 ? <><Rocket className="mr-2 h-6 w-6" />Quero evoluir mais rápido</> : <><ShoppingCart className="mr-2 h-6 w-6" />Comprar Agora</>}
                  </Button>
                  <Button
                    className="h-10 w-full rounded-2xl text-sm font-bold text-white shadow-sm transition-transform bg-[#25D366] hover:bg-[#1DA851]"
                    onClick={() => handleWhatsAppClick(`Olá! Gostaria de adquirir o *${pkg.name}* (${pkg.numClasses} aulas) no valor de R$ ${pkg.totalPrice.toFixed(2).replace('.', ',')}. Como faço para realizar o pagamento?`)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> Comprar via WhatsApp
                  </Button>
                </CardFooter>
              </Card>
              );
            })}
          </div>

          {/* CALCULADORA */}
          <div className="mt-8 lg:mt-16" id="calculator">
            <Card className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <CardHeader className="text-center pb-6 pt-10 px-8">
                <CardTitle className="font-headline text-3xl font-bold text-slate-900 tracking-tight">Calculadora de Pacotes</CardTitle>
                <CardDescription className="mt-3 text-lg text-slate-500 max-w-xl mx-auto">
                  Não encontrou o pacote ideal? Monte o seu plano personalizado. Nosso desconto é progressivo!
                </CardDescription>
              </CardHeader>
              
              <CardContent className="grid lg:grid-cols-2 items-center justify-center gap-8 text-center p-8 pt-4">
                
                <div className="grid grid-cols-1 gap-8 rounded-3xl border border-slate-100 bg-slate-50/80 p-8">
                  <div className="grid gap-3 text-center">
                    <Label htmlFor="classes-per-week" className="text-xs font-bold uppercase tracking-widest text-slate-500">Aulas por Semana</Label>
                    <Input
                      id="classes-per-week"
                      type="number"
                      value={classesPerWeek}
                      onChange={(e) => setClassesPerWeek(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="mx-auto h-16 w-32 rounded-2xl border-slate-200 text-center text-3xl font-extrabold text-slate-900 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20"
                      min="1"
                    />
                  </div>
                  
                  <div className="grid gap-3 text-center">
                    <Label htmlFor="number-of-weeks" className="text-xs font-bold uppercase tracking-widest text-slate-500">Duração</Label>
                    <Select value={String(numberOfWeeks)} onValueChange={(value) => setNumberOfWeeks(Number(value))}>
                      <SelectTrigger className="mx-auto h-16 w-48 justify-center rounded-2xl border-slate-200 text-xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-yellow/20">
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {[1, 2, 3, 4, 8, 12, 16, 24].map((w) => (
                          <SelectItem key={w} value={String(w)} className="text-lg font-medium cursor-pointer">
                            {w} {w > 1 ? 'semanas' : 'semana'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex min-h-[100%] flex-col items-center justify-center rounded-3xl bg-brand-yellow p-8 text-center shadow-inner">
                  <p className="mb-2 text-sm font-bold uppercase tracking-widest text-slate-800/70">{calculatedPackage.totalClasses} aulas no total</p>
                  <p className="my-2 text-6xl font-extrabold text-slate-900 tracking-tighter">
                    R$ {calculatedPackage.total.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="mt-4 rounded-full bg-white/50 backdrop-blur-sm px-4 py-1.5 text-sm font-bold text-slate-800">
                    Apenas R$ {calculatedPackage.pricePerClass.toFixed(2).replace('.', ',')} por aula
                  </p>
                </div>
                
              </CardContent>
              
              <CardFooter className="flex-col gap-2 pb-10 px-8 pt-0">
                <Button 
                  size="lg" 
                  className="mx-auto h-14 w-full max-w-md rounded-2xl text-lg font-bold text-white shadow-lg transition-transform bg-slate-900 hover:bg-slate-800 hover:scale-105"
                  onClick={() => {
                    localStorage.removeItem('checkoutBookings');
                    router.push(`/dashboard/checkout?needed=${calculatedPackage.totalClasses}&current=0`);
                  }}
                >
                  Comprar Agora
                </Button>
                <Button
                  size="lg"
                  className="mx-auto h-14 w-full max-w-md rounded-2xl text-lg font-bold text-white shadow-lg transition-transform bg-[#25D366] hover:bg-[#1DA851] hover:scale-105"
                  onClick={() => handleWhatsAppClick(getCalculatorWhatsAppText())}
                >
                  <MessageCircle className="mr-3 h-6 w-6" /> Contratar Pacote Personalizado
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default function PackagesPage() {
  return (
    <Suspense fallback={<div className="flex h-[50vh] items-center justify-center text-slate-400 font-medium animate-pulse">Carregando vitrine de pacotes...</div>}>
      <PackagesContent />
    </Suspense>
  );
}