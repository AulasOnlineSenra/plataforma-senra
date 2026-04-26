'use client';

import { Brain, GraduationCap, Pencil, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const steps = [
  { letter: 'M', word: 'Mapear', icon: Brain, desc: 'Diagnosticamos suas dificuldades e objetivos', color: 'rose' },
  { letter: 'A', word: 'Aprender', icon: GraduationCap, desc: 'Aulas 100% personalizadas com especialistas', color: 'amber' },
  { letter: 'P', word: 'Praticar', icon: Pencil, desc: 'Exercícios direcionados para fixar', color: 'emerald' },
  { letter: 'A', word: 'Aperfeiç.', icon: Trophy, desc: 'Refinamos até dominar completamente', color: 'blue' },
];

// Versão 1: Timeline vertical com linhas conectando
export default function MapaCircle() {
  return (
    <div className="relative w-full overflow-hidden py-20 md:py-28 bg-slate-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold mb-4">
            Metodologia Exclusiva
          </span>
          <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
            O Ciclo <span className="text-amber-500">MAPA</span>
          </h3>
        </div>

        {/* Timeline Vertical */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* Linha vertical central */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-500 via-amber-500 to-blue-500" />

            {/* Passos */}
            {steps.map((step, index) => (
              <Link key={step.letter} href="#planos" className="block mb-8 last:mb-0">
                <div className="flex items-start gap-6 group">
                  {/* Círculo numerado */}
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center font-black text-xl z-10 shrink-0
                    ${index % 2 === 0 ? 'bg-slate-900 border-4 border-slate-800' : ''}
                  `}>
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${step.color === 'rose' ? 'bg-rose-500' : step.color === 'amber' ? 'bg-amber-500' : step.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}
                    `}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`
                    flex-1 bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5
                    hover:-translate-y-1 transition-all
                    ${index % 2 === 0 ? 'text-right' : 'text-left'}
                  `}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`
                        text-2xl font-black
                        ${step.color === 'rose' ? 'text-rose-400' : step.color === 'amber' ? 'text-amber-400' : step.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'}
                      `}>{step.letter}</span>
                      <span className="font-bold text-white text-xl">{step.word}</span>
                    </div>
                    <p className="text-slate-400 text-sm">{step.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
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