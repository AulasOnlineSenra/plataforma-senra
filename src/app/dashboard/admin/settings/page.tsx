'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Gift, KeyRound, MessageCircle, Plus, Save, Settings, Trash2, Wallet, GripVertical, X, Bot, Database, DownloadCloud, UploadCloud, History, Clock, Trash, Download, BookCopy, Sparkles, Send, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSettings, updateSettings, updateAvailabilityType } from '@/app/actions/settings';
import { getAllQuizQuestions, createQuizQuestion, updateQuizQuestion, deleteQuizQuestion, reorderQuizQuestions } from '@/app/actions/quiz';
import { getEnemConfig, updateEnemConfig, listSimuladoTemplates } from '@/app/actions/enem';
import { ENEM_DIA1_MINUTES, ENEM_DIA2_MINUTES } from '@/lib/enem-utils';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const DEFAULT_SETTINGS = {
  whatsapp: '5583999999999',
  teacherClassValue: '50.00',
  referralBonus: '1',
  pixKey: '27394788000114',
  pixKeyType: 'cnpj',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [whatsapp, setWhatsapp] = useState(DEFAULT_SETTINGS.whatsapp);
  const [teacherClassValue, setTeacherClassValue] = useState(DEFAULT_SETTINGS.teacherClassValue);
  const [referralBonus, setReferralBonus] = useState(DEFAULT_SETTINGS.referralBonus);
  const [availabilityType, setAvailabilityType] = useState('weekly');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState(DEFAULT_SETTINGS.pixKeyType);
  
  // AI API Keys
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [minimaxApiKey, setMinimaxApiKey] = useState('');
  const [grokApiKey, setGrokApiKey] = useState('');

  // Backup Settings
  const [backupAuto, setBackupAuto] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState('weekly');
  const [backupRetention, setBackupRetention] = useState('5');
  const [backupEmail, setBackupEmail] = useState('');
  const [backupDrive, setBackupDrive] = useState('');

  // Backup Files
  const [backupFiles, setBackupFiles] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  
  // Restore State
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [formData, setFormData] = useState({
    question: '',
    questionPt: '',
    type: 'text',
    options: '',
    placeholder: '',
    isRequired: true,
  });

  // ENEM Settings States
  const [enemEnabled, setEnemEnabled] = useState(false);
  const [enemDia1TemplateId, setEnemDia1TemplateId] = useState<string>('');
  const [enemDia2TemplateId, setEnemDia2TemplateId] = useState<string>('');
  const [enemReleaseHour, setEnemReleaseHour] = useState(13);
  const [enemReleaseMinute, setEnemReleaseMinute] = useState(0);
  const [enemOnlyTagged, setEnemOnlyTagged] = useState(true);
  const [enemTemplates, setEnemTemplates] = useState<any[]>([]);
  const [isSendingEnemManual, setIsSendingEnemManual] = useState<'DIA1' | 'DIA2' | null>(null);
  const [isSavingEnem, setIsSavingEnem] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      const result = await getSettings();
      if (!isMounted || !result.success || !result.data) return;

      setWhatsapp(result.data.whatsapp || DEFAULT_SETTINGS.whatsapp);
      setTeacherClassValue(result.data.classValue || DEFAULT_SETTINGS.teacherClassValue);
      setReferralBonus(result.data.referralBonus || DEFAULT_SETTINGS.referralBonus);
      setAvailabilityType(result.data.availabilityType || 'weekly');
      setPixKey((result.data as any).pixKey || DEFAULT_SETTINGS.pixKey);
      setPixKeyType((result.data as any).pixKeyType || DEFAULT_SETTINGS.pixKeyType);
      
      // AI Keys
      setGeminiApiKey((result.data as any).geminiApiKey || '');
      setOpenaiApiKey((result.data as any).openaiApiKey || '');
      setAnthropicApiKey((result.data as any).anthropicApiKey || '');
      setOpenRouterApiKey((result.data as any).openRouterApiKey || '');
      setMinimaxApiKey((result.data as any).minimaxApiKey || '');
      setGrokApiKey((result.data as any).grokApiKey || '');

      setBackupAuto((result.data as any).backupAuto || false);
      setBackupFrequency((result.data as any).backupFrequency || 'weekly');
      setBackupRetention(String((result.data as any).backupRetention || 5));
      setBackupEmail((result.data as any).backupEmail || '');
      setBackupDrive((result.data as any).backupDrive || '');

      // Carregar Configurações e Templates do ENEM
      const [configRes, templatesRes] = await Promise.all([
        getEnemConfig(),
        listSimuladoTemplates()
      ]);

      if (isMounted) {
        if (configRes.success && configRes.data) {
          const c = configRes.data;
          setEnemEnabled(c.enemSimuladoEnabled);
          setEnemDia1TemplateId(c.enemDia1TemplateId || '');
          setEnemDia2TemplateId(c.enemDia2TemplateId || '');
          setEnemReleaseHour(c.enemReleaseHour);
          setEnemReleaseMinute(c.enemReleaseMinute);
          setEnemOnlyTagged(c.enemOnlyTaggedStudents);
        }
        if (templatesRes.success && templatesRes.data) {
          setEnemTemplates(templatesRes.data);
        }
      }
    };

    loadSettings();
    
    // Fetch backups
    const fetchBackups = async () => {
      try {
        setIsLoadingBackups(true);
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        const res = await fetch(`/api/backups/list?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setBackupFiles(data.backups || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingBackups(false);
      }
    };
    fetchBackups();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const loadQuizQuestions = async () => {
      setIsLoadingQuestions(true);
      const result = await getAllQuizQuestions();
      if (result.success && result.data) {
        setQuizQuestions(result.data);
      }
      setIsLoadingQuestions(false);
    };
    loadQuizQuestions();
  }, []);

  const handleSaveAvailabilityType = async () => {
    setIsSavingAvailability(true);
    const result = await updateAvailabilityType(availabilityType);
    setIsSavingAvailability(false);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
      return;
    }
    toast({
      title: 'Sucesso!',
      description: 'Tipo de agenda atualizado.',
      className: 'border-none bg-green-600 text-white',
    });
  };

  const handleSaveEnem = async () => {
    setIsSavingEnem(true);
    const res = await updateEnemConfig({
      enemSimuladoEnabled: enemEnabled,
      enemDia1TemplateId: enemDia1TemplateId || null,
      enemDia2TemplateId: enemDia2TemplateId || null,
      enemReleaseHour: Number(enemReleaseHour),
      enemReleaseMinute: Number(enemReleaseMinute),
      enemOnlyTaggedStudents: enemOnlyTagged,
    });
    setIsSavingEnem(false);

    if (res.success) {
      toast({
        title: 'Configurações Salvas',
        description: 'As regras de agendamento do ENEM foram atualizadas com sucesso.',
        className: 'border-none bg-green-600 text-white',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Houve um problema ao salvar as configurações.',
      });
    }
  };

  const handleManualSendEnem = async (dayType: 'DIA1' | 'DIA2') => {
    const adminId = localStorage.getItem('userId');
    if (!adminId) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para realizar esta ação.',
      });
      return;
    }

    setIsSendingEnemManual(dayType);

    try {
      const response = await fetch('/api/cron/enem-simulado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayType, adminId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: `Simulado ${dayType === 'DIA1' ? 'Dia 1' : 'Dia 2'} Enviado!`,
          description: `Enviado para ${data.dispatched} alunos de um total de ${data.total} elegíveis.`,
          className: 'border-none bg-green-600 text-white',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro no Envio',
          description: data.error || 'Não foi possível disparar o simulado.',
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro de Rede',
        description: 'Falha ao conectar ao servidor.',
      });
    } finally {
      setIsSendingEnemManual(null);
    }
  };

  const handleSave = async () => {
    console.log('[handleSave] Salvando configurações:', { teacherClassValue, referralBonus: referralBonus, type: typeof referralBonus });
    setIsLoading(true);
    
    const referralBonusValue = String(referralBonus).trim() || '1';
    const teacherClassValueValue = String(teacherClassValue).trim() || '50.00';
    
    console.log('[handleSave] Valores processados:', { teacherClassValueValue, referralBonusValue });
    
    const nextSettings = {
      whatsapp: whatsapp.trim() || '',
      teacherClassValue: teacherClassValueValue,
      referralBonus: referralBonusValue,
    };

    const result = await updateSettings({
      whatsapp: nextSettings.whatsapp,
      classValue: nextSettings.teacherClassValue,
      referralBonus: nextSettings.referralBonus,
      pixKey: pixKey.trim(),
      pixKeyType: pixKeyType.trim(),
      geminiApiKey: geminiApiKey.trim(),
      openaiApiKey: openaiApiKey.trim(),
      anthropicApiKey: anthropicApiKey.trim(),
      openRouterApiKey: openRouterApiKey.trim(),
      minimaxApiKey: minimaxApiKey.trim(),
      grokApiKey: grokApiKey.trim(),
      backupAuto,
      backupFrequency,
      backupRetention: parseInt(backupRetention) || 5,
      backupEmail: backupEmail.trim(),
      backupDrive: backupDrive.trim(),
    });
    console.log('[handleSave] Resultado:', result);
    setIsLoading(false);

    if (!result.success) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao salvar', 
        description: result.error || 'Falha ao salvar configurações.' 
      });
      return;
    }

    toast({
      title: 'Sucesso!',
      description: 'Configurações do sistema atualizadas.',
      className: 'border-none bg-green-600 text-white',
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 pb-8">
      <Card className="relative overflow-hidden rounded-3xl border-slate-200 bg-slate-900 shadow-sm">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-2xl text-slate-50">
            <Settings className="h-7 w-7 text-brand-yellow" />
            Configurações do Sistema
          </CardTitle>
          <CardDescription className="mt-2 text-base text-slate-300">
            Gerencie as variaveis operacionais e regras de negocio da Plataforma Senra.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Suporte & Vendas</CardTitle>
                <CardDescription>WhatsApp principal de atendimento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="font-medium text-slate-700">
                Número do WhatsApp (com DDI e DDD)
              </Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="h-12 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow"
                placeholder="Ex: 5583999999999"
              />
              <p className="mt-2 text-sm text-slate-500">
                Os links de "Comprar Plano" e "Falar com Suporte" redirecionarao para este número.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Repasse (Professores)</CardTitle>
                <CardDescription>Base financeira para aulas concluidas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="class-value" className="font-medium text-slate-700">
                Valor repassado por Aula (R$)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-slate-500">R$</span>
                <Input
                  id="class-value"
                  type="number"
                  value={teacherClassValue}
                  onChange={(e) => setTeacherClassValue(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 pl-10 focus:border-brand-yellow focus:ring-brand-yellow"
                  placeholder="50.00"
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Usado para calcular quanto a plataforma deve aos tutores no fechamento do mês.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm transition-shadow hover:shadow-md md:col-span-2 lg:col-span-1">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-purple-100 p-3 text-purple-600">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Marketing de Indicação</CardTitle>
                <CardDescription>Regras para novos cadastros por convite</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="referral" className="font-medium text-slate-700">
                Créditos por Indicacao Bem-sucedida
              </Label>
              <Input
                id="referral"
                type="number"
                value={referralBonus}
                onChange={(e) => setReferralBonus(e.target.value)}
                className="h-12 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow"
                placeholder="Ex: 1"
              />
              <p className="mt-2 text-sm text-slate-500">
                Quantidade de aulas gratis que o aluno recebe quando um amigo se cadastra e compra um plano usando o codigo dele.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm transition-shadow hover:shadow-md md:col-span-2">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Tipo de Agenda</CardTitle>
                <CardDescription>Periodicidade da grade de disponibilidade dos professores</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="availability-type" className="font-medium text-slate-700">
                Periodicidade da disponibilidade
              </Label>
              <Select value={availabilityType} onValueChange={setAvailabilityType}>
                <SelectTrigger
                  id="availability-type"
                  className="h-12 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quinzenal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-sm text-slate-500">
                Define o ciclo de repetição dos horários cadastrados pelos professores.
                <span className="font-semibold text-slate-700"> Como será usado: </span>
                no agendamento, o sistema lerá este campo para calcular os próximos blocos
                disponíveis — <span className="italic">semanal</span> repete toda semana,
                <span className="italic"> quinzenal</span> a cada 14 dias e
                <span className="italic"> mensal</span> uma vez por mês.
                Ao verificar conflitos de data, a query filtrará somente os slots que se encaixam
                no ciclo atual antes de comparação com as aulas já agendadas.
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSaveAvailabilityType}
                disabled={isSavingAvailability}
                className="h-12 rounded-full bg-brand-yellow px-6 font-bold text-slate-900 hover:bg-amber-400 transition-all"
              >
                {isSavingAvailability ? 'Salvando...' : <><Save className="mr-2 h-4 w-4" /> Salvar Tipo de Agenda</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 shadow-sm transition-shadow hover:shadow-md md:col-span-2">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-600">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Pagamento Pix</CardTitle>
                <CardDescription>Chave Pix exibida no checkout dos alunos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pix-key-type" className="font-medium text-slate-700">
                  Tipo de chave
                </Label>
                <Select value={pixKeyType} onValueChange={setPixKeyType}>
                  <SelectTrigger id="pix-key-type" className="h-12 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow">
                    <SelectValue placeholder="Selecione o tipo" />
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
              <div className="space-y-2">
                <Label htmlFor="pix-key" className="font-medium text-slate-700">
                  Chave Pix (copia e cola)
                </Label>
                <Input
                  id="pix-key"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow"
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
            <p className="mt-2 text-sm text-slate-500">
              Esta chave será exibida para os alunos ao escolherem pagar via Pix no checkout.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm transition-shadow hover:shadow-md md:col-span-2">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Configurações de IA</CardTitle>
                <CardDescription>Chaves de API para os provedores de inteligência artificial</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label className="font-medium text-slate-700">Google Gemini API Key</Label>
                <Input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow"
                  placeholder="sk-..."
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-slate-700">OpenAI API Key</Label>
                <Input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow"
                  placeholder="sk-..."
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-slate-700">Anthropic (Claude) Key</Label>
                <Input
                  type="password"
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow"
                  placeholder="sk-ant-..."
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-slate-700">OpenRouter API Key</Label>
                <Input
                  type="password"
                  value={openRouterApiKey}
                  onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow"
                  placeholder="sk-or-..."
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-slate-700">Grok (xAI) API Key</Label>
                <Input
                  type="password"
                  value={grokApiKey}
                  onChange={(e) => setGrokApiKey(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow"
                  placeholder="xai-..."
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-slate-700">MiniMax API Key</Label>
                <Input
                  type="password"
                  value={minimaxApiKey}
                  onChange={(e) => setMinimaxApiKey(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow"
                  placeholder="Key..."
                />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500 italic">
              * Suas chaves são armazenadas de forma segura e usadas apenas para processar requisições de IA da plataforma.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simulado ENEM Automático */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden md:col-span-2">
          <CardHeader className="border-b border-slate-100 pb-6 bg-slate-50/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600">
                  <BookCopy className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                    Simulado ENEM Automático
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-indigo-600" /> Recorrente
                    </span>
                  </CardTitle>
                  <CardDescription>Configure o disparo recorrente mensal do simulado para os alunos</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                <Label htmlFor="enem-enabled-main" className="text-sm font-bold text-slate-700 cursor-pointer">Ativar Envio Automático</Label>
                <Switch
                  id="enem-enabled-main"
                  checked={enemEnabled}
                  onCheckedChange={setEnemEnabled}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-600 leading-relaxed">
                Quando ativado, o sistema envia automaticamente a primeira parte do simulado no <strong>último sábado de cada mês</strong> e a segunda parte no <strong>último domingo de cada mês</strong>.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label className="font-bold text-slate-700">Template Dia 1 (Sábado - 5h30)</Label>
                <Select value={enemDia1TemplateId} onValueChange={setEnemDia1TemplateId}>
                  <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione o simulado do Dia 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {enemTemplates.filter(t => t.dayType === 'DIA1' || t.dayType === 'CUSTOM').map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">Tempo limite recomendado: {ENEM_DIA1_MINUTES} minutos (5h30min)</p>
              </div>

              <div className="grid gap-2">
                <Label className="font-bold text-slate-700">Template Dia 2 (Domingo - 5h)</Label>
                <Select value={enemDia2TemplateId} onValueChange={setEnemDia2TemplateId}>
                  <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione o simulado do Dia 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {enemTemplates.filter(t => t.dayType === 'DIA2' || t.dayType === 'CUSTOM').map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">Tempo limite recomendado: {ENEM_DIA2_MINUTES} minutos (5h00min)</p>
              </div>

              <div className="grid gap-2">
                <Label className="font-bold text-slate-700">Horário de Liberação</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    className="h-12 text-center font-bold text-lg w-20 rounded-xl border-slate-200"
                    value={enemReleaseHour}
                    onChange={(e) => setEnemReleaseHour(Number(e.target.value))}
                  />
                  <span className="font-bold text-slate-400">:</span>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    className="h-12 text-center font-bold text-lg w-20 rounded-xl border-slate-200"
                    value={enemReleaseMinute}
                    onChange={(e) => setEnemReleaseMinute(Number(e.target.value))}
                  />
                  <span className="text-sm text-slate-500 ml-2">horas</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 self-end h-12">
                <Label htmlFor="enem-only-tagged" className="font-bold text-slate-700 cursor-pointer">Apenas Alunos com Tag "Foco ENEM"</Label>
                <Switch
                  id="enem-only-tagged"
                  checked={enemOnlyTagged}
                  onCheckedChange={setEnemOnlyTagged}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t py-4 flex justify-end">
            <Button
              className="rounded-full bg-brand-yellow hover:bg-amber-400 text-slate-900 font-bold h-11 px-6 transition-all"
              onClick={handleSaveEnem}
              disabled={isSavingEnem}
            >
              {isSavingEnem ? 'Salvando...' : <><Save className="mr-2 h-4 w-4" /> Salvar Regras do ENEM</>}
            </Button>
          </CardFooter>
        </Card>

        {/* Disparo Manual de Teste */}
        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden md:col-span-2">
          <CardHeader className="bg-slate-50/50 border-b pb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Disparo Manual de Teste (ENEM)</CardTitle>
                <CardDescription>
                  Envie imediatamente os simulados selecionados acima para fins de homologação e testes práticos.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
            <div className="p-5 border rounded-2xl flex flex-col justify-between h-44 bg-white hover:border-slate-300 transition-all">
              <div>
                <h4 className="font-bold text-slate-800">Enviar Dia 1 Agora</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Cria o simulado ENEM do Dia 1 na conta de todos os alunos elegíveis imediatamente.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl font-bold border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all mt-4"
                onClick={() => handleManualSendEnem('DIA1')}
                disabled={!!isSendingEnemManual}
              >
                {isSendingEnemManual === 'DIA1' ? 'Enviando...' : 'Disparar Dia 1'}
              </Button>
            </div>

            <div className="p-5 border rounded-2xl flex flex-col justify-between h-44 bg-white hover:border-slate-300 transition-all">
              <div>
                <h4 className="font-bold text-slate-800">Enviar Dia 2 Agora</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Cria o simulado ENEM do Dia 2 na conta de todos os alunos elegíveis imediatamente.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl font-bold border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all mt-4"
                onClick={() => handleManualSendEnem('DIA2')}
                disabled={!!isSendingEnemManual}
              >
                {isSendingEnemManual === 'DIA2' ? 'Enviando...' : 'Disparar Dia 2'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm md:col-span-2">
        <CardHeader className="border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-teal-100 p-3 text-teal-600">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">Backup & Segurança de Dados</CardTitle>
              <CardDescription>Gerencie backups manuais, automáticos e restauração do sistema.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          
          {/* Backup Manual */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <p className="font-medium text-slate-900 flex items-center gap-2">
                <DownloadCloud className="w-5 h-5 text-teal-600" />
                Backup Manual (Sob Demanda)
              </p>
              <p className="text-sm text-slate-500 max-w-lg mt-1">
                Gera e baixa um arquivo criptografado (.sql.gz) contendo o banco de dados completo no exato momento do clique.
              </p>
            </div>
            <Button
              type="button"
              onClick={async () => {
                try {
                  toast({ title: 'Gerando backup...', description: 'Aguarde, isso pode demorar um pouco.' });
                  const userId = localStorage.getItem('userId');
                  const res = await fetch(`/api/backups/generate?userId=${userId}`, { method: 'POST' });
                  if (!res.ok) throw new Error('Erro ao gerar');
                  const data = await res.json();
                  
                  if (data.success && data.filename) {
                     // Iniciar download
                     const downloadRes = await fetch(`/api/backups/download?userId=${userId}&file=${data.filename}`);
                     const blob = await downloadRes.blob();
                     const url = window.URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = data.filename;
                     document.body.appendChild(a);
                     a.click();
                     a.remove();
                     window.URL.revokeObjectURL(url);
                     toast({ title: 'Sucesso', description: 'Download iniciado.', className: 'border-none bg-green-600 text-white' });
                     fetchBackups();
                  }
                } catch(e) {
                  toast({ title: 'Erro', description: 'Falha ao baixar backup.', variant: 'destructive' });
                }
              }}
              className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white"
            >
              Gerar Backup Agora
            </Button>
          </div>

          {/* Backup Automático (Cron) */}
          <div className="grid md:grid-cols-2 gap-6 p-4 rounded-xl border border-slate-200 bg-white">
            <div className="space-y-4">
              <div>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Backup Automático Programado
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Ative rotinas de backup que rodam de madrugada para não pesar o servidor.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch 
                   checked={backupAuto} 
                   onCheckedChange={setBackupAuto} 
                   className="data-[state=checked]:bg-teal-600"
                />
                <Label className="font-medium">Ativar Backups Automáticos</Label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                 <Label>Frequência</Label>
                 <Select disabled={!backupAuto} value={backupFrequency} onValueChange={setBackupFrequency}>
                    <SelectTrigger className="border-slate-200 focus:ring-brand-yellow">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label>Retenção (Manter últimos X arquivos)</Label>
                 <Input 
                   type="number" 
                   disabled={!backupAuto}
                   value={backupRetention}
                   onChange={(e) => setBackupRetention(e.target.value)}
                   className="border-slate-200 focus:ring-brand-yellow" 
                   min="1" max="30"
                 />
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-600" />
              Histórico de Backups (Servidor)
            </h3>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
               {isLoadingBackups ? (
                 <p className="p-4 text-center text-slate-500">Carregando...</p>
               ) : backupFiles.length === 0 ? (
                 <p className="p-4 text-center text-slate-500">Nenhum backup encontrado no servidor.</p>
               ) : (
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-600 border-b">
                     <tr>
                       <th className="px-4 py-3 font-medium">Nome do Arquivo</th>
                       <th className="px-4 py-3 font-medium">Data</th>
                       <th className="px-4 py-3 font-medium">Tamanho</th>
                       <th className="px-4 py-3 font-medium text-right">Ações</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {backupFiles.map((file, i) => (
                       <tr key={i} className="hover:bg-slate-50/50">
                         <td className="px-4 py-3 font-medium text-slate-700">{file.filename}</td>
                         <td className="px-4 py-3 text-slate-500">{new Date(file.date).toLocaleString('pt-BR')}</td>
                         <td className="px-4 py-3 text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</td>
                         <td className="px-4 py-3 text-right">
                           <Button variant="ghost" size="sm" onClick={() => {
                              const userId = localStorage.getItem('userId');
                              window.open(`/api/backups/download?userId=${userId}&file=${file.filename}`, '_blank');
                           }}>
                              <Download className="w-4 h-4 text-teal-600" />
                           </Button>
                           <Button variant="ghost" size="sm" onClick={async () => {
                              if(confirm('Excluir este backup?')) {
                                const userId = localStorage.getItem('userId');
                                await fetch(`/api/backups/list?userId=${userId}&file=${file.filename}`, { method: 'DELETE' });
                                fetchBackups();
                              }
                           }}>
                              <Trash className="w-4 h-4 text-red-500" />
                           </Button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )}
            </div>
          </div>

          {/* Importação */}
          <div className="pt-6 border-t border-slate-100">
             <Button 
               variant="outline" 
               className="border-red-200 text-red-600 hover:bg-red-50"
               onClick={() => setIsRestoreDialogOpen(true)}
             >
               <UploadCloud className="w-4 h-4 mr-2" />
               Restaurar Backup do Computador
             </Button>
          </div>

        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
               <UploadCloud className="w-5 h-5" /> Restaurar Sistema
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
               <strong>Atenção:</strong> Esta ação reescreverá completamente o banco de dados. Qualquer cadastro, aula ou edição feita após o momento deste backup será permanentemente perdida.
             </div>
             
             <div className="space-y-2">
               <Label>Arquivo de Backup (.sql.gz)</Label>
               <Input 
                 type="file" 
                 accept=".gz,.sql" 
                 onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
               />
             </div>

             <div className="space-y-2">
               <Label>Senha do Administrador</Label>
               <Input 
                 type="password" 
                 placeholder="Digite sua senha para confirmar"
                 value={restorePassword}
                 onChange={(e) => setRestorePassword(e.target.value)}
               />
             </div>
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setIsRestoreDialogOpen(false)}>Cancelar</Button>
             <Button 
               disabled={!restoreFile || !restorePassword || isRestoring}
               className="bg-red-600 hover:bg-red-700 text-white"
               onClick={async () => {
                 try {
                   setIsRestoring(true);
                   const userId = localStorage.getItem('userId');
                   const formData = new FormData();
                   formData.append('file', restoreFile as Blob);
                   formData.append('password', restorePassword);

                   const res = await fetch(`/api/backups/restore?userId=${userId}`, {
                     method: 'POST',
                     body: formData
                   });
                   const data = await res.json();
                   if (data.success) {
                     toast({ title: 'Sucesso', description: 'Sistema restaurado com sucesso!', className: 'bg-green-600 text-white' });
                     setIsRestoreDialogOpen(false);
                     setTimeout(() => window.location.reload(), 2000);
                   } else {
                     toast({ title: 'Erro', description: data.error, variant: 'destructive' });
                   }
                 } catch(e) {
                   toast({ title: 'Erro', description: 'Falha grave na restauração.', variant: 'destructive' });
                 } finally {
                   setIsRestoring(false);
                 }
               }}
             >
               {isRestoring ? 'Restaurando...' : 'Confirmar Restauração'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                <GripVertical className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Questionário home</CardTitle>
                <CardDescription>
                  Configure as perguntas do questionário que aparece na página inicial
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingQuestion(null);
                setFormData({
                  question: '',
                  questionPt: '',
                  type: 'text',
                  options: '',
                  placeholder: '',
                  isRequired: true,
                });
                setIsDialogOpen(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingQuestions ? (
            <p className="text-center text-slate-500">Carregando perguntas...</p>
          ) : quizQuestions.length === 0 ? (
            <p className="text-center text-slate-500">Nenhuma pergunta configurada.</p>
          ) : (
            <div className="space-y-3">
              {quizQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{q.question}</p>
                      <p className="text-sm text-slate-500">
                        Tipo: {q.type} {q.isRequired && '• Obrigatório'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingQuestion(q);
                        setFormData({
                          question: q.question,
                          questionPt: q.questionPt || '',
                          type: q.type,
                          options: Array.isArray(q.options) ? q.options.join('\n') : '',
                          placeholder: q.placeholder || '',
                          isRequired: q.isRequired,
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja excluir esta pergunta?')) {
                          const result = await deleteQuizQuestion(q.id);
                          if (result.success) {
                            setQuizQuestions((prev) => prev.filter((item) => item.id !== q.id));
                            toast({
                              title: 'Sucesso',
                              description: 'Pergunta excluída.',
                              className: 'border-none bg-green-600 text-white',
                            });
                          }
                        }
                      }}
                      className="text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pergunta (PT)</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value, questionPt: e.target.value })}
                placeholder="Digite a pergunta"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de campo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="radio">Radio (escolha única)</SelectItem>
                  <SelectItem value="multiselect">Multi-seleção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.type === 'radio' || formData.type === 'multiselect') && (
              <div className="space-y-2">
                <Label>Opções (uma por linha)</Label>
                <Textarea
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                  rows={4}
                />
              </div>
            )}
            {formData.type === 'text' && (
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  placeholder="Texto de ajuda"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isRequired}
                onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
              />
              <Label>Obrigatório</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const optionsArray = formData.options
                  ? formData.options.split('\n').filter((o) => o.trim())
                  : [];

                if (editingQuestion) {
                  const result = await updateQuizQuestion(editingQuestion.id, {
                    question: formData.question,
                    questionPt: formData.questionPt,
                    type: formData.type as any,
                    options: optionsArray,
                    placeholder: formData.placeholder,
                    isRequired: formData.isRequired,
                  });
                  if (result.success) {
                    setQuizQuestions((prev) =>
                      prev.map((q) =>
                        q.id === editingQuestion.id
                          ? {
                              ...q,
                              question: formData.question,
                              questionPt: formData.questionPt,
                              type: formData.type,
                              options: optionsArray,
                              placeholder: formData.placeholder,
                              isRequired: formData.isRequired,
                            }
                          : q
                      )
                    );
                    toast({
                      title: 'Sucesso',
                      description: 'Pergunta atualizada.',
                      className: 'border-none bg-green-600 text-white',
                    });
                  }
                } else {
                  const result = await createQuizQuestion({
                    question: formData.question,
                    questionPt: formData.questionPt || formData.question,
                    type: formData.type as any,
                    options: optionsArray,
                    placeholder: formData.placeholder,
                    isRequired: formData.isRequired,
                  });
                  if (result.success && result.data) {
                    setQuizQuestions((prev) => [...prev, result.data]);
                    toast({
                      title: 'Sucesso',
                      description: 'Pergunta criada.',
                      className: 'border-none bg-green-600 text-white',
                    });
                  }
                }
                setIsDialogOpen(false);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            >
              {editingQuestion ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="h-14 rounded-full bg-brand-yellow px-8 text-lg font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 hover:bg-brand-yellow/90 active:scale-95"
        >
          {isLoading ? (
            'Salvando...'
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
