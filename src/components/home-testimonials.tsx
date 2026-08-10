'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Star, MessageCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

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
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16 lg:mb-20">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Quem já passou por aqui <span className="text-amber-500">recomenda</span>
        </h2>
        <p className="text-lg text-white/80 max-w-2xl mx-auto font-medium drop-shadow-md whitespace-nowrap">
          Histórias reais de quem encontrou na Senra uma forma mais organizada de estudar
        </p>
      </div>

      {/* Main Grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-center lg:items-start">
        
        {/* Left Column: WhatsApp (Order 2 on Mobile, Order 1 on Desktop) */}
        <div className="w-full lg:col-span-5 flex flex-col gap-5 order-2 lg:order-1">
          {whatsappTestimonials.map((msg, index) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="bg-[#dcf8c6] rounded-2xl rounded-tl-sm p-5 md:p-6 shadow-sm relative group hover:-translate-y-1 hover:shadow-md transition-all duration-300"
            >
              {/* WhatsApp Tail */}
              <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-[#dcf8c6] border-l-[10px] border-l-transparent"></div>
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{msg.name}</h4>
                  <span className="text-xs font-semibold text-emerald-700">{msg.profile}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 opacity-80">
                  <MessageCircle className="w-3 h-3" />
                  {msg.source}
                </div>
              </div>
              <p className="text-slate-800 text-[12px] leading-relaxed mb-3">
                "{msg.text}"
              </p>
              <div className="text-right text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                {msg.date}
              </div>
            </motion.div>
          ))}
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
                <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium text-white/90 shadow-sm flex items-center gap-1">
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