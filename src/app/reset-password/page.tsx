'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { SenraLogo } from '@/components/senra-logo';
import { useToast } from '@/hooks/use-toast';
import { resetPasswordWithToken } from '@/app/actions/auth';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
        toast({ variant: 'destructive', title: 'Link Inválido', description: 'O token de segurança está ausente.' });
        return;
    }
    if (password !== confirmPassword) {
        toast({ variant: 'destructive', title: 'Senhas não conferem', description: 'As senhas digitadas são diferentes.' });
        return;
    }
    if (password.length < 6) {
        toast({ variant: 'destructive', title: 'Senha muito curta', description: 'A nova senha deve ter no mínimo 6 caracteres.' });
        return;
    }

    setIsSubmitting(true);
    const result = await resetPasswordWithToken(token, password);

    if (result.success) {
        toast({ title: 'Senha Redefinida! 🎉', description: 'A sua nova senha foi salva com sucesso. Você já pode fazer login.' });
        router.push('/login');
    } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error });
        setIsSubmitting(false);
    }
  };

  if (!token) {
      return (
          <div className="text-center py-10">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Link Inválido</h1>
              <p className="text-slate-500 mb-6">Não foi possível encontrar o token de verificação. Solicite um novo link de recuperação.</p>
              <Button asChild className="bg-brand-yellow text-slate-900 font-bold hover:bg-amber-400"><Link href="/forgot-password">Solicitar novo link</Link></Button>
          </div>
      );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-8 w-8 text-green-500" />
          <h1 className="text-2xl font-bold font-headline text-slate-900">Criar Nova Senha</h1>
      </div>
      <p className="text-slate-500 text-sm mb-8">Digite uma nova senha segura para a sua conta.</p>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-2 relative">
          <Label htmlFor="password" className="font-bold text-slate-700">Nova Senha</Label>
          <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" required className="h-12 rounded-xl pr-10 bg-slate-50 border-slate-200 focus:border-amber-400 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-8 h-10 w-10 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="confirm-password" className="font-bold text-slate-700">Confirmar Senha</Label>
          <Input id="confirm-password" type={showPassword ? 'text' : 'password'} placeholder="Repita a nova senha" required className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-amber-400 transition-all" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>

        <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md text-lg transition-all mt-4">
          {isSubmitting ? 'A salvar...' : 'Salvar Nova Senha'}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full bg-slate-50 items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
            <Link href="/login"><SenraLogo /></Link>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
          <Suspense fallback={<div className="py-10 text-center text-slate-400 animate-pulse font-medium">Carregando validação de segurança...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}