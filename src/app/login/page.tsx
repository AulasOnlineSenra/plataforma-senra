
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SenraLogo } from '@/components/senra-logo';
import { UserRole } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMockUser } from '@/lib/data';

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

export default function LoginPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    localStorage.setItem('userRole', role);
    const user = getMockUser(role);
    localStorage.setItem('currentUser', JSON.stringify(user));
    router.push('/dashboard');
  };

  const RoleSelection = () => (
    <div className="grid gap-4">
      <Button
        variant="outline"
        className="w-[95%] mx-auto justify-center h-12 text-lg rounded-xl"
        onClick={() => setRole('teacher')}
      >
        Professor
      </Button>
      <Button
        variant="outline"
        className="w-[95%] mx-auto justify-center h-12 text-lg rounded-xl"
        onClick={() => setRole('student')}
      >
        Aluno
      </Button>
      <Button
        variant="outline"
        className="w-[95%] mx-auto justify-center h-12 text-lg rounded-xl"
        onClick={() => setRole('admin')}
      >
        Administrador
      </Button>
    </div>
  );

  const LoginForm = () => (
    <form onSubmit={handleLogin}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" required />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
        <Button variant="outline" className="w-full">
          <GoogleIcon className="mr-2 h-4 w-4" />
          Login com Google
        </Button>
         <div className="mt-4 text-center text-sm">
          <Link
            href="#"
            className="underline"
          >
            Esqueceu sua senha?
          </Link>
        </div>
      </div>
    </form>
  );

  const roleLabels: Record<UserRole, string> = {
    student: 'Aluno',
    teacher: 'Professor',
    admin: 'Administrador',
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 relative">
      <Button asChild variant="ghost" className="absolute top-4 left-4 text-base">
        <Link href="/home">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a página inicial
        </Link>
      </Button>
      <Card className="mx-auto w-full max-w-md shadow-2xl relative">
        {role && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setRole(null)}
                className="absolute top-4 right-4"
                aria-label="Voltar para a seleção de perfil"
            >
                <ArrowLeft className="h-5 w-5" />
            </Button>
        )}
        <CardHeader className="text-center pt-12">
          <div className="w-full flex justify-center h-20 mb-4">
            <SenraLogo />
          </div>
          <CardTitle className="text-2xl font-headline">
            {role ? `Login como ${roleLabels[role]}` : 'Bem-vindo(a)!'}
          </CardTitle>
          <CardDescription>
            {role
              ? 'Insira seus dados para acessar a plataforma.'
              : 'Selecione seu tipo de perfil para continuar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {role ? <LoginForm /> : <RoleSelection />}
        </CardContent>
      </Card>
    </div>
  );
}
