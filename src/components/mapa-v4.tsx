'use client';

import { Brain, GraduationCap, Pencil, Trophy, Check } from 'lucide-react';
import Link from 'next/link';

const steps = [
  { letter: 'M', word: 'Mapear', icon: Brain, desc: 'Diagnosticamos suas dificuldades e objetivos', color: 'rose' },
  { letter: 'A', word: 'Aprender', icon: GraduationCap, desc: 'Aulas 100% personalizadas com especialistas', color: 'amber' },
  { letter: 'P', word: 'Praticar', icon: Pencil, desc: 'Exercícios direcionados para fixar', color: 'emerald' },
  { letter: 'A', word: 'Aperfeiç.', icon: Trophy, desc: 'Refinamos até dominar completamente', color: 'blue' },
];

// Versão 4: Cards estilo accordion/expansível com números grandes
export default function MapaCircle() {
  return (
    <div className="relative w-full overflow-hidden py-20 md:py-28 bg-slate-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold mb-4">
            Metodologia Exclusiva
          </span>
          <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
            O Ciclo <span className="text-amber-500">MAPA</span>
          </h3>
        </div>

        {/* Container estilo steps/progress */}
        <div className="max-w-2xl mx-auto space-y-3">
          {steps.map((step, index) => (
            <Link key={step.letter} href="#planos" className="block group">
              <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all hover:bg-slate-900/80">
                {/* Número grande circulo */}
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0
                  ${step.color === 'rose' ? 'bg-rose-500' : step.color === 'amber' ? 'bg-amber-500' : step.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}
                `}>
                  {index + 1}
                </div>

                {/* Ícone e texto */}
                <div className="flex items-center gap-3 flex-1">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${step.color === 'rose' ? 'bg-rose-500/20 text-rose-400' : step.color === 'amber' ? 'bg-amber-500/20 text-amber-400' : step.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}
                  `}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className={`
                      text-lg font-bold
                      ${step.color === 'rose' ? 'text-rose-400' : step.color === 'amber' ? 'text-amber-400' : step.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'}
                    `}>{step.letter}</span>
                    <span className="font-bold text-white ml-1">{step.word}</span>
                  </div>
                </div>

                {/* Check mark */}
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                  <Check className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </Link>
          ))}
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