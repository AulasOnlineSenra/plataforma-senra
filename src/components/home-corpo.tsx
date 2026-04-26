'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, GraduationCap, Clock, Users, Video, BookOpen, Award, Target, Calculator, PenTool, Globe, FlaskConical, Brain, BookA, History, Languages, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getSubjects } from '@/app/actions/users';
import { getSettings } from '@/app/actions/settings';

const DEFAULT_WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

const subjectIcons: Record<string, any> = {
  'matemática': Calculator,
  'português': BookA,
  'física': Brain,
  'redação': PenTool,
  'história': History,
  'química': FlaskConical,
  'espanhol': Languages,
  'filosofia': Brain,
  'geografia': Globe,
  'inglês': Languages,
  'sociologia': Globe,
  'biologia': FlaskConical,
};

const problems = [
  { icon: BookOpen, text: 'Dificuldade em uma matéria específica?', desc: 'Aquela matéria que parece impossível' },
  { icon: Target, text: 'Falta de motivação e método de estudo?', desc: 'Você tenta, mas não sabe como melhorar' },
  { icon: Users, text: 'Professores sem tempo para atenção individual?', desc: 'Aulas genéricas que não te acompanham' },
  { icon: Clock, text: 'Horários inflexíveis que não cabem na sua rotina?', desc: 'Você tem outros compromissos' },
];

const solutions = [
  { icon: GraduationCap, text: 'Aulas Sob Medida', desc: 'Cada aula é planejada especialmente para suas necessidades e objetivos' },
  { icon: Award, text: 'Professores Especialistas', desc: 'Mentores apaixonados por ensinar e experts na matéria que você precisa' },
  { icon: Video, text: 'Plataforma Completa', desc: 'Videochamada HD, quadro branco interativo, chat e material exclusivo' },
  { icon: Clock, text: 'Horários Flexíveis', desc: 'Você escolhe quando estudar. Nós nos adaptamos à sua rotina' },
];

type Subject = { id: string; name: string };

function getSubjectIcon(subjectName: string) {
  const key = subjectName.toLowerCase();
  const Icon = subjectIcons[key] || BookOpen;
  return Icon;
}

function SubjectCarousel({ subjects }: { subjects: Subject[] }) {
  const duplicatedSubjects = [...subjects, ...subjects, ...subjects];

  return (
    <div className="relative w-full overflow-hidden py-6">
      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .carousel-scroll {
          animation: scrollLeft 30s linear infinite;
        }
        .carousel-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10" />
      
      <div className="flex gap-4 carousel-scroll">
        {duplicatedSubjects.map((subject, index) => {
          const Icon = getSubjectIcon(subject.name);
          return (
            <div 
              key={`${subject.id}-${index}`}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer">
                <Icon className="h-9 w-9 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-slate-700 text-center max-w-[80px] truncate">
                {subject.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomeCorpo() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);

  useEffect(() => {
    const fetchSubjects = async () => {
      const result = await getSubjects();
      if (result.success && result.data) {
        setSubjects(result.data as Subject[]);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      const result = await getSettings();
      if (result.success && result.data) {
        const normalizedNumber = (result.data.whatsapp || '').replace(/\D/g, '');
        if (normalizedNumber) {
          setWhatsappNumber(normalizedNumber);
        }
      }
    };
    fetchWhatsappNumber();
  }, []);

  const handleWhatsAppClick = (text: string) => {
    const targetWhatsapp = whatsappNumber || DEFAULT_WHATSAPP_NUMBER;
    const url = `https://wa.me/${targetWhatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleComprarAgora = () => {
    localStorage.removeItem('checkoutBookings');
    router.push('/dashboard/checkout?needed=4&current=0');
  };

  return (
    <div className="relative w-full space-y-20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-black font-headline text-slate-900 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              Resolvemos
            </span>{' '}o que te paralisa
          </h2>
          <div className="mt-4 text-xl text-slate-600 max-w-[800px] mx-auto space-y-1">
            <p>Entendemos as dificuldades que impedem você de alcançar seus objetivos.</p>
          </div>
        </div>

        {/* Imagem como funciona */}
        <div className="flex justify-center mb-12 -mt-[39px]">
          <img 
            src="/como-funciona1+.png" 
            alt="Como funciona" 
            className="max-w-full h-auto rounded-2xl"
          />
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="bg-slate-50 py-8 border-y border-slate-100 hidden">
          <div className="container mx-auto px-4 max-w-[90%]">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold font-headline text-slate-900">
                Disciplinas Que ensinamos
              </h3>
              <p className="mt-2 text-slate-600">
                Tire suas dúvidas com especialistas em qualquer matéria
              </p>
            </div>
            <SubjectCarousel subjects={subjects} />
            <div className="text-center mt-8 hidden">
              <Link 
                href="#planos" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full shadow-lg shadow-amber-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Ver Planos e Preços
                <Check className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 text-center pb-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-0">
          <Link 
            href="#planos" 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 min-w-[500px] -translate-y-[90px] bg-[#0f172a] text-white font-bold text-lg rounded-full hover:scale-105 transition-all duration-300 z-20 relative"
          >
            Ver Planos e Preços
            <Check className="h-5 w-5" />
          </Link>
          <button
            onClick={() => handleWhatsAppClick('Olá! Gostaria de adquirir um pacote de aulas. Como faço para realizar o pagamento?')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 min-w-[500px] -translate-y-[90px] bg-green-500 text-white font-bold text-lg rounded-full shadow-lg shadow-green-500/30 hover:scale-105 transition-all duration-300 z-20 relative"
          >
            <MessageCircle className="h-5 w-5" />
            Comprar via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}