'use client';

import { useState, useEffect } from 'react';
import { getSettings } from '@/app/actions/settings';
import { 
  Target, 
  User, 
  TrendingUp, 
  Monitor, 
  Star, 
  Users, 
  ShieldCheck, 
  Trophy, 
  Calendar, 
  ClipboardCheck,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';

const steps = [
  { num: 1, title: 'Defina seu objetivo', desc: 'Você nos conta onde quer chegar e traçamos o melhor caminho.', icon: Target },
  { num: 2, title: 'Plano e cronograma', desc: 'Criamos um plano de estudos personalizado e organizamos sua rotina diária.', icon: Calendar },
  { num: 3, title: 'Professor ideal', desc: 'Conectamos você ao professor especialista certo para o seu perfil e objetivo.', icon: User },
  { num: 4, title: 'Tudo na plataforma', desc: 'Acesso fácil a aulas, materiais, tarefas, chat e tudo que você precisa em um só lugar.', icon: Monitor, highlighted: true },
  { num: 5, title: 'Pratique e teste', desc: 'Simulados e exercícios para você fixar o que aprendeu e identificar pontos de melhoria.', icon: ClipboardCheck },
  { num: 6, title: 'Acompanhe sua evolução', desc: 'Relatórios e histórico para você ver seu progresso e manter o foco no que importa.', icon: TrendingUp },
];

const DEFAULT_WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

export default function HomeJourney() {
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await getSettings();
      if (res.success && res.data?.whatsapp) {
        setWhatsappNumber(res.data.whatsapp.replace(/\D/g, ''));
      }
    };
    fetchSettings();
  }, []);

  const handleWhatsAppClick = () => {
    const target = whatsappNumber || DEFAULT_WHATSAPP_NUMBER;
    const url = `https://wa.me/${target}?text=${encodeURIComponent('Olá! Gostaria de organizar minha jornada de estudos.')}`;
    window.open(url, '_blank');
  };

  return (
    <section className="pt-[81px] pb-[66px] bg-white overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Title for mobile only, placed above the grid */}
        <div className="mb-6 block lg:hidden">
          <h2 className="text-4xl md:text-5xl font-black font-headline text-slate-900 leading-[1.1] tracking-tight">
            Do seu objetivo <br />
            <span className="text-amber-500">ao seu resultado</span>
          </h2>
        </div>

        {/* Bloco Superior: Copy + Mockup 3D */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-10 lg:mb-[68px]">
          <div className="order-2 lg:order-1">
            <h2 className="hidden lg:block text-4xl md:text-5xl lg:text-6xl font-black font-headline text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Do seu objetivo <br />
              <span className="text-amber-500">ao seu resultado</span>
            </h2>
            <p className="hidden lg:block text-base md:text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
              A Senra organiza cada etapa da sua jornada de estudos para que você saiba exatamente o que fazer e possa focar no que realmente importa: <span className="font-bold text-slate-900">aprender e evoluir.</span>
            </p>
            <div className="flex flex-col gap-0 -space-y-1 mt-6 lg:mt-0">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-slate-800 font-semibold text-sm lg:text-lg">Tudo conectado em um único lugar</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-slate-800 font-semibold text-sm lg:text-lg">Acompanhamento humano</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-slate-800 font-semibold text-sm lg:text-lg">Mais organização, foco e resultados</p>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2 w-full flex justify-center lg:justify-end">
            <style>{`
              .dashboard-mockup {
                transform: perspective(1200px) rotateY(-12deg) rotateX(4deg) scale(0.93);
                box-shadow: -20px 30px 60px rgba(0,0,0,0.25), -1px 1px 0px rgba(255,255,255,0.5) inset;
              }
              @media (min-width: 1024px) {
                .dashboard-mockup {
                  transform: perspective(1200px) translateX(-135px) rotateY(-12deg) rotateX(4deg) scale(0.93);
                }
              }
            `}</style>
            <div 
              className="relative w-full lg:w-[750px] lg:max-w-none lg:-mr-[150px] xl:-mr-[250px] rounded-2xl overflow-hidden bg-white border border-slate-200 dashboard-mockup"
            >
              {/* Fallback temporário para a imagem do painel, caso /images/dashboard-senra.png não exista, o alt salva. */}
              {/* É recomendado subir a screenshot real no repositório para o caminho abaixo */}
              <img 
                src="/images/dashboard-senra.png" 
                alt="Painel do Aluno Senra Aulas Online" 
                className="w-full h-auto object-cover bg-slate-100 min-h-[300px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop';
                }}
              />
            </div>
          </div>
        </div>

        {/* Bloco Central: Timeline / Jornada */}
        <div className="relative mb-12 md:mb-24">
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-6 md:mb-16 px-2 pt-[25px] md:pt-0">
            <div className="h-px bg-slate-300 w-6 sm:w-12 lg:w-32 rounded-full relative shrink-0">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300"></div>
            </div>
            <h3 className="font-black text-[11px] md:text-sm uppercase tracking-[0.1em] md:tracking-[0.2em] text-slate-900 whitespace-nowrap shrink-0">
              SUA JORNADA NA SENRA
            </h3>
            <div className="h-px bg-slate-300 w-6 sm:w-12 lg:w-32 rounded-full relative shrink-0">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300"></div>
            </div>
          </div>

          <div className="relative flex overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-6 gap-4 pb-4 lg:pb-0 pt-6 lg:pt-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 lg:mx-0 lg:px-0">
            {/* Linha pontilhada de fundo (desktop apenas) */}
            <div className="hidden lg:block absolute top-[60px] left-[8%] right-[8%] h-[2px] border-t-2 border-dashed border-amber-300 z-0 opacity-60" />
            
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.num} 
                  className={`relative z-10 flex flex-col items-center text-center py-6 px-[10px] md:p-6 lg:px-4 bg-white rounded-[20px] transition-all duration-300 w-[280px] md:min-w-[40vw] md:w-auto lg:min-w-0 snap-center shrink-0 lg:shrink
                  ${step.highlighted 
                    ? 'border-2 border-amber-500 shadow-[0_10px_30px_rgba(245,176,0,0.15)] scale-100 lg:scale-105' 
                    : 'border border-transparent'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm absolute -top-4 left-6 shadow-md
                    ${step.highlighted ? 'bg-amber-500 text-slate-900' : 'bg-amber-400 text-slate-900'}
                  `}>
                    {step.num}
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 mt-2">
                    <Icon className={`w-10 h-10 ${step.highlighted ? 'text-amber-500' : 'text-slate-800 stroke-[1.5]'}`} />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-3 text-sm leading-tight">{step.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloco Inferior: Banner de Autoridade */}
        <div className="bg-slate-950 rounded-[32px] py-[7px] px-8 lg:py-[20px] lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl overflow-hidden relative -mt-[50px] mb-[30px] z-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 w-full lg:w-auto">
            <button 
              onClick={handleWhatsAppClick}
              className="group flex items-center justify-between gap-4 sm:gap-6 bg-amber-500 hover:bg-amber-400 transition-colors rounded-[26px] md:rounded-2xl py-[3px] px-[28.5px] md:px-4 sm:pr-6 sm:pl-4 w-full sm:w-auto text-left shadow-[0_4px_20px_rgba(245,158,11,0.25)]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-slate-900">
                    <path d="M16.6 14c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.2-.5-.5-1-1.1-1.4-1.7-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.3.2-.4.1-.2 0-.4 0-.5C10 9.5 9.4 8 9.3 7.8c-.1-.2-.2-.2-.4-.2h-.3c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.1 2 3.1 4.9 4.3.7.3 1.3.5 1.7.6.6.2 1.3.2 1.8.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/>
                    <path fillRule="evenodd" d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3C8.5 21.5 10.2 22 12 22c5.5 22 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.1l-.3-.2-3.2.8.9-3.1-.2-.3C4.2 15 3.8 13.5 3.8 12c0-4.5 3.7-8.2 8.2-8.2s8.2 3.7 8.2 8.2-3.7 8.2-8.2 8.2z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-xs md:text-sm leading-tight group-hover:text-black">
                    Quero organizar minha jornada
                  </span>
                  <span className="text-slate-800 text-[11px] md:text-xs font-medium mt-0.5">
                    Falar com especialista
                  </span>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-900 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="hidden md:flex flex-col sm:flex-row gap-8 lg:gap-10 relative z-10">
            <div className="flex items-center gap-4">
              <Users className="w-7 h-7 text-amber-500 flex-shrink-0" />
              <span className="text-xs font-medium max-w-[120px] leading-snug text-slate-300">Equipe humana sempre ao seu lado</span>
            </div>
            <div className="flex items-center gap-4">
              <ShieldCheck className="w-7 h-7 text-amber-500 flex-shrink-0" />
              <span className="text-xs font-medium max-w-[120px] leading-snug text-slate-300">Acompanhamento constante</span>
            </div>
            <div className="flex items-center gap-4">
              <Trophy className="w-7 h-7 text-amber-500 flex-shrink-0" />
              <span className="text-xs font-medium max-w-[120px] leading-snug text-slate-300">Foco no que realmente importa</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
