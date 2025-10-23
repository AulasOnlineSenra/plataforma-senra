import { Button } from '@/components/ui/button';
import { SenraLogo } from '@/components/senra-logo';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 lg:p-6">
        <SenraLogo />
        <Button asChild>
          <Link href="/login">Acessar Plataforma</Link>
        </Button>
      </header>

      <main className="flex-1">
        <section className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center text-center text-white bg-black">
          <Image
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
            alt="Students learning online"
            fill
            className="object-cover opacity-50"
            data-ai-hint="happy students learning"
          />
          <div className="relative z-10 p-4">
            <h1 className="text-4xl md:text-6xl font-bold font-headline">
              Transforme seu aprendizado com aulas particulares de excelência.
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto">
              Conectamos você aos melhores professores para aulas online personalizadas, focadas no seu sucesso.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/dashboard/packages">Conheça Nossos Planos</Link>
            </Button>
          </div>
        </section>

        <section className="py-12 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div>
                <h3 className="text-2xl font-bold font-headline text-primary">Professores Qualificados</h3>
                <p className="mt-2 text-muted-foreground">
                  Nossa equipe é composta por especialistas com vasta experiência e paixão por ensinar.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-headline text-primary">Aulas Personalizadas</h3>
                <p className="mt-2 text-muted-foreground">
                  Metodologia adaptada ao seu ritmo e objetivos, garantindo o máximo aproveitamento.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-headline text-primary">Flexibilidade Total</h3>
                <p className="mt-2 text-muted-foreground">
                  Agende suas aulas nos horários que funcionam para você, de onde estiver.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar text-sidebar-foreground p-6 text-center">
        <p>&copy; {new Date().getFullYear()} Aulas Online Senra. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
