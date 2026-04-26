'use client';

import { Brain, GraduationCap, Pencil, Trophy, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const steps = [
  { letter: 'M', word: 'Mapear', icon: Brain, desc: 'Diagnosticamos suas dificuldades e objetivos', color: 'rose', gradient: 'from-rose-500 to-rose-600' },
  { letter: 'A', word: 'Aprender', icon: GraduationCap, desc: 'Aulas 100% personalizadas com especialistas', color: 'amber', gradient: 'from-amber-500 to-orange-500' },
  { letter: 'P', word: 'Praticar', icon: Pencil, desc: 'Exercícios direcionados para fixar', color: 'emerald', gradient: 'from-emerald-500 to-emerald-600' },
  { letter: 'A', word: 'Aperfeiç.', icon: Trophy, desc: 'Refinamos até dominar completamente', color: 'blue', gradient: 'from-blue-500 to-blue-600' },
];

export default function MapaCircle() {
  return (
    <div className="relative w-full overflow-hidden py-20 md:py-28 bg-slate-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold mb-4">
            <TrendingUp className="w-4 h-4" />
            Metodologia Exclusiva
          </span>
          <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
            O Ciclo <span className="text-amber-500">MAPA</span>
          </h3>
          <p className="text-slate-400 text-lg">
            Subindo degrau por degrau até a mestria
          </p>
        </div>

        {/* Escada/subindo - layout escalonado */}
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-center gap-2 md:gap-4">
            {steps.map((step, index) => (
              <Link key={step.letter} href="#planos" className="block group flex-1">
                <div className={`
                  relative bg-slate-900/80 border border-slate-800 rounded-3xl p-6
                  hover:-translate-y-2 hover:border-slate-700 transition-all duration-300
                  ${index === 0 ? 'md:translate-y-0' : index === 1 ? 'md:translate-y-8' : index === 2 ? 'md:translate-y-16' : 'md:translate-y-24'}
                `}>
                  {/* degrau visual - linha inferior */}
                  <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r ${step.gradient} rounded-b-3xl`} />
                  
                  {/* Número do degrau */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-slate-500`}>
                      DEGRAU {index + 1}
                    </div>
                    <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center`}>
                      <TrendingUp className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>

                  {/* Ícone e letra */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className={`text-3xl font-black ${step.color === 'rose' ? 'text-rose-400' : step.color === 'amber' ? 'text-amber-400' : step.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'}`}>{step.letter}</span>
                      <span className="font-bold text-white text-lg ml-1">{step.word}</span>
                    </div>
                  </div>

                  {/* Descrição */}
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-slate-400 mb-6">
            O ciclo se repete até você alcançar a <span className="text-amber-500 font-semibold">mestria</span>
          </p>
          <Link href="#planos" className="px-8 py-4 bg-amber-500 text-slate-900 font-bold rounded-full hover:bg-amber-400 transition-all">
            Começar Agora
          </Link>
        </div>
      </div>
    </div>
  );
}