'use client';

import { Brain, GraduationCap, Pencil, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';

const steps = [
  { letter: 'M', word: 'Mapear', icon: Brain, desc: 'Diagnosticamos suas dificuldades e objetivos', color: '#f43f5e' },
  { letter: 'A', word: 'Aprender', icon: GraduationCap, desc: 'Aulas 100% personalizadas com especialistas', color: '#f59e0b' },
  { letter: 'P', word: 'Praticar', icon: Pencil, desc: 'Exercícios direcionados para fixar', color: '#10b981' },
  { letter: 'A', word: 'Aperfeiç.', icon: Trophy, desc: 'Refinamos até dominar completamente', color: '#3b82f6' },
];

// Versão 7: Grid tipo "flip cards" com efeito visual e icone grandão
export default function MapaCircle() {
  return (
    <div className="relative w-full overflow-hidden py-20 md:py-28 bg-slate-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Metodologia Exclusiva
          </span>
          <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
            O Ciclo <span className="text-amber-500">MAPA</span>
          </h3>
          <p className="text-slate-400 text-lg">
            Quatro etapas que se repetem até você dominar
          </p>
        </div>

        {/* Grid de cards estilo "destaque" com icone mega */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {steps.map((step) => (
            <Link key={step.letter} href="#planos" className="block group">
              <div className="relative bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center hover:-translate-y-2 hover:border-slate-700 transition-all duration-300 overflow-hidden">
                {/* Background color sutil */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundColor: step.color }}
                />

                <div className="relative z-10">
                  {/* Icone mega com cor */}
                  <div 
                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    style={{ backgroundColor: step.color }}
                  >
                    <step.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Letra sola grande */}
                  <div 
                    className="text-5xl font-black mb-1"
                    style={{ color: step.color }}
                  >
                    {step.letter}
                  </div>

                  {/* Palavra */}
                  <div className="font-bold text-white text-xl mb-2">{step.word}</div>

                  {/* Mini descrição */}
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {step.desc}
                  </p>
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