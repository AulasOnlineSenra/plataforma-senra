'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, ShieldCheck, Mail, KeyRound, Save, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// MOTORES DO BANCO DE DADOS
import { getUserById, updateUserProfile } from '@/app/actions/users';
import { changePassword } from '@/app/actions/auth';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Estados do Perfil
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Estados da Palavra-passe (Senha)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        router.push('/login');
        return;
      }

      const result = await getUserById(userId);
      if (result.success && result.data) {
        setCurrentUser(result.data);
        setName(result.data.name);
        setEmail(result.data.email);
      }
      setIsLoading(false);
    };

    loadUser();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({ variant: 'destructive', title: 'Campos vazios', description: 'O nome e o e-mail são obrigatórios.' });
      return;
    }

    setIsSavingProfile(true);
    const result = await updateUserProfile(currentUser.id, { name, email });

    if (result.success && result.data) {
      toast({ title: 'Perfil Atualizado! 🎉', description: 'As suas informações foram guardadas com sucesso.' });
      setCurrentUser(result.data);
      localStorage.setItem('currentUser', JSON.stringify(result.data));
      window.dispatchEvent(new Event('storage')); // Atualiza a foto na barra lateral
    } else {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: result.error || 'Não foi possível atualizar o perfil.' });
    }
    setIsSavingProfile(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ variant: 'destructive', title: 'Campos incompletos', description: 'Preencha todos os campos de segurança.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'As senhas não coincidem', description: 'A nova senha e a confirmação devem ser iguais.' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Senha muito curta', description: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setIsSavingPassword(true);
    
    // Chama o nosso novo motor seguro com bcrypt!
    const result = await changePassword(currentUser.id, currentPassword, newPassword);

    if (result.success) {
      toast({ title: 'Senha Alterada! 🔐', description: 'A sua nova senha já está ativa no sistema.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast({ variant: 'destructive', title: 'Erro de Autenticação', description: result.error });
    }
    setIsSavingPassword(false);
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center text-slate-500 animate-pulse font-medium">A carregar perfil...</div>;
  }

  const roleLabels: Record<string, string> = {
    student: 'Aluno',
    teacher: 'Professor',
    admin: 'Administrador',
  };

  return (
    <div className="flex flex-1 flex-col gap-8 max-w-4xl mx-auto w-full pb-10">
      
      {/* CABEÇALHO DO PERFIL */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <Avatar className="h-24 w-24 border-4 border-brand-yellow shadow-md">
          <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name} />
          <AvatarFallback className="bg-amber-100 text-amber-700 font-black text-3xl">
            {currentUser?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left flex-1">
          <h1 className="font-headline text-3xl font-bold text-slate-900">{currentUser?.name}</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">{currentUser?.email}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider">
              Perfil: {roleLabels[currentUser?.role] || currentUser?.role}
            </span>
            {currentUser?.status === 'active' && (
              <span className="bg-green-100 text-green-700 flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4" /> Ativo
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* BLOCO 1: INFORMAÇÕES PESSOAIS */}
        <Card className="rounded-3xl border-slate-200 shadow-sm h-fit">
          <CardHeader className="bg-slate-50 border-b pb-5 rounded-t-3xl">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
              <User className="h-6 w-6 text-brand-yellow" />
              Informações Pessoais
            </CardTitle>
            <CardDescription className="text-base font-medium">Atualize o seu nome e endereço de e-mail.</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="font-bold text-slate-700">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="name" className="pl-10 h-12 bg-white" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-bold text-slate-700">E-mail de Acesso</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="email" type="email" className="pl-10 h-12 bg-white" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 pt-6 rounded-b-3xl border-t">
              <Button type="submit" disabled={isSavingProfile} className="w-full h-12 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 transition-all">
                {isSavingProfile ? 'A Guardar...' : <><Save className="mr-2 h-5 w-5" /> Guardar Alterações</>}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* BLOCO 2: SEGURANÇA E SENHA */}
        <Card className="rounded-3xl border-slate-200 shadow-sm h-fit">
          <CardHeader className="bg-slate-50 border-b pb-5 rounded-t-3xl">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
              <ShieldCheck className="h-6 w-6 text-green-500" />
              Segurança
            </CardTitle>
            <CardDescription className="text-base font-medium">Altere a sua palavra-passe para manter a conta segura.</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-2">
                <Label htmlFor="current-password" className="font-bold text-slate-700">Senha Atual</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="current-password" type="password" placeholder="Digite a senha atual" className="pl-10 h-12 bg-white" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password" className="font-bold text-slate-700">Nova Senha</Label>
                <Input id="new-password" type="password" placeholder="Mínimo 6 caracteres" className="h-12 bg-white" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password" className="font-bold text-slate-700">Confirmar Nova Senha</Label>
                <Input id="confirm-password" type="password" placeholder="Repita a nova senha" className="h-12 bg-white" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 pt-6 rounded-b-3xl border-t">
              <Button type="submit" disabled={isSavingPassword} className="w-full h-12 rounded-xl bg-brand-yellow font-bold text-slate-900 hover:bg-amber-400 shadow-md transition-all">
                {isSavingPassword ? 'A Validar...' : 'Atualizar Senha'}
              </Button>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
}