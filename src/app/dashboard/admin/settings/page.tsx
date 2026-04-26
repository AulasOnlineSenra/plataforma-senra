'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Gift, KeyRound, MessageCircle, Plus, Save, Settings, Trash2, Wallet, GripVertical, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    };

    loadSettings();

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
      </div>

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
