'use client';

import { useEffect, useState } from 'react';
import { getSubjects } from '@/app/actions/users';
import { Brain, GraduationCap, Pencil Trophy, TrendingUp, ArrowUpRight, Check, Calculator, PenTool, Globe, FlaskConical, BookA, History, Language } from 'lucide-react';
import Link from 'next/link';

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
  { letter: 'M', word: 'Mapear', icon: Brain, desc: 'Diagnosticamos suas dificuldades e objetivos', color: '#f43f5e', bg: 'bg-rose-500' },
  { letter: 'A', word: 'Aprender', icon: GraduationCap, desc: 'Aulas 100% personalizadas com especialistas', color: '#f59e0b', bg: 'bg-amber-500' },
  { letter: 'P', word: 'Praticar', icon: Pencil, desc: 'Exercícios direcionados para fixar', color: '#10b981', bg: 'bg-emerald-500' },
  { letter: 'A', word: 'Aperfeiç.', icon: Trophy, desc: 'Refinamos até dominar completamente', color: '#3b82f6', bg: 'bg-blue-500' },
];

export default function MapaSubjects() {
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
    <div className="relative w-full overflow-hidden py-24 md:py-32 bg-slate-950">
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

        {/* MAPA Steps - Escada */}
        <div className="relative max-w-5xl mx-auto mb-20">
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-3 md:gap-4">
            {steps.map((step, index) => (
              <Link key={step.letter} href="#planos" className="block group flex-1">
                <div className={`
                  relative h-[350px] bg-slate-900/60 border border-slate-800 rounded-3xl p-6
                  transition-all duration-500 group-hover:-translate-y-4
                  ${index === 0 ? 'md:mt-20' : index === 1 ? 'md:mt-0' : index === 2 ? 'md:-mt-20' : 'md:-mt-40'}
                `}>
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-5"
                    style={{ background: `linear-gradient(135deg, ${step.color}20 0%, transparent 100%)` }}
                  />
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
                    style={{ backgroundColor: step.color }}
                  />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
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

                    <div className="mb-4">
                      <div 
                        className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
                        style={{ backgroundColor: step.color }}
                      >
                        <step.icon className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    <div className="mb-3">
                      <span 
                        className="text-5xl font-black"
                        style={{ color: step.color }}
                      >{step.letter}</span>
                      <span className="font-bold text-white text-2xl ml-2">{step.word}</span>
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed mt-auto">
                      {step.desc}
                    </p>
                  </div>

                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: `0 0 30px ${step.color}40` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Disciplinas Section */}
        {subjects.length > 0 && (
          <div className="border-t border-slate-800 pt-16">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold uppercase tracking-wider mb-4">
                <BookA className="w-4 h-4" />
                Disciplinas Que ensinamos
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-white">
                Mais de <span className="text-amber-500">{subjects.length}</span> especialidades
              </h3>
            </div>

            {/* Subject Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10 max-w-4xl mx-auto">
              {subjects.slice(0, 12).map((subject) => {
                const Icon = getSubjectIcon(subject.name);
                return (
                  <Link 
                    key={subject.id} 
                    href="/login"
                    className="group flex flex-col items-center p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-amber-500/50 hover:-translate-y-1 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-300 text-center truncate w-full">
                      {subject.name}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="text-center">
              <Link 
                href="#planos" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 text-slate-900 font-bold rounded-full hover:bg-amber-400 hover:scale-105 transition-all shadow-lg shadow-amber-500/30"
              >
                Ver Planos e Preços
                <Check className="h-5 w-5" />
              </Link>
            </div>
          </div>
        )}

        <div className="text-center mt-16">
          <p className="text-slate-400 mb-8 text-lg">
            O ciclo se repete até você alcançar a <span className="text-amber-500 font-bold">mestria</span>
          </p>
          <Link 
            href="#planos" 
            className="inline-flex items-center gap-3 px-10 py-5 bg-amber-500 text-slate-900 font-bold rounded-full hover:bg-amber-400 hover:scale-105 transition-all shadow-lg shadow-amber-500/30"
          >
            Começar Agora
            <ArrowUpRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}