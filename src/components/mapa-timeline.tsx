'use client';

import { useEffect, useState } from 'react';
import { getSubjects } from '@/app/actions/users';
import { Brain, GraduationCap, Pencil, Trophy, Search, Target, Lightbulb, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
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
    color: '#f43f5e',
    bgColor: 'bg-rose-500'
  },
  { 
    letter: 'A', 
    word: 'Aprender', 
    icon: GraduationCap, 
    desc: 'Aulas 100% personalizadas com especialistas',
    color: '#f59e0b',
    bgColor: 'bg-amber-500'
  },
  { 
    letter: 'P', 
    word: 'Praticar', 
    icon: Pencil, 
    desc: 'Exercícios direcionados para fixar',
    color: '#10b981',
    bgColor: 'bg-emerald-500'
  },
  { 
    letter: 'A', 
    word: 'Aperfeiç.', 
    icon: Trophy, 
    desc: 'Refinamos até dominar completamente',
    color: '#3b82f6',
    bgColor: 'bg-blue-500'
  },
];

export default function MapaTimeline() {
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
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 -mt-10 ml-10">
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

        {/* Timeline Horizontal */}
        <div className="relative">
          {/* Linha central */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 via-emerald-500 to-blue-500 rounded-full" />
          
          {/* Steps Container */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
            
            {/* Step 1: Mapear */}
            <div className="flex-1 flex md:flex-col items-center gap-4">
              <Link href="#planos" className="group">
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-slate-900/80 border-2 border-slate-700 group-hover:border-rose-500 transition-all flex items-center justify-center shadow-xl group-hover:shadow-rose-500/30">
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-lg">M</span>
                  </div>
                  <Search className="w-10 h-10 text-rose-400" />
                </div>
              </Link>
              <div className="text-center md:text-left">
                <h4 className="text-xl font-black text-rose-400">Mapear</h4>
                <p className="text-slate-400 text-sm max-w-[150px]">Diagnosticamos suas dificuldades</p>
              </div>
            </div>

            {/* Step 2 + 3: Aprender + Praticar = Disciplinas no centro */}
            <div className="flex-1">
              {/* Título das etapas */}
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-2 mx-auto">
                    <GraduationCap className="w-8 h-8 text-amber-400" />
                  </div>
                  <span className="text-amber-400 font-black text-lg">A</span>
                  <span className="text-white font-bold ml-1">Aprender</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-2 mx-auto">
                    <Pencil className="w-8 h-8 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400 font-black text-lg">P</span>
                  <span className="text-white font-bold ml-1">Praticar</span>
                </div>
              </div>

              {/* Grid de Disciplinas */}
              {subjects.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-700 rounded-3xl p-6">
                  <div className="text-center mb-4">
                    <p className="text-slate-400 text-sm">Mais de <span className="text-amber-400 font-bold">{subjects.length}</span> disciplinas disponíveis</p>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {subjects.slice(0, 12).map((subject) => {
                      const Icon = getSubjectIcon(subject.name);
                      return (
                        <Link 
                          key={subject.id}
                          href="/login"
                          className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-800 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mb-1 group-hover:bg-amber-500/20">
                            <Icon className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
                          </div>
                          <span className="text-[10px] text-slate-500 truncate w-full text-center">
                            {subject.name.split(' ')[0]}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Aperfeiçoar */}
            <div className="flex-1 flex md:flex-col items-center gap-4">
              <Link href="#planos" className="group">
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-slate-900/80 border-2 border-slate-700 group-hover:border-blue-500 transition-all flex items-center justify-center shadow-xl group-hover:shadow-blue-500/30">
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-lg">A</span>
                  </div>
                  <Trophy className="w-10 h-10 text-blue-400" />
                </div>
              </Link>
              <div className="text-center md:text-right">
                <h4 className="text-xl font-black text-blue-400">Aperfeiç.</h4>
                <p className="text-slate-400 text-sm max-w-[150px]">Refinamos até dominar</p>
              </div>
            </div>
          </div>
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