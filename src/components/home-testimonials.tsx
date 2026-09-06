'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Star, MessageCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const WhatsappIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const whatsappTestimonials = [
  {
    id: 1,
    name: "Pai do Enzo",
    profile: "Concurso",
    source: "WhatsApp",
    text: "Contratar o suporte das Aulas Online Senra foi fundamental para a preparação do Enzo. Estávamos com o tempo muito curto para a prova do Pedro II e uma rotina super corrida, mas o professor Luiz Fernando foi excelente, dominando totalmente o conteúdo do edital e focando nas provas anteriores. A plataforma facilitou muito a nossa rotina de agendamentos e o atendimento foi sempre impecável. O resultado de todo esse esforço e direcionamento não podia ser melhor: o Enzo passou no Pedro II e também no Santo Inácio!",
    date: "Hoje",
    audioUrl: "/audio/Pai_do_Enzo.mp3"
  },
  {
    id: 2,
    name: "Jéssica C.",
    profile: "Vestibular",
    source: "WhatsApp",
    text: "A equipe Senra é maravilhosa! Amei o atendimento logo na nossa primeira conversa, explicou tudo direitinho e fez um direcionamento super legal. No começo eu estava bem perdida porque matemática e física eram matérias que eu não tinha aptidão, mas os professores foram incríveis. O Rodrigo era ótimo, sempre pausando para tirar dúvidas e passando exercícios fundamentais para colocar a teoria em prática, assim como o Pedro, o Rafael Kenji e o Leon. Fui firme nos estudos, focando em tudo o que precisava — especialmente em biologia, que era o meu grande foco. E o resultado dessa jornada toda e de todo o apoio dos professores foi incrível: consegui passar e já comecei a faculdade de Veterinária na Unisa!",
    date: "Ontem",
    audioUrl: "/audio/Jessica_C.ogg"
  },
  {
    id: 3,
    name: "Alessandra F.",
    profile: "ENEM",
    source: "WhatsApp",
    text: "Sou muito grata a Deus pela equipe do Senra, foram anjos na minha vida. Agora, depois de quase um ano, na reta final para prova, estou tranquila, porque fui bem instruída pelos melhores professores. Vinda de escola pública, tinha dificuldade em todas as matérias, e melhorei muito, não dá nem para acreditar. Enfim, obrigada por tudo.",
    date: "Ontem",
    audioUrl: "/audio/Alessandra.ogg"
  }
];

const videoTestimonial = {
  name: "Aluna",
  profile: "Vestibular",
  thumbnail: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop", // Placeholder real thumbnail
  videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" // Placeholder video
};

const microproofs = [
  "⭐ Mudou minha vida",
  "⭐ Aprovado na USP",
  "⭐ Finalmente criei uma rotina"
];

const BigAudioPlayer = ({ src }: { src: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const waveHeights = useMemo(() => {
    const patterns = [
      [20,30,40,60,40,80,50,30,70,90,60,40,30,50,70,40,20,40,30,20,40,60,80,50,40,60,90,70,50,40,30,50,70,80,90,60,40,30,20,40,50,70,90,60,40,30,50,80,60,40,30,50,70,90,60,40,30,20,40,50],
      [30,50,60,40,70,90,60,30,40,60,80,50,40,70,90,60,50,40,30,50,70,60,40,30,50,70,90,60,40,50,70,90,60,40,30,50,80,60,40,30,50,70,90,60,40,50,70,90,60,40,30,50,70,90,60,40,50,60,70,80],
      [50,70,40,30,20,40,60,80,90,70,50,40,60,80,90,70,50,40,30,50,70,90,60,40,30,50,70,90,60,40,50,70,90,60,40,30,50,80,60,40,30,50,70,90,60,40,30,50,70,90,60,40,30,20,40,60,80,90,70,50]
    ];
    const hash = src.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return patterns[hash % patterns.length];
  }, [src]);

  return (
    <div className="w-full flex flex-row items-center relative mt-0 md:mt-4 px-2">
      <button 
        onClick={togglePlay}
        className="relative z-10 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-amber-500 text-slate-900 rounded-full shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all hover:scale-110 hover:bg-amber-400 -translate-y-[15px] -translate-x-[25px] md:translate-y-0 md:translate-x-0"
      >
        {isPlaying ? (
          <div className="w-6 h-6 bg-slate-900 rounded-sm" />
        ) : (
          <Play className="w-8 h-8 ml-1" fill="currentColor" />
        )}
      </button>
      <div className="flex-1 flex items-center justify-center gap-[3px] h-16 w-full opacity-90 cursor-pointer relative z-0 ml-2 md:ml-4 pr-[10px] -translate-y-[15px] md:translate-y-0">
        {waveHeights.map((h, i) => {
          const isPlayed = (i / waveHeights.length) * 100 <= progress;
          return (
            <div 
              key={i} 
              className={cn(
                "flex-1 rounded-full transition-colors duration-200", 
                isPlayed ? "bg-amber-500" : "bg-slate-700"
              )} 
              style={{ height: `${h}%`, minWidth: '3px', maxWidth: '4px' }} 
            />
          );
        })}
      </div>
      <audio 
        ref={audioRef} 
        src={src} 
        onEnded={() => { setIsPlaying(false); setProgress(0); }} 
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
};

export default function HomeTestimonials() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeTestimonial = whatsappTestimonials[activeIndex] || whatsappTestimonials[0];

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const isMobile = window.innerWidth < 1024;
      const containerCenter = isMobile
        ? container.scrollLeft + container.clientWidth / 2
        : container.scrollTop + container.clientHeight / 2;
      
      let closestIndex = 0;
      let minDistance = Infinity;
      
      Array.from(container.children).forEach((child, index) => {
        const childElement = child as HTMLElement;
        const childCenter = isMobile
          ? childElement.offsetLeft + childElement.clientWidth / 2
          : childElement.offsetTop + childElement.clientHeight / 2;
        const distance = Math.abs(containerCenter - childCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });
      
      setActiveIndex(closestIndex);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll();
    }
    
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-16 lg:mb-20">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center">
          Quem já passou por aqui <span className="text-amber-500">recomenda</span>
        </h2>
        <p className="text-base sm:text-lg text-white/80 mx-auto font-medium drop-shadow-md text-center max-w-xl md:max-w-[846px]">
          Histórias <span className="hidden md:inline">reais </span>de quem encontrou na Senra uma forma mais organizada de estudar
        </p>
      </div>

      {/* Main Grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-center lg:items-start">
        
        {/* Left Column: WhatsApp */}
        <div className="w-full lg:col-span-5 relative">
          <div ref={containerRef} className="flex flex-row lg:flex-col gap-5 overflow-x-auto lg:overflow-x-hidden overflow-y-hidden lg:overflow-y-auto max-h-none lg:max-h-[386px] pb-10 pt-4 px-4 lg:px-8 -mx-4 lg:-mx-8 snap-x snap-mandatory lg:snap-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}>
            {whatsappTestimonials.map((msg, index) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={cn(
                "bg-[#dcf8c6] rounded-2xl rounded-tl-sm px-5 py-2 md:px-6 md:py-3 relative z-10 h-auto pb-[10px] group hover:-translate-y-1 transition-all duration-300 mr-4 lg:mr-[20px] w-[85vw] sm:w-[400px] lg:w-auto shrink-0 snap-center lg:snap-align-none",
                activeIndex === index 
                  ? "border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.8)] scale-[1.02]" 
                  : "border-2 border-transparent shadow-sm opacity-80"
              )}
            >
              {/* WhatsApp Tail */}
              <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-[#dcf8c6] border-l-[10px] border-l-transparent"></div>
              
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-row items-baseline gap-2">
                  <h4 className="font-bold text-slate-900 text-base">{msg.name}</h4>
                  <span className="text-[10px] font-semibold text-emerald-700">{msg.profile}</span>
                </div>
                <div className="flex items-center text-[#25D366] opacity-90">
                  <WhatsappIcon className="w-[18px] h-[18px]" />
                </div>
              </div>
              <p className="text-slate-800 text-[12px] leading-relaxed mb-2 pr-[20px]">
                "{msg.text}"
              </p>
              <div className="text-right text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                {msg.date}
              </div>
            </motion.div>
          ))}
          </div>
        </div>

        {/* Right Column: Audio */}
        <div className="w-full lg:col-span-7 flex flex-col items-center lg:items-start">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            {/* Audio Box */}
            <div 
              className="relative w-full rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-slate-900 py-[10px] px-8 md:p-12 flex flex-col justify-center gap-3 md:gap-6"
            >
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left mb-[10px] md:mb-0">
                <div className="flex flex-col justify-center">
                  <h3 className="text-white font-black text-[21px] md:text-3xl drop-shadow-md">
                    {(activeTestimonial as any).audioUrl ? "Ouça este depoimento" : "Mensagem de texto"}
                  </h3>
                  <p className="text-amber-400 text-[13px] md:text-lg font-semibold mt-1">
                    {activeTestimonial.name} · {activeTestimonial.profile}
                  </p>
                </div>
              </div>

              <div className="hidden md:block w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
              
              {(activeTestimonial as any).audioUrl ? (
                <BigAudioPlayer key={activeTestimonial.id} src={(activeTestimonial as any).audioUrl} />
              ) : (
                <div className="w-full flex flex-col md:flex-row items-center gap-6 mt-4 opacity-50 grayscale pointer-events-none">
                  <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-slate-700 text-slate-500 rounded-full shrink-0">
                    <Play className="w-8 h-8 ml-1" fill="currentColor" />
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-[3px] h-16 w-full">
                    {[...Array(60)].map((_, i) => (
                      <div key={i} className="flex-1 bg-slate-700 rounded-full" style={{ height: `${20 + Math.random() * 40}%`, minWidth: '3px', maxWidth: '4px' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Microproofs */}
            <div className="mt-6 hidden md:flex flex-wrap gap-2 md:gap-3 justify-center lg:justify-start">
              {microproofs.map((proof, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-medium text-white/90 shadow-sm flex items-center gap-1">
                  {proof}
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>

      {/* Trust Metric */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-center md:justify-between gap-6"
      >
        <div className="flex flex-row items-center gap-3 text-left -ml-[25px] md:ml-0">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <span className="text-white font-bold text-[10px] md:text-sm mt-0.5 max-w-[150px]">Dezenas de alunos já estudaram com a Senra!</span>
        </div>

        {/* Optional subtle CTA transition */}
        <div className="text-center md:text-right">
          <p className="text-white/60 text-sm mb-1">Quer viver essa experiência também?</p>
          <a href="#planos" className="text-amber-400 font-bold hover:text-amber-300 transition-colors inline-flex items-center gap-1 text-sm group">
            Conheça a Senra <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </motion.div>

    </div>
  );
}