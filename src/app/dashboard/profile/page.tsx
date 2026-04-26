'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
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
  GraduationCap, BookOpen, Clock, Plus, Trash2, CalendarDays, Upload,
  ChevronDown, Wallet, AlertTriangle, Video, Star,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  getUserById,
  updateUserProfile,
  updateTeacherProfile,
  saveTeacherAvailability,
  getSubjects,
  getTeacherAvailability,
} from '@/app/actions/users';
import { changePassword } from '@/app/actions/auth';
import { getTeacherAverageRating } from '@/app/actions/ratings';

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  avatarUrl?: string | null;
  cpf?: string | null;
  birthDate?: string | Date | null;
  phone?: string | null;
  cep?: string | null;
  state?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  number?: string | null;
  videoUrl?: string | null;
  bio?: string | null;
  education?: string | null;
  subject?: string | null;
  subjects?: string | null;
  pixKeyType?: string | null;
  pixKey?: string | null;
  createdAt?: string | Date | null;
};

type EducationEntry = {
  course: string;
  type: string;
  university: string;
  conclusionYear: string;
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

function formatCNPJ(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  const part1 = numbers.slice(0, 2);
  const part2 = numbers.slice(2, 5);
  const part3 = numbers.slice(5, 8);
  const part4 = numbers.slice(8, 12);
  const part5 = numbers.slice(12, 14);

  let formatted = part1;
  if (part2) formatted += `.${part2}`;
  if (part3) formatted += `.${part3}`;
  if (part4) formatted += `/${part4}`;
  if (part5) formatted += `-${part5}`;
  return formatted;
}

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  const part1 = numbers.slice(0, 2);
  const part2 = numbers.slice(2, 3);
  const part3 = numbers.slice(3, 7);
  const part4 = numbers.slice(7, 11);

  let formatted = `(${part1})`;
  if (part2) formatted += ` ${part2}`;
  if (part3) formatted += `.${part3}`;
  if (part4) formatted += `-${part4}`;
  return formatted;
}

function isValidPixKey(type: string, key: string): boolean {
  const numbers = key.replace(/\D/g, '');
  switch (type) {
    case 'cpf':
      return numbers.length === 11;
    case 'cnpj':
      return numbers.length === 14;
    case 'phone':
      return numbers.length >= 10 && numbers.length <= 11;
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(key);
    case 'random':
      return key.trim().length > 0;
    default:
      return false;
  }
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
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [state, setState] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrlSaveTimer, setVideoUrlSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSavingVideoUrl, setIsSavingVideoUrl] = useState(false);

  const handleVideoUrlChange = async (value: string) => {
    setVideoUrl(value);
    
    if (videoUrlSaveTimer) {
      clearTimeout(videoUrlSaveTimer);
    }
    
    if (!currentUser?.id || currentUser.role !== 'teacher') return;
    
    const newTimer = setTimeout(async () => {
      setIsSavingVideoUrl(true);
      const result = await updateUserProfile(currentUser.id, {
        videoUrl: value,
      });
      setIsSavingVideoUrl(false);
      
      if (result.success) {
        toast({ title: 'Link salvo com sucesso!' });
      } else {
        toast({ variant: 'destructive', title: 'Erro ao salvar', description: result.error });
      }
    }, 3000);
    
    setVideoUrlSaveTimer(newTimer);
  };

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Estado específico do professor
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [course, setCourse] = useState('');
  const [educationType, setEducationType] = useState('');
  const [university, setUniversity] = useState('');
  const [conclusionYear, setConclusionYear] = useState('');
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  const [subject, setSubject] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectsList, setSubjectsList] = useState<{ id: string; name: string }[]>([]);
  const [isSavingTeacherProfile, setIsSavingTeacherProfile] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  const [pixKeyType, setPixKeyType] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyRaw, setPixKeyRaw] = useState('');
  const [isSavingPix, setIsSavingPix] = useState(false);
  const [teacherRating, setTeacherRating] = useState<{ average: number; count: number }>({ average: 5.0, count: 0 });

  const handleAddEducation = async () => {
    if (!course.trim() || !educationType || !university.trim() || !conclusionYear.trim()) {
      toast({ variant: 'destructive', title: 'Campos vazios', description: 'Preencha todos os campos da formação.' });
      return;
    }
    if (!currentUser?.id) return;
    const entry: EducationEntry = {
      course: course.trim(),
      type: educationType,
      university: university.trim(),
      conclusionYear: conclusionYear.trim(),
    };
    const updated = [...educationEntries, entry];
    setEducationEntries(updated);
    setCourse('');
    setEducationType('');
    setUniversity('');
    setConclusionYear('');
    const result = await updateTeacherProfile(currentUser.id, { education: JSON.stringify(updated) });
    if (result.success) {
      toast({ title: 'Formação adicionada e salva', description: entry.course + ' - ' + entry.type });
    } else {
      setEducationEntries(educationEntries);
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: result.error });
    }
  };

  const handleRemoveEducation = async (index: number) => {
    if (!currentUser?.id) return;
    const updated = educationEntries.filter((_, i) => i !== index);
    setEducationEntries(updated);
    const result = await updateTeacherProfile(currentUser.id, { education: JSON.stringify(updated) });
    if (!result.success) {
      setEducationEntries(educationEntries);
      toast({ variant: 'destructive', title: 'Erro ao remover', description: result.error });
    }
  };

  const handlePixKeyChange = (value: string) => {
    if (!pixKeyType) {
      setPixKey(value);
      setPixKeyRaw(value);
      return;
    }

    const numbers = value.replace(/\D/g, '');
    let rawValue = numbers;
    let formatted = value;

    switch (pixKeyType) {
      case 'cpf':
        rawValue = numbers.slice(0, 11);
        formatted = formatCPF(rawValue);
        break;
      case 'cnpj':
        rawValue = numbers.slice(0, 14);
        formatted = formatCNPJ(rawValue);
        break;
      case 'phone':
        rawValue = numbers.slice(0, 11);
        formatted = formatPhone(rawValue);
        break;
      case 'email':
      case 'random':
        rawValue = value;
        formatted = value;
        break;
    }

    setPixKey(formatted);
    setPixKeyRaw(rawValue);
  };

  const isPixKeyValid = isValidPixKey(pixKeyType, pixKeyRaw);

  const [openSection, setOpenSection] = useState<string | null>('personal');

  const handleToggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

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
        setPhone(formatPhone(user.phone || ''));
        setCep(formatCEP(user.cep || ''));
        setState(user.state || '');
        setNeighborhood(user.neighborhood || '');
        setStreet(user.street || '');
        setNumber(user.number || '');
        setVideoUrl(user.videoUrl || '');

        if (user.role === 'teacher') {
          setBio(user.bio || '');
          setEducation(user.education || '');
          try {
            const parsed = JSON.parse(user.education || '[]');
            if (Array.isArray(parsed)) {
              setEducationEntries(parsed);
            }
          } catch {
            setEducationEntries([]);
          }
          setSubject(user.subject || '');
          
          let storedSubjects: string[] = [];
          try {
            storedSubjects = user.subjects ? JSON.parse(user.subjects) : [];
          } catch {
            storedSubjects = [];
          }
          setSelectedSubjects(storedSubjects);
          
          const storedPixKeyType = user.pixKeyType || '';
          const storedPixKey = user.pixKey || '';
          setPixKeyType(storedPixKeyType);
          
          if (storedPixKeyType === 'cpf') {
            setPixKeyRaw(storedPixKey.replace(/\D/g, ''));
            setPixKey(formatCPF(storedPixKey.replace(/\D/g, '')));
          } else if (storedPixKeyType === 'cnpj') {
            setPixKeyRaw(storedPixKey.replace(/\D/g, ''));
            setPixKey(formatCNPJ(storedPixKey.replace(/\D/g, '')));
          } else if (storedPixKeyType === 'phone') {
            setPixKeyRaw(storedPixKey.replace(/\D/g, ''));
            setPixKey(formatPhone(storedPixKey.replace(/\D/g, '')));
          } else {
            setPixKeyRaw(storedPixKey);
            setPixKey(storedPixKey);
          }
          
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

          const ratingResult = await getTeacherAverageRating(userId);
          if (ratingResult.success && ratingResult.data) {
            setTeacherRating(ratingResult.data);
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
    const educationJson = JSON.stringify(educationEntries);
    const result = await updateTeacherProfile(currentUser.id, { bio, education: educationJson, subject });
    if (result.success) {
      toast({ title: 'Perfil público atualizado', description: 'Bio, formação e disciplina foram salvos.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: result.error });
    }
    setIsSavingTeacherProfile(false);
  };

  const handleSaveAllProfile = async (e: React.FormEvent) => {
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

    const profileResult = await updateUserProfile(currentUser.id, {
      name,
      email,
      avatarUrl: avatarUrl || null,
      cpf,
      birthDate: birthDate || null,
      phone,
      cep,
      state,
      neighborhood,
      street,
      number,
      videoUrl: currentUser.role === 'teacher' ? videoUrl : null,
    });

    if (!profileResult.success) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: profileResult.error || 'Não foi possivel atualizar o perfil.' });
      setIsSavingProfile(false);
      return;
    }

    if (currentUser.role === 'teacher') {
      const educationJson = JSON.stringify(educationEntries);
      const teacherResult = await updateTeacherProfile(currentUser.id, { 
        bio, 
        education: educationJson, 
        subject,
        subjects: JSON.stringify(selectedSubjects),
      });
      if (!teacherResult.success) {
        toast({ variant: 'destructive', title: 'Erro ao atualizar', description: teacherResult.error });
        setIsSavingProfile(false);
        return;
      }
    }

    const updated = profileResult.data as ProfileUser;
    toast({ title: 'Perfil atualizado', description: 'As informacoes foram salvas com sucesso.' });
    setCurrentUser(updated);
    setAvatarUrl(updated.avatarUrl || '');
    localStorage.setItem('currentUser', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setIsSavingProfile(false);
  };

  const handleSaveAvailability = async () => {
    if (!currentUser?.id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não identificado.' });
      return;
    }

    const slotsToSave = availabilitySlots.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));
    
    if (slotsToSave.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Adicione pelo menos um horário.' });
      return;
    }

    const hasConflict = availabilitySlots.some((slot, idx) =>
      availabilitySlots.some(
        (other, otherIdx) =>
          otherIdx !== idx &&
          slot.dayOfWeek === other.dayOfWeek &&
          slot.startTime < other.endTime &&
          slot.endTime > other.startTime,
      ),
    );

    if (hasConflict) {
      toast({
        variant: 'destructive',
        title: 'Horário conflitante',
        description: 'Esse horário conflita com outro já cadastrado neste dia.',
      });
      return;
    }

    setIsSavingAvailability(true);
    const result = await saveTeacherAvailability(currentUser.id, slotsToSave);
    if (result.success) {
      toast({ title: 'Disponibilidade salva', description: 'Seus horários foram atualizados com sucesso.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Erro ao salvar.' });
    }
    setIsSavingAvailability(false);
  };

  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !isPixKeyValid) return;
    setIsSavingPix(true);
    
    let pixKeyToSave = pixKeyRaw;
    if (pixKeyType === 'email' || pixKeyType === 'random') {
      pixKeyToSave = pixKey;
    }
    
    const result = await updateTeacherProfile(currentUser.id, {
      pixKeyType: pixKeyType || null,
      pixKey: pixKeyToSave || null,
    });
    if (result.success) {
      toast({ title: 'Dados Pix salvos', description: 'Sua chave Pix foi atualizada com sucesso.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: result.error });
    }
    setIsSavingPix(false);
  };

  const hasTimeOverlap = (
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    slots: AvailabilitySlot[],
  ) => {
    return slots.some(
      (s) =>
        s.dayOfWeek === dayOfWeek &&
        startTime < s.endTime &&
        endTime > s.startTime,
    );
  };

  const getDefaultTimesForDay = (dayOfWeek: number) => {
    const daySlots = availabilitySlots.filter((s) => s.dayOfWeek === dayOfWeek);
    if (daySlots.length === 0) return { startTime: '08:00', endTime: '09:30' };

    const lastSlot = daySlots.reduce((latest, slot) =>
      slot.endTime > latest.endTime ? slot : latest,
    );
    const [hours, minutes] = lastSlot.endTime.split(':').map(Number);
    const endHours = hours + 1;
    const endMinutes = minutes;
    const startTime = lastSlot.endTime;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    return { startTime, endTime };
  };

  const handleSaveAndAddSlot = (dayOfWeek: number) => {
    const { startTime, endTime } = getDefaultTimesForDay(dayOfWeek);
    setAvailabilitySlots((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), dayOfWeek, startTime, endTime },
    ]);
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

  const roundToHalfHour = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    let roundedMinutes = 0;
    
    if (minutes >= 45) {
      roundedMinutes = 0;
      return `${String(hours + 1).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
    } else if (minutes >= 15) {
      roundedMinutes = 30;
    } else {
      roundedMinutes = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
  };

  const updateSlotField = (
    tempId: string,
    field: keyof Omit<AvailabilitySlot, 'tempId'>,
    value: string | number,
  ) => {
    let processedValue = value;
    if (field === 'startTime' || field === 'endTime') {
      processedValue = roundToHalfHour(value as string);
    }
    setAvailabilitySlots((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, [field]: processedValue } : s)),
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
    <div className="flex flex-1 flex-col gap-2 max-w-4xl mx-auto w-full pb-10">
      {/* Informações Pessoais */}
      <Collapsible open={openSection === 'personal'} onOpenChange={(open) => handleToggleSection('personal')}>
        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden transition-colors hover:border-[#f5b000]">
          <CollapsibleTrigger asChild>
            <CardHeader className="bg-slate-50 border-b pb-3 pt-4 rounded-t-3xl cursor-pointer select-none hover:bg-slate-100 transition-colors">
              <CardTitle className="flex items-center justify-between text-xl text-slate-800">
                <span className="flex items-center gap-2">
                  <User className="h-6 w-6 text-brand-yellow" />
                  Informações Pessoais
                </span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${openSection === 'personal' ? 'rotate-180' : ''}`} />
              </CardTitle>
              <CardDescription className="text-base font-medium">Gerencie seus dados pessoais e informações de contato.</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <form onSubmit={handleSaveAllProfile}>
              <CardContent>
                <div className="bg-white p-8 rounded-3xl">
                  <div className="flex flex-col sm:flex-row gap-8">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="relative group">
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2"
                          aria-label="Trocar imagem de perfil"
                        >
                          <Avatar className="h-24 w-24 border-2 border-brand-yellow shadow-[0_4px_16px_rgba(245,176,0,0.5)] cursor-pointer">
                            <AvatarImage src={avatarUrl || currentUser?.avatarUrl || ''} alt={currentUser?.name} />
                            <AvatarFallback className="bg-amber-100 text-amber-700 font-black text-3xl">
                              {currentUser?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </button>
    <div
      className="absolute bg-slate-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      style={{ bottom: 'calc(12.5% + 5px)', right: 'calc(12.5% + 5px)', transform: 'translate(50%, 50%)', padding: '5px' }}
    >
      <Upload className="h-3.5 w-3.5" style={{ color: '#f5b000' }} />
    </div>
                      </div>
                      <Input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarSelect}
                      />
                      <div className="flex flex-col items-center gap-1.5 mt-2">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                          {roleLabels[currentUser?.role || ''] || currentUser?.role}
                        </span>
                        {currentUser?.role === 'teacher' ? (
                          <div className="flex items-center gap-0.5">
                            {Array(5).fill(0).map((_, i) => (
                              <Star
                                key={i}
                                className="h-4 w-4"
                                style={{ color: '#FFC107', fill: i < Math.round(teacherRating.average) ? '#FFC107' : 'none' }}
                              />
                            ))}
                            <span className="text-xs font-bold ml-1" style={{ color: '#FFC107' }}>
                              {teacherRating.average.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          currentUser?.status === 'active' && (
                            <span className="bg-green-100 text-green-700 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                              <CheckCircle2 className="h-3 w-3" /> Ativo
                            </span>
                          )
                        )}
                        {currentUser?.createdAt && (
                          <p className="text-xs text-slate-400">
                            Desde {format(new Date(currentUser.createdAt), 'MMMM/yyyy', { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-5">
                      {currentUser?.role === 'teacher' && (
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
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
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

                      <div className="grid md:grid-cols-3 gap-4">
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
                        <div className="grid gap-2">
                          <Label htmlFor="phone" className="font-bold text-slate-700">Telefone</Label>
                          <Input
                            id="phone"
                            className="h-12 bg-white"
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            placeholder="(11) 9.9999-9999"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="neighborhood" className="font-bold text-slate-700">Bairro</Label>
                          <Input id="neighborhood" className="h-12 bg-white" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="street" className="font-bold text-slate-700">Rua</Label>
                          <Input id="street" className="h-12 bg-white" value={street} onChange={(e) => setStreet(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="number" className="font-bold text-slate-700">Número</Label>
                          <Input id="number" className="h-12 bg-white" value={number} onChange={(e) => setNumber(e.target.value)} />
                        </div>
                      </div>

                      </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <Button type="submit" disabled={isSavingProfile} className="w-full h-12 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 transition-all">
                      {isSavingProfile ? 'A Guardar...' : <><Save className="mr-2 h-5 w-5" /> Guardar alteracoes</>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </form>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Segurança */}
      <Collapsible open={openSection === 'security'} onOpenChange={(open) => handleToggleSection('security')}>
        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden transition-colors hover:border-[#f5b000]">
          <CollapsibleTrigger asChild>
            <CardHeader className="bg-slate-50 border-b pb-3 pt-4 rounded-t-3xl cursor-pointer select-none hover:bg-slate-100 transition-colors">
              <CardTitle className="flex items-center justify-between text-xl text-slate-800">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-green-500" />
                  Segurança
                </span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${openSection === 'security' ? 'rotate-180' : ''}`} />
              </CardTitle>
              <CardDescription className="text-base font-medium">Altere sua senha para manter a conta segura.</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Formação Acadêmica */}
      {currentUser?.role === 'teacher' && (
        <Collapsible open={openSection === 'education'} onOpenChange={(open) => handleToggleSection('education')}>
          <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden transition-colors hover:border-[#f5b000]">
            <CollapsibleTrigger asChild>
              <CardHeader className="bg-slate-50 border-b pb-3 pt-4 rounded-t-3xl cursor-pointer select-none hover:bg-slate-100 transition-colors">
                <CardTitle className="flex items-center justify-between text-xl text-slate-800">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-brand-yellow" />
                    Formação Acadêmica
                  </span>
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${openSection === 'education' ? 'rotate-180' : ''}`} />
                </CardTitle>
                <CardDescription className="text-base font-medium">
                  Informe sua formação acadêmica e qualificações.
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="course" className="font-bold text-slate-700">Curso</Label>
                    <Input id="course" className="h-12 bg-white" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Ex: Matemática" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="educationType" className="font-bold text-slate-700">Tipo</Label>
                    <Select value={educationType} onValueChange={setEducationType}>
                      <SelectTrigger className="h-12 bg-white">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bacharelado">Bacharelado</SelectItem>
                        <SelectItem value="Licenciatura">Licenciatura</SelectItem>
                        <SelectItem value="Tecnólogo">Tecnólogo</SelectItem>
                        <SelectItem value="Mestrado">Mestrado</SelectItem>
                        <SelectItem value="Doutorado">Doutorado</SelectItem>
                        <SelectItem value="Pós-Doutorado">Pós-Doutorado</SelectItem>
                        <SelectItem value="Especialização">Especialização</SelectItem>
                        <SelectItem value="MBA">MBA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="university" className="font-bold text-slate-700">Universidade</Label>
                    <Input id="university" className="h-12 bg-white" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Ex: USP" />
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="grid gap-2 flex-1">
                      <Label htmlFor="conclusionYear" className="font-bold text-slate-700">Ano de Conclusão</Label>
                      <Input id="conclusionYear" className="h-12 bg-white" value={conclusionYear} onChange={(e) => setConclusionYear(e.target.value)} placeholder="Ex: 2020" />
                    </div>
                    <Button type="button" onClick={handleAddEducation} className="h-12 px-6 rounded-xl bg-brand-yellow font-bold text-slate-900 hover:bg-amber-400 shadow-md transition-all shrink-0">
                      <Plus className="h-5 w-5 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>
                {educationEntries.length > 0 && (
                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      Formações adicionadas
                    </p>
                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                      {educationEntries.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{entry.course} - {entry.university}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{entry.type} - {entry.conclusionYear}</p>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-500" onClick={() => handleRemoveEducation(index)} aria-label="Remover formação">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Sala de Aula Virtual */}
      {currentUser?.role === 'teacher' && (
        <Collapsible open={openSection === 'classroom'} onOpenChange={(open) => handleToggleSection('classroom')}>
          <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden transition-colors hover:border-[#f5b000]">
            <CollapsibleTrigger asChild>
              <CardHeader className="bg-slate-50 border-b pb-3 pt-4 rounded-t-3xl cursor-pointer select-none hover:bg-slate-100 transition-colors">
                <CardTitle className="flex items-center justify-between text-xl text-slate-800">
                  <span className="flex items-center gap-2">
                    <Video className="h-6 w-6 text-brand-yellow" />
                    Sala de Aula Virtual
                  </span>
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${openSection === 'classroom' ? 'rotate-180' : ''}`} />
                </CardTitle>
                <CardDescription className="text-base font-medium">
                  Configure o link da sua sala de aula virtual para apresentação.
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-6 space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="videoUrl" className="font-bold text-slate-700">
                    Link do vídeo de apresentação
                    {isSavingVideoUrl && <span className="ml-2 text-xs text-amber-600">(Salvando...)</span>}
                  </Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    className="h-12 bg-white"
                    value={videoUrl}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {currentUser?.role === 'teacher' && (
        <>
          {/* Disciplinas Lecionadas */}
          <Collapsible open={openSection === 'subjects'} onOpenChange={(open) => handleToggleSection('subjects')}>
            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden transition-colors hover:border-[#f5b000]">
              <CollapsibleTrigger asChild>
                <CardHeader className="bg-slate-50 border-b pb-3 pt-4 rounded-t-3xl cursor-pointer select-none hover:bg-slate-100 transition-colors">
                  <CardTitle className="flex items-center justify-between text-xl text-slate-800">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-6 w-6 text-brand-yellow" />
                      Disciplinas Lecionadas
                    </span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${openSection === 'subjects' ? 'rotate-180' : ''}`} />
                  </CardTitle>
                  <CardDescription className="text-base font-medium">
                    Selecione as disciplinas que você pode lecionar.
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-6 space-y-4">
                  {subjectsList.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      {subjectsList.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={selectedSubjects.includes(s.name)}
                            onCheckedChange={async (checked) => {
                              const newSubjects = checked
                                ? [...selectedSubjects, s.name]
                                : selectedSubjects.filter((subj) => subj !== s.name);
                              setSelectedSubjects(newSubjects);
                              
                              if (currentUser?.id) {
                                await updateTeacherProfile(currentUser.id, {
                                  subjects: JSON.stringify(newSubjects),
                                });
                              }
                            }}
                          />
                          <span className="text-sm text-slate-700">{s.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Nenhuma disciplina disponível.</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Gestão de Disponibilidade */}
          <Collapsible open={openSection === 'availability'} onOpenChange={(open) => handleToggleSection('availability')}>
            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden transition-colors hover:border-[#f5b000]">
              <CollapsibleTrigger asChild>
                <CardHeader className="bg-slate-50 border-b pb-3 pt-4 rounded-t-3xl cursor-pointer select-none hover:bg-slate-100 transition-colors">
                  <CardTitle className="flex items-center justify-between text-xl text-slate-800">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-6 w-6 text-brand-yellow" />
                      Disponibilidade Semanal
                    </span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${openSection === 'availability' ? 'rotate-180' : ''}`} />
                  </CardTitle>
                  <CardDescription className="text-base font-medium">
                    Defina os dias e horários em que você está disponível para aulas.
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-6 space-y-1.5">
                  {[
                    { value: 1, label: 'Segunda-feira' },
                    { value: 2, label: 'Terça-feira' },
                    { value: 3, label: 'Quarta-feira' },
                    { value: 4, label: 'Quinta-feira' },
                    { value: 5, label: 'Sexta-feira' },
                    { value: 6, label: 'Sábado' },
                    { value: 0, label: 'Domingo' },
                  ].map((day) => {
                    const daySlots = availabilitySlots.filter((s) => s.dayOfWeek === day.value);
                    return (
                      <div
                        key={day.value}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-2"
                      >
                        {daySlots.length === 0 ? (
                          <div className="grid grid-cols-[160px_1fr_1fr_auto_auto] gap-3 items-end">
                                <span className="font-bold text-slate-700 text-center">{day.label}</span>
                            <div className="relative cursor-pointer" onClick={() => document.getElementById(`start-${day.value}-new`)?.showPicker()}>
                              <Input
                                id={`start-${day.value}-new`}
                                type="time"
                                className="h-8 bg-white rounded-lg text-sm w-full cursor-pointer"
                                value="08:00"
                                disabled
                                readOnly
                              />
                            </div>
                            <div className="relative cursor-pointer" onClick={() => document.getElementById(`end-${day.value}-new`)?.showPicker()}>
                              <Input
                                id={`end-${day.value}-new`}
                                type="time"
                                className="h-8 bg-white rounded-lg text-sm w-full cursor-pointer"
                                value="09:30"
                                disabled
                                readOnly
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-100"
                              onClick={() => handleSaveAndAddSlot(day.value)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <div className="h-8 w-8" />
                          </div>
                        ) : (
                          daySlots.map((slot, idx) => (
                            <div
                              key={slot.tempId}
                              className={`grid grid-cols-[160px_1fr_1fr_auto_auto] gap-3 items-end ${idx > 0 ? 'mt-1' : ''}`}
                            >
                              {idx === 0 ? (
                                <span className="font-bold text-slate-700 text-center">{day.label}</span>
                              ) : (
                                <div className="w-[160px]" />
                              )}
<div className="relative cursor-pointer w-full" onClick={() => document.getElementById(`start-${slot.tempId}`)?.showPicker()}>
                              <Input
                                id={`start-${slot.tempId}`}
                                type="time"
                                className="h-8 bg-white rounded-lg text-sm w-full cursor-pointer"
                                value={slot.startTime}
                                onChange={(e) => updateSlotField(slot.tempId, 'startTime', e.target.value)}
                              />
                            </div>

                            <div className="relative cursor-pointer w-full" onClick={() => document.getElementById(`end-${slot.tempId}`)?.showPicker()}>
                              <Input
                                id={`end-${slot.tempId}`}
                                type="time"
                                className="h-8 bg-white rounded-lg text-sm w-full cursor-pointer"
                                value={slot.endTime}
                                onChange={(e) => updateSlotField(slot.tempId, 'endTime', e.target.value)}
                              />
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-100"
                              onClick={() => handleSaveAndAddSlot(day.value)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-red-200 text-red-400 hover:bg-red-50 hover:text-red-500"
                              onClick={() => removeAvailabilitySlot(slot.tempId)}
                            >
                              <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      onClick={handleSaveAvailability}
                      disabled={isSavingAvailability}
                      className="bg-brand-yellow hover:bg-brand-yellow/90 text-slate-900 font-bold"
                    >
                      {isSavingAvailability ? 'A salvar...' : 'Salvar Disponibilidade'}
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Dados para Recebimento (Pix) */}
          <Collapsible open={openSection === 'pix'} onOpenChange={(open) => handleToggleSection('pix')}>
            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden transition-colors hover:border-[#f5b000]">
              <CollapsibleTrigger asChild>
                <CardHeader className="bg-slate-50 border-b pb-3 pt-4 rounded-t-3xl cursor-pointer select-none hover:bg-slate-100 transition-colors">
                  <CardTitle className="flex items-center justify-between text-xl text-slate-800">
                    <span className="flex items-center gap-2">
                      <Wallet className="h-6 w-6 text-brand-yellow" />
                      Dados para Recebimento (Pix)
                    </span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${openSection === 'pix' ? 'rotate-180' : ''}`} />
                  </CardTitle>
                  <CardDescription className="text-base font-medium">
                    Adicione sua chave Pix para receber pelas aulas realizadas.
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <form onSubmit={handleSavePix}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="pixKeyType" className="font-bold text-slate-700">Tipo de chave</Label>
                        <Select value={pixKeyType} onValueChange={(value) => { setPixKeyType(value); setPixKey(''); setPixKeyRaw(''); }}>
                          <SelectTrigger id="pixKeyType" className="h-12 bg-white rounded-xl">
                            <SelectValue placeholder="Selecione o tipo de chave" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="random">Chave Aleatória</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="pixKey" className="font-bold text-slate-700">Chave Pix</Label>
                        <Input
                          id="pixKey"
                          type="text"
                          className="h-12 bg-white"
                          value={pixKey}
                          onChange={(e) => handlePixKeyChange(e.target.value)}
                          placeholder={
                            !pixKeyType ? 'Selecione o tipo de chave primeiro' :
                            pixKeyType === 'cpf' ? '000.000.000-00' :
                            pixKeyType === 'cnpj' ? '00.000.000/0000-00' :
                            pixKeyType === 'phone' ? '(00) 00000-0000' :
                            pixKeyType === 'email' ? 'seu@email.com' :
                            'Chave aleatória'
                          }
                          disabled={!pixKeyType}
                        />
                      </div>
                    </div>

                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 text-sm">
                        As transferências somente poderão ser realizadas para o titular da conta.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                  <CardFooter className="bg-slate-50 pt-6 rounded-b-3xl border-t">
                    <Button
                      type="submit"
                      disabled={isSavingPix || !isPixKeyValid}
                      className="w-full h-12 rounded-xl bg-brand-yellow font-bold text-slate-900 hover:bg-amber-400 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingPix
                        ? 'Salvando...'
                        : <><Save className="mr-2 h-5 w-5" /> Salvar dados Pix</>}
                    </Button>
                  </CardFooter>
                </form>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </>
      )}
    </div>
  );
}
