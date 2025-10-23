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

const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image-1');

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-card">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 lg:p-6 bg-card/80 backdrop-blur-sm border-b">
        <SenraLogo />
        <Button asChild>
          <Link href="/login">Acessar Plataforma</Link>
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
              Aulas Online que Finalmente Fazem o Clique Acontecer.
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-white/90">
              Aulas 100% personalizadas com os melhores especialistas. Do reforço escolar ao vestibular, encontre o tutor ideal para transformar dúvidas em conquistas.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
                <ChevronRight className="mr-2 h-5 w-5" /> Encontre Seu Tutor Ideal
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-white text-white hover:bg-white hover:text-black">
                Ver Depoimentos
              </Button>
            </div>
          </div>
        </section>

        {/* Section 2: Trust Badges */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <h3 className="text-center text-muted-foreground font-semibold mb-4">Reconhecida por famílias e instituições</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Heart className="h-8 w-8 text-primary" />
                <p className="font-semibold">100% Satisfação Garantida</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PlayCircle className="h-8 w-8 text-primary" />
                <p className="font-semibold">Mais de 5.000 Aulas Ministradas</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <p className="font-semibold">Professores Verificados</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <p className="font-semibold">Plataforma Segura e Interativa</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Problem & Solution */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div className="p-8 border rounded-lg bg-red-50 dark:bg-red-900/20">
              <h2 className="text-2xl font-bold font-headline mb-4">A Frustração de Ver o Potencial, Mas Não o Resultado?</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3"><XCircle className="h-6 w-6 text-red-500 mt-0.5" /><span>Dificuldade em uma matéria específica?</span></li>
                <li className="flex items-start gap-3"><XCircle className="h-6 w-6 text-red-500 mt-0.5" /><span>Falta de motivação e método de estudo?</span></li>
                <li className="flex items-start gap-3"><XCircle className="h-6 w-6 text-red-500 mt-0.5" /><span>Professores na escola não conseguem dar atenção individual?</span></li>
                <li className="flex items-start gap-3"><XCircle className="h-6 w-6 text-red-500 mt-0.5" /><span>Horários inflexíveis que não se encaixam na rotina?</span></li>
              </ul>
            </div>
            <div className="p-8 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <h2 className="text-2xl font-bold font-headline mb-4">Nós Conectamos o Aluno ao Professor que Faz a Diferença.</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3"><CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" /><span>Aulas Sob Medida para Suas Necessidades</span></li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" /><span>Mentores Especialistas e Apaixonados por Ensinar</span></li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" /><span>Plataforma Tudo-em-Um: Vídeo, Chat e Material</span></li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" /><span>Flexibilidade Total: Você Escolhe o Horário</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: How It Works */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-12">Do Desafio ao Sucesso em Apenas 3 Passos</h2>
            <div className="grid md:grid-cols-3 gap-8 relative">
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-8"></div>
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/20 rounded-full p-4 w-fit mb-4 relative">
                            <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">1</span>
                            <Target className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Conte Seu Objetivo</h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Responda um quiz rápido para entendermos sua necessidade, estilo de aprendizado e disponibilidade.</p>
                    </CardContent>
                </Card>
                 <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/20 rounded-full p-4 w-fit mb-4 relative">
                            <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">2</span>
                            <Bot className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Conheça Seu Tutor Ideal</h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Nossa IA e nosso time especializado selecionam o professor perfeito para você. Veja o perfil e as avaliações.</p>
                    </CardContent>
                </Card>
                 <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/20 rounded-full p-4 w-fit mb-4 relative">
                            <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">3</span>
                            <CalendarCheck className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Agende Sua Primeira Aula</h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Escolha o horário e comece sua jornada. <span className="font-bold text-primary">A primeira aula é por nossa conta!</span></p>
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
                    <h3 className="text-xl font-bold font-headline">Não é Sorte, é Método.</h3>
                    <p className="text-muted-foreground">Usamos tecnologia para analisar perfil, personalidade e objetivos, garantindo a combinação mais eficaz entre aluno e tutor.</p>
                </div>
                 <div className="flex flex-col items-center text-center gap-3">
                    <Briefcase className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold font-headline">Tudo o que Você Precisa em Um Só Lugar.</h3>
                    <p className="text-muted-foreground">Videochamada de alta qualidade, quadro branco interativo, compartilhamento de tela e biblioteca de exercícios.</p>
                </div>
                 <div className="flex flex-col items-center text-center gap-3">
                    <TrendingUp className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-bold font-headline">Acompanhe Cada Passo do Sucesso.</h3>
                    <p className="text-muted-foreground">Relatórios periódicos detalham o progresso, pontos fortes e áreas de melhoria, para pais e alunos sempre informados.</p>
                </div>
            </div>
        </section>

        {/* Section 6: Testimonials */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">Histórias Reais, Resultados Reais</h2>
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
                        <p className="italic text-muted-foreground">"{testimonial.text}"</p>
                        <div className="mt-4 font-bold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.details}</div>
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
                <h2 className="text-3xl md:text-4xl font-bold font-headline">Pronto para Transformar Sua Jornada de Aprendizado?</h2>
                <p className="mt-2 text-lg">A primeira aula-experiência é gratuita e sem compromisso. Sem cartão de crédito. Sem letras miúdas.</p>
                <div className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-4">
                    <Input type="email" placeholder="Seu melhor e-mail" className="h-12 text-black" />
                    <Button size="lg" className="h-12 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent">Quero Minha Aula Grátis! 🚀</Button>
                </div>
                 <p className="mt-4 text-xs text-primary-foreground/80">Seu e-mail está 100% seguro. Não fazemos spam.</p>
            </div>
        </section>
      </main>

      <footer className="bg-sidebar text-sidebar-foreground p-8">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
                <SenraLogo />
                <p className="text-xs mt-2 text-sidebar-foreground/70">&copy; {new Date().getFullYear()} Aulas Online Senra. <br/>Todos os direitos reservados.</p>
            </div>
             <div>
                <h4 className="font-bold mb-2">Links Rápidos</h4>
                <ul className="space-y-1 text-sm text-sidebar-foreground/80">
                    <li><Link href="#" className="hover:underline">Como Funciona</Link></li>
                    <li><Link href="#" className="hover:underline">Matérias</Link></li>
                    <li><Link href="#" className="hover:underline">Preços</Link></li>
                    <li><Link href="#" className="hover:underline">Blog</Link></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold mb-2">Legal</h4>
                <ul className="space-y-1 text-sm text-sidebar-foreground/80">
                    <li><Link href="#" className="hover:underline">Termos de Uso</Link></li>
                    <li><Link href="#" className="hover:underline">Política de Privacidade</Link></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold mb-2">Contato</h4>
                 <ul className="space-y-1 text-sm text-sidebar-foreground/80">
                    <li><Link href="#" className="hover:underline">contato@senra.com</Link></li>
                    <li><Link href="#" className="hover:underline">(11) 99999-9999</Link></li>
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
