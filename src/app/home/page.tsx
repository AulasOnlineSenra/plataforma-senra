
import { Button } from '@/components/ui/button';
import { SenraLogo } from '@/components/senra-logo';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, CheckCircle2, ChevronRight, Heart, PlayCircle, ShieldCheck, Star, XCircle, BrainCircuit, Bot, Briefcase, CalendarCheck, MessageSquare, Target, TrendingUp, Menu, LogIn } from 'lucide-react';import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EditableText } from '@/components/editable-text';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image-1');

const navLinks = [
  { href: "#", label: "Página inicial", storageKey: "home-nav-home" },
  { href: "#", label: "Blog", storageKey: "home-nav-blog" },
  { href: "#", label: "Sobre nós", storageKey: "home-nav-about" },
  { href: "#", label: "Fale conosco", storageKey: "home-nav-contact" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-card">
      <header className="sticky top-0 z-50 flex items-center justify-between p-2 lg:p-4 bg-card/80 backdrop-blur-sm border-b">
        <SenraLogo />
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
             <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                <EditableText storageKey={link.storageKey}>{link.label}</EditableText>
             </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
            <Button asChild className="hidden sm:inline-flex rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 gap-2 font-bold border border-slate-800">
              <Link href="/login" className="flex items-center">
              <LogIn className="w-4 h-4 text-amber-400" />
              <EditableText storageKey="home-login-button">Acessar Plataforma</EditableText></Link>
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
                        {navLinks.map(link => (
                             <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
                                <EditableText storageKey={link.storageKey}>{link.label}</EditableText>
                             </Link>
                        ))}
                    </nav>
                    <div className="absolute bottom-6 left-6 right-6">
                         <Button asChild className="w-full">
                            <Link href="/login"><EditableText storageKey="home-login-button-mobile">Acessar Plataforma</EditableText></Link>
                         </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </header>

      <main className="flex-1">
        {/* Section 1: Hero Section */}
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
              <EditableText storageKey="home-subheadline">Aulas 100% personalizadas com os melhores especialistas. Do reforço escolar ao vestibular, encontre o tutor ideal para transformar dúvidas em conquistas.</EditableText>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                <ChevronRight className="mr-2 h-5 w-5" /> <EditableText storageKey="home-cta-primary">Encontre Seu Tutor Ideal</EditableText>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black">
                <EditableText storageKey="home-cta-secondary">Ver Depoimentos</EditableText>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 2: Trust Badges */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <h3 className="text-center text-muted-foreground font-semibold mb-4"><EditableText storageKey="home-trust-intro">Reconhecida por famílias e instituições</EditableText></h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Heart className="h-8 w-8 text-primary" />
                <p className="font-semibold"><EditableText storageKey="home-trust-1">100% Satisfação Garantida</EditableText></p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PlayCircle className="h-8 w-8 text-primary" />
                <p className="font-semibold"><EditableText storageKey="home-trust-2">Mais de 5.000 Aulas Ministradas</EditableText></p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <p className="font-semibold"><EditableText storageKey="home-trust-3">Professores Verificados</EditableText></p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <p className="font-semibold"><EditableText storageKey="home-trust-4">Plataforma Segura e Interativa</EditableText></p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Problem & Solution */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div className="p-8 border rounded-lg bg-red-50 dark:bg-red-900/20">
              <h2 className="text-2xl font-bold font-headline mb-4"><EditableText storageKey="home-problem-title">A Frustração de Ver o Potencial, Mas Não o Resultado?</EditableText></h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3"><XCircle className="h-6 w-6 text-red-500 mt-0.5" /><span><EditableText storageKey="home-problem-1">Dificuldade em uma matéria específica?</EditableText></span></li>
                <li className="flex items-start gap-3"><XCircle className="h-6 w-6 text-red-500 mt-0.5" /><span><EditableText storageKey="home-problem-2">Falta de motivação e método de estudo?</EditableText></span></li>
                <li className="flex items-start gap-3"><XCircle className="h-6 w-6 text-red-500 mt-0.5" /><span><EditableText storageKey="home-problem-3">Professores na escola não conseguem dar atenção individual?</EditableText></span></li>
                <li className="flex items-start gap-3"><XCircle className="h-6 w-6 text-red-500 mt-0.5" /><span><EditableText storageKey="home-problem-4">Horários inflexíveis que não se encaixam na rotina?</EditableText></span></li>
              </ul>
            </div>
            <div className="p-8 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <h2 className="text-2xl font-bold font-headline mb-4"><EditableText storageKey="home-solution-title">Nós Conectamos o Aluno ao Professor que Faz a Diferença.</EditableText></h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3"><CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" /><span><EditableText storageKey="home-solution-1">Aulas Sob Medida para Suas Necessidades</EditableText></span></li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" /><span><EditableText storageKey="home-solution-2">Mentores Especialistas e Apaixonados por Ensinar</EditableText></span></li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" /><span><EditableText storageKey="home-solution-3">Plataforma Tudo-em-Um: Vídeo, Chat e Material</EditableText></span></li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" /><span><EditableText storageKey="home-solution-4">Flexibilidade Total: Você Escolhe o Horário</EditableText></span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: How It Works */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-12">
              <EditableText storageKey="home-howitworks-title">Do Desafio ao Sucesso em Apenas 3 Passos</EditableText>
            </h2>
            <div className="grid md:grid-cols-3 gap-8"> 
                
                <Card className="text-center bg-card border shadow-sm hover:shadow-md transition-all duration-200 relative top-0 hover:-top-1"> 
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4 relative">
                            <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold shadow-md">1</span>
                            <Target className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold"><EditableText storageKey="home-howitworks-step1-title">Conte Seu Objetivo</EditableText></h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground"><EditableText storageKey="home-howitworks-step1-text">Responda um quiz rápido para entendermos sua necessidade, estilo de aprendizado e disponibilidade.</EditableText></p>
                    </CardContent>
                </Card>

                 <Card className="text-center bg-card border shadow-sm hover:shadow-md transition-all duration-200 relative top-0 hover:-top-1">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4 relative">
                            <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold shadow-md">2</span>
                            <Bot className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold"><EditableText storageKey="home-howitworks-step2-title">Conheça Seu Tutor Ideal</EditableText></h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground"><EditableText storageKey="home-howitworks-step2-text">Nossa IA e nosso time especializado selecionam o professor perfeito para você. Veja o perfil e as avaliações.</EditableText></p>
                    </CardContent>
                </Card>

                 <Card className="text-center bg-card border shadow-sm hover:shadow-md transition-all duration-200 relative top-0 hover:-top-1">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4 relative">
                            <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold shadow-md">3</span>
                            <CalendarCheck className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold"><EditableText storageKey="home-howitworks-step3-title">Agende Sua Primeira Aula</EditableText></h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            <EditableText storageKey="home-howitworks-step3-text">Escolha o horário e comece sua jornada.</EditableText>
                        </p>
                    </CardContent>
                </Card>

            </div>
          </div>
        </section>
        
        {/* Section 5: Differentiators */}
        <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center p-8 bg-card border shadow-sm hover:shadow-md transition-all duration-200 relative top-0 hover:-top-1">
                    <BrainCircuit className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold font-headline mb-3">
                      <EditableText storageKey="home-diff-1-title">Não é Sorte, é Método.</EditableText>
                      </h3>
                    <p className="text-muted-foreground loading-relaxed">
                      <EditableText storageKey="home-diff-1-text">Usamos tecnologia para analisar perfil, personalidade e objetivos, garantindo a combinação mais eficaz entre aluno e tutor.</EditableText>
                      </p>
                </div>
                 <div className="flex flex-col items-center text-center p-8 bg-card border shadow-sm hover:shadow-md transition-all duration-200 relative top-0 hover:-top-1">
                    <Briefcase className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold font-headline mb-3">
                      <EditableText storageKey="home-diff-2-title">Tudo o que Você Precisa em Um Só Lugar.</EditableText>
                      </h3>
                    <p className="text-muted-foreground loading-relaxed">
                      <EditableText storageKey="home-diff-2-text">Videochamada de alta qualidade, quadro branco interativo, compartilhamento de tela e biblioteca de exercícios.</EditableText>
                      </p>
                </div>
                 <div className="flex flex-col items-center text-center p-8 bg-card border shadow-sm hover:shadow-md transition-all duration-200 relative top-0 hover:-top-1">
                    <TrendingUp className="h-10 w-10 text-primary"/>
                    <h3 className="text-xl font-bold font-headline mb-3">
                      <EditableText storageKey="home-diff-3-title">Acompanhe Cada Passo do Sucesso.</EditableText>
                      </h3>
                    <p className="text-muted-foreground loading-relaxed">
                      <EditableText storageKey="home-diff-3-text">Relatórios periódicos detalham o progresso, pontos fortes e áreas de melhoria, para pais e alunos sempre informados.</EditableText>
                    </p>
                </div>
            </div>
        </section>

        {/* Section 6: Testimonials */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12"><EditableText storageKey="home-testimonials-title">Histórias Reais, Resultados Reais</EditableText></h2>
            <Carousel opts={{ loop: true }} className="w-full max-w-4xl mx-auto">
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 mb-4">
                          <AvatarImage src={testimonial.avatar} />
                          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="italic text-muted-foreground">"<EditableText storageKey={`home-testimonial-text-${index}`}>{testimonial.text}</EditableText>"</p>
                        <div className="mt-4 font-bold"><EditableText storageKey={`home-testimonial-name-${index}`}>{testimonial.name}</EditableText></div>
                        <div className="text-sm text-muted-foreground"><EditableText storageKey={`home-testimonial-details-${index}`}>{testimonial.details}</EditableText></div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="ml-12" />
              <CarouselNext className="mr-12" />
            </Carousel>
          </div>
        </section>

        {/* Section 7: Call to Action Final */}
        <section className="py-24 relative overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h2 className="text-3xl md:text-5xl font-bold font-headline text-white mb-6">
                  <EditableText storageKey="home-finalcta-title">Pronto para Transformar Sua Jornada de Aprendizado?</EditableText>
                  </h2>
                <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
                  <EditableText storageKey="home-finalcta-subtitle">A primeira aula-experiência é gratuita e sem compromisso. Sem cartão de crédito. Sem letras miúdas.</EditableText>
                  </p>

                  <div className="mt-8 max-w-lg mx-auto bg-white/10 p-2 rounded-full backdrop-blur-sm border border-white/20 flex flex-col sm:flex-row gap-2">
                    <Input 
                        type="email" 
                        placeholder="Seu melhor e-mail" 
                        className="h-12 bg-transparent border-none text-white placeholder:text-blue-200 focus-visible:ring-0 focus-visible:ring-offset-0 px-6 rounded-full" 
                    />
                    <Button 
                        size="lg" 
                        className="h-12 rounded-full px-8 bg-[#FFC107] hover:bg-[#FFD54F] text-slate-900 font-bold shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all hover:scale-105"
                    >
                        <EditableText storageKey="home-finalcta-button">Quero Minha Aula! 🚀</EditableText>
                    </Button>
                  </div>
                 <p className="mt-6 text-sm text-blue-200/80 flex items-center justify-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-400"></span>
                 <EditableText storageKey="home-finalcta-guarantee">Seu e-mail está 100% seguro. Não fazemos spam.</EditableText>
                 </p>
            </div>
        </section>
      </main>

      <footer id="contato" className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              
                <div className="flex flex-col gap-5">
                    <div className="w-fit filter invert brightness-200 grayscale opacity-90 hover:opacity-100 transition-opacity">
                        <SenraLogo />
                    </div>
                    <p className="text-sm leading-relaxed max-w-xs">
                        Transformando dificuldades em conquistas através de uma educação personalizada e humana.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6 text-lg tracking-tight">Navegação</h4>
                    <ul className="space-y-3 text-sm">
                        <li><Link href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Como Funciona</Link></li>
                        <li><Link href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Nossos Tutores</Link></li>
                        <li><Link href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Depoimentos</Link></li>
                        <li><Link href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Blog Educativo</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6 text-lg tracking-tight">Institucional</h4>
                    <ul className="space-y-3 text-sm">
                        <li><Link href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Sobre Nós</Link></li>
                        <li><Link href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Política de Privacidade</Link></li>
                        <li><Link href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Termos de Uso</Link></li>
                        <li><Link href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">Trabalhe Conosco</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6 text-lg tracking-tight">Fale Conosco</h4>
                    <ul className="space-y-4 text-sm">
                        <li className="flex items-center gap-3 group cursor-pointer">
                            <span className="hover:text-white transition-colors">contato@senra.com.br</span>
                        </li>
                        <li className="flex items-center gap-3 group cursor-pointer">
                            <span className="hover:text-white transition-colors">(11) 99999-9999</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                <p>
                    &copy; {new Date().getFullYear()} Aulas Online Senra Ltda. Todos os direitos reservados.
                </p>
                <div className="flex gap-6">
                    <span className="hover:text-white cursor-pointer transition-colors">Instagram</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Facebook</span>
                    <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
                </div>
            </div>

        </div>
      </footer>
    </div>
  );
}


const testimonials = [
  {
    avatar: "https://picsum.photos/seed/test1/100/100",
    text: "Pulei de 5 para 8,5 em Física graças ao Pedro! A didática dele é incrível e a plataforma facilitou tudo.",
    name: "Lara F.",
    details: "Aluna, 16 anos - Física",
  },
  {
    avatar: "https://picsum.photos/seed/test2/100/100",
    text: "Como mãe, a segurança e os relatórios de progresso me deram total tranquilidade. Recomendo de olhos fechados.",
    name: "Maria S.",
    details: "Mãe da Lara, 15 anos - Matemática",
  },
  {
    avatar: "https://picsum.photos/seed/test3/100/100",
    text: "Finalmente passei em Cálculo de primeira! O match com o tutor foi perfeito, ele realmente entendia minhas dificuldades.",
    name: "Carlos M.",
    details: "Universitário, 19 anos - Cálculo I",
  },
    {
    avatar: "https://picsum.photos/seed/test4/100/100",
    text: "A flexibilidade de horários foi essencial para conciliar com meu trabalho. Aulas de altíssima qualidade.",
    name: "Sofia R.",
    details: "Concurseira, 25 anos - Redação",
  },
];

    
