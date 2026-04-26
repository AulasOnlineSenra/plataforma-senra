'use client';

import { Brain, GraduationCap, Pencil, Trophy } from 'lucide-react';
import Link from 'next/link';

const steps = [
  { letter: 'M', word: 'Mapear', icon: Brain, desc: 'Diagnosticamos suas dificuldades e objetivos', color: 'rose', angle: 0 },
  { letter: 'A', word: 'Aprender', icon: GraduationCap, desc: 'Aulas 100% personalizadas com especialistas', color: 'amber', angle: 90 },
  { letter: 'P', word: 'Praticar', icon: Pencil, desc: 'Exercícios direcionados para fixar', color: 'emerald', angle: 180 },
  { letter: 'A', word: 'Aperfeiç.', icon: Trophy, desc: 'Refinamos até dominar completamente', color: 'blue', angle: 270 },
];

// Versão 5: Layout em cruz perfeito com MAPA no centro
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

        {/* Layout em cruz com centro */}
        <div className="relative max-w-3xl mx-auto h-[400px]">
          
          {/* MAPA Central */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl border-4 border-amber-400/30">
              <span className="text-xl md:text-2xl font-black text-slate-900">MAPA</span>
            </div>
          </div>

          {/* Linhas conectando ao centro (cruz) */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          {/* Cards nos 4 pontos da cruz */}
          {/* Topo - M */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <Link href="#planos" className="block group">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-rose-500/50 transition-all hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-black text-rose-400">M</span>
                  <span className="font-bold text-white">Mapear</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Direita - A */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
            <Link href="#planos" className="block group">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-amber-500/50 transition-all hover:translate-x-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-black text-amber-400">A</span>
                  <span className="font-bold text-white">Aprender</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Baixo - P */}
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2">
            <Link href="#planos" className="block group">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-emerald-500/50 transition-all hover:translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-black text-emerald-400">P</span>
                  <span className="font-bold text-white">Praticar</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Esquerda - A */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
            <Link href="#planos" className="block group">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-blue-500/50 transition-all hover:-translate-x-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-black text-blue-400">A</span>
                  <span className="font-bold text-white">Aperfeiç.</span>
                </div>
              </div>
            </Link>
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