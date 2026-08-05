'use client';

import { 
  Users, Monitor, Calendar, LayoutGrid, Folder, CheckSquare, BarChart2, 
  GraduationCap, MessageCircle, User, Headphones, Heart, 
  ShieldCheck, Star, Trophy, ArrowRight, Lock, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomeTechPeople() {
  return (
    <div className="w-full bg-[#fcfcfd] py-20 overflow-hidden font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-16">

          
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Você estuda. <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Nós cuidamos de todo o resto.</span>
          </h2>
          
          <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
            Enquanto a plataforma organiza sua rotina, nossa equipe acompanha sua evolução<br className="hidden md:block" />
            para que você tenha apenas uma preocupação: <strong className="text-slate-900">aprender.</strong>
          </p>
        </div>

        {/* Main Layout Section */}
        <div className="relative flex flex-col lg:flex-row items-stretch justify-center gap-10 lg:gap-6 xl:gap-8 mb-20 max-w-6xl mx-auto">
          
          {/* LEFT PANEL: Plataforma Senra */}
          <div className="w-full lg:w-[380px] xl:w-[400px] bg-white rounded-[2rem] p-8 pb-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-10 shrink-0 flex flex-col lg:translate-x-[15px] lg:-translate-y-[30px]">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 rounded-full bg-blue-50/50 flex items-center justify-center shrink-0 border border-blue-100">
                <Monitor className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[22px] font-bold text-slate-900 leading-tight mb-1">
                  Plataforma Senra
                </h3>
                <p className="text-blue-600 text-sm font-semibold">Organização que reduz o esforço.</p>
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
                    <h4 className="font-bold text-slate-900 text-[15px] mb-0.5">{item.title}</h4>
                    <p className="text-slate-500 text-[13px] leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-2 pb-0 border-t border-slate-100 text-center">
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
                {/* Solid dot at the end */}
                <circle cx="85" cy="75" r="5" fill="#3b82f6" />
             </svg>
          </div>

          {/* CENTER COMPONENT */}
          <div className="flex flex-col items-center justify-start pt-10 shrink-0 relative z-10 w-full lg:w-auto translate-y-[90px]">
            {/* The Main Circle */}
            <div className="relative z-10 mb-8 flex items-center justify-center">
              {/* Outer dashed orbit */}
              <div className="absolute inset-[-18px] rounded-full border-[2px] border-dashed border-slate-300/80 pointer-events-none" />
              
              <div className="w-[172px] h-[172px] rounded-full bg-white border-2 border-slate-200 shadow-[0_8px_40px_rgb(0,0,0,0.06)] flex flex-col items-center justify-center relative z-10 p-6">
                <User className="w-[116px] h-[116px] text-[#2563eb] mb-2" strokeWidth={1.2} />
                <h4 className="font-black text-slate-900 text-2xl mb-1">Você</h4>
                <p className="text-[13px] font-medium text-slate-500 text-center leading-tight">
                  No centro de<br />toda a jornada.
                </p>
              </div>
            </div>
            
            {/* Shield & Text outside */}
            <div className="flex flex-row items-center gap-2 max-w-[180px]">
              <ShieldCheck className="w-6 h-6 text-slate-400 shrink-0" strokeWidth={1.5} />
              <span className="text-[12px] font-medium text-slate-500 text-left leading-tight">
                Segurança, privacidade<br/>e dados protegidos.
              </span>
            </div>
          </div>

          {/* RIGHT CONNECTOR */}
          <div className="hidden lg:flex flex-col justify-start pt-[60px] w-12 xl:w-20 relative shrink-0 z-20 -mx-8 xl:-mx-12 -translate-x-[30px] -translate-y-[30px]">
             <svg className="w-full h-32" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                {/* Solid dot on the left (at the edge of center circle) */}
                <circle cx="15" cy="75" r="5" fill="#f59e0b" />
                {/* Line going up then curving right to right panel */}
                <path d="M 15,75 L 15,45 Q 15,20 40,20 L 96,20" fill="none" stroke="#f59e0b" strokeWidth="2" />
                {/* Arrow head at the end */}
                <polygon points="96,16 104,20 96,24" fill="#f59e0b" />
             </svg>
          </div>

          {/* RIGHT PANEL: Equipe Senra */}
          <div className="w-full lg:w-[380px] xl:w-[400px] bg-white rounded-[2rem] p-8 pb-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-10 shrink-0 flex flex-col lg:-translate-x-[15px] lg:-translate-y-[30px]">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 rounded-full bg-amber-50/80 flex items-center justify-center shrink-0 border border-amber-100">
                <Users className="w-8 h-8 text-amber-500" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[22px] font-bold text-slate-900 leading-tight mb-1">
                  Equipe Senra
                </h3>
                <p className="text-amber-500 text-sm font-semibold">Acompanhamento que gera confiança.</p>
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
                    <h4 className="font-bold text-slate-900 text-[15px] mb-0.5">{item.title}</h4>
                    <p className="text-slate-500 text-[13px] leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-2 pb-0 border-t border-slate-100 text-center">
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed px-2">
                Quando surgir uma dúvida ou imprevisto, existe uma <span className="text-amber-500 font-bold">equipe de verdade</span> pronta para ajudar.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Authority Box */}
        <div className="w-full max-w-[1064px] mx-auto bg-white rounded-3xl border-2 border-blue-50 px-6 py-[10px] md:px-8 md:py-[18px] flex flex-col xl:flex-row items-center justify-between gap-8 mb-10 shadow-sm hover:border-blue-100 transition-colors -translate-y-[100px]">
          <div className="flex flex-col md:flex-row items-center gap-6 xl:w-1/2 text-center md:text-left">
            <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/20">
              <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
            </div>
            <Link href="#planos" className="w-full md:w-auto">
              <Button className="w-full md:w-auto h-auto py-3 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-2 font-bold text-base md:text-lg">
                  Conheça a plataforma na prática
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5 text-blue-100 text-[11px] font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  Ambiente seguro e confiável
                </div>
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap md:flex-nowrap justify-center gap-6 md:gap-10 xl:w-1/2 border-t xl:border-t-0 xl:border-l border-slate-100 pt-6 xl:pt-0 xl:pl-10">
            {[
              { icon: Target, label: 'Mais direção' },
              { icon: ShieldCheck, label: 'Mais segurança' },
              { icon: BarChart2, label: 'Mais evolução' },
              { icon: Trophy, label: 'Mais resultados' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-slate-800" strokeWidth={1.5} />
                </div>
                <span className="text-[7px] md:text-[9px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
