'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'Posso trocar de professor se não me adaptar?',
    answer: 'Sim. Se, por qualquer motivo, você sentir que outro professor combina mais com seu perfil, fazemos a troca sem burocracia. Nosso objetivo é encontrar o professor ideal para o seu jeito de aprender.',
  },
  {
    question: 'E se eu precisar remarcar uma aula?',
    answer: 'Basta avisar com antecedência e reagendamos sua aula conforme a disponibilidade. Sabemos que imprevistos acontecem e buscamos oferecer flexibilidade para que você não fique sem estudar.',
  },
  {
    question: 'Os planos têm fidelidade?',
    answer: 'Não. Você permanece porque percebe evolução, não porque está preso a um contrato.',
  },
  {
    question: 'As aulas são gravadas ou ao vivo?',
    answer: 'Todas as aulas são 100% ao vivo e individuais. Isso significa que o professor acompanha seu raciocínio em tempo real, tira dúvidas na hora e adapta a aula exatamente às suas necessidades.',
  },
  {
    question: 'Como sei qual professor é o ideal para mim?',
    answer: 'Nós fazemos essa análise junto com você. Antes das aulas entendemos seu objetivo, nível de conhecimento e disponibilidade para indicar o professor mais adequado.',
  },
  {
    question: 'A plataforma substitui o professor?',
    answer: 'Não. A plataforma organiza sua rotina de estudos. O professor acelera seu aprendizado. Juntos, eles tornam seus estudos mais organizados e eficientes.',
  }
];

export default function HomeFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-[29px] md:py-[61px] bg-slate-50 border-y border-slate-100">
      <div className="container mx-auto px-4 max-w-[798px]">
        <div className="text-center mb-[83px] mt-[30px]">
          <h2 className="text-3xl md:text-5xl xl:text-6xl font-black font-headline text-slate-900 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Perguntas frequentes
          </h2>
        </div>
        
        <div className="space-y-[10px]">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={cn(
                  "border rounded-2xl overflow-hidden transition-all duration-300",
                  isOpen ? "border-amber-500 bg-amber-50/30" : "border-slate-200 bg-white hover:border-amber-300"
                )}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className={cn(
                    "w-full flex items-center justify-between px-6 text-left focus:outline-none transition-all duration-300",
                    isOpen ? "py-[13px]" : "py-[8px]"
                  )}
                >
                  <span className="font-bold text-slate-900 pr-4 text-sm md:text-base">{faq.question}</span>
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                    isOpen ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isOpen && "rotate-180")} />
                  </div>
                </button>
                <div 
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="p-6 pt-0 text-slate-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
