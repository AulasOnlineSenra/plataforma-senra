
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
import { User, UserRole, Teacher } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { teachers as initialTeachers, users as initialUsers } from '@/lib/data';

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
const USERS_STORAGE_KEY = 'userList';
const TEACHERS_STORAGE_KEY = 'teacherList';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
        toast({
            variant: "destructive",
            title: "Erro de Cadastro",
            description: "Um perfil deve ser selecionado.",
        });
        return;
    }

    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const currentUsers: User[] = storedUsers ? JSON.parse(storedUsers) : initialUsers;
    const storedTeachers = localStorage.getItem(TEACHERS_STORAGE_KEY);
    const currentTeachers: Teacher[] = storedTeachers ? JSON.parse(storedTeachers) : initialTeachers;
    const allExistingUsers: (User | Teacher)[] = [...currentUsers, ...currentTeachers];

    const emailExists = allExistingUsers.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (emailExists) {
        toast({
            variant: "destructive",
            title: "Email já Cadastrado",
            description: "Este endereço de e-mail já está em uso. Por favor, tente fazer login ou use um e-mail diferente.",
        });
        return;
    }
    
    // Create a new user object based on the form data
    let newUser: User | Teacher;
    const baseUser = {
        id: `user-${Date.now()}`,
        name: name,
        email: email,
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
        role: role,
        status: 'active' as 'active',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    if (role === 'teacher') {
        newUser = {
            ...baseUser,
            id: `teacher-${Date.now()}`,
            role: 'teacher',
            subjects: [],
            bio: 'Novo professor na plataforma! Perfil em breve.',
            education: [],
            availability: {},
            status: 'active',
            classCredits: 0, // Start with 0 completed classes
        } as Teacher;

        const updatedTeachers = [...currentTeachers, newUser];
        localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedTeachers));

    } else {
        newUser = { ...baseUser, role: role } as User;
        const updatedUsers = [...currentUsers, newUser];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    }

    window.dispatchEvent(new Event('storage'));
    
    // Store the new user object in localStorage to be picked up by the login page.
    localStorage.setItem('newlyRegisteredUser', JSON.stringify(newUser));
    
    toast({
        title: "Cadastro realizado!",
        description: "Você será redirecionado para a página de login.",
    });
    router.push('/login');
  };

  const renderRoleSelection = () => (
    <>
      <h1 className="text-2xl font-bold font-headline text-center mb-6">
        Como você usará a plataforma?
      </h1>
      <div className="grid gap-4">
        <Button onClick={() => setRole('teacher')} className="h-12 text-base bg-brand-yellow text-black hover:bg-brand-yellow/90">
          Sou Professor
        </Button>
        <Button onClick={() => setRole('student')} className="h-12 text-base bg-brand-yellow text-black hover:bg-brand-yellow/90">
          Sou Aluno
        </Button>
         <Button onClick={() => setRole('admin')} className="h-12 text-base bg-brand-yellow text-black hover:bg-brand-yellow/90">
          Sou Administrador
        </Button>
      </div>
      <div className="mt-8 text-center text-sm">
        Já tem uma conta?{' '}
        <Link href="/login" className="underline font-semibold">
          Faça login
        </Link>
      </div>
    </>
  );

  const renderRegistrationForm = () => (
     <>
        <h1 className="text-2xl font-bold font-headline text-center mb-4">
            Crie sua Conta de {role === 'student' ? 'Aluno' : role === 'teacher' ? 'Professor' : 'Administrador'}
        </h1>
        <form onSubmit={handleRegister} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              required
              className="h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              required
              className="h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
            <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              required
              className="h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-11 mt-2 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent">
            Criar Conta
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
          <Button variant="outline" className="h-11">
            <GoogleIcon className="mr-2" />
            Cadastrar com Google
          </Button>
        </div>
        <div className="mt-6 text-center text-sm">
          <button onClick={() => setRole(null)} className="underline font-semibold">
            Voltar para seleção de perfil
          </button>
        </div>
     </>
  );

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-card">
      <div className="grid w-full h-screen grid-cols-1 md:grid-cols-2">
        <div className="relative flex flex-col items-center justify-center p-8">
          <Button asChild variant="ghost" size="icon" className="absolute top-6 left-6">
            <Link href="/home" aria-label="Voltar para a página inicial">
                <ArrowLeft />
            </Link>
          </Button>
          <div className="w-full max-w-sm">
            <div className="mb-8">
                <SenraLogo className="mx-auto" />
            </div>
            {role ? renderRegistrationForm() : renderRoleSelection()}
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
