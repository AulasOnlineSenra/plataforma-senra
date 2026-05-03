'use client';

import { SenraLogo } from '@/components/senra-logo';
import HeroCarousel from '@/components/hero-carousel';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Facebook,
  Heart,
  Instagram,
  Landmark,
  Loader2,
  LogIn,
  Menu,
  MessageSquare,
  PlayCircle,
  ShieldCheck,
  Star,
  TrendingUp,
  XCircle,
  Youtube,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { EditableText } from '@/components/editable-text';
import HomeCorpo from '@/components/home-corpo';
import HomeTestimonials from '@/components/home-testimonials';
import TestimonialsCarousel from '@/components/testimonials-carousel';
import HomePricing from '@/components/home-pricing';
import MapaCircle from '@/components/mapa-v9';
import SubjectCarousel from '@/components/subject-carousel-hero';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getSubjects, getTeachers } from '@/app/actions/users';
import { getTeacherAverageRating } from '@/app/actions/ratings';
import { getQuizQuestions } from '@/app/actions/quiz';
import QuizCarousel from '@/components/quiz-carousel';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-image-1');

const navLinks = [
  { href: '/', label: 'Início', storageKey: 'home-nav-inicio' },
  { href: '/dashboard/booking', label: 'Agendar aulas', storageKey: 'home-nav-agendar' },
  { href: '/blog', label: 'Blog', storageKey: 'home-nav-blog' },
  { href: '/contato', label: 'Contato', storageKey: 'home-nav-contato' },
];


export default function HomePage() {
  const [leadEmail, setLeadEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [indiceDisciplina, setIndiceDisciplina] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherRatings, setTeacherRatings] = useState<Record<string, { average: number; count: number }>>({});
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    const buscarDisciplinas = async () => {
      const result = await getSubjects();
      if (result.success && result.data) {
        const nomes = (result.data as { name: string }[]).map(d => d.name);
        setDisciplinas(nomes);
      }
    };
    buscarDisciplinas();
  }, []);

  useEffect(() => {
    if (disciplinas.length === 0) return;
    const intervalo = setInterval(() => {
      setIndiceDisciplina((prev) => (prev + 1) % disciplinas.length);
    }, 2500);
    return () => clearInterval(intervalo);
  }, [disciplinas]);

  useEffect(() => {
    const loadTeachers = async () => {
      const result = await getTeachers(false);
      if (result.success && result.data) {
        const teachersData = result.data.slice(0, 6);
        setTeachers(teachersData);
        
        const ratings: Record<string, { average: number; count: number }> = {};
        for (const teacher of teachersData) {
          const ratingResult = await getTeacherAverageRating(teacher.id);
          if (ratingResult.success && ratingResult.data) {
            ratings[teacher.id] = ratingResult.data;
          } else {
            ratings[teacher.id] = { average: 5.0, count: 0 };
          }
        }
        setTeacherRatings(ratings);
      }
    };
    loadTeachers();
  }, []);

  useEffect(() => {
    const loadQuizQuestions = async () => {
      const result = await getQuizQuestions();
      if (result.success && result.data) {
        setQuizQuestions(result.data);
      }
    };
    loadQuizQuestions();
  }, []);

  const handleInputFocus = () => {
    setInputFocused(true);
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leadEmail || !leadEmail.includes('@')) {
      toast({ title: 'Erro', description: 'Por favor, digite um e-mail válido.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/send-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: leadEmail }),
      });

      if (response.ok) {
        toast({
          title: 'Sucesso! 🚀',
          description: 'Recebemos seu interesse. Entraremos em contato em breve!',
          className: 'bg-green-600 text-white border-none',
        });
        setLeadEmail('');
      } else {
        throw new Error('Erro no envio');
      }
    } catch {
      toast({
        title: 'Ops!',
        description: 'Houve um erro ao enviar. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-card">
<header className="sticky top-0 z-50 flex items-center justify-between p-2 lg:px-4 lg:py-[2px] bg-card border-b h-[47px] sm:h-[47px]">
          <SenraLogo className="h-8 sm:h-10" />

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium font-bold text-muted-foreground transition-colors hover:text-foreground">
              <EditableText storageKey={link.storageKey}>{link.label}</EditableText>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Button asChild className="hidden sm:inline-flex h-[32px] rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 gap-2 font-bold border border-slate-800">
            <Link href="/login" className="flex items-center">
              <LogIn className="w-4 h-4 text-amber-400 -ml-1" />
              <EditableText storageKey="home-login-button" className="text-[12px] -ml-1">Acessar</EditableText>
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="grid gap-6 text-lg font-medium mt-12">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="text-muted-foreground font-bold hover:text-foreground">
                    <EditableText storageKey={link.storageKey}>{link.label}</EditableText>
                  </Link>
                ))}
              </nav>
              <div className="absolute bottom-6 left-6 right-6">
                <Button asChild className="w-full h-14 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all active:scale-95 gap-2 font-bold border border-slate-800 text-lg">
                  <Link href="/login" className="flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-amber-400 mr-2 -ml-1" />
                    <EditableText storageKey="home-login-button-mobile" className="text-[12px] -ml-1">Acessar</EditableText>
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full h-[80vh] md:h-[90vh] flex items-center justify-center text-center text-white bg-black">
          <HeroCarousel />
          <div className="absolute inset-0 bg-black/80" />

          <div className="relative z-10 p-4 max-w-4xl mx-auto">
            <p className="text-lg md:text-xl font-medium mb-4 text-white/90">
              Do reforço escolar ao vestibular
            </p>
            <h1 className="mt-[31px] text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Aulas particulares online <span className="text-amber-500 whitespace-nowrap">feitas sob medida para você</span>
            </h1>
            <div className="mt-[34px] text-lg md:text-xl max-w-3xl mx-auto text-white/90">
              <p className="hidden">Acompanhamento 100% personalizado com os melhores especialistas.</p>
              <p>Encontre agora o tutor ideal e acaba com as dúvidas definitivamente.</p>
            </div>


            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="relative w-full sm:w-auto mt-5">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={inputFocused ? "" : "Buscar por disciplina:"}
                  className="w-full sm:w-[500px] lg:w-[540px] h-12 pl-4 pr-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-amber-400 transition-all shadow-[0_0_15px_rgba(255,193,7,0.3)]"
                  onFocus={handleInputFocus}
                  onBlur={() => setInputFocused(false)}
                />
                {!inputFocused && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-white/50">Buscar por disciplina: </span>
                    <span key={indiceDisciplina} className="text-amber-400 inline-block animate-roll-up">
                      {disciplinas[indiceDisciplina]}
                    </span>
                  </div>
                )}
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-amber-400 z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <style>{`
                  @keyframes rollUp {
                    0% { transform: translateY(10px); opacity: 0; }
                    15% { transform: translateY(0); opacity: 1; }
                    85% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(-10px); opacity: 0; }
                  }
                  .animate-roll-up {
                    animation: rollUp 2.5s ease-in-out infinite;
                  }
                `}</style>
              </div>
            </div>

            {/* Botão Ver Depoimentos - ocultado */}
            {/*
            <Button className="mt-8 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-full px-8">
              Ver Depoimentos
            </Button>
            */}
          </div>
        </section>

        {/* SUBJECT CAROUSEL - Abaixo dos botões da hero */}
        <SubjectCarousel />

        {/* MAPA CIRCLE - Escada */}
        <MapaCircle />

        {/* SEÇÃO CORPO DOCENTE */}
        <section className="py-16 pt-[94px] bg-white">
          <div className="container mx-auto px-4">
            <div className="text-left mb-12 ml-10">
              <h2 className="text-4xl md:text-5xl font-black font-headline text-slate-900 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Corpo</span> Docente
              </h2>
            </div>
            <div className="flex justify-center gap-6 flex-wrap">
              {teachers.map((teacher: any) => {
                const rating = teacherRatings[teacher.id] || { average: 5.0, count: 0 };
                const avatarUrl = teacher.avatarUrl || teacher.avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop';
                
                const education = (() => {
                  if (!teacher.education) return null;
                  let eduList = teacher.education;
                  if (typeof eduList === 'string') {
                    try { eduList = JSON.parse(eduList); } catch { return null; }
                  }
                  if (Array.isArray(eduList) && eduList.length > 0) {
                    return eduList[0].course || eduList[0].degree || null;
                  }
                  return null;
                })();
                
                return (
                <div 
                  key={teacher.id}
                  className="relative w-48 h-64 rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                  style={{
                    backgroundImage: `url(${avatarUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div 
                    className="absolute inset-0 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${avatarUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Rating no canto superior direito */}
                  <div className="absolute top-3 right-3 bg-amber-400 text-slate-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {rating.average.toFixed(1)}
                  </div>
                  
                  {/* Nome e formação na parte inferior */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <p className="font-bold text-sm">{teacher.name}</p>
                    {education && <p className="text-xs text-white/80">{education}</p>}
                  </div>
                </div>
              )})}
            </div>
          </div>
        </section>

        {/* SEÇÃO CORPO: Problema e Solução */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <HomeCorpo />
          </div>
        </section>

        {/* SEÇÃO DEPOIMENTOS */}
        <section 
          id="depoimentos" 
          className="py-44 md:py-[88px] -mt-[298px] relative"
          style={{ 
            backgroundImage: 'url(/depoimentos_pano_de_fundo_site.png)', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-black/65"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-17 -mt-10">
              <h2 className="text-4xl md:text-5xl font-black font-headline text-white tracking-tight mt-[168px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                O Que Nossos Alunos Dizem
              </h2>
              <p className="text-lg text-white/90 mt-[11px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                A satisfação de quem já evoluiu com a gente
              </p>
            </div>
            <HomeTestimonials />
            <TestimonialsCarousel className="mt-[20px]" />
          </div>
        </section>

        {/* SEÇÃO PREÇOS */}
        <section id="planos" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <HomePricing />
          </div>
        </section>

        <section className={`py-${showQuiz ? '[12rem]' : '[13rem]'} relative overflow-hidden bg-slate-950`}>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 min-h-[500px]">
            {!showQuiz && (
              <>
                <h2 className="text-2xl md:text-4xl font-bold font-headline text-white mb-[11px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <EditableText storageKey="home-finalcta-title">Pronto para Transformar Sua Jornada de Aprendizado?</EditableText>
                </h2>
                <p className="text-base md:text-lg text-blue-100 max-w-[900px] mx-auto mb-10 leading-relaxed">
                  <EditableText storageKey="home-finalcta-subtitle">A primeira aula é experimental e sem compromisso. Sem cartão de crédito. Sem letras miúdas.</EditableText>
                </p>
              </>
            )}

            {showQuiz || quizCompleted ? (
              <div className="w-full max-w-lg mt-[60px]">
                <QuizCarousel
                  questions={quizQuestions}
                  onComplete={() => setQuizCompleted(true)}
                />
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowQuiz(false);
                    setQuizCompleted(false);
                  }}
                  className="mt-4 pb-[45px] text-white hover:bg-transparent hover:text-amber-400 -ml-[800px]"
                >
                  Voltar ao início
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => setShowQuiz(true)}
                className="h-14 sm:h-12 rounded-2xl sm:rounded-full px-8 bg-[#FFC107] hover:bg-[#FFD54F] text-slate-900 font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(245,176,0,0.9)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <EditableText storageKey="home-finalcta-button">Quero minha aula experimental grátis</EditableText>
              </Button>
            )}

            <p className="mt-6 text-sm text-blue-200/80 flex items-center justify-center gap-2 hidden">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <EditableText storageKey="home-finalcta-guarantee">Seu e-mail está 100% seguro. Não fazemos spam.</EditableText>
            </p>
          </div>
        </section>
      </main>

      <footer id="contato" className="bg-slate-950 text-slate-300 pt-0 pb-0 border-t border-slate-800">
        <div className="container mx-auto px-[61px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[26px] mt-5 mb-3">
            <div className="space-y-4">
              <div className="w-24 ml-[65px]">
                <img src="/logo.png" alt="Aulas Online Senra" className="w-full h-auto rounded-full border-2 border-[#f5b000] shadow-[0_0_10px_#f5b000]" />
              </div>
              <p className="text-xs leading-relaxed text-slate-400 max-w-xs">
                <EditableText storageKey="home-footer-company-description">Quais habilidade você precisa aprimorar?</EditableText>
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4 text-lg tracking-tight">
                <EditableText storageKey="home-footer-nav-title">Navegação & Institucional</EditableText>
              </h4>
              <ul className="space-y-1 text-xs">
                <li>
                  <Link href="#como-funciona" className="hover:text-amber-400 transition-colors inline-flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <EditableText storageKey="home-footer-nav-how">Como funciona</EditableText>
                  </Link>
                </li>
                <li>
                  <Link href="#sobre-nos" className="hover:text-amber-400 transition-colors inline-flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <EditableText storageKey="home-footer-nav-about">Sobre nós</EditableText>
                  </Link>
                </li>
                <li>
<Link href="/blog" className="hover:text-amber-400 transition-colors inline-flex items-center gap-2">
  <ArrowRight className="h-4 w-4" />
  <EditableText storageKey="home-footer-nav-blog">Blog</EditableText>
</Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-amber-400 transition-colors inline-flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <EditableText storageKey="home-footer-nav-terms">Contato</EditableText>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4 text-lg tracking-tight">
                <EditableText storageKey="home-footer-specialties-title">Especialidades</EditableText>
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <EditableText storageKey="home-footer-specialty-1">Ensino Fundamental</EditableText>
                </li>
                <li>
                  <EditableText storageKey="home-footer-specialty-2">Ensino Médio</EditableText>
                </li>
                <li>
                  <EditableText storageKey="home-footer-specialty-3">ENEM e Vestibulares</EditableText>
                </li>
                <li>
                  <EditableText storageKey="home-footer-specialty-4">Concursos</EditableText>
                </li>
              </ul>
            </div>

            <div className="ml-[-10px]">
              <h4 className="font-bold text-white mb-6 text-lg tracking-tight">
                <EditableText storageKey="home-footer-security-title">Segurança & Pagamentos</EditableText>
              </h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <div>
                    <p className="font-semibold text-white">
                      <EditableText storageKey="home-footer-security-ssl-title">Site Seguro SSL</EditableText>
                    </p>
                    <p className="text-xs text-slate-400">
                      <EditableText storageKey="home-footer-security-ssl-text">Dados protegidos com criptografia.</EditableText>
                    </p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-amber-400 mt-0.5" />
                </div>

                <div className="space-y-2 text-sm text-slate-400">
                  <p className="font-semibold text-white">
                    <EditableText storageKey="home-footer-payments-title">Pagamentos aceitos</EditableText>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-xs text-slate-200">
                      <Landmark className="h-4 w-4 text-amber-400" /> Pix
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-xs text-slate-200">
                      <Landmark className="h-4 w-4 text-amber-400" /> Transferência bancária
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-1 mt-1 pb-0 mb-0 border-t border-slate-800 text-center flex flex-col items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center justify-center gap-4 mt-[5px]">
              <Link href="https://www.instagram.com/aulasonlinesenra/" target="_blank" aria-label="Instagram" className="text-slate-400 hover:text-amber-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="https://www.facebook.com/aulasonlinesenra?_rdc=1&_rdr#" target="_blank" aria-label="Facebook" className="text-slate-400 hover:text-amber-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="https://www.youtube.com/@AulasOnlineSenra" target="_blank" aria-label="Youtube" className="text-slate-400 hover:text-amber-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
<div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
              <p className="-mt-[45px]">
                &copy; {new Date().getFullYear()} <EditableText storageKey="home-footer-copyright">Plataforma Senra. Todos os direitos reservados.</EditableText>
              </p>
              <p className="text-slate-500 -mt-[45px]">
                <Link href="/politica-de-privacidade" className="hover:text-amber-400 transition-colors">
                  <EditableText storageKey="home-footer-bottom-note">Política de privacidade</EditableText>
                </Link>
                &nbsp;&&nbsp;
                <Link href="/termos-de-uso" className="hover:text-amber-400 transition-colors">
                  Termos de uso
                </Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
