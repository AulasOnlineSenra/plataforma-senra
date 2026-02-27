'use client';

import { useEffect, useState } from 'react';
import { Gift, MessageCircle, Save, Settings, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const APP_SETTINGS_KEY = 'appSettings';
const DEFAULT_SETTINGS = {
  whatsapp: '5583999999999',
  teacherClassValue: '50.00',
  referralBonus: '1',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [whatsapp, setWhatsapp] = useState(DEFAULT_SETTINGS.whatsapp);
  const [teacherClassValue, setTeacherClassValue] = useState(DEFAULT_SETTINGS.teacherClassValue);
  const [referralBonus, setReferralBonus] = useState(DEFAULT_SETTINGS.referralBonus);

  useEffect(() => {
    const stored = localStorage.getItem(APP_SETTINGS_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      setWhatsapp(parsed.whatsapp || DEFAULT_SETTINGS.whatsapp);
      setTeacherClassValue(parsed.teacherClassValue || DEFAULT_SETTINGS.teacherClassValue);
      setReferralBonus(parsed.referralBonus || DEFAULT_SETTINGS.referralBonus);
    } catch {
      setWhatsapp(DEFAULT_SETTINGS.whatsapp);
      setTeacherClassValue(DEFAULT_SETTINGS.teacherClassValue);
      setReferralBonus(DEFAULT_SETTINGS.referralBonus);
    }
  }, []);

  const handleSave = () => {
    setIsLoading(true);
    const nextSettings = {
      whatsapp: whatsapp.trim(),
      teacherClassValue: teacherClassValue.trim(),
      referralBonus: referralBonus.trim(),
    };

    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(nextSettings));
    window.dispatchEvent(new Event('storage'));

    setIsLoading(false);
    toast({
      title: 'Sucesso!',
      description: 'Configuracoes do sistema atualizadas.',
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
            Configuracoes do Sistema
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
                Numero do WhatsApp (com DDI e DDD)
              </Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="h-12 rounded-xl border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow"
                placeholder="Ex: 5583999999999"
              />
              <p className="mt-2 text-sm text-slate-500">
                Os links de "Comprar Plano" e "Falar com Suporte" redirecionarao para este numero.
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
                Usado para calcular quanto a plataforma deve aos tutores no fechamento do mes.
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
                <CardTitle className="text-xl text-slate-900">Marketing de Indicacao</CardTitle>
                <CardDescription>Regras para novos cadastros por convite</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="referral" className="font-medium text-slate-700">
                Creditos por Indicacao Bem-sucedida
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
      </div>

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
              Salvar Configuracoes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
