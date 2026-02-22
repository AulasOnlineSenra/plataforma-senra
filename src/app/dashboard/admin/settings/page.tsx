'use client';

import { useState } from 'react';
import { Settings, MessageCircle, Wallet, Gift, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Estados com valores iniciais fictícios
  const [whatsapp, setWhatsapp] = useState('5583999999999');
  const [teacherClassValue, setTeacherClassValue] = useState('50.00');
  const [referralBonus, setReferralBonus] = useState('1');

  const handleSave = () => {
    setIsLoading(true);
    // Simulando o salvamento
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Sucesso!",
        description: "Configurações do sistema atualizadas.",
        className: "bg-green-600 text-white border-none",
      });
    }, 800);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-5xl mx-auto w-full pb-8">
      {/* Cabeçalho da Página */}
      <Card className="rounded-3xl border-slate-200 bg-slate-900 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-2xl text-slate-50">
            <Settings className="h-7 w-7 text-[#FFC107]" />
            Configurações do Sistema
          </CardTitle>
          <CardDescription className="text-slate-300 text-base mt-2">
            Gerencie as variáveis operacionais e regras de negócio da Plataforma Senra.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card: Contato e Suporte */}
        <Card className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Suporte & Vendas</CardTitle>
                <CardDescription>WhatsApp principal de atendimento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-slate-700 font-medium">Número do WhatsApp (com DDI e DDD)</Label>
              <Input 
                id="whatsapp" 
                value={whatsapp} 
                onChange={(e) => setWhatsapp(e.target.value)}
                className="h-12 rounded-xl border-slate-200 focus:ring-amber-400 focus:border-amber-400"
                placeholder="Ex: 5583999999999"
              />
              <p className="text-sm text-slate-500 mt-2">
                Os links de "Comprar Plano" e "Falar com Suporte" redirecionarão para este número.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card: Pagamento aos Professores */}
        <Card className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Repasse (Professores)</CardTitle>
                <CardDescription>Base financeira para aulas concluídas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class-value" className="text-slate-700 font-medium">Valor repassado por Aula (R$)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                <Input 
                  id="class-value" 
                  type="number"
                  value={teacherClassValue} 
                  onChange={(e) => setTeacherClassValue(e.target.value)}
                  className="h-12 rounded-xl pl-10 border-slate-200 focus:ring-amber-400 focus:border-amber-400"
                  placeholder="50.00"
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Usado para calcular quanto a plataforma deve aos tutores no fechamento do mês.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card: Programa de Indicações */}
        <Card className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Marketing de Indicação</CardTitle>
                <CardDescription>Regras para novos cadastros por convite</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referral" className="text-slate-700 font-medium">Créditos por Indicação Bem-sucedida</Label>
              <Input 
                id="referral" 
                type="number"
                value={referralBonus} 
                onChange={(e) => setReferralBonus(e.target.value)}
                className="h-12 rounded-xl border-slate-200 focus:ring-amber-400 focus:border-amber-400"
                placeholder="Ex: 1"
              />
              <p className="text-sm text-slate-500 mt-2">
                Quantidade de aulas grátis que o aluno recebe quando um amigo se cadastra e compra um plano usando o código dele.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Salvar Global */}
      <div className="flex justify-end mt-4">
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="h-14 px-8 rounded-full bg-[#FFC107] hover:bg-[#FFD54F] text-slate-900 font-bold shadow-lg shadow-amber-500/20 text-lg transition-all hover:scale-105 active:scale-95"
        >
          {isLoading ? 'Salvando...' : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}