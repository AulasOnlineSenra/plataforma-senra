'use client';

import { Brain, GraduationCap, Pencil, Trophy, TrendingUp, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const steps = [
  { letter: 'M', word: 'apear', icon: Brain, desc: 'Diagnosticamos suas dificuldades e objetivos', color: '#f43f5e', bg: 'bg-rose-500' },
  { letter: 'A', word: 'prender', icon: GraduationCap, desc: 'Aulas 100% personalizadas com especialistas', color: '#f59e0b', bg: 'bg-amber-500' },
  { letter: 'P', word: 'raticar', icon: Pencil, desc: 'Exercícios direcionados para fixar', color: '#10b981', bg: 'bg-emerald-500' },
  { letter: 'A', word: 'perfeiçoar', icon: Trophy, desc: 'Refinamos até dominar completamente', color: '#3b82f6', bg: 'bg-blue-500' },
];

export default function MapaCircle() {
  return (
    <div className="relative w-full overflow-hidden py-24 md:py-[120px] bg-slate-950 -mt-28 z-0 translate-y-8">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-left mb-5 -mt-10 ml-10 pt-16">
          <h3 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            O Método <span className="text-amber-500">MAPA</span>
          </h3>
          <p className="text-slate-400 text-lg max-w-xl whitespace-nowrap">
            Quatro etapas que se repetem até você dominar qualquer assunto
          </p>
        </div>

        {/* Escada subindo com conexão visual */}
        <div className="relative max-w-5xl mx-auto">
          {/* Linha de conexão diagonal */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 via-emerald-500 to-blue-500 opacity-30" />

          <div className="flex flex-col md:flex-row items-stretch justify-center gap-[19px] md:gap-[23px] mt-[110px]">
            {steps.map((step, index) => (
              <Link key={`mapa-${index}`} href="#planos" className="block group flex-1">
                <div className={`
                  relative h-[340px] bg-slate-900/60 border border-slate-800 rounded-3xl p-6
                  transition-all duration-500 group-hover:-translate-y-4
                  ${index === 0 ? 'md:mt-20' : index === 1 ? 'md:mt-0' : index === 2 ? 'md:-mt-20' : 'md:-mt-40'}
                `}>
                  {/* Background gradient sutil */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-5"
                    style={{ background: `linear-gradient(135deg, ${step.color}20 0%, transparent 100%)` }}
                  />

                  {/* Barra lateral colorida */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
                    style={{ backgroundColor: step.color }}
                  />

                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header com número */}
                    <div className="flex items-center justify-between mb-6">
                      <div 
                        className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest"
                        style={{ backgroundColor: `${step.color}20`, color: step.color }}
                      >
                        Etapa {index + 1}
                      </div>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: step.color }}
                      >
                        <ArrowUpRight className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Ícone grande */}
                    <div className="mb-6">
                      <div 
                        className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
                        style={{ backgroundColor: step.color }}
                      >
                        <step.icon className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    {/* Letra e palavra */}
                    <div className="mb-3">
                      <span 
                        className="text-5xl font-black"
                        style={{ color: step.color }}
                      >{step.letter}</span>
                      <span className="font-bold text-white text-2xl ml-2">{step.word}</span>
                    </div>

                    {/* Descrição */}
                    <p className="text-slate-400 text-sm leading-relaxed mt-auto">
                      {step.desc}
                    </p>
                  </div>

                  {/* Borda glow no hover */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: `0 0 30px ${step.color}40` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center -mt-12 ml-[600px]">
          <p className="text-slate-400 mb-8 text-lg">
            Você repete o ciclo até alcançar a <span className="text-amber-500 font-bold">maestria</span>
          </p>
        </div>
      </div>
    </div>
  );
}