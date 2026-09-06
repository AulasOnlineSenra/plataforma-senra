'use client';

import { useState, useEffect } from 'react';
import { getSettings } from '@/app/actions/settings';
import { 
  Users, Monitor, Calendar, LayoutGrid, Folder, CheckSquare, BarChart2, 
  GraduationCap, MessageCircle, User, Headphones, Heart, 
  ShieldCheck, Star, Trophy, ArrowRight, Lock, Target, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const DEFAULT_WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

export default function HomeTechPeople() {
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
    <div className="w-full bg-[#fcfcfd] pt-[60px] lg:pt-20 pb-[10px] overflow-hidden font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-6 md:mb-16">

          
          <h2 className="text-[27px] md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-[1.05] md:leading-tight">
            Você estuda. <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Nós cuidamos de todo o resto.</span>
          </h2>
          
          <p className="hidden md:block text-[18px] text-slate-600 font-body max-w-3xl leading-relaxed">
            Enquanto a plataforma organiza sua rotina, nossa equipe acompanha sua evolução<br className="hidden md:block" />
            para que você tenha apenas uma preocupação: <strong className="text-slate-900">aprender.</strong>
          </p>
        </div>

        {/* Main Layout Section */}
        <div className="flex flex-col lg:flex-row items-stretch justify-center relative mb-16 gap-4 lg:gap-0 lg:max-h-[600px] lg:-translate-y-[60px]">
          
          {/* LEFT PANEL: Plataforma Senra */}
          <div className="w-full lg:w-[380px] xl:w-[400px] bg-white rounded-[2rem] p-8 pb-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-10 shrink-0 flex flex-col lg:translate-x-[15px] lg:-translate-y-[30px]">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 rounded-full bg-blue-50/50 flex items-center justify-center shrink-0 border border-blue-100">
                <Monitor className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[22px] font-bold text-slate-900 leading-tight mb-1">
                  Plataforma Senra
                </h3>
                <p className="text-blue-600 text-[10px] md:text-sm font-semibold pr-[10px] md:pr-0">Organização que reduz o esforço.</p>
              </div>
            </div>

            <div className="space-y-[12px] flex-1">
              {[
                { icon: Calendar, title: 'Agenda organizada', desc: 'Compromissos, aulas e prazos sempre à mão.', color: 'text-blue-500' },
                { icon: LayoutGrid, title: 'Cronograma personalizado', desc: 'Seu plano de estudos, do seu jeito.', color: 'text-blue-500' },
                { icon: Folder, title: 'Materiais em um único lugar', desc: 'Acesse o que precisa, quando precisar.', color: 'text-blue-500' },
                { icon: CheckSquare, title: 'Simulados e exercícios', desc: 'Pratique, teste e evolua sempre.', color: 'text-blue-500' },
                { icon: BarChart2, title: 'Histórico das aulas', desc: 'Acompanhe sua jornada completa.', color: 'text-blue-500' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="mt-0.5 shrink-0">
                    <div className="w-10 h-10 rounded-[10px] bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={1.5} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-[15px] mb-[2px]">{item.title}</h4>
                    <p className="text-slate-500 text-[9px] md:text-[13px] leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block mt-6 pt-2 pb-0 border-t border-slate-100 text-center">
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed px-4">
                Tudo o que você precisa para estudar fica organizado em um <span className="text-blue-600 font-bold">único ambiente</span>.
              </p>
            </div>
          </div>

          {/* LEFT CONNECTOR */}
          <div className="hidden lg:flex flex-col justify-start pt-[60px] w-12 xl:w-20 relative shrink-0 z-0 -mx-8 xl:-mx-12 translate-x-[30px] -translate-y-[30px]">
             <svg className="w-full h-32" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                {/* Hollow circle on the left */}
                <circle cx="4" cy="20" r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                {/* Line going right then curving down to left edge of center circle */}
                <path d="M 8,20 L 60,20 Q 85,20 85,45 L 85,75" fill="none" stroke="#3b82f6" strokeWidth="2" />
             </svg>
          </div>

          {/* CENTER COMPONENT */}
          <div className="flex flex-col items-center justify-start pt-4 lg:pt-10 shrink-0 relative z-10 w-full lg:w-auto translate-y-4 lg:translate-y-[90px]">
            {/* The Main Circle */}
            <div className="relative z-10 mb-8 flex items-center justify-center">
              {/* Outer dashed orbit */}
              <div className="absolute inset-[-18px] rounded-full border-[2px] border-dashed border-slate-300/80 pointer-events-none" />
              
              {/* Orbit Dots */}
              <div className="absolute w-[10px] h-[10px] rounded-full bg-blue-500 shadow-[0_0_0_2px_rgba(255,255,255,1)] z-20" style={{ top: '-2px', left: '19px' }} />
              <div className="absolute w-[10px] h-[10px] rounded-full bg-amber-500 shadow-[0_0_0_2px_rgba(255,255,255,1)] z-20" style={{ top: '-2px', right: '19px' }} />

              <div className="w-[172px] h-[172px] rounded-full bg-white border-2 border-slate-200 shadow-[0_8px_40px_rgb(0,0,0,0.06)] flex flex-col items-center justify-center relative z-10 p-6">
                <User className="w-[116px] h-[116px] text-[#2563eb] mb-2" strokeWidth={1.2} />
                <h4 className="font-black text-slate-900 text-2xl mb-1">Você</h4>
                <p className="text-[13px] font-medium text-slate-500 text-center leading-tight">
                  No centro de<br />toda a jornada.
                </p>
              </div>
            </div>
            
            {/* Shield & Text outside */}
            <div className="hidden md:flex relative flex-col items-center justify-start pt-[40px] w-full max-w-[260px]">
              {/* Connector */}
              <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 w-px h-[54px] bg-slate-300">
                <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full bg-slate-400 shadow-[0_0_0_2px_rgba(255,255,255,1)]"></div>
              </div>
              <div className="flex flex-row items-center gap-3 bg-white border border-slate-200 shadow-sm rounded-full px-5 py-2.5 z-10">
                <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0" strokeWidth={1.8} />
                <span className="text-[11px] font-medium text-slate-500 text-left leading-tight">
                  Segurança, privacidade<br/>e dados protegidos
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT CONNECTOR */}
          <div className="hidden lg:flex flex-col justify-start pt-[60px] w-12 xl:w-20 relative shrink-0 z-20 -mx-8 xl:-mx-12 -translate-x-[30px] -translate-y-[30px]">
             <svg className="w-full h-32" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                {/* Line going up then curving right to right panel */}
                <path d="M 15,75 L 15,45 Q 15,20 40,20 L 96,20" fill="none" stroke="#f59e0b" strokeWidth="2" />
                {/* Arrow head at the end */}
                <polygon points="96,16 104,20 96,24" fill="#f59e0b" />
             </svg>
          </div>

          {/* RIGHT PANEL: Equipe Senra */}
          <div className="w-full lg:w-[380px] xl:w-[400px] bg-white rounded-[2rem] p-8 pb-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-10 shrink-0 flex flex-col translate-y-[5px] lg:-translate-x-[15px] lg:-translate-y-[30px]">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 rounded-full bg-amber-50/80 flex items-center justify-center shrink-0 border border-amber-100">
                <Users className="w-8 h-8 text-amber-500" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[22px] font-bold text-slate-900 leading-tight mb-1">
                  Equipe Senra
                </h3>
                <p className="text-amber-500 text-[10px] md:text-sm font-semibold pr-[10px] md:pr-0">Acompanhamento que gera confiança.</p>
              </div>
            </div>

            <div className="space-y-[12px] flex-1">
              {[
                { icon: GraduationCap, title: 'Professores especialistas', desc: 'Experiência e didática focadas no seu objetivo.', color: 'text-amber-500' },
                { icon: MessageCircle, title: 'Suporte rápido', desc: 'Respostas ágeis para dúvidas e imprevistos.', color: 'text-amber-500' },
                { icon: User, title: 'Acompanhamento individual', desc: 'Seguimos sua evolução de perto.', color: 'text-amber-500' },
                { icon: Headphones, title: 'Remarcação simples', desc: 'Flexibilidade para ajustar quando precisar.', color: 'text-amber-500' },
                { icon: Heart, title: 'Atendimento humano', desc: 'Fale com pessoas reais, sempre.', color: 'text-amber-500' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="mt-0.5 shrink-0">
                    <div className="w-10 h-10 rounded-[10px] bg-slate-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                      <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={1.5} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-[15px] mb-[2px]">{item.title}</h4>
                    <p className="text-slate-500 text-[11px] md:text-[13px] leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-2 pb-0 border-t border-slate-100 text-center">
              <p className="hidden md:block text-[13px] text-slate-500 font-medium leading-relaxed px-2">
                Quando surgir uma dúvida ou imprevisto, existe uma <span className="text-amber-500 font-bold">equipe de verdade</span> pronta para ajudar.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Authority Box */}
        <div className="w-full max-w-[1064px] mx-auto bg-white rounded-3xl border-2 border-blue-50 px-6 py-[2.5px] md:px-8 md:py-[10.5px] flex flex-col xl:flex-row items-center justify-between gap-4 md:gap-8 mb-5 lg:mb-10 shadow-sm hover:border-blue-100 transition-colors -translate-y-[60px] md:-translate-y-0">
          
          {/* Circled Stats - Swapped to top on mobile (order-1 xl:order-2) */}
          <div className="order-1 xl:order-2 flex flex-row justify-between md:flex-nowrap md:justify-center gap-2 md:gap-10 w-full xl:w-1/2 border-b xl:border-b-0 xl:border-l border-slate-100 pb-3 xl:pb-0 pt-2 md:pt-6 xl:pt-0 xl:pl-10 px-2 md:px-0">
            {[
              { icon: Target, label: 'Mais direção' },
              { icon: ShieldCheck, label: 'Mais segurança' },
              { icon: BarChart2, label: 'Mais evolução' },
              { icon: Trophy, label: 'Mais resultados' },
            ].map((stat, i) => (
              <div key={i} className={`flex flex-col items-center gap-2 text-center flex-1 md:flex-none ${stat.label === 'Mais evolução' ? 'hidden md:flex' : ''}`}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-slate-700" />
                </div>
                <span className="text-[7px] md:text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap md:whitespace-normal">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Button Container - Swapped to bottom on mobile (order-2 xl:order-1) */}
          <div className="order-2 xl:order-1 flex flex-col md:flex-row items-center justify-center gap-6 w-full xl:w-1/2 text-center md:text-left">
            <button 
              onClick={handleWhatsAppClick}
              className="group flex items-center justify-center mx-auto gap-4 sm:gap-6 bg-slate-950 hover:bg-slate-900 transition-all duration-300 hover:-translate-y-1 rounded-2xl py-[6px] px-4 sm:pr-6 sm:pl-4 w-full sm:w-auto text-left shadow-lg shadow-slate-900/20 hover:shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 md:w-10 md:h-10 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white text-[15px] md:text-lg leading-tight">
                    Conheça a plataforma na prática
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300 text-[8px] md:text-[11px] font-medium mt-[1px]">
                    <Lock className="w-3 h-3" />
                    Ambiente seguro e confiável
                  </span>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
