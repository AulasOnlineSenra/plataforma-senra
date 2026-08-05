'use client';

import { useState, useEffect } from 'react';
import { getSettings } from '@/app/actions/settings';
import { 
  Calendar, MessageSquare, FileCheck, GraduationCap, BarChart,
  Gift, ShieldCheck, Headset, Clock, ExternalLink, ChevronRight, Lock
} from 'lucide-react';

const DEFAULT_WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

export default function HomeFinalCTA() {
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
    const url = `https://wa.me/${target}?text=${encodeURIComponent('Olá! Quero conhecer a plataforma.')}`;
    window.open(url, '_blank');
  };

  return (
    <section className="relative overflow-hidden bg-[#020817] py-24 md:py-32 font-sans border-t border-slate-900">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Orbital lines */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-blue-500/10 -translate-x-[50%]" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-blue-500/10 translate-x-[50%]" />
        
        {/* Floating Icons (Faint) */}
        <div className="absolute top-[15%] left-[10%] opacity-[0.03]">
          <Calendar className="w-32 h-32 text-white" />
        </div>
        <div className="absolute top-[20%] right-[12%] opacity-[0.03]">
          <MessageSquare className="w-24 h-24 text-white" />
        </div>
        <div className="absolute bottom-[20%] left-[8%] opacity-[0.03]">
          <FileCheck className="w-28 h-28 text-white" />
        </div>
        <div className="absolute top-[45%] right-[5%] opacity-[0.03]">
          <GraduationCap className="w-32 h-32 text-white" />
        </div>
        <div className="absolute bottom-[10%] right-[15%] opacity-[0.03]">
          <BarChart className="w-24 h-24 text-white" />
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-4 max-w-6xl flex flex-col items-center justify-center text-center">
        {/* Headings */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
          Pare de estudar sozinho.<br />
          Comece a <span className="text-amber-500">evoluir todos os dias.</span>
        </h2>
        
        <p className="text-base md:text-lg text-slate-300 max-w-[800px] mx-auto leading-relaxed mb-16 md:mb-24">
          A Senra reúne organização, professores especialistas e<br className="hidden md:block" />
          acompanhamento humano para que você estude com mais<br className="hidden md:block" />
          <span className="text-amber-500 font-semibold">clareza, consistência</span> e <span className="text-amber-500 font-semibold">confiança</span> até alcançar seu objetivo.
        </p>

        {/* Features Grid */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0 w-full mb-16 md:mb-20">
          {/* Feature 1 */}
          <div className="flex flex-col items-center flex-1 w-full md:border-r md:border-slate-800/80 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center mb-5 shadow-lg">
              <Gift className="w-7 h-7 text-amber-500" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Aula experimental</h4>
            <p className="text-sm text-slate-400">gratuita</p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center flex-1 w-full md:border-r md:border-slate-800/80 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center mb-5 shadow-lg">
              <ShieldCheck className="w-7 h-7 text-amber-500" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Sem fidelidade</h4>
            <p className="text-sm text-slate-400">cancele quando quiser</p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center flex-1 w-full md:border-r md:border-slate-800/80 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center mb-5 shadow-lg">
              <Headset className="w-7 h-7 text-amber-500" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Atendimento humano</h4>
            <p className="text-sm text-slate-400">pelo WhatsApp</p>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col items-center flex-1 w-full px-4">
            <div className="w-16 h-16 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center mb-5 shadow-lg">
              <Clock className="w-7 h-7 text-amber-500" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Horários flexíveis</h4>
            <p className="text-sm text-slate-400">você escolhe</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col items-center w-full max-w-md mx-auto relative group">
          <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <button 
            onClick={handleWhatsAppClick}
            className="relative z-10 w-full h-[60px] bg-amber-500 hover:bg-amber-400 transition-all duration-300 hover:-translate-y-1 rounded-[20px] flex items-center justify-center gap-4 text-slate-950 shadow-[0_0_40px_rgba(245,158,11,0.25)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] border border-amber-400/50"
          >
            <ExternalLink className="w-[22px] h-[22px] stroke-[2.5]" />
            <span className="font-bold text-lg md:text-[20px] tracking-tight">Quero conhecer a plataforma</span>
            <ChevronRight className="w-6 h-6 stroke-[3] group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="flex items-center gap-2 mt-6 text-[13px] font-medium text-slate-400">
            <Lock className="w-3.5 h-3.5 opacity-70" />
            <span>Sem cartão de crédito</span>
            <span className="w-1 h-1 rounded-full bg-slate-600 mx-1.5" />
            <span>Agendamento em poucos minutos</span>
          </div>
        </div>
      </div>
    </section>
  );
}
