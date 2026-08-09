'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, ArrowLeft, Calendar, CalendarDays, FolderOpen, User, Target, TrendingUp, MonitorPlay } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

const STEPS = [
  {
    id: 'cronograma',
    title: 'Saiba exatamente o que estudar hoje',
    description: 'Seu cronograma organiza sua rotina para que você não perca tempo decidindo por onde começar.',
    benefits: ['Prioridades claras', 'Organização automática', 'Mais consistência'],
    label: 'Cronograma',
    icon: Calendar,
    videoSrc: '/videos/cronograma.mp4',
    imgClass: 'bg-slate-800'
  },
  {
    id: 'agenda',
    title: 'Nunca mais perca o horário de uma aula',
    description: 'Veja todos os seus horários em um único lugar. Receba lembretes e mantenha sua rotina perfeitamente alinhada.',
    benefits: ['Agenda organizada', 'Professores', 'Datas e horários'],
    label: 'Agenda',
    icon: CalendarDays,
    videoSrc: '/videos/agenda.mp4',
    imgClass: 'bg-slate-700'
  },
  {
    id: 'materiais',
    title: 'Tudo organizado em um só lugar',
    description: 'Chega de procurar PDFs perdidos ou links espalhados. Todo o conteúdo fica disponível sempre que você precisar.',
    benefits: ['Materiais', 'Exercícios', 'Arquivos organizados'],
    label: 'Materiais',
    icon: FolderOpen,
    videoSrc: '/videos/materiais.mp4',
    imgClass: 'bg-slate-600'
  },
  {
    id: 'professor',
    title: 'Aprenda com quem acompanha sua evolução',
    description: 'Todas as aulas são individuais e ao vivo. Você aprende no seu ritmo e tira dúvidas na hora.',
    benefits: ['Aulas ao vivo', 'Foco 100% em você', 'Aprendizado no seu ritmo'],
    label: 'Professor',
    icon: User,
    videoSrc: '/videos/professores.mp4',
    imgClass: 'bg-slate-700'
  },
  {
    id: 'simulados',
    title: 'Descubra exatamente onde precisa evoluir',
    description: 'Veja seu desempenho por disciplina e direcione seus estudos de forma inteligente baseada em dados reais.',
    benefits: ['Análise de desempenho', 'Pontos fortes e fracos', 'Direcionamento inteligente'],
    label: 'Simulados',
    icon: Target,
    videoSrc: '/videos/simulados.mp4',
    imgClass: 'bg-slate-800'
  },
  {
    id: 'evolucao',
    title: 'Acompanhe sua evolução ao longo do tempo',
    description: 'Pequenos avanços diários se transformam em grandes resultados. Veja o seu progresso tomando forma.',
    benefits: ['Horas estudadas', 'Aulas concluídas', 'Histórico completo'],
    label: 'Evolução',
    icon: TrendingUp,
    videoSrc: '/videos/evolucao.mp4',
    imgClass: 'bg-slate-900'
  },
];

export default function PlatformJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.14) setActiveStep(0);
    else if (latest < 0.28) setActiveStep(1);
    else if (latest < 0.42) setActiveStep(2);
    else if (latest < 0.56) setActiveStep(3);
    else if (latest < 0.70) setActiveStep(4);
    else if (latest < 0.86) setActiveStep(5);
    else setActiveStep(6); // Fechamento
  });

  // Função para navegação manual por botões (opcional para acessibilidade/atalho)
  const handleNav = (direction: 'next' | 'prev') => {
    if (direction === 'next' && activeStep < 6) {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    } else if (direction === 'prev' && activeStep > 0) {
      window.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
    }
  };

  const isClosing = activeStep === 6;

  return (
    <section className="bg-[#0A0F1C] text-white">

      {/* MOBILE EXPERIENCE (Fluxo Vertical) */}
      <div className="block lg:hidden pt-20 pb-24 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black font-headline tracking-tight mb-4">
            Conheça a <span className="text-amber-500">plataforma</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Cada recurso foi pensado para organizar seus estudos, mostrar o próximo passo e acompanhar sua evolução.
          </p>
        </div>

        {/* Notebook Fixo no topo do mobile (Opcional, aqui deixamos ele fluir junto ou ser sticky) */}
        <div className="sticky top-20 z-40 bg-[#0A0F1C] pb-6 pt-2 mb-10 border-b border-slate-800">
          <div className="w-full aspect-[16/8] bg-[#1a1f2e] rounded-xl shadow-2xl border-4 border-[#2a3143] overflow-hidden flex items-center justify-center relative mx-auto">
            <span className="text-slate-500 text-sm">Interface do Sistema</span>
          </div>
        </div>

        <div className="space-y-16">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="relative pl-6 border-l-2 border-slate-800">
              {/* Ponto no eixo */}
              <div className="absolute top-0 -left-[11px] w-5 h-5 rounded-full bg-[#0A0F1C] border-2 border-slate-700 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <h3 className="text-2xl font-bold font-headline leading-tight mb-3">
                {step.title}
              </h3>
              <p className="text-slate-400 mb-6 text-sm">
                {step.description}
              </p>
              <ul className="space-y-[10px]">
                {step.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Fechamento Mobile */}
          <div className="pt-10 border-t border-slate-800 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-xl mb-4">
              <MonitorPlay className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold font-headline leading-tight mb-3 text-white">
              Tudo conectado
            </h3>
            <p className="text-slate-400 mb-8 text-sm">
              Tudo conectado para você estudar com mais organização e direção.
            </p>
            <Button asChild className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl py-6 text-base shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Link href="/register">
                Quero conhecer a plataforma <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* DESKTOP EXPERIENCE (Sticky Scroll-Driven Journey) */}
      <div ref={containerRef} className="hidden lg:block relative h-[650vh]">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">

          <div className="container mx-auto px-4 lg:px-8 h-full max-h-[900px] flex flex-col justify-center py-10 relative">

            {/* Cabeçalho da Seção */}
            <div className="absolute top-[57px] left-4 lg:left-[92px] z-20">
              <h2 className="text-4xl lg:text-5xl font-black font-headline tracking-tight">
                Conheça a <span className="text-amber-500">plataforma</span>
              </h2>
              <p className="text-slate-400 mt-2 text-sm lg:text-base lg:whitespace-nowrap">
                Cada recurso foi pensado para organizar seus estudos, mostrar o próximo passo e acompanhar sua evolução.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between w-full h-full mt-24 lg:mt-32 gap-8 lg:gap-12 relative z-10 lg:pl-[60px] lg:-mr-[60px]">

              {/* Lado Esquerdo - Textos */}
              <div className="w-full lg:w-[25%] min-w-[280px] flex flex-col h-[350px] lg:h-[400px] relative order-2 lg:order-1 pr-4">
                <AnimatePresence mode="wait">
                  {!isClosing ? (
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex flex-col h-full justify-center -translate-y-[10px] min-w-[380px]"
                    >
                      <h3 className="text-3xl lg:text-4xl font-bold font-headline leading-tight mb-4 text-white">
                        {STEPS[activeStep].title}
                      </h3>
                      <p className="text-slate-400 mb-8 leading-relaxed">
                        {STEPS[activeStep].description}
                      </p>
                      <ul className="space-y-[10px] mb-auto">
                        {STEPS[activeStep].benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-300">
                            <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                            <span className="font-medium">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="closing"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="flex flex-col h-full justify-center relative -top-[80px] min-w-[380px]"
                    >
                      <h3 className="text-3xl lg:text-4xl font-bold font-headline leading-tight mb-4 text-white">
                        Tudo conectado
                      </h3>
                      <p className="text-slate-400 mb-4 leading-relaxed">
                        A plataforma organiza todo o seu processo para que você foque no que realmente importa: estudar com direção e consistência.
                      </p>
                      <Button asChild className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl py-6 px-8 text-lg w-max shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all">
                        <Link href="/register">
                          Quero conhecer a plataforma <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Centro - Laptop Mockup e CTA */}
              <div className="w-full lg:w-[55%] flex flex-col items-center justify-center relative order-1 lg:order-2 perspective-1000 gap-5 max-w-[750px] mx-auto lg:translate-x-[65px]">
                <div className="relative w-full aspect-[16/8] bg-[#1a1f2e] rounded-t-2xl rounded-b-lg shadow-2xl border-[8px] border-[#2a3143] overflow-hidden flex items-center justify-center shrink-0">
                  {/* O Notebook / Câmera da Interface */}

                  <AnimatePresence mode="crossfade">
                    {!isClosing ? (
                      <motion.div
                        key={activeStep}
                        initial={{ scale: 1.05, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`absolute inset-0 w-full h-full flex items-center justify-center bg-[#0A0F1C] overflow-hidden`}
                      >
                        {STEPS[activeStep].videoSrc ? (
                          <video
                            src={STEPS[activeStep].videoSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${STEPS[activeStep].imgClass}`}>
                            <span className="text-slate-400 text-lg opacity-50">Vídeo Pendente: {STEPS[activeStep].label}</span>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="closing-img"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 w-full h-full bg-slate-900 flex flex-wrap items-center justify-center p-4 gap-4"
                      >
                        {/* Efeito Teia (Todos os módulos conectados) */}
                        {STEPS.map((s, i) => (
                          <motion.div
                            key={s.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1, duration: 0.3 }}
                            className="w-[30%] h-[30%] bg-slate-800 rounded-lg flex flex-col items-center justify-center border border-amber-500/20"
                          >
                            <s.icon className="w-6 h-6 text-amber-500 mb-2" />
                            <span className="text-xs text-slate-300">{s.label}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Base do Laptop */}
                  <div className="absolute -bottom-4 left-[-5%] right-[-5%] h-8 bg-[#2a3143] rounded-b-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 hidden lg:block" />
                </div>

                {/* Rodapé CTA Inferior (Abaixo do Laptop) */}
                <div className="w-[calc(100%+130px)] max-w-none shrink-0 bg-[#111727] border border-slate-800 rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between shadow-lg relative -left-[25px]">
                  <div className="flex items-center gap-4 text-slate-300 text-sm">
                    <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                      <MonitorPlay className="w-6 h-6 text-amber-500" />
                    </div>
                    <p>Tudo conectado para você estudar com <strong className="text-white">mais organização e direção.</strong></p>
                  </div>
                  <Button asChild className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl mt-4 xl:mt-0 w-full xl:w-auto shrink-0">
                    <Link href="/register">
                      Quero conhecer a plataforma <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Lado Direito - Progresso (Desktop) */}
              <div className="hidden lg:flex w-[20%] flex-col justify-center h-full relative order-3 -translate-y-[35px] lg:translate-x-[40px]">
                <div className="absolute top-[10%] bottom-[10%] left-6 w-[2px] bg-slate-800/50" />

                {/* Linha de progresso preenchida */}
                <motion.div
                  className="absolute top-[10%] left-6 w-[2px] bg-amber-500 origin-top"
                  style={{
                    height: '80%',
                    scaleY: scrollYProgress,
                    opacity: isClosing ? 0 : 1
                  }}
                />

                <div className="flex flex-col justify-between h-[80%] relative z-10">
                  {STEPS.map((step, i) => {
                    const isActive = activeStep === i && !isClosing;
                    const isPast = activeStep > i || isClosing;
                    return (
                      <div key={step.id} className="flex flex-row items-center gap-4 group cursor-default">
                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-[#0A0F1C] shrink-0 ${isActive
                            ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                            : isPast
                              ? 'border-amber-500/40 text-amber-500/40'
                              : 'border-slate-700 text-slate-500'
                          }`}>
                          <step.icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : ''}`} />
                        </div>
                        <span className={`text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-amber-500' : 'text-slate-500'
                          }`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>


          </div>
        </div>
      </div>
    </section>
  );
}
