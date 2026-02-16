'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ProfileAvatarUploader } from '@/components/profile-avatar-uploader';
import { getUserById, updateUserPassword, updateUserProfile } from '@/app/actions/users';

type DBUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatarUrl?: string | null;
  subject?: string | null;
  status: string;
  credits: number;
};

const roleLabel: Record<DBUser['role'], string> = {
  admin: 'Administrador',
  teacher: 'Professor',
  student: 'Aluno',
};

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loggedUser, setLoggedUser] = useState<DBUser | null>(null);
  const [profileUser, setProfileUser] = useState<DBUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const canEdit = useMemo(() => {
    if (!loggedUser || !profileUser) return false;
    return loggedUser.role === 'admin' || loggedUser.id === profileUser.id;
  }, [loggedUser, profileUser]);

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const logged = await getUserById(userId);
      if (!logged.success || !logged.data) return;

      const loggedDbUser = logged.data as DBUser;
      setLoggedUser(loggedDbUser);

      const userIdParam = searchParams.get('userId');
      const targetId = userIdParam || userId;
      const target = await getUserById(targetId);
      if (!target.success || !target.data) return;

      setProfileUser(target.data as DBUser);
    };

    load();
  }, [searchParams]);

  const handleSaveField = async (field: keyof DBUser, value: string) => {
    if (!profileUser || !canEdit) return;
    setIsSaving(true);

    const result = await updateUserProfile(profileUser.id, { [field]: value });
    if (!result.success || !result.data) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: result.error || 'Nao foi possivel salvar os dados.',
      });
      setIsSaving(false);
      return;
    }

    const updated = result.data as DBUser;
    setProfileUser(updated);
    if (loggedUser?.id === updated.id) {
      setLoggedUser(updated);
      localStorage.setItem('currentUser', JSON.stringify(updated));
    }

    toast({ title: 'Perfil atualizado', description: 'Alteracao salva no banco de dados.' });
    setIsSaving(false);
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!profileUser) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ variant: 'destructive', title: 'Campos obrigatorios', description: 'Preencha todos os campos.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Senhas diferentes', description: 'A confirmacao nao confere.' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Senha curta', description: 'Use pelo menos 6 caracteres.' });
      return;
    }

    const result = await updateUserPassword(profileUser.id, currentPassword, newPassword);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Nao foi possivel atualizar a senha.' });
      return;
    }

    toast({ title: 'Senha atualizada', description: 'A senha foi alterada com sucesso.' });
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!profileUser) {
    return <div className="flex h-[40vh] items-center justify-center text-slate-500">Carregando perfil...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 bg-slate-50">
      <div>
        <h1 className="font-headline text-3xl font-bold text-slate-900">Perfil</h1>
        <p className="text-sm text-slate-600">Dados pessoais conectados ao banco em tempo real.</p>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50">
          <CardTitle className="text-slate-900">Identidade</CardTitle>
          <CardDescription>Informacoes principais e avatar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6 md:grid-cols-[auto_1fr]">
          <ProfileAvatarUploader
            user={profileUser as any}
            canEdit={canEdit}
            onSave={(url) => {
              handleSaveField('avatarUrl', url);
            }}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                defaultValue={profileUser.name}
                disabled={!canEdit || isSaving}
                onBlur={(event) => handleSaveField('name', event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                defaultValue={profileUser.email}
                disabled={!canEdit || isSaving}
                onBlur={(event) => handleSaveField('email', event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Papel</Label>
              <div className="h-10 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                {roleLabel[profileUser.role]}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Badge className="w-fit rounded-xl bg-[#FFC107] text-slate-900">{profileUser.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50">
          <CardTitle className="text-slate-900">Conta e Créditos</CardTitle>
          <CardDescription>Dados financeiros e operacionais do usuário.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Créditos atuais</Label>
            <div className="h-11 rounded-2xl border border-slate-200 bg-slate-900 px-3 py-2 text-center text-lg font-bold text-[#FFC107]">
              {profileUser.credits}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Disciplina principal</Label>
            <Input
              defaultValue={profileUser.subject || ''}
              placeholder="Ex: Matematica"
              disabled={!canEdit || profileUser.role !== 'teacher' || isSaving}
              onBlur={(event) => handleSaveField('subject', event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full rounded-2xl bg-slate-900 font-bold text-white transition-all hover:bg-slate-800"
              disabled={!canEdit}
              onClick={() => setIsPasswordModalOpen(true)}
            >
              Alterar Senha
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>Confirme sua senha atual para atualizar com segurança.</DialogDescription>
          </DialogHeader>

          <form className="grid gap-3" onSubmit={handlePasswordChange}>
            <div className="grid gap-1.5">
              <Label>Senha atual</Label>
              <Input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" />
            </div>
            <div className="grid gap-1.5">
              <Label>Nova senha</Label>
              <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" />
            </div>
            <div className="grid gap-1.5">
              <Label>Confirmar senha</Label>
              <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" />
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="secondary" onClick={() => setIsPasswordModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#FFC107] font-bold text-slate-900 hover:bg-amber-300">
                Salvar senha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

