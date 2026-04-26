'use client';

import { Brain, GraduationCap, Pencil, Trophy } from 'lucide-react';
import Link from 'next/link';

const steps = [
  { letter: 'M', word: 'Mapear', icon: Brain, desc: 'Diagnosticamos suas dificuldades e objetivos', color: 'rose', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
  { letter: 'A', word: 'Aprender', icon: GraduationCap, desc: 'Aulas 100% personalizadas com especialistas', color: 'amber', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  { letter: 'P', word: 'Praticar', icon: Pencil, desc: 'Exercícios direcionados para fixar', color: 'emerald', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  { letter: 'A', word: 'Aperfeiç.', icon: Trophy, desc: 'Refinamos até dominar completamente', color: 'blue', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
];

// Versão 2: Cards horizontais conectados com setas
export default function MapaCircle() {
  return (
    <div className="relative w-full overflow-hidden py-20 md:py-28 bg-slate-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/5 rounded-full blur-[80px]" />
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

        {/* Container de cards em linha (scroll no mobile) */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 overflow-x-auto pb-4">
          {steps.map((step, index) => (
            <div key={step.letter} className="flex items-center">
              <Link href="#planos" className="block group">
                <div className={`
                  w-64 bg-slate-900/80 backdrop-blur border ${step.border} rounded-2xl p-6
                  hover:-translate-y-2 transition-all duration-300
                `}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      ${step.color === 'rose' ? 'bg-rose-500' : step.color === 'amber' ? 'bg-amber-500' : step.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}
                    `}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className={`
                        text-2xl font-black
                        ${step.color === 'rose' ? 'text-rose-400' : step.color === 'amber' ? 'text-amber-400' : step.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'}
                      `}>{step.letter}</span>
                      <span className="font-bold text-white text-lg ml-1">{step.word}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">{step.desc}</p>
                </div>
              </Link>
              
              {/* Seta entre cards (não mostra no último) */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center w-12 text-slate-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              )}
            </div>
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