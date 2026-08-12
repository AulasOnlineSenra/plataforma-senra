'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPlans } from '@/app/actions/plans';
import { getSettings } from '@/app/actions/settings';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ArrowRight, MessageCircle, PackageOpen, CalendarClock, TrendingUp, Trophy, Medal, Rocket, ShoppingCart, Star, SlidersHorizontal, BookOpen, Target, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

type ClassPackage = {
  id: string;
  name: string;
  numClasses: number;
  pricePerClass: number;
  totalPrice: number;
  popular: boolean;
  features: string[];
};

const WhatsappIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const DEFAULT_WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

const DEFAULT_FEATURES = [
  'Aulas individuais e personalizadas',
  'Flexibilidade de horários',
  'Professores especialistas',
  'Suporte via chat',
];

export default function HomePricing() {
  const router = useRouter();
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
    return (
      <div className="flex h-[40vh] items-center justify-center text-slate-400 font-medium animate-pulse">
        Carregando planos...
      </div>
    );
  }

  if (classPackages.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-slate-500">
        <PackageOpen className="mb-4 h-12 w-12 text-slate-300" />
        <p className="text-lg font-bold text-slate-700">Em breve</p>
        <p className="text-sm">Volte em breve para ver nossas ofertas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-black font-headline text-slate-900 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap">
          Invista no ritmo que <span className="text-amber-500">faz sentido para você</span>
        </h2>
        <p className="mt-4 text-lg font-medium text-slate-600 max-w-3xl mx-auto leading-tight">
          Aulas individuais ao vivo de 90 minutos, acompanhamento personalizado e uma plataforma completa para você estudar com mais direção e consistência.
        </p>
      </div>

      <div className="grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3 items-center mx-auto w-full">
        {classPackages.map((pkg, index) => {
          const icons = [GraduationCap, BookOpen, Target];
          const IconComponent = icons[index] || PackageOpen;
          return (
          <Card
            key={pkg.id}
            className={cn(
              'relative flex flex-col rounded-3xl bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(245,176,0,0.4)]',
              pkg.popular
                ? 'z-10 border-2 border-amber-400 shadow-xl scale-100 lg:scale-105'
                : 'border border-slate-200 shadow-md'
            )}
          >
            {pkg.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-6 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-900 shadow-sm flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-current" /> MAIS ESCOLHIDO
              </div>
            )}

            <CardHeader className="pt-8 text-left pb-0">
              <div className="flex items-start gap-3 px-2">
                <div className="bg-slate-50 p-4 rounded-full text-slate-700 ring-1 ring-slate-200 shrink-0 flex items-center justify-center">
                  <IconComponent className={cn(
                    "w-10 h-10",
                    index === 0 ? "text-blue-600" : "",
                    index === 1 ? "text-amber-500" : "",
                    index >= 2 ? "text-emerald-500" : ""
                  )} />
                </div>
                <div>
                  <CardTitle className="font-headline text-lg text-slate-900 leading-[20px]">
                    {pkg.name}
                  </CardTitle>
                  <p className="mt-1 text-[11px] leading-tight font-medium text-slate-600 h-10 pr-2">
                    {index === 0 && 'Ideal para quem tem uma prova e precisa intensificar a preparação.'}
                    {index === 1 && 'Ideal para quem precisa de apoio e quer evoluir nas matérias.'}
                    {index >= 2 && 'Ideal para quem precisa de consistência e flexibilidade.'}
                  </p>
                </div>
              </div>
              
              <div className="mt-[15px] mb-[15px] flex flex-row items-center justify-center gap-2 md:gap-4 text-xs font-semibold text-slate-700 bg-slate-50 py-2 rounded-xl border border-slate-100 mx-1 whitespace-nowrap">
                <span className="flex items-center gap-1.5"><CalendarClock className="w-4 h-4 text-indigo-500" /> {pkg.numClasses} aulas por mês</span>
                <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-600" /> 90 min cada aula</span>
              </div>
            </CardHeader>

            <CardContent className="mt-0 flex-1 px-8 pb-2">
              <p className="mt-[20px] text-xs font-bold text-slate-900 mb-4">Você recebe:</p>
              <ul className="grid gap-1 text-sm">
                {['Acesso à plataforma', ...pkg.features, ...(pkg.name.toLowerCase().includes('enem') ? ['Simulados e exercícios direcionados'] : [])].map((feature) => (
                  <li key={feature} className="flex items-start font-semibold text-slate-600 text-[13px] leading-tight">
                    <Check className={cn(
                      "mr-3 h-4 w-4 shrink-0 mt-0.5 rounded-full p-0.5",
                      index === 0 ? "bg-blue-600 text-white" : "",
                      index === 1 ? "bg-amber-400 text-slate-900" : "",
                      index >= 2 ? "bg-emerald-500 text-white" : ""
                    )} />
                    {feature === 'Aulas individuais e personalizadas' ? 'Aulas ao vivo e individuais' : feature}
                  </li>
                ))}
              </ul>

              <div className="mt-[20px] border-t border-slate-100 pt-[10px]">
                <div className="flex items-baseline gap-1">
                  <span className="text-[14px] font-bold text-slate-900">R$</span>
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {pkg.pricePerClass.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[14px] font-bold text-slate-900">/aula</span>
                </div>
                <p className="mt-[3px] text-[13px] font-medium text-slate-500">
                  Total: R$ {pkg.totalPrice.toFixed(2).replace('.', ',')}/mês
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-2 px-8 pb-[12px] pt-2">
              <Button 
                className={cn(
                  "h-[38px] w-full rounded-2xl text-sm font-bold shadow-md transition-transform hover:scale-[1.02]",
                  index === 1 ? "bg-amber-500 hover:bg-amber-400 text-slate-900" : "bg-slate-900 hover:bg-slate-800 text-white"
                )}
                onClick={() => {
                  localStorage.removeItem('checkoutBookings');
                  router.push(`/dashboard/checkout?needed=${pkg.numClasses}&current=0`);
                }}
              >
                {index === 0 && 'Quero acelerar →'}
                {index === 1 && 'Quero evoluir →'}
                {index >= 2 && 'Quero começar →'}
              </Button>
              <Button
                variant="outline"
                className="h-[38px] w-full rounded-2xl text-sm font-bold text-slate-700 border-slate-200 hover:bg-slate-50"
                onClick={() => handleWhatsAppClick(`Olá! Gostaria de adquirir o *${pkg.name}* (${pkg.numClasses} aulas) no valor de R$ ${pkg.totalPrice.toFixed(2).replace('.', ',')}. Como faço para realizar o pagamento?`)}
              >
                <WhatsappIcon className="h-4 w-4 text-[#25D366]" /> Falar com a equipe
              </Button>
            </CardFooter>
          </Card>
          );
        })}
      </div>

      <div className="mt-[-20px] mb-[-20px] max-w-6xl mx-auto w-full px-4 md:px-0">
        <div className="flex flex-col xl:flex-row items-center xl:justify-start gap-[10px] xl:gap-[8px] bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-[9px] md:px-8 md:py-[17px] shadow-sm">
          
          <div className="flex flex-col md:flex-row items-center gap-5 xl:w-[384px] shrink-0 text-center md:text-left">
            <div className="bg-white p-4 rounded-full shrink-0 shadow-sm ring-1 ring-slate-100 -ml-[19px] md:-ml-[27px]">
              <SlidersHorizontal className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base leading-tight">Seu objetivo exige outro ritmo?</h4>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-snug pr-5">Monte um plano personalizado com a nossa equipe e estude no ritmo ideal para você.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 xl:gap-8 shrink-0 bg-white px-5 py-[15px] md:px-[22px] rounded-3xl border border-slate-100 shadow-sm w-full xl:w-auto justify-center xl:-ml-[35px]">
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Aulas por semana</Label>
                <Select value={String(classesPerWeek)} onValueChange={(value) => setClassesPerWeek(Number(value))}>
                  <SelectTrigger className="h-[38px] w-[113px] rounded-xl border-slate-200 text-sm font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[1, 2, 3, 4, 5].map((w) => (
                      <SelectItem key={w} value={String(w)} className="font-medium">{w} {w > 1 ? 'aulas' : 'aula'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duração (semanas)</Label>
                <Select value={String(numberOfWeeks)} onValueChange={(value) => setNumberOfWeeks(Number(value))}>
                  <SelectTrigger className="h-[38px] w-[130px] rounded-xl border-slate-200 text-sm font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[1, 2, 3, 4, 8, 12, 16, 24].map((w) => (
                      <SelectItem key={w} value={String(w)} className="font-medium">{w} {w > 1 ? 'semanas' : 'semana'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="hidden md:block w-px h-16 bg-slate-100"></div>

            <div className="flex flex-col text-center md:text-right mt-4 md:mt-0">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">R$ {calculatedPackage.total.toFixed(2).replace('.', ',')}<span className="text-sm font-bold text-slate-500">/mês</span></p>
              <p className="text-xs font-bold text-slate-500 mt-1">R$ {calculatedPackage.pricePerClass.toFixed(2).replace('.', ',')} por aula</p>
              <p className="text-[10px] text-slate-400 mt-1">*Valores sujeitos a alteração</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0 w-full xl:w-auto xl:ml-auto">
            <Button 
              className="h-[38px] px-[19px] rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-transform hover:scale-[1.02] shadow-md w-full"
              onClick={() => {
                localStorage.removeItem('checkoutBookings');
                router.push(`/dashboard/checkout?needed=${calculatedPackage.totalClasses}&current=0`);
              }}
            >
              Montar meu plano →
            </Button>
            <Button
              variant="outline"
              className="h-[38px] px-[19px] rounded-xl text-sm font-bold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 w-full"
              onClick={() => handleWhatsAppClick(getCalculatorWhatsAppText())}
            >
              <WhatsappIcon className="h-4 w-4 text-[#25D366]" /> Falar com a equipe
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}