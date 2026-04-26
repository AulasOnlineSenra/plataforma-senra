'use client';

import { useEffect, useState } from 'react';
import { getSubjects } from '@/app/actions/users';
import { Calculator, PenTool, Globe, FlaskConical, Brain, BookA, History, Language, Search, UserPlus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const subjectIcons: Record<string, any> = {
  'matemática': Calculator,
  'português': BookA,
  'física': Brain,
  'redação': PenTool,
  'história': History,
  'química': FlaskConical,
  'espanhol': Language,
  'filosofia': Brain,
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

const teachers = [
  { name: 'Prof. Carlos', subject: 'Matemática', rating: 4.9, students: 250, color: '#f43f5e' },
  { name: 'Profa. Ana', subject: 'Física', rating: 4.8, students: 180, color: '#3b82f6' },
  { name: 'Prof. João', subject: 'Química', rating: 4.7, students: 320, color: '#10b981' },
  { name: 'Profa. Maria', subject: 'Português', rating: 4.9, students: 410, color: '#f59e0b' },
];

export default function MapaSearch() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      const result = await getSubjects();
      if (result.success && result.data) {
        setSubjects(result.data as Subject[]);
      }
    };
    fetchSubjects();
  }, []);

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full overflow-hidden py-16 md:py-20 bg-slate-900">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 -mt-10 ml-10">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold uppercase tracking-wider mb-4">
            <Search className="w-4 h-4" />
            Encontre seu tutor
          </span>
          <h3 className="text-5xl md:text-6xl font-black text-white mb-4">
            Busque por <span className="text-amber-500">matéria</span>
          </h3>
          <p className="text-slate-400 text-lg max-w-xl whitespace-nowrap ml-10">
            Mais de 50 especialidades para você dominar
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Digite uma matéria... (ex: matemática, física)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>
        </div>

        {/* Subject Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
          {(searchTerm ? filteredSubjects : subjects).slice(0, 12).map((subject) => {
            const Icon = getSubjectIcon(subject.name);
            return (
              <Link 
                key={subject.id} 
                href="/login"
                className="group flex flex-col items-center p-4 bg-slate-800/50 border border-slate-700 rounded-2xl hover:bg-slate-800 hover:border-amber-500/50 hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-xs font-medium text-slate-300 text-center truncate w-full">
                  {subject.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Featured Teachers */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h4 className="text-xl font-bold text-white">Professores em destaque</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teachers.map((teacher) => (
              <Link 
                key={teacher.name}
                href="/login"
                className="group p-4 bg-slate-800/50 border border-slate-700 rounded-2xl hover:border-slate-600 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: teacher.color }}
                  >
                    {teacher.name.split(' ')[1]?.[0] || teacher.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{teacher.name}</p>
                    <p className="text-xs text-slate-400">{teacher.subject}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 font-bold text-sm">★ {teacher.rating}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {teacher.students}+ alunos
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 border border-slate-700 text-white font-bold rounded-2xl hover:bg-slate-700 hover:border-slate-600 transition-all"
          >
            Ver todos os professores
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}