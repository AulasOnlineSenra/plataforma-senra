'use client';

import { Brain, GraduationCap, Pencil, Trophy } from 'lucide-react';
import Link from 'next/link';

const steps = [
  { letter: 'M', word: 'Mapear', icon: Brain, desc: 'Diagnosticamos suas dificuldades e objetivos', color: 'rose', gradient: 'from-rose-500 to-rose-600' },
  { letter: 'A', word: 'Aprender', icon: GraduationCap, desc: 'Aulas 100% personalizadas com especialistas', color: 'amber', gradient: 'from-amber-500 to-orange-500' },
  { letter: 'P', word: 'Praticar', icon: Pencil, desc: 'Exercícios direcionados para fixar', color: 'emerald', gradient: 'from-emerald-500 to-emerald-600' },
  { letter: 'A', word: 'Aperfeiç.', icon: Trophy, desc: 'Refinamos até dominar completamente', color: 'blue', gradient: 'from-blue-500 to-blue-600' },
];

// Versão 6: Cards minimalistas com barra de progresso lateral
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

        {/* Grid com cards minimalistas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <Link key={step.letter} href="#planos" className="block group">
              <div className="relative h-full bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:bg-slate-900/60 hover:border-slate-700 transition-all">
                {/* Barra lateral colorida no topo */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${step.gradient} rounded-t-2xl`} />
                
                {/* Número ordinal */}
                <div className="text-xs font-bold text-slate-600 mb-3">
                  ETAPA {String(index + 1).padStart(2, '0')}
                </div>

                {/* Ícone em circulo */}
                <div className={`
                  w-12 h-12 rounded-full bg-gradient-to-br ${step.gradient}
                  flex items-center justify-center mb-4
                  group-hover:scale-110 transition-transform
                `}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>

                {/* Letra e palavra */}
                <div className="mb-2">
                  <span className={`
                    text-3xl font-black
                    ${step.color === 'rose' ? 'text-rose-400' : step.color === 'amber' ? 'text-amber-400' : step.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'}
                  `}>{step.letter}</span>
                  <span className="font-bold text-white text-xl ml-2">{step.word}</span>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed">
                  {step.desc}
                </p>
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