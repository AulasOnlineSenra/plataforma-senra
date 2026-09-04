'use client';

import { useState, useEffect } from 'react';
import { getSettings } from '@/app/actions/settings';
import { trackPainPointClick } from '@/app/actions/track-click';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Home,
  FileText,
  Calendar,
  Battery,
  Target,
  Brain,
  Clock,
  TrendingDown,
  Layers,
  Puzzle,
  Users,
  User,
  TrendingUp,
  ArrowRight,
  Lock,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

const painPoints = [
  { id: 'se-perde-pdfs', text: 'Se perde entre PDFs, vídeos e exercícios.', icon: FileText },
  { id: 'nao-mantem-rotina', text: 'Não consegue manter uma rotina de estudos.', icon: Calendar },
  { id: 'desmotivado', text: 'Está desmotivado porque já tentou estudar sozinho várias vezes.', icon: Battery },
  { id: 'sabe-dificuldade-mas-nao-evolui', text: 'Sabe exatamente em quais matérias tem dificuldade, mas não consegue evoluir sozinho.', icon: Target },
  { id: 'esquece-rapidamente', text: 'Sente que esquece rapidamente o que estudou.', icon: Brain },
  { id: 'prova-chegando', text: 'Sua prova está chegando e você sente que ainda não está preparado.', icon: Clock },
  { id: 'desiste-rapido', text: 'Começa animado e desiste depois de poucos dias.', icon: TrendingDown },
  { id: 'materia-acumula', text: 'Sempre deixa a matéria acumular.', icon: Layers },
  { id: 'nao-organiza', text: 'Não consegue organizar os estudos sozinho.', icon: Puzzle },
];

export default function HomePainPoints() {
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await getSettings();
      if (res.success && res.data?.whatsapp) {
        setWhatsappNumber(res.data.whatsapp.replace(/\D/g, ''));
      }
    };
    fetchSettings();
  }, []);

  const handleWhatsAppClick = () => {
    const target = whatsappNumber || DEFAULT_WHATSAPP_NUMBER;
    const url = `https://wa.me/${target}?text=${encodeURIComponent('Olá! Estava navegando pelo site e percebi que estudar sozinho não está funcionando para mim. Quero ajuda para me organizar!')}`;
    window.open(url, '_blank');
  };

  const handleCheck = async (id: string, text: string) => {
    const newVal = !checkedItems[id];
    setCheckedItems(prev => ({ ...prev, [id]: newVal }));
    if (newVal) {
      await trackPainPointClick(text);
    }
  };

  return (
    <section className="pt-16 pb-[94px] bg-[#FAFAFA]">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Title Area */}
        <div className="mb-10 text-center lg:text-left">
          <h2 className="text-2xl md:text-5xl font-black text-slate-900 leading-tight">
            Sinais de que estudar sozinho <br className="hidden lg:block" />
            já <span className="text-amber-500">não está funcionando</span> para você
          </h2>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Checklist */}
          <Card className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex flex-col p-[38px]">
              {painPoints.map((item, index) => {
                const Icon = item.icon;
                const isChecked = checkedItems[item.id];
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleCheck(item.id, item.text)}
                    className={cn(
                      "flex items-center gap-3 py-2 px-3 sm:px-4 cursor-pointer transition-colors hover:bg-slate-50",
                      index !== painPoints.length - 1 && "border-b border-slate-100"
                    )}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-[#F0F4F8] rounded-xl flex items-center justify-center text-slate-500">
                      <Icon className="w-5 h-5 stroke-[1.5]" />
                    </div>
                    <div className={cn(
                      "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      isChecked ? "border-amber-500 bg-amber-500" : "border-slate-300"
                    )}>
                      {isChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <p className="text-slate-700 font-medium text-[12px] select-none flex-1">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Right Column: CTA Card (Hidden on Mobile) */}
          <div className="hidden lg:block lg:col-span-5">
            <Card className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 border border-slate-700 rounded-full flex items-center justify-center mb-5">
                  <Users className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Você não precisa <br />enfrentar isso <span className="text-amber-500">sozinho.</span>
                </h3>
                <p className="text-slate-300 mb-8 text-[11px] leading-tight px-1">
                  Na Senra, unimos tecnologia e acompanhamento humano para organizar seus estudos e te ajudar a alcançar o seu objetivo.
                </p>

                <div className="w-full flex flex-col gap-[7px] text-left mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-slate-700 rounded-full flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">Plano de estudos <span className="text-amber-500">personalizado</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-slate-700 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">Professores especialistas <span className="text-amber-500">e suporte humano</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-slate-700 rounded-full flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">Acompanhamento <span className="text-amber-500">da sua evolução</span></p>
                  </div>
                </div>

                <Button 
                  onClick={handleWhatsAppClick}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-5 rounded-2xl text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105"
                >
                  Quero ajuda agora!
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <div className="flex items-center justify-center gap-2 mt-4 text-slate-400 text-xs">
                  <Lock className="w-3 h-3" />
                  <span>Sem compromisso. Fale com um especialista.</span>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Mobile CTA Button (Visible only on Mobile) */}
          <div className="block lg:hidden w-full mt-4">
            <Button 
              onClick={handleWhatsAppClick}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-6 rounded-2xl text-lg flex items-center justify-center gap-2 shadow-lg"
            >
              Quero ajuda agora!
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center justify-center gap-2 mt-4 text-slate-500 text-xs">
              <Lock className="w-3 h-3" />
              <span>Sem compromisso. Fale com um especialista.</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
