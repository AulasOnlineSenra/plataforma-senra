'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Star, MessageCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const WhatsappIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const whatsappTestimonials = [
  {
    id: 1,
    name: "Mãe da Laura",
    profile: "Reforço Escolar",
    source: "WhatsApp",
    text: "Minha filha estava perdida com tantas matérias. Depois que começou na Senra, ela finalmente criou uma rotina e as notas subiram muito!",
    date: "Hoje"
  },
  {
    id: 2,
    name: "Aluno Pedro",
    profile: "ENEM",
    source: "WhatsApp",
    text: "Eu estudava horas e não via resultado. O plano personalizado me mostrou o que eu realmente precisava revisar. Passei no ENEM!",
    date: "Ontem"
  },
  {
    id: 3,
    name: "Pai do Enzo",
    profile: "Concurso",
    source: "WhatsApp",
    text: "Precisei trocar meu filho de escola e no começo do ano ele sentiu muita a diferença de ensino, ele estava no último ano do fundamental teve muita dificuldade com Física e Matemática. Além dos professores conseguirem ajudar ele a recuperar a notas, ele ainda passou em segundo lugar no CP2. Obrigado!!!",
    date: "Ontem"
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

export default function HomeTestimonials() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-16 lg:mb-20">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center">
          Quem já passou por aqui <span className="text-amber-500">recomenda</span>
        </h2>
        <p className="text-lg text-white/80 mx-auto font-medium drop-shadow-md whitespace-nowrap text-center">
          Histórias reais de quem encontrou na Senra uma forma mais organizada de estudar
        </p>
      </div>

      {/* Main Grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-center lg:items-start">
        
        {/* Left Column: WhatsApp (Order 2 on Mobile, Order 1 on Desktop) */}
        <div className="w-full lg:col-span-5 order-2 lg:order-1 relative">
          <div className="flex flex-col gap-5 overflow-hidden max-h-[450px] lg:max-h-[386px] pb-10" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}>
            {whatsappTestimonials.map((msg, index) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="bg-[#dcf8c6] rounded-2xl rounded-tl-sm px-5 py-2 md:px-6 md:py-3 shadow-sm relative group hover:-translate-y-1 hover:shadow-md transition-all duration-300 mr-[20px]"
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

        {/* Right Column: Video (Order 1 on Mobile, Order 2 on Desktop) */}
        <div className="w-full lg:col-span-7 flex flex-col items-center lg:items-start order-1 lg:order-2">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            {/* Video Box */}
            <div 
              className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-slate-900 group"
            >
              {isVideoOpen ? (
                <video 
                  src={videoTestimonial.videoUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                />
              ) : (
                <>
                  <Image 
                    src={videoTestimonial.thumbnail} 
                    alt="Depoimento em vídeo" 
                    fill 
                    onClick={() => setIsVideoOpen(true)}
                    className="cursor-pointer object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent"></div>
                  
                  {/* Play Button Overlay */}
                  <div 
                    onClick={() => setIsVideoOpen(true)}
                    className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] group-hover:scale-110 group-hover:bg-amber-400 transition-all duration-300 mb-4">
                      <Play className="w-7 h-7 md:w-8 md:h-8 text-slate-900 ml-1 fill-current" />
                    </div>
                    <span className="font-bold text-white text-lg drop-shadow-md">Assistir depoimento</span>
                    <span className="text-white/80 text-sm font-medium mt-1">{videoTestimonial.name} · {videoTestimonial.profile}</span>
                  </div>
                </>
              )}
            </div>

            {/* Microproofs */}
            <div className="mt-6 flex flex-wrap gap-2 md:gap-3 justify-center lg:justify-start">
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
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800">
                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-white font-bold text-sm mt-0.5">+1.000 alunos já estudaram com a Senra</span>
          </div>
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