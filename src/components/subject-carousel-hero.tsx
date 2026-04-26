'use client';

import { useEffect, useState } from 'react';
import { getSubjects } from '@/app/actions/users';
import { Calculator, PenTool, Map, FlaskConical, BookA, Atom, Landmark, Lightbulb, BookOpen, MessageCircle, Users, Leaf } from 'lucide-react';

const subjectIcons: Record<string, any> = {
  'matemática': Calculator,
  'português': BookA,
  'física': Atom,
  'redação': PenTool,
  'história': Landmark,
  'química': FlaskConical,
  'espanhol': BookOpen,
  'filosofia': Lightbulb,
  'geografia': Map,
  'inglês': MessageCircle,
  'sociologia': Users,
  'biologia': Leaf,
};

type Subject = { id: string; name: string };

function getSubjectIcon(subjectName: string) {
  const key = subjectName.toLowerCase();
  const Icon = subjectIcons[key] || BookA;
  return Icon;
}

export default function SubjectCarouselHero() {
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

  if (subjects.length === 0) return null;

  const duplicatedSubjects = [...subjects, ...subjects, ...subjects];

  return (
    <div className="relative w-full overflow-hidden py-4 bg-slate-900 max-w-[90%] mx-auto rounded-[30px] -mt-8 z-10 -translate-y-4">
      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .carousel-scroll {
          animation: scrollLeft 30s linear infinite;
          width: max-content;
        }
        .carousel-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 -mt-2">
          <p className="text-amber-400 font-bold text-sm uppercase tracking-wider hidden">
            Tire suas dúvidas em qualquer matéria
          </p>
        </div>
        
        <div className="flex gap-[47px] carousel-scroll">
          {duplicatedSubjects.map((subject, index) => {
            const Icon = getSubjectIcon(subject.name);
            return (
              <div 
                key={`${subject.id}-${index}`}
                className="flex-shrink-0 flex flex-col items-center -mt-5"
              >
                <div className="w-20 h-20 flex items-center justify-center hover:scale-110 transition-all duration-300 cursor-pointer group">
                  <Icon className="h-10 w-10 text-amber-400 group-hover:text-amber-300" />
                </div>
                <span className="text-sm font-medium text-slate-300 text-center max-w-[90px] truncate -mt-4">
                  {subject.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}