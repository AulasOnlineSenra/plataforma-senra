'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SenraLogo } from '@/components/senra-logo';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowLeft } from 'lucide-react'; 
import { registerUser } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { logNotification } from '@/lib/data';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

const loginImage = PlaceHolderImages.find(img => img.id === 'hero-image-1');

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await registerUser({
      name,
      email,
      password,
      role: 'student', // Força todo mundo a ser aluno!
      referralCode,
    });

    if (!result.success) {
      toast({ variant: "destructive", title: "Erro", description: result.error });
      return;
    }

    logNotification({
      type: 'new_user_registered',
      title: `Novo Aluno`,
      description: `${result.user?.name} se cadastrou.`,
      userId: result.user?.id || '0',
    });

    toast({ title: "Sucesso!", description: "Conta criada! Redirecionando..." });
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-10">
          <Button asChild variant="ghost" className="text-slate-500 hover:text-amber-600 hover:bg-amber-50 gap-2 transition-colors">
            <Link href="/home">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar ao site</span>
              <span className="sm:hidden">Voltar</span>
            </Link>
          </Button>
        </div>

        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <SenraLogo />
          </div>
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
            
            <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold font-headline text-slate-900 mb-2">
                  Criar sua conta
                </h1>
                <p className="text-slate-500 text-sm">
                   Preencha seus dados para acessar a plataforma
                </p>
              </div>

              <form onSubmit={handleRegister} className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="sr-only">Nome Completo</Label>
                  <Input
                    id="name" type="text" placeholder="Seu nome completo" required
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-amber-400 focus:ring-amber-400 transition-all"
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="sr-only">E-mail</Label>
                  <Input
                    id="email" type="email" placeholder="Seu melhor e-mail" required
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-amber-400 focus:ring-amber-400 transition-all"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="sr-only">Senha</Label>
                  <Input
                    id="password" type="password" placeholder="Crie uma senha segura" required
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-amber-400 focus:ring-amber-400 transition-all"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="referral-code" className="sr-only">Codigo de indicacao</Label>
                  <Input
                    id="referral-code" type="text" placeholder="Código de indicação (opcional)"
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-amber-400 focus:ring-amber-400 transition-all"
                    value={referralCode} onChange={(e) => setReferralCode(e.target.value)}
                  />
                </div>

                <Button type="submit" className="h-12 w-full rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-slate-900 font-bold shadow-lg shadow-amber-500/20 text-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Criar Conta
                </Button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-400 font-medium">ou continue com</span>
                </div>
              </div>

              <div className="grid gap-4">
                <Button variant="outline" className="h-12 w-full rounded-xl border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium text-slate-600">
                  <GoogleIcon className="mr-3 h-5 w-5" /> Google
                </Button>
              </div>

              <div className="mt-8 text-center text-sm text-slate-500">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-amber-600 font-bold hover:underline underline-offset-4">
                  Fazer login
                </Link>
              </div>
            </div>

          </div>
          <p className="text-center text-slate-400 text-xs mt-8">
            &copy; {new Date().getFullYear()} Senra Aulas Online. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <div className="hidden md:flex w-1/2 bg-slate-900 relative items-center justify-center text-center p-12 overflow-hidden">
        {loginImage && (
          <>
            <Image src={loginImage.imageUrl} alt="Estudante feliz" fill className="object-cover opacity-40 mix-blend-overlay" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/30"></div>
          </>
        )}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl md:text-5xl font-bold font-headline text-white mb-6 leading-tight">
             Aulas que inspiram.<br/>Resultados que impressionam.
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
             Junte-se a milhares de alunos que estão transformando suas notas e conquistando seus sonhos com nossos mentores.
          </p>
        </div>
      </div>
    </div>
  );
}