
'use client';

import { useState, useEffect, DragEvent, MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SenraLogo } from '@/components/senra-logo';
import { User, UserRole, Teacher } from '@/lib/types';
import { getMockUser, teachers as initialTeachers, users as initialRegularUsers } from '@/lib/data';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowLeft, Eye, EyeOff, GripVertical } from 'lucide-react';
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
const TEACHERS_STORAGE_KEY = 'teacherList';
const USERS_STORAGE_KEY = 'userList';

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

  return (
    <div className="w-full relative">
      <Button
        onClick={onBack}
        variant="ghost"
        size="icon"
        className="absolute -top-24 left-0"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Voltar para seleção</span>
      </Button>
      <h1 className="text-2xl font-bold font-headline text-center mb-1">
        Login como {rolePortuguese[role]}
      </h1>
      <p className="text-muted-foreground text-center mb-6">
        Insira seus dados para acessar a plataforma.
      </p>
      <form onSubmit={onLogin} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email" className="sr-only">
            E-mail
          </Label>
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
        <div className="grid gap-2 relative">
          <Label htmlFor="password" className="sr-only">
            Senha
          </Label>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            required
            className="h-11 pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
            <span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
          </Button>
        </div>
        <Button type="submit" className="h-11 w-full bg-sidebar text-sidebar-foreground hover:bg-brand-yellow">
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
        <Link href={`/register?role=${role}`} className="underline font-semibold">
          Cadastrar-se
        </Link>
      </div>
    </div>
  );
};

const defaultRoleButtons = [
  { id: 'teacher', label: 'Sou Professor', role: 'teacher' as UserRole },
  { id: 'student', label: 'Sou Aluno', role: 'student' as UserRole },
  { id: 'admin', label: 'Sou Administrador', role: 'admin' as UserRole },
  { id: 'visitor', label: 'Acessar como Visitante' },
];

const ROLE_BUTTON_ORDER_STORAGE_KEY = 'loginRoleOrder';


const RoleSelection = ({ onSelectRole, onLogin }: { onSelectRole: (role: UserRole) => void; onLogin: (e: React.FormEvent) => void;}) => {
  const [roleButtons, setRoleButtons] = useState(defaultRoleButtons);
  
  useEffect(() => {
    const savedOrder = localStorage.getItem(ROLE_BUTTON_ORDER_STORAGE_KEY);
    if (savedOrder) {
      try {
        const orderedIds = JSON.parse(savedOrder);
        const reorderedButtons = orderedIds
            .map((id: string) => defaultRoleButtons.find(btn => btn.id === id))
            .filter(Boolean);
        const remainingButtons = defaultRoleButtons.filter(btn => !orderedIds.includes(btn.id));
        setRoleButtons([...reorderedButtons, ...remainingButtons]);
      } catch (e) {
        console.error("Failed to parse role order from localStorage", e);
      }
    }
  }, []);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLDivElement).classList.add('dragging');
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).classList.remove('dragging');
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).classList.add('drag-over');
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).classList.remove('drag-over');
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>, dropId: string) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).classList.remove('drag-over');

    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId === dropId) return;

    const draggedItem = roleButtons.find(btn => btn.id === draggedId);
    if (!draggedItem) return;

    const itemsWithoutDragged = roleButtons.filter(btn => btn.id !== draggedId);
    const dropIndex = itemsWithoutDragged.findIndex(btn => btn.id === dropId);
    
    const newItems = [
      ...itemsWithoutDragged.slice(0, dropIndex),
      draggedItem,
      ...itemsWithoutDragged.slice(dropIndex),
    ];
    
    setRoleButtons(newItems);
    localStorage.setItem(ROLE_BUTTON_ORDER_STORAGE_KEY, JSON.stringify(newItems.map(btn => btn.id)));
  };

  return (
  <div className="w-full">
    <h1 className="text-2xl font-bold font-headline text-center mb-6">
      Selecione seu perfil para entrar
    </h1>
    <div className="grid gap-4">
      {roleButtons.map((item) => (
        <div 
          key={item.id}
          className="relative group"
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragEnd={handleDragEnd}
          onDrop={(e) => handleDrop(e, item.id)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <GripVertical className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
          {item.role ? (
            <Button onClick={() => onSelectRole(item.role)} className="h-12 text-base w-full bg-brand-yellow text-black hover:bg-brand-yellow/90 pl-10">
              {item.label}
            </Button>
          ) : (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              <Button onClick={onLogin} className="h-12 text-base w-full bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent pl-10">
                {item.label}
              </Button>
            </>
          )}
        </div>
      ))}
    </div>
  </div>
);
}

const DRAGGABLE_BUTTON_STORAGE_KEY = 'loginDraggableButtonPos';

export default function LoginPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const [position, setPosition] = useState({ top: 24, left: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const newUserDataString = localStorage.getItem('newlyRegisteredUser');
    if (newUserDataString) {
        try {
            const newUser: User = JSON.parse(newUserDataString);
            setEmail(newUser.email);
            setRole(newUser.role);
            // Do NOT remove the item here. It will be removed after successful login.
        } catch (e) {
            console.error("Failed to parse newly registered user data", e);
        }
    }
  }, []);

  useEffect(() => {
    const savedPos = localStorage.getItem(DRAGGABLE_BUTTON_STORAGE_KEY);
    if (savedPos) {
        try {
            setPosition(JSON.parse(savedPos));
        } catch (e) {
            console.error("Failed to parse button position from localStorage", e);
            setPosition({ top: 24, left: 24 });
        }
    }
  }, []);

  const handleMouseDown = (e: MouseEvent<HTMLAnchorElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.left, y: e.clientY - position.top });
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).style.cursor = '';
    localStorage.setItem(DRAGGABLE_BUTTON_STORAGE_KEY, JSON.stringify(position));
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      top: e.clientY - dragStart.y,
      left: e.clientX - dragStart.x,
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Always get the most up-to-date user lists from localStorage
    const storedUsersStr = localStorage.getItem(USERS_STORAGE_KEY);
    const currentUsers: User[] = storedUsersStr ? JSON.parse(storedUsersStr) : initialRegularUsers;
    const storedTeachersStr = localStorage.getItem(TEACHERS_STORAGE_KEY);
    const currentTeachers: Teacher[] = storedTeachersStr ? JSON.parse(storedTeachersStr) : initialTeachers;
    const combinedUsers: (User | Teacher)[] = [...currentUsers, ...currentTeachers];
    
    let userToLogin: User | Teacher | null = null;
    let isNewRegistration = false;
    const newUserDataString = localStorage.getItem('newlyRegisteredUser');

    // Case 1: Handle newly registered user
    if (newUserDataString) {
        try {
            const newUser = JSON.parse(newUserDataString);
            if (newUser.email.toLowerCase() === email.toLowerCase() && newUser.role === role) {
                userToLogin = combinedUsers.find(u => u.id === newUser.id) || null;
                isNewRegistration = true;
            } else if (newUser.email.toLowerCase() === email.toLowerCase() && newUser.role !== role) {
                 toast({
                    variant: "destructive",
                    title: "Perfil Incorreto",
                    description: `Você se cadastrou como ${newUser.role}. Por favor, faça login com o perfil correto.`,
                });
                return;
            }
        } catch (error) {
            console.error("Error parsing new user data during login:", error);
        }
    }
    
    // Case 2: Handle existing user
    if (!userToLogin) {
        const foundUser = combinedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (foundUser) {
            if (foundUser.role === role) {
                const storedPassword = localStorage.getItem(`savedPassword-${foundUser.id}`);
                if (storedPassword === password || (storedPassword === null && password === 'password')) {
                    userToLogin = foundUser;
                } else {
                     toast({
                        variant: "destructive",
                        title: "Credenciais Inválidas",
                        description: "Email ou senha incorretos para o perfil selecionado.",
                    });
                    return;
                }
            } else {
                 toast({
                    variant: "destructive",
                    title: "Perfil Incorreto",
                    description: `Este email está registrado como ${foundUser.role}. Por favor, selecione o perfil correto para entrar.`,
                });
                return;
            }
        }
    }

    // Case 3: Handle visitor login
    if (!role && !userToLogin) {
        const visitorRole = 'student';
        localStorage.setItem('userRole', visitorRole);
        const user = getMockUser(visitorRole);
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('userId', user.id);
        toast({
            title: "Acesso de Visitante",
            description: `Você está acessando como ${user.name.split(' ')[0]}.`,
        });
        router.push('/dashboard');
        return;
    }
    
    // Proceed with login if a user was found and validated
    if (userToLogin) {
        const now = new Date().toISOString();
        const updatedUser = { ...userToLogin, lastAccess: now };

        if (updatedUser.role === 'teacher') {
            const updatedTeachers = currentTeachers.map(t => t.id === updatedUser.id ? updatedUser as Teacher : t);
            localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedTeachers));
        } else {
            const updatedUsers = currentUsers.map(u => u.id === updatedUser.id ? updatedUser as User : u);
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
        }

        localStorage.setItem('userRole', updatedUser.role);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        localStorage.setItem(`savedEmail-${updatedUser.role}`, email);
        localStorage.setItem('userId', updatedUser.id);
        
        window.dispatchEvent(new Event('storage'));

        if (isNewRegistration) {
            localStorage.removeItem('newlyRegisteredUser');
            localStorage.setItem(`savedPassword-${updatedUser.id}`, password);
        }
        
        toast({
            title: "Login bem-sucedido!",
            description: `Bem-vindo(a) de volta, ${updatedUser.name.split(' ')[0]}!`,
        });
        
        router.push('/dashboard');
    } else {
         toast({
            variant: "destructive",
            title: "Credenciais Inválidas",
            description: "Email ou senha incorretos para o perfil selecionado.",
        });
    }
  };

  return (
    <div 
        className="flex min-h-screen w-full items-center justify-center bg-background"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      <div className="grid w-full h-screen grid-cols-1 md:grid-cols-2">
        <div className="relative flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-md relative">
                {!role && (
                    <Button asChild variant="ghost" size="icon" className="absolute cursor-grab" style={{ top: `${position.top}px`, left: `${position.left}px`, zIndex: 10 }}>
                        <Link href="/home" onMouseDown={handleMouseDown}>
                            <ArrowLeft />
                        </Link>
                    </Button>
                )}
                <div className="rounded-lg border-2 border-brand-yellow p-8 shadow-[0_0_15px_rgba(245,176,0,0.5)]">
                    <div className="mb-8">
                        <SenraLogo className="mx-auto" />
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
                       <RoleSelection onSelectRole={setRole} onLogin={handleLogin} />
                    )}
                </div>
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
