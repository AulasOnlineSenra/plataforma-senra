'use client';

import { useEffect, useState } from 'react';
import { getSettings } from '@/app/actions/settings';
import { 
  GraduationCap, 
  BookOpen, 
  Target, 
  Globe, 
  MessageSquare,
  MessageCircle,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

const DEFAULT_WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

export default function HomeCorpo() {
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);

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

  return (
    <div className="w-full bg-[#f8fafc] py-20 font-sans">
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <p className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-4">Para quem é</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Pra quem é a Senra?
          </h2>
          <p className="text-[18px] text-slate-600 font-body max-w-2xl mx-auto leading-relaxed">
            Cada aluno tem um objetivo. A plataforma se adapta à jornada que você precisa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 mb-16">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col overflow-hidden transition-transform hover:-translate-y-1">
            <div className="relative h-48 w-full bg-slate-100">
              <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop" alt="ENEM & Vestibulares" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-3">ENEM & Vestibulares</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Sua prova está chegando. Saiba onde concentrar seu tempo e prepare-se com direção.
              </p>
              <button 
                onClick={() => handleWhatsAppClick('Olá! Gostaria de saber mais sobre aulas para ENEM e Vestibulares.')}
                className="text-slate-900 font-bold text-sm flex items-center gap-2 group hover:text-amber-600 transition-colors mt-auto"
              >
                Conhecer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col overflow-hidden transition-transform hover:-translate-y-1">
            <div className="relative h-48 w-full bg-slate-100">
              <img src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=2070&auto=format&fit=crop" alt="Reforço Escolar" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Reforço Escolar</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Você sabe onde está a dificuldade. Agora tenha ajuda para finalmente evoluir.
              </p>
              <button 
                onClick={() => handleWhatsAppClick('Olá! Gostaria de saber mais sobre Reforço Escolar.')}
                className="text-slate-900 font-bold text-sm flex items-center gap-2 group hover:text-amber-600 transition-colors mt-auto"
              >
                Conhecer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col overflow-hidden transition-transform hover:-translate-y-1">
            <div className="relative h-48 w-full bg-slate-100">
              <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop" alt="Concursos" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Concursos</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Transforme um edital extenso em uma rotina de estudos organizada e consistente.
              </p>
              <button 
                onClick={() => handleWhatsAppClick('Olá! Gostaria de saber mais sobre aulas para Concursos.')}
                className="text-slate-900 font-bold text-sm flex items-center gap-2 group hover:text-amber-600 transition-colors mt-auto"
              >
                Conhecer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col overflow-hidden transition-transform hover:-translate-y-1">
            <div className="relative h-48 w-full bg-slate-100">
              <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop" alt="Inglês & Idiomas" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg">
                <Globe className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Inglês & Idiomas</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                Desenvolva novos idiomas para entrevistas, viagens, trabalho e oportunidades.
              </p>
              <button 
                onClick={() => handleWhatsAppClick('Olá! Gostaria de saber mais sobre aulas de Inglês & Idiomas.')}
                className="text-slate-900 font-bold text-sm flex items-center gap-2 group hover:text-amber-600 transition-colors mt-auto"
              >
                Conhecer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Banner Final */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center md:text-left">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mx-auto md:mx-0">
              <MessageSquare className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-lg mb-1">Não encontrou seu objetivo?</h4>
              <p className="text-sm text-slate-500">Fale com nossa equipe e descubra como podemos te ajudar.</p>
            </div>
          </div>
          <button 
            onClick={() => handleWhatsAppClick('Olá! Gostaria de falar com um especialista sobre meu objetivo de estudos.')}
            className="shrink-0 bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-3 transition-colors shadow-lg shadow-slate-900/20"
          >
            <MessageCircle className="w-5 h-5" />
            Falar com especialista <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}