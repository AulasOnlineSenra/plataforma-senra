'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SenraLogo } from '@/components/senra-logo';
import { User, UserRole } from '@/lib/types';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowLeft, Eye, EyeOff, GraduationCap, School } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loginUser } from '../actions/auth';

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

const LoginForm = ({
  role,
  onBack,
  onLogin,
  email,
  setEmail,
  password,
  setPassword,
}: {
  role: UserRole;
  onBack: () => void;
  onLogin: (e: React.FormEvent) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
}) => {
  const rolePortuguese = {
    student: 'Aluno',
    teacher: 'Professor',
    admin: 'Administrador',
  };
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem(`savedEmail-${role}`);
    if (savedEmail) {
      setEmail(savedEmail);
      const savedPassword = localStorage.getItem(`savedPassword-${savedEmail}`);
      if (savedPassword) setPassword(savedPassword);
      else setPassword('');
    } else {
        setEmail('');
        setPassword('');
    }
  }, [role, setEmail, setPassword]);

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-8 duration-500">
      
      <div className="flex items-center justify-start mb-6 mt-[-90px]">
          <Button
            onClick={onBack}
            variant="ghost"
            className="-ml-4 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-full px-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" /> Voltar
          </Button>
      </div>

    <div className="text-center mb-8 pt-[15px]">
         <h1 className="text-2xl font-bold font-headline mb-1 text-slate-900">
            Login como <span className="text-amber-500">{rolePortuguese[role]}</span>
         </h1>
        <p className="text-slate-500 text-sm">
            Bem-vindo de volta! Insira suas credenciais.
         </p>
      </div>

      <form onSubmit={onLogin} className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email" className="sr-only">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="Seu e-mail cadastrado"
            required
            className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-amber-400 focus:ring-amber-400 transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2 relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Sua senha"
            required
            className="h-12 rounded-xl pr-10 bg-slate-50 border-slate-200 focus:border-amber-400 focus:ring-amber-400 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="button" variant="ghost" size="icon"
            className="absolute right-1 top-[38px] h-10 w-10 text-slate-400 hover:text-slate-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
          <div className="-mt-2 ml-1">
            <Link href="/forgot-password" className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline">
              Esqueci minha senha
            </Link>
          </div>
        </div>
        
        <Button
            type="submit" 
            className="h-12 w-full rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-slate-900 font-bold shadow-lg shadow-amber-500/20 text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Entrar na Plataforma
        </Button>
      </form>

      <div className="relative my-8 mt-[6px]">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-4 text-slate-400 font-medium">ou continue com</span>
        </div>
      </div>

    <div className="grid gap-4">
        <Button variant="outline" className="h-12 w-full rounded-xl border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium text-slate-600">
            <GoogleIcon className="mr-3 h-5 w-5" />
            Google
        </Button>
      </div>

      <div className="mt-2 text-center text-sm text-slate-500">
        Não tem uma conta?{' '}
        <Link href={`/register?role=${role}`} className="text-amber-600 font-bold hover:underline underline-offset-4">
          Criar conta agora
        </Link>
      </div>
    </div>
  );
};

const RoleSelection = ({ onSelectRole }: { onSelectRole: (role: UserRole) => void; }) => {
  return (
  <div className="w-full animate-in fade-in zoom-in-95 duration-500">
    <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-headline text-slate-900 mb-1">
            Como você deseja acessar?
        </h1>
        <p className="text-slate-500 text-sm">
            Escolha seu perfil para continuar.
        </p>
    </div>

    <div className="grid gap-4 mt-[-10px]">
        <Button 
            onClick={() => onSelectRole('teacher')} 
            className="h-14 w-full rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-slate-900 font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-1 text-lg flex items-center justify-start px-6 gap-4 group"
        >
            <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
                <GraduationCap className="w-6 h-6" />
            </div>
            Sou Professor
        </Button>

        <Button 
            onClick={() => onSelectRole('student')} 
            className="h-14 w-full rounded-xl bg-[#FFC107] hover:bg-[#FFD54F] text-slate-900 font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-1 text-lg flex items-center justify-start px-6 gap-4 group"
        >
             <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
                <School className="w-6 h-6" />
            </div>
            Sou Aluno
        </Button>
        
         <Button 
            onClick={() => onSelectRole('admin')} 
            variant="outline"
            className="h-14 w-full rounded-xl border-2 border-slate-100 hover:border-amber-400 hover:bg-amber-50 text-slate-600 font-bold transition-all text-base flex items-center justify-start px-6 gap-4 shadow-lg"
        >
            Sou Administrador
        </Button>

      <div className="mt-8 text-center text-sm text-slate-500">
        Não tem uma conta?{' '}
        <Link href="/register" className="text-amber-600 font-bold hover:underline underline-offset-4">
          Criar conta agora
        </Link>
      </div>

    </div>
  </div>
);
}

export default function LoginPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const newUserDataString = localStorage.getItem('newlyRegisteredUser');
    if (newUserDataString) {
        try {
            const newUser: User = JSON.parse(newUserDataString);
            setEmail(newUser.email);
            setRole(newUser.role);
        } catch (e) {
            console.error("Failed to parse newly registered user data", e);
        }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Login 100% Blindado no Banco de Dados
    const result = await loginUser({ email, password });

    if (!result.success || !result.user) {
        toast({
            variant: "destructive",
            title: "Acesso Negado",
            description: result.error || "Email ou senha incorretos.",
        });
        return;
    }

    const loggedUser = result.user;

    if (loggedUser.role !== role) {
        toast({
            variant: "destructive",
            title: "Perfil Incorreto",
            description: `Este e-mail pertence a um perfil de ${loggedUser.role === 'teacher' ? 'Professor' : loggedUser.role === 'admin' ? 'Administrador' : 'Aluno'}. Volte e selecione o perfil correto.`,
        });
        return;
    }

    // Salva os dados na memória do navegador se a autenticação foi um sucesso
    localStorage.setItem('userRole', loggedUser.role);
    localStorage.setItem('currentUser', JSON.stringify(loggedUser));
    localStorage.setItem(`savedEmail-${loggedUser.role}`, email);
    localStorage.setItem(`savedPassword-${email}`, password);
    localStorage.setItem('userId', String(loggedUser.id));

    window.dispatchEvent(new Event('storage'));
    localStorage.removeItem('newlyRegisteredUser'); 
    
    toast({
        title: "Login bem-sucedido!",
        description: `Bem-vindo(a) de volta, ${loggedUser.name.split(' ')[0]}!`,
    });
    
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 pt-[47px] relative">

      <div className="absolute top-2 left-1 md:top-2 md:left-0.5 z-10"> 
          <Button 
            asChild
            variant="ghost"
            className="text-slate-500 hover:text-amber-600 hover:bg-amber-50 gap-2 transition-colors"
          >
            <Link href="/home">
              <ArrowLeft className="h-4 w-4"/>
              <span className="hidden sm:inline">Voltar ao site</span>
              <span className="sm:hidden">Voltar</span>
            </Link>
          </Button>
      </div>

        <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 py-[11px] md:py-[15px] px-8 md:px-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
                <div className="flex justify-center mt-6 mb-6">
                    <SenraLogo />
                </div>
                {role ? (
                    <LoginForm
                        role={role}
                        onBack={() => setRole(null)}
                        onLogin={handleLogin}
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                    />
                ) : (
                    <RoleSelection onSelectRole={setRole} />
                )}
            </div>
            <p className="text-center text-slate-400 text-xs mt-8">
                &copy; {new Date().getFullYear()} Senra Aulas Online. Todos os direitos reservados.
            </p>
        </div>
      </div>
      <div className="hidden md:flex w-1/2 bg-slate-900 relative items-center justify-center text-center p-12 overflow-hidden">
         {loginImage && (
            <>
            <Image
              src={loginImage.imageUrl}
              alt="Estudante focado"
              fill
              className="object-cover opacity-70 mix-blend-overlay"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-slate-900/5"></div>
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