'use client';

import { SenraLogo } from '@/components/senra-logo';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-image-1');

const navLinks = [
  { href: '#como-funciona', label: 'Como funciona', storageKey: 'home-nav-how-it-works' },
  { href: '#sobre-nos', label: 'Sobre nós', storageKey: 'home-nav-about' },
  { href: '#contato', label: 'Contato', storageKey: 'home-nav-contact' },
  { href: '/blog', label: 'Blog', storageKey: 'home-nav-blog' },
];


export default function HomePage() {
  const [leadEmail, setLeadEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
<header className="sticky top-0 z-50 flex items-center justify-between p-2 lg:px-4 lg:py-[2px] bg-card border-b h-[52px] sm:h-[52px]">
          <SenraLogo className="h-7 sm:h-9" />

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <EditableText storageKey={link.storageKey}>{link.label}</EditableText>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Button asChild className="hidden sm:inline-flex h-[32px] rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 gap-2 font-bold border border-slate-800">
            <Link href="/login" className="flex items-center">
              <LogIn className="w-4 h-4 text-amber-400" />
              <EditableText storageKey="home-login-button">Acessar Plataforma</EditableText>
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
                  <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
                    <EditableText storageKey={link.storageKey}>{link.label}</EditableText>
                  </Link>
                ))}
              </nav>
              <div className="absolute bottom-6 left-6 right-6">
                <Button asChild className="w-full h-14 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all active:scale-95 gap-2 font-bold border border-slate-800 text-lg">
                  <Link href="/login" className="flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-amber-400 mr-2" />
                    <EditableText storageKey="home-login-button-mobile">Acessar Plataforma</EditableText>
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full h-[80vh] md:h-[90vh] flex items-center justify-center text-center text-white bg-black">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt="Tutor sorridente em uma chamada de vídeo"
              fill
              className="object-cover opacity-50"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}

          <div className="relative z-10 p-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold font-headline leading-tight">
              <EditableText storageKey="home-headline">Aulas Online que Finalmente Fazem o Clique Acontecer.</EditableText>
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-white/90">
              <EditableText storageKey="home-subheadline">
                Aulas 100% personalizadas com os melhores especialistas. Do reforço escolar ao vestibular, encontre o tutor ideal para transformar dúvidas em conquistas.
              </EditableText>
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full text-lg px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-black shadow-[0_0_30px_rgba(255,193,7,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_36px_rgba(255,193,7,0.55)]"
              >
                <ChevronRight className="mr-2 h-5 w-5" />
                <EditableText storageKey="home-cta-primary">Encontre Seu Tutor Ideal</EditableText>
              </Link>

              <Button 
                asChild 
                size="lg" 
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full text-lg px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105"
              >
                <Link href="#depoimentos">
                  <EditableText storageKey="home-cta-secondary">Ver Depoimentos</EditableText>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <h3 className="text-center text-muted-foreground font-semibold mb-4">
              <EditableText storageKey="home-trust-intro">Reconhecida por famílias e instituições</EditableText>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Heart className="h-8 w-8 text-primary" />
                <p className="font-semibold">
                  <EditableText storageKey="home-trust-1">100% Satisfação Garantida</EditableText>
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PlayCircle className="h-8 w-8 text-primary" />
                <p className="font-semibold">
                  <EditableText storageKey="home-trust-2">Mais de 5.000 Aulas Ministradas</EditableText>
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <p className="font-semibold">
                  <EditableText storageKey="home-trust-3">Professores Verificados</EditableText>
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <p className="font-semibold">
                  <EditableText storageKey="home-trust-4">Plataforma Segura e Interativa</EditableText>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-slate-900">
                <EditableText storageKey="home-how-title">Como Funciona em 3 Passos</EditableText>
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                <EditableText storageKey="home-how-subtitle">Um processo simples para começar rápido, com segurança e foco no seu objetivo.</EditableText>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-slate-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 text-center space-y-4">
                  <Bot className="h-10 w-10 mx-auto text-amber-500" />
                  <h3 className="font-bold text-xl text-slate-900">
                    <EditableText storageKey="home-how-step-1-title">Conte seu objetivo</EditableText>
                  </h3>
                  <p className="text-muted-foreground">
                    <EditableText storageKey="home-how-step-1-text">Você informa série, matéria e dificuldade para iniciarmos o melhor direcionamento.</EditableText>
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 text-center space-y-4">
                  <BrainCircuit className="h-10 w-10 mx-auto text-amber-500" />
                  <h3 className="font-bold text-xl text-slate-900">
                    <EditableText storageKey="home-how-step-2-title">Receba o match ideal</EditableText>
                  </h3>
                  <p className="text-muted-foreground">
                    <EditableText storageKey="home-how-step-2-text">Nossa curadoria conecta você com o tutor certo para o seu perfil e ritmo.</EditableText>
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 text-center space-y-4">
                  <CalendarCheck className="h-10 w-10 mx-auto text-amber-500" />
                  <h3 className="font-bold text-xl text-slate-900">
                    <EditableText storageKey="home-how-step-3-title">Agende e evolua</EditableText>
                  </h3>
                  <p className="text-muted-foreground">
                    <EditableText storageKey="home-how-step-3-text">Escolha o melhor horário, faça sua aula online e acompanhe seu progresso.</EditableText>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="sobre-nos" className="py-16 md:py-24 bg-card relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full bg-slate-50/50 -z-10 rounded-[3rem] blur-3xl opacity-70 pointer-events-none" />

          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 items-stretch">
            <div className="p-8 md:p-10 border border-red-100 rounded-3xl bg-red-50/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300 relative top-0 hover:-top-1">
              <h2 className="text-2xl md:text-3xl font-bold font-headline mb-6 text-red-900 leading-tight">
                <EditableText storageKey="home-problem-title">A Frustração de Ver o Potencial, Mas Não o Resultado?</EditableText>
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <XCircle className="h-6 w-6 text-red-500 mt-0.5 shrink-0 drop-shadow-sm" />
                  <span className="text-red-800 font-medium text-lg">
                    <EditableText storageKey="home-problem-1">Dificuldade em uma matéria específica?</EditableText>
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="h-6 w-6 text-red-500 mt-0.5 shrink-0 drop-shadow-sm" />
                  <span className="text-red-800 font-medium text-lg">
                    <EditableText storageKey="home-problem-2">Falta de motivação e método de estudo?</EditableText>
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="h-6 w-6 text-red-500 mt-0.5 shrink-0 drop-shadow-sm" />
                  <span className="text-red-800 font-medium text-lg">
                    <EditableText storageKey="home-problem-3">Professores sem tempo para atenção individual?</EditableText>
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="h-6 w-6 text-red-500 mt-0.5 shrink-0 drop-shadow-sm" />
                  <span className="text-red-800 font-medium text-lg">
                    <EditableText storageKey="home-problem-4">Horários inflexíveis que não cabem na rotina?</EditableText>
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-8 md:p-10 border border-green-100 rounded-3xl bg-green-50/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300 relative top-0 hover:-top-1">
              <h2 className="text-2xl md:text-3xl font-bold font-headline mb-6 text-green-900 leading-tight">
                <EditableText storageKey="home-solution-title">Nós Conectamos o Aluno ao Professor que Faz a Diferença.</EditableText>
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 shrink-0 drop-shadow-sm" />
                  <span className="text-green-800 font-medium text-lg">
                    <EditableText storageKey="home-solution-1">Aulas sob medida para suas necessidades</EditableText>
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 shrink-0 drop-shadow-sm" />
                  <span className="text-green-800 font-medium text-lg">
                    <EditableText storageKey="home-solution-2">Mentores especialistas e apaixonados por ensinar</EditableText>
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 shrink-0 drop-shadow-sm" />
                  <span className="text-green-800 font-medium text-lg">
                    <EditableText storageKey="home-solution-3">Plataforma completa: vídeo, chat e material</EditableText>
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 shrink-0 drop-shadow-sm" />
                  <span className="text-green-800 font-medium text-lg">
                    <EditableText storageKey="home-solution-4">Flexibilidade total para escolher seus horários</EditableText>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-8 bg-card border shadow-sm hover:shadow-md transition-all duration-200 relative top-0 hover:-top-1">
              <BrainCircuit className="h-10 w-10 text-amber-500" />
              <h3 className="text-xl font-bold font-headline mb-3">
                <EditableText storageKey="home-diff-1-title">Não é sorte, é método.</EditableText>
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                <EditableText storageKey="home-diff-1-text">Combinamos perfil, personalidade e objetivos para formar a conexão mais eficaz entre aluno e tutor.</EditableText>
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-8 bg-card border shadow-sm hover:shadow-md transition-all duration-200 relative top-0 hover:-top-1">
              <Briefcase className="h-10 w-10 text-amber-500" />
              <h3 className="text-xl font-bold font-headline mb-3">
                <EditableText storageKey="home-diff-2-title">Tudo o que você precisa em um só lugar.</EditableText>
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                <EditableText storageKey="home-diff-2-text">Videochamada de qualidade, quadro branco interativo, compartilhamento de tela e material de apoio.</EditableText>
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-8 bg-card border shadow-sm hover:shadow-md transition-all duration-200 relative top-0 hover:-top-1">
              <TrendingUp className="h-10 w-10 text-amber-500" />
              <h3 className="text-xl font-bold font-headline mb-3">
                <EditableText storageKey="home-diff-3-title">Acompanhe cada passo do sucesso.</EditableText>
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                <EditableText storageKey="home-diff-3-text">Relatórios periódicos mostram evolução, pontos fortes e oportunidades de melhoria.</EditableText>
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 relative overflow-hidden bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-3xl md:text-5xl font-bold font-headline text-white mb-6">
              <EditableText storageKey="home-finalcta-title">Pronto para Transformar Sua Jornada de Aprendizado?</EditableText>
            </h2>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              <EditableText storageKey="home-finalcta-subtitle">A primeira aula é experimental e sem compromisso. Sem cartão de crédito. Sem letras miúdas.</EditableText>
            </p>

            <form onSubmit={handleSubscribe} className="mt-8 w-full max-w-lg mx-auto bg-transparent sm:bg-white/10 sm:p-2 rounded-3xl sm:rounded-full sm:backdrop-blur-sm sm:border sm:border-white/20 flex flex-col sm:flex-row gap-3 sm:gap-2">
              <Input
                type="email"
                placeholder="Seu melhor e-mail"
                className="h-14 sm:h-12 w-full bg-white/10 sm:bg-transparent border border-white/20 sm:border-none text-white placeholder:text-blue-200 focus-visible:ring-1 focus-visible:ring-amber-400 px-6 rounded-2xl sm:rounded-full"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="h-14 sm:h-12 w-full sm:w-auto rounded-2xl sm:rounded-full px-8 bg-[#FFC107] hover:bg-[#FFD54F] text-slate-900 font-bold shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando...
                  </>
                ) : (
                  <EditableText storageKey="home-finalcta-button">Quero Minha Aula! 🚀</EditableText>
                )}
              </Button>
            </form>

            <p className="mt-6 text-sm text-blue-200/80 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <EditableText storageKey="home-finalcta-guarantee">Seu e-mail está 100% seguro. Não fazemos spam.</EditableText>
            </p>
          </div>
        </section>
      </main>

      <footer id="contato" className="bg-slate-950 text-slate-300 py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="space-y-5">
              <div className="w-fit brightness-0 invert">
                <SenraLogo />
              </div>
              <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
                <EditableText storageKey="home-footer-company-description">Transformamos dificuldades em conquistas com ensino personalizado, humano e orientado a resultados.</EditableText>
              </p>
              <div className="flex items-center gap-4">
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
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg tracking-tight">
                <EditableText storageKey="home-footer-nav-title">Navegação & Institucional</EditableText>
              </h4>
              <ul className="space-y-3 text-sm">
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
                    <EditableText storageKey="home-footer-nav-terms">Termos</EditableText>
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-amber-400 transition-colors inline-flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <EditableText storageKey="home-footer-nav-privacy">Privacidade</EditableText>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg tracking-tight">
                <EditableText storageKey="home-footer-specialties-title">Especialidades</EditableText>
              </h4>
              <ul className="space-y-3 text-sm text-slate-400">
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

            <div>
              <h4 className="font-bold text-white mb-6 text-lg tracking-tight">
                <EditableText storageKey="home-footer-security-title">Segurança & Pagamentos</EditableText>
              </h4>

              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <ShieldCheck className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">
                      <EditableText storageKey="home-footer-security-ssl-title">Site Seguro SSL</EditableText>
                    </p>
                    <p className="text-slate-400">
                      <EditableText storageKey="home-footer-security-ssl-text">Seus dados e transações protegidos com criptografia.</EditableText>
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-400">
                  <p className="font-semibold text-white">
                    <EditableText storageKey="home-footer-payments-title">Pagamentos aceitos</EditableText>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-slate-200">
                      <Landmark className="h-4 w-4 text-amber-400" /> Pix
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-slate-200">
                      <CreditCard className="h-4 w-4 text-amber-400" /> Cartão de Crédito
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-slate-200">
                      <CalendarCheck className="h-4 w-4 text-amber-400" /> Boleto
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} <EditableText storageKey="home-footer-copyright">Plataforma Senra. Todos os direitos reservados.</EditableText>
            </p>
            <p className="text-slate-500">
              <EditableText storageKey="home-footer-bottom-note">Educação premium, segura e personalizada.</EditableText>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
