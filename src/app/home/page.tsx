
import { Button } from '@/components/ui/button';
import { SenraLogo } from '@/components/senra-logo';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, CheckCircle2, ChevronRight, Heart, PlayCircle, ShieldCheck, Star, XCircle, BrainCircuit, Bot, Briefcase, CalendarCheck, MessageSquare, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EditableText } from '@/components/editable-text';

const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image-1');

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-card">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 lg:p-6 bg-card/80 backdrop-blur-sm border-b">
        <SenraLogo />
        <Button asChild>
          <Link href="/login"><EditableText storageKey="home-login-button">Acessar Plataforma</EditableText></Link>
        </Button>
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
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-white text-white hover:bg-white hover:text-black">
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
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-12"><EditableText storageKey="home-howitworks-title">Do Desafio ao Sucesso em Apenas 3 Passos</EditableText></h2>
            <div className="grid md:grid-cols-3 gap-8 relative">
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-8"></div>
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/20 rounded-full p-4 w-fit mb-4 relative">
                            <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">1</span>
                            <Target className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold"><EditableText storageKey="home-howitworks-step1-title">Conte Seu Objetivo</EditableText></h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground"><EditableText storageKey="home-howitworks-step1-text">Responda um quiz rápido para entendermos sua necessidade, estilo de aprendizado e disponibilidade.</EditableText></p>
                    </CardContent>
                </Card>
                 <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/20 rounded-full p-4 w-fit mb-4 relative">
                            <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">2</span>
                            <Bot className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold"><EditableText storageKey="home-howitworks-step2-title">Conheça Seu Tutor Ideal</EditableText></h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground"><EditableText storageKey="home-howitworks-step2-text">Nossa IA e nosso time especializado selecionam o professor perfeito para você. Veja o perfil e as avaliações.</EditableText></p>
                    </CardContent>
                </Card>
                 <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/20 rounded-full p-4 w-fit mb-4 relative">
                            <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">3</span>
                            <CalendarCheck className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold"><EditableText storageKey="home-howitworks-step3-title">Agende Sua Primeira Aula</EditableText></h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground"><EditableText storageKey="home-howitworks-step3-text">Escolha o horário e comece sua jornada. <span className="font-bold text-primary">A primeira aula é por nossa conta!</span></EditableText></p>
                    </CardContent>
                </Card>
            </div>
          </div>
        </section>
        
        {/* Section 5: Differentiators */}
        <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center gap-3">
                    <BrainCircuit className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold font-headline"><EditableText storageKey="home-diff-1-title">Não é Sorte, é Método.</EditableText></h3>
                    <p className="text-muted-foreground"><EditableText storageKey="home-diff-1-text">Usamos tecnologia para analisar perfil, personalidade e objetivos, garantindo a combinação mais eficaz entre aluno e tutor.</EditableText></p>
                </div>
                 <div className="flex flex-col items-center text-center gap-3">
                    <Briefcase className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold font-headline"><EditableText storageKey="home-diff-2-title">Tudo o que Você Precisa em Um Só Lugar.</EditableText></h3>
                    <p className="text-muted-foreground"><EditableText storageKey="home-diff-2-text">Videochamada de alta qualidade, quadro branco interativo, compartilhamento de tela e biblioteca de exercícios.</EditableText></p>
                </div>
                 <div className="flex flex-col items-center text-center gap-3">
                    <TrendingUp className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold font-headline"><EditableText storageKey="home-diff-3-title">Acompanhe Cada Passo do Sucesso.</EditableText></h3>
                    <p className="text-muted-foreground"><EditableText storageKey="home-diff-3-text">Relatórios periódicos detalham o progresso, pontos fortes e áreas de melhoria, para pais e alunos sempre informados.</EditableText></p>
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
        <section className="py-20 bg-primary/80 text-primary-foreground">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-headline"><EditableText storageKey="home-finalcta-title">Pronto para Transformar Sua Jornada de Aprendizado?</EditableText></h2>
                <p className="mt-2 text-lg"><EditableText storageKey="home-finalcta-subtitle">A primeira aula-experiência é gratuita e sem compromisso. Sem cartão de crédito. Sem letras miúdas.</EditableText></p>
                <div className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-4">
                    <Input type="email" placeholder="Seu melhor e-mail" className="h-12 text-black" />
                    <Button size="lg" className="h-12 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"><EditableText storageKey="home-finalcta-button">Quero Minha Aula Grátis! 🚀</EditableText></Button>
                </div>
                 <p className="mt-4 text-xs text-primary-foreground/80"><EditableText storageKey="home-finalcta-guarantee">Seu e-mail está 100% seguro. Não fazemos spam.</EditableText></p>
            </div>
        </section>
      </main>

      <footer className="bg-sidebar text-sidebar-foreground p-8">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
                <SenraLogo />
                <p className="text-xs mt-2 text-sidebar-foreground/70"><EditableText storageKey="home-footer-copyright">&copy; {new Date().getFullYear()} Aulas Online Senra. <br/>Todos os direitos reservados.</EditableText></p>
            </div>
             <div>
                <h4 className="font-bold mb-2"><EditableText storageKey="home-footer-quicklinks-title">Links Rápidos</EditableText></h4>
                <ul className="space-y-1 text-sm text-sidebar-foreground/80">
                    <li><Link href="#" className="hover:underline"><EditableText storageKey="home-footer-link-how">Como Funciona</EditableText></Link></li>
                    <li><Link href="#" className="hover:underline"><EditableText storageKey="home-footer-link-subjects">Matérias</EditableText></Link></li>
                    <li><Link href="#" className="hover:underline"><EditableText storageKey="home-footer-link-pricing">Preços</EditableText></Link></li>
                    <li><Link href="#" className="hover:underline"><EditableText storageKey="home-footer-link-blog">Blog</EditableText></Link></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold mb-2"><EditableText storageKey="home-footer-legal-title">Legal</EditableText></h4>
                <ul className="space-y-1 text-sm text-sidebar-foreground/80">
                    <li><Link href="#" className="hover:underline"><EditableText storageKey="home-footer-link-terms">Termos de Uso</EditableText></Link></li>
                    <li><Link href="#" className="hover:underline"><EditableText storageKey="home-footer-link-privacy">Política de Privacidade</EditableText></Link></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold mb-2"><EditableText storageKey="home-footer-contact-title">Contato</EditableText></h4>
                 <ul className="space-y-1 text-sm text-sidebar-foreground/80">
                    <li><Link href="#" className="hover:underline"><EditableText storageKey="home-footer-contact-email">contato@senra.com</EditableText></Link></li>
                    <li><Link href="#" className="hover:underline"><EditableText storageKey="home-footer-contact-phone">(11) 99999-9999</EditableText></Link></li>
                </ul>
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

    
