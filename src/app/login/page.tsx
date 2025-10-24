
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SenraLogo } from '@/components/senra-logo';
import { UserRole } from '@/lib/types';
import { getMockUser } from '@/lib/data';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 48 48"
      width="24"
      height="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

const loginImage = PlaceHolderImages.find(img => img.id === 'hero-image-1');

export default function LoginPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
        toast({
            variant: "destructive",
            title: "Seleção de Perfil Necessária",
            description: "Por favor, selecione um perfil para continuar.",
        });
        return;
    }
    
    // Simulate login and role assignment
    localStorage.setItem('userRole', role);
    const user = getMockUser(role);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('savedEmail', email);
    
    toast({
        title: "Login bem-sucedido!",
        description: `Bem-vindo(a) de volta, ${user.name.split(' ')[0]}!`,
    });
    
    router.push('/dashboard');
  };

  const LoginForm = ({ role }: { role: UserRole }) => {
    const rolePortuguese = {
        student: 'Aluno',
        teacher: 'Professor',
        admin: 'Administrador',
    };

    return (
      <div className="w-full">
        <button onClick={() => setRole(null)} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar para seleção
        </button>
        <h1 className="text-2xl font-bold font-headline text-center mb-1">
          Login como {rolePortuguese[role]}
        </h1>
        <p className="text-muted-foreground text-center mb-6">
            Insira seus dados para acessar a plataforma.
        </p>
        <form onSubmit={handleLogin} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="sr-only">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="E-mail"
              required
              className="h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="sr-only">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Senha"
              required
              className="h-11"
            />
          </div>
          <Button type="submit" className="h-11 w-full bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent">
            Entrar
          </Button>
        </form>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>
        <div className="grid gap-4">
          <Button variant="outline" className="h-11 w-full">
            <GoogleIcon className="mr-2" />
            Continuar com Google
          </Button>
        </div>
        <div className="mt-6 text-center text-sm">
          Não tem uma conta?{' '}
          <Link href="/register" className="underline font-semibold">
            Cadastrar-se
          </Link>
        </div>
      </div>
    );
  };
  
   const RoleSelection = () => (
    <div className="w-full">
      <h1 className="text-2xl font-bold font-headline text-center mb-6">
        Selecione seu perfil para entrar
      </h1>
      <div className="grid gap-4">
        <Button onClick={() => setRole('teacher')} variant="outline" className="h-12 text-base">
          Sou Professor
        </Button>
        <Button onClick={() => setRole('student')} variant="outline" className="h-12 text-base">
          Sou Aluno
        </Button>
        <Button onClick={() => setRole('admin')} variant="outline" className="h-12 text-base">
          Sou Administrador
        </Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>
        <Button onClick={() => handleLogin({ preventDefault: () => {} } as React.FormEvent)} className="h-12 text-base bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent">
          Acessar como Visitante
        </Button>
      </div>
    </div>
  );


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-card">
      <div className="grid w-full h-screen grid-cols-1 md:grid-cols-2">
        <div className="relative flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <div className="mb-8">
                <SenraLogo className="mx-auto" />
            </div>
            {role ? <LoginForm role={role} /> : <RoleSelection />}
          </div>
        </div>
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-primary to-accent p-12 text-center text-primary-foreground relative">
          {loginImage && (
             <Image
              src={loginImage.imageUrl}
              alt="Estudante feliz"
              fill
              className="object-cover opacity-20"
              data-ai-hint={loginImage.imageHint}
            />
          )}
          <div className="relative z-10">
            <h2 className="text-4xl font-bold font-headline mb-4">
              Aulas que inspiram. Resultados que impressionam.
            </h2>
            <p className="text-lg text-primary-foreground/90">
              Junte-se a milhares de alunos que estão alcançando seus objetivos com
              os melhores professores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}