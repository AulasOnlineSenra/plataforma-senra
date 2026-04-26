'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { registerUser, loginUser } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { SenraLogo } from '@/components/senra-logo';
import { Eye, EyeOff, GraduationCap, School, ShoppingCart, UserPlus, LogIn } from 'lucide-react';
import type { UserRole } from '@/lib/types';

interface CheckoutAuthModalProps {
  open: boolean;
  onAuthenticated: () => void;
  onClose: () => void;
}

// ─── Formulário de Cadastro ───────────────────────────────────────────────────
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('[CheckoutAuthModal] Enviando dados para registro:', { name, email, password, role: 'student' });
    const result = await registerUser({ name, email, password, role: 'student' });
    console.log('[CheckoutAuthModal] Resposta do registro:', result);

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Erro ao criar conta', description: result.error });
      setIsLoading(false);
      return;
    }

    const user = result.user!;

    // Autentica imediatamente após o cadastro
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('userId', String(user.id));
    window.dispatchEvent(new Event('storage'));

    toast({ title: 'Conta criada! ✨', description: `Bem-vindo(a), ${user.name.split(' ')[0]}! Continuando seu pedido...` });
    onSuccess();
  };

  return (
    <form onSubmit={handleRegister} className="grid gap-2 mt-2">
      <div className="grid gap-1.5">
        <Label htmlFor="reg-name" className="sr-only">
          Nome Completo
        </Label>
        <Input
          id="reg-name"
          type="text"
          placeholder="Seu nome completo"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:border-amber-400 focus:ring-amber-400/20"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="reg-email" className="sr-only">
          E-mail
        </Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="Seu melhor e-mail"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:border-amber-400 focus:ring-amber-400/20"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="reg-password" className="sr-only">
          Senha
        </Label>
        <div className="relative">
          <Input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Crie uma senha segura"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl border-slate-200 bg-slate-50 pr-10 focus:border-amber-400 focus:ring-amber-400/20"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-0.5 h-10 w-10 text-slate-400 hover:text-slate-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="h-12 w-full rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-base shadow-md shadow-amber-400/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            Criando conta...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Criar Conta e Continuar
          </span>
        )}
      </Button>

      <p className="text-xs text-slate-500 text-center mt-2">
        Ao criar a conta, você será cadastrado como <span className="font-bold text-amber-600">Aluno</span>.
      </p>
    </form>
  );
}

// ─── Formulário de Login ──────────────────────────────────────────────────────
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setIsLoading(true);

    const result = await loginUser({ email, password });

    if (!result.success || !result.user) {
      toast({ variant: 'destructive', title: 'Acesso Negado', description: result.error || 'E-mail ou senha incorretos.' });
      setIsLoading(false);
      return;
    }

    const user = result.user;

    if (user.role !== selectedRole) {
      toast({
        variant: 'destructive',
        title: 'Perfil Incorreto',
        description: `Este e-mail pertence a um perfil de ${user.role === 'teacher' ? 'Professor' : user.role === 'admin' ? 'Administrador' : 'Aluno'}. Selecione o perfil correto.`,
      });
      setIsLoading(false);
      return;
    }

    localStorage.setItem('userRole', user.role);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('userId', String(user.id));
    localStorage.setItem(`savedEmail-${user.role}`, email);
    window.dispatchEvent(new Event('storage'));

    toast({ title: 'Login bem-sucedido! 🎉', description: `Bem-vindo(a), ${user.name.split(' ')[0]}! Continuando seu pedido...` });
    onSuccess();
  };

  if (!selectedRole) {
    return (
      <div className="mt-2 grid gap-3">
        <p className="text-center text-sm text-slate-500 mb-1">Selecione seu perfil para entrar:</p>
        <Button
          onClick={() => setSelectedRole('student')}
          className="h-12 w-full rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold flex items-center gap-3 px-5 transition-all hover:-translate-y-0.5"
        >
          <div className="bg-white/30 p-1.5 rounded-lg"><School className="h-5 w-5" /></div>
          Sou Aluno
        </Button>
        <Button
          onClick={() => setSelectedRole('teacher')}
          variant="outline"
          className="h-12 w-full rounded-xl border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 font-bold flex items-center gap-3 px-5 transition-all hover:-translate-y-0.5"
        >
          <div className="bg-slate-100 p-1.5 rounded-lg"><GraduationCap className="h-5 w-5" /></div>
          Sou Professor
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="grid gap-4 mt-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setSelectedRole(null)}
        className="w-fit -mb-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 text-xs"
      >
        ← Trocar perfil
      </Button>

      <div className="grid gap-1.5">
        <Label htmlFor="login-email" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          E-mail
        </Label>
        <Input
          id="login-email"
          type="email"
          placeholder="Seu e-mail cadastrado"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:border-amber-400 focus:ring-amber-400/20"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="login-password" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Senha
        </Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Sua senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl border-slate-200 bg-slate-50 pr-10 focus:border-amber-400 focus:ring-amber-400/20"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-0.5 h-10 w-10 text-slate-400 hover:text-slate-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="h-12 w-full rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-base shadow-md shadow-amber-400/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            Entrando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <LogIn className="h-4 w-4" /> Entrar e Continuar
          </span>
        )}
      </Button>
    </form>
  );
}

// ─── Modal Principal ──────────────────────────────────────────────────────────
export function CheckoutAuthModal({ open, onAuthenticated, onClose }: CheckoutAuthModalProps) {
  const router = useRouter();

  const handleClose = () => {
    onClose();
    router.push('/home');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent
        className="sm:max-w-md border border-slate-100 bg-white p-0 shadow-2xl overflow-hidden"
        style={{ borderRadius: '20px' }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Faixa decorativa superior */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />

        <div className="px-6 pb-4 pt-2">
          {/* Header */}
          <DialogHeader className="items-center text-center mb-5">
            <div className="flex justify-center mb-3">
              <SenraLogo />
            </div>
            <div className="flex items-center gap-2 justify-center bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2 mb-1">
              <ShoppingCart className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-700">Quase lá! Finalize sua compra</span>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 font-headline">
              Acesse sua conta para continuar
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-0.5">
              Crie uma conta gratuita ou faça login para finalizar seu pedido.
            </DialogDescription>
          </DialogHeader>

          {/* Abas */}
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 h-11">
              <TabsTrigger
                value="register"
                className="rounded-xl text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                Criar Conta
              </TabsTrigger>
              <TabsTrigger
                value="login"
                className="rounded-xl text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                Já tenho conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="register">
              <RegisterForm onSuccess={onAuthenticated} />
            </TabsContent>

            <TabsContent value="login">
              <LoginForm onSuccess={onAuthenticated} />
            </TabsContent>
          </Tabs>

          {/* Rodapé */}
          <p className="mt-5 text-center text-xs text-slate-400 sr-only">
            Ao continuar, você concorda com nossos{' '}
            <span className="font-medium text-amber-600 cursor-pointer hover:underline">termos de uso</span>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
