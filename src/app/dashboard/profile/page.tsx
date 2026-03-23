'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User, ShieldCheck, Mail, KeyRound, Save, CheckCircle2,
  GraduationCap, BookOpen, Clock, Plus, Trash2, CalendarDays,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  getUserById,
  updateUserProfile,
  updateTeacherProfile,
  saveTeacherAvailability,
  getSubjects,
  getTeacherAvailability,
} from '@/app/actions/users';
import { changePassword } from '@/app/actions/auth';

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  avatarUrl?: string | null;
  cpf?: string | null;
  birthDate?: string | Date | null;
  cep?: string | null;
  state?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  number?: string | null;
  videoUrl?: string | null;
  bio?: string | null;
  education?: string | null;
  subject?: string | null;
};

type AvailabilitySlot = {
  tempId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

function toDateInputValue(value?: string | Date | null) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatCPF(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  const part1 = numbers.slice(0, 3);
  const part2 = numbers.slice(3, 6);
  const part3 = numbers.slice(6, 9);
  const part4 = numbers.slice(9, 11);

  let formatted = part1;
  if (part2) formatted += `.${part2}`;
  if (part3) formatted += `.${part3}`;
  if (part4) formatted += `-${part4}`;
  return formatted.slice(0, 14);
}

function formatCEP(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  const part1 = numbers.slice(0, 5);
  const part2 = numbers.slice(5, 8);

  if (!part2) return part1;
  return `${part1}-${part2}`.slice(0, 9);
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<ProfileUser | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [cep, setCep] = useState('');
  const [state, setState] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Estado específico do professor
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectsList, setSubjectsList] = useState<{ id: string; name: string }[]>([]);
  const [isSavingTeacherProfile, setIsSavingTeacherProfile] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        router.push('/login');
        return;
      }

      const [userResult, subjectsResult] = await Promise.all([
        getUserById(userId),
        getSubjects(),
      ]);

      if (userResult.success && userResult.data) {
        const user = userResult.data as ProfileUser;
        setCurrentUser(user);
        setName(user.name || '');
        setEmail(user.email || '');
        setAvatarUrl(user.avatarUrl || '');
        setCpf(formatCPF(user.cpf || ''));
        setBirthDate(toDateInputValue(user.birthDate));
        setCep(formatCEP(user.cep || ''));
        setState(user.state || '');
        setNeighborhood(user.neighborhood || '');
        setStreet(user.street || '');
        setNumber(user.number || '');
        setVideoUrl(user.videoUrl || '');

        if (user.role === 'teacher') {
          setBio(user.bio || '');
          setEducation(user.education || '');
          setSubject(user.subject || '');
          const availResult = await getTeacherAvailability(userId);
          if (availResult.success && availResult.data) {
            setAvailabilitySlots(
              availResult.data.map((slot) => ({
                tempId: slot.id,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
              })),
            );
          }
        }
      }

      if (subjectsResult.success && subjectsResult.data) {
        setSubjectsList(subjectsResult.data);
      }

      setIsLoading(false);
    };

    loadUser();
  }, [router]);

  useEffect(() => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    let isActive = true;

    async function fetchAddressByCep() {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();

        if (!isActive || data?.erro) return;
        if (data.uf) setState(data.uf);
        if (data.bairro) setNeighborhood(data.bairro);
        if (data.logradouro) setStreet(data.logradouro);
      } catch (error) {
        console.error('Erro ao buscar CEP no ViaCEP:', error);
      }
    }

    fetchAddressByCep();

    return () => {
      isActive = false;
    };
  }, [cep]);

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({ variant: 'destructive', title: 'Campos vazios', description: 'O nome e o e-mail sao obrigatorios.' });
      return;
    }

    if (!currentUser?.id) {
      toast({ variant: 'destructive', title: 'Erro de sessao', description: 'Usuario não encontrado na sessao atual.' });
      return;
    }

    setIsSavingProfile(true);
    const result = await updateUserProfile(currentUser.id, {
      name,
      email,
      avatarUrl: avatarUrl || null,
      cpf,
      birthDate: birthDate || null,
      cep,
      state,
      neighborhood,
      street,
      number,
      videoUrl: currentUser.role === 'teacher' ? videoUrl : null,
    });

    if (result.success && result.data) {
      const updated = result.data as ProfileUser;
      toast({ title: 'Perfil atualizado', description: 'As informacoes foram salvas com sucesso.' });
      setCurrentUser(updated);
      setAvatarUrl(updated.avatarUrl || '');
      localStorage.setItem('currentUser', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } else {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: result.error || 'Não foi possivel atualizar o perfil.' });
    }
    setIsSavingProfile(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ variant: 'destructive', title: 'Campos incompletos', description: 'Preencha todos os campos de seguranca.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'As senhas não coincidem', description: 'A nova senha e a confirmacao devem ser iguais.' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Senha muito curta', description: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (!currentUser?.id) {
      toast({ variant: 'destructive', title: 'Erro de sessao', description: 'Usuario não encontrado na sessao atual.' });
      return;
    }

    setIsSavingPassword(true);
    const result = await changePassword(currentUser.id, currentPassword, newPassword);

    if (result.success) {
      toast({ title: 'Senha alterada', description: 'A nova senha ja esta ativa no sistema.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast({ variant: 'destructive', title: 'Erro de autenticacao', description: result.error });
    }
    setIsSavingPassword(false);
  };

  const handleSaveTeacherProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setIsSavingTeacherProfile(true);
    const result = await updateTeacherProfile(currentUser.id, { bio, education, subject });
    if (result.success) {
      toast({ title: 'Perfil público atualizado', description: 'Bio, formação e disciplina foram salvos.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: result.error });
    }
    setIsSavingTeacherProfile(false);
  };

  const handleSaveAvailability = async () => {
    if (!currentUser?.id) return;
    setIsSavingAvailability(true);
    const result = await saveTeacherAvailability(
      currentUser.id,
      availabilitySlots.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })),
    );
    if (result.success) {
      toast({ title: 'Disponibilidade salva', description: 'Seus horários foram atualizados com sucesso.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsSavingAvailability(false);
  };

  const addAvailabilitySlot = () => {
    setAvailabilitySlots((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), dayOfWeek: 1, startTime: '08:00', endTime: '09:30' },
    ]);
  };

  const removeAvailabilitySlot = (tempId: string) => {
    setAvailabilitySlots((prev) => prev.filter((s) => s.tempId !== tempId));
  };

  const updateSlotField = (
    tempId: string,
    field: keyof Omit<AvailabilitySlot, 'tempId'>,
    value: string | number,
  ) => {
    setAvailabilitySlots((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, [field]: value } : s)),
    );
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
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2"
            aria-label="Trocar imagem de perfil"
          >
            <Avatar className="h-24 w-24 border-4 border-brand-yellow shadow-md cursor-pointer">
              <AvatarImage src={avatarUrl || currentUser?.avatarUrl || ''} alt={currentUser?.name} />
              <AvatarFallback className="bg-amber-100 text-amber-700 font-black text-3xl">
                {currentUser?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </button>
          <Input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarSelect}
          />
          <span className="text-xs text-slate-500">Clique na foto para alterar</span>
        </div>
        <div className="text-center sm:text-left flex-1">
          <h1 className="font-headline text-3xl font-bold text-slate-900">{currentUser?.name}</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">{currentUser?.email}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider">
              Perfil: {roleLabels[currentUser?.role || ''] || currentUser?.role}
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
        <Card className="rounded-3xl border-slate-200 shadow-sm h-fit">
          <CardHeader className="bg-slate-50 border-b pb-5 rounded-t-3xl">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
              <User className="h-6 w-6 text-brand-yellow" />
              Informacoes pessoais
            </CardTitle>
            <CardDescription className="text-base font-medium">Atualize seus dados cadastrais.</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="font-bold text-slate-700">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="name" className="pl-10 h-12 bg-white" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="font-bold text-slate-700">E-mail de acesso</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="email" type="email" className="pl-10 h-12 bg-white" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cpf" className="font-bold text-slate-700">CPF</Label>
                  <Input
                    id="cpf"
                    className="h-12 bg-white"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="birthDate" className="font-bold text-slate-700">Data de nascimento</Label>
                  <Input id="birthDate" type="date" className="h-12 bg-white" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cep" className="font-bold text-slate-700">CEP</Label>
                  <Input
                    id="cep"
                    className="h-12 bg-white"
                    value={cep}
                    onChange={(e) => setCep(formatCEP(e.target.value))}
                    placeholder="00000-000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state" className="font-bold text-slate-700">Estado</Label>
                  <Input id="state" className="h-12 bg-white" value={state} onChange={(e) => setState(e.target.value)} placeholder="SP" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="neighborhood" className="font-bold text-slate-700">Bairro</Label>
                <Input id="neighborhood" className="h-12 bg-white" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="street" className="font-bold text-slate-700">Rua</Label>
                  <Input id="street" className="h-12 bg-white" value={street} onChange={(e) => setStreet(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="number" className="font-bold text-slate-700">Número</Label>
                  <Input id="number" className="h-12 bg-white" value={number} onChange={(e) => setNumber(e.target.value)} />
                </div>
              </div>

              {currentUser?.role === 'teacher' && (
                <div className="grid gap-2">
                  <Label htmlFor="videoUrl" className="font-bold text-slate-700">Link do video de apresentacao</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    className="h-12 bg-white"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-slate-50 pt-6 rounded-b-3xl border-t">
              <Button type="submit" disabled={isSavingProfile} className="w-full h-12 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 transition-all">
                {isSavingProfile ? 'A Guardar...' : <><Save className="mr-2 h-5 w-5" /> Guardar alteracoes</>}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm h-fit">
          <CardHeader className="bg-slate-50 border-b pb-5 rounded-t-3xl">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
              <ShieldCheck className="h-6 w-6 text-green-500" />
              Seguranca
            </CardTitle>
            <CardDescription className="text-base font-medium">Altere sua senha para manter a conta segura.</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-2">
                <Label htmlFor="current-password" className="font-bold text-slate-700">Senha atual</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="current-password" type="password" placeholder="Digite a senha atual" className="pl-10 h-12 bg-white" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password" className="font-bold text-slate-700">Nova senha</Label>
                <Input id="new-password" type="password" placeholder="Minimo 6 caracteres" className="h-12 bg-white" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password" className="font-bold text-slate-700">Confirmar nova senha</Label>
                <Input id="confirm-password" type="password" placeholder="Repita a nova senha" className="h-12 bg-white" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 pt-6 rounded-b-3xl border-t">
              <Button type="submit" disabled={isSavingPassword} className="w-full h-12 rounded-xl bg-brand-yellow font-bold text-slate-900 hover:bg-amber-400 shadow-md transition-all">
                {isSavingPassword ? 'A Validar...' : 'Atualizar senha'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {currentUser?.role === 'teacher' && (
        <>
          {/* Perfil Público do Professor */}
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-5 rounded-t-3xl">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
                <GraduationCap className="h-6 w-6 text-brand-yellow" />
                Perfil Público
              </CardTitle>
              <CardDescription className="text-base font-medium">
                Informações exibidas para os alunos. Complete para ser aprovado pelo administrador.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveTeacherProfile}>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-2">
                  <Label htmlFor="teacher-subject" className="font-bold text-slate-700">
                    Disciplina principal
                  </Label>
                  {subjectsList.length > 0 ? (
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger id="teacher-subject" className="h-12 bg-white rounded-xl">
                        <SelectValue placeholder="Selecione uma disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectsList.map((s) => (
                          <SelectItem key={s.id} value={s.name}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="teacher-subject-text"
                      className="h-12 bg-white"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ex: Matemática"
                    />
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="education" className="font-bold text-slate-700 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-slate-500" /> Formação Acadêmica
                  </Label>
                  <Input
                    id="education"
                    className="h-12 bg-white"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="Ex: Licenciatura em Matemática — UFPB"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio" className="font-bold text-slate-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" /> Bio / Apresentação
                  </Label>
                  <Textarea
                    id="bio"
                    className="min-h-[120px] bg-white resize-none"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte sobre sua experiência, metodologia e diferenciais como professor..."
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 pt-6 rounded-b-3xl border-t">
                <Button
                  type="submit"
                  disabled={isSavingTeacherProfile}
                  className="w-full h-12 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 transition-all"
                >
                  {isSavingTeacherProfile
                    ? 'Salvando...'
                    : <><Save className="mr-2 h-5 w-5" /> Salvar perfil público</>}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Gestão de Disponibilidade */}
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-5 rounded-t-3xl">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
                <CalendarDays className="h-6 w-6 text-brand-yellow" />
                Gestão de Disponibilidade
              </CardTitle>
              <CardDescription className="text-base font-medium">
                Defina os dias e horários em que você está disponível para aulas.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {availabilitySlots.length === 0 && (
                <p className="text-sm text-slate-500 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                  Nenhum horário cadastrado. Clique em &quot;Adicionar Horário&quot; para começar.
                </p>
              )}

              {availabilitySlots.map((slot) => (
                <div
                  key={slot.tempId}
                  className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-slate-600">Dia da Semana</Label>
                    <Select
                      value={String(slot.dayOfWeek)}
                      onValueChange={(v) => updateSlotField(slot.tempId, 'dayOfWeek', Number(v))}
                    >
                      <SelectTrigger className="h-10 bg-white rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          { value: 0, label: 'Domingo' },
                          { value: 1, label: 'Segunda-feira' },
                          { value: 2, label: 'Terça-feira' },
                          { value: 3, label: 'Quarta-feira' },
                          { value: 4, label: 'Quinta-feira' },
                          { value: 5, label: 'Sexta-feira' },
                          { value: 6, label: 'Sábado' },
                        ].map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Início
                    </Label>
                    <Input
                      type="time"
                      className="h-10 bg-white rounded-xl text-sm"
                      value={slot.startTime}
                      onChange={(e) => updateSlotField(slot.tempId, 'startTime', e.target.value)}
                    />
                  </div>

                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Fim
                    </Label>
                    <Input
                      type="time"
                      className="h-10 bg-white rounded-xl text-sm"
                      value={slot.endTime}
                      onChange={(e) => updateSlotField(slot.tempId, 'endTime', e.target.value)}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeAvailabilitySlot(slot.tempId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addAvailabilitySlot}
                className="w-full h-11 rounded-xl border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Horário
              </Button>
            </CardContent>
            <CardFooter className="bg-slate-50 pt-6 rounded-b-3xl border-t">
              <Button
                type="button"
                onClick={handleSaveAvailability}
                disabled={isSavingAvailability}
                className="w-full h-12 rounded-xl bg-brand-yellow font-bold text-slate-900 hover:bg-amber-400 shadow-md transition-all"
              >
                {isSavingAvailability
                  ? 'Salvando...'
                  : <><Save className="mr-2 h-5 w-5" /> Salvar disponibilidade</>}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
