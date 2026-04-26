'use client';

import { useEffect, useState } from 'react';
import { getSubjects } from '@/app/actions/users';
import { GraduationCap, Pencil, Trophy, Search, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Calculator, PenTool, Globe, FlaskConical, BookA, History, Language } from 'lucide-react';

const subjectIcons: Record<string, any> = {
  'matemática': Calculator,
  'português': BookA,
  'física': FlaskConical,
  'redação': PenTool,
  'história': History,
  'química': FlaskConical,
  'espanhol': Language,
  'filosofia': Globe,
  'geografia': Globe,
  'inglês': Language,
  'sociologia': Globe,
  'biologia': FlaskConical,
};

type Subject = { id: string; name: string };

function getSubjectIcon(subjectName: string) {
  const key = subjectName.toLowerCase();
  const Icon = subjectIcons[key] || BookA;
  return Icon;
}

const steps = [
  { 
    letter: 'M', 
    word: 'Mapear', 
    icon: Search, 
    desc: 'Diagnosticamos suas dificuldades e objetivos',
    color: '#f43f5e'
  },
  { 
    letter: 'A', 
    word: 'Aprender', 
    icon: GraduationCap, 
    desc: 'Aulas 100% personalizadas com especialistas',
    color: '#f59e0b'
  },
  { 
    letter: 'P', 
    word: 'Praticar', 
    icon: Pencil, 
    desc: 'Exercícios direcionados para fixar',
    color: '#10b981'
  },
  { 
    letter: 'A', 
    word: 'Aperfeiç.', 
    icon: Trophy, 
    desc: 'Refinamos até dominar completamente',
    color: '#3b82f6'
  },
];

export default function MapaFlip() {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const result = await getSubjects();
      if (result.success && result.data) {
        setSubjects(result.data as Subject[]);
      }
    };
    fetchSubjects();
  }, []);

  return (
    <div className="relative w-full overflow-hidden py-20 md:py-28 bg-slate-950">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-left mb-16 -mt-10 ml-10">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold uppercase tracking-wider mb-4">
            <TrendingUp className="w-4 h-4" />
            Metodologia Exclusiva
          </span>
          <h3 className="text-5xl md:text-6xl font-black text-white mb-4">
            O Método <span className="text-amber-500">MAPA</span>
          </h3>
          <p className="text-slate-400 text-lg max-w-xl whitespace-nowrap ml-10">
            Quatro etapas que se repetem até você dominar qualquer assunto
          </p>
        </div>

        {/* Grid de Cards Flip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={step.letter} 
              className="group relative h-[380px] cursor-pointer"
            >
              {/* Glow effect */}
              <div 
                className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"
                style={{ background: `linear-gradient(135deg, ${step.color}40, transparent)` }}
              />

              {/* Card Traseiro - Disciplinas */}
              <div 
                className="absolute inset-0 rounded-2xl p-6 transition-all duration-700 group-hover:rotate-y-180"
                style={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: `2px solid ${step.color}30`,
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden'
                }}
              >
                <div className="text-center mb-4">
                  <span 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase"
                    style={{ backgroundColor: `${step.color}20`, color: step.color }}
                  >
                    {step.word}
                  </span>
                </div>
                <p className="text-slate-300 text-sm text-center mb-4">{step.desc}</p>
                <div className="grid grid-cols-3 gap-2 mt-auto">
                  {subjects.slice(index * 3, index * 3 + 3).map((subject) => {
                    const Icon = getSubjectIcon(subject.name);
                    return (
                      <Link 
                        key={subject.id}
                        href="/login"
                        className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-800 transition-all"
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center mb-1"
                          style={{ backgroundColor: `${step.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: step.color }} />
                        </div>
                        <span className="text-[9px] text-slate-400 text-center">
                          {subject.name.split(' ')[0]}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Card Frontal - MAPA */}
              <div 
                className="absolute inset-0 rounded-2xl transition-all duration-700 group-hover:rotate-y-180"
                style={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  backfaceVisibility: 'hidden'
                }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl" style={{ backgroundColor: step.color }} />

                <div className="relative z-10 flex flex-col h-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="px-4 py-2 rounded-full text-xs font-black uppercase"
                      style={{ backgroundColor: `${step.color}20`, color: step.color }}
                    >
                      Etapa {index + 1}
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <div 
                      className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                      style={{ 
                        backgroundColor: step.color,
                        boxShadow: `0 20px 40px -15px ${step.color}60`
                      }}
                    >
                      <step.icon className="w-14 h-14 text-white" />
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <span className="text-6xl font-black" style={{ color: step.color }}>{step.letter}</span>
                    <span className="block text-white font-bold text-xl">{step.word}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-slate-400 mb-6">
            O ciclo se repete até você alcançar a <span className="text-amber-500 font-bold">mestria</span>
          </p>
          <Link 
            href="#planos" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 text-slate-900 font-bold rounded-full hover:bg-amber-400 hover:scale-105 transition-all shadow-lg shadow-amber-500/30"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}