'use client';

import { useEffect, useState } from 'react';
import { Copy, Gift, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getReferralSummary } from '@/app/actions/users';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ReferralSummary = {
  id: string;
  name: string;
  referralCode: string;
  referrals: { id: string; name: string; email: string; createdAt: string | Date }[];
};

export default function IndicacoesPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }

      const result = await getReferralSummary(userId);
      if (result.success && result.data) {
        setSummary(result.data as ReferralSummary);
      }
      setLoading(false);
    };

    load();
  }, []);

  const copyCode = async () => {
    if (!summary?.referralCode) return;
    await navigator.clipboard.writeText(summary.referralCode);
    toast({ title: 'Codigo copiado', description: 'Compartilhe para ganhar +1 credito por indicacao.' });
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card className="rounded-3xl border-slate-200 bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-50">
            <Gift className="h-5 w-5 text-[#FFC107]" />
            Programa de Indicações
          </CardTitle>
          <CardDescription className="text-slate-300">
            Cada novo aluno com seu codigo gera +1 credito na sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-300">Carregando...</p>
          ) : (
            <div className="flex flex-col gap-4 rounded-3xl bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Seu codigo</p>
                <p className="text-3xl font-bold text-slate-900">{summary?.referralCode || '-'}</p>
              </div>
              <Button onClick={copyCode} className="rounded-2xl bg-[#FFC107] text-slate-900 hover:bg-amber-300">
                <Copy className="mr-2 h-4 w-4" />
                Copiar Codigo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Users className="h-5 w-5 text-[#FFC107]" />
            Alunos Indicados
          </CardTitle>
          <CardDescription>Lista de cadastros que usaram seu codigo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          {!summary?.referrals?.length && <p className="text-sm text-slate-500">Nenhuma indicacao registrada ainda.</p>}
          {summary?.referrals?.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-900">{item.name}</p>
              <p className="text-sm text-slate-600">{item.email}</p>
              <p className="mt-1 text-xs text-slate-500">
                Cadastro em {format(new Date(item.createdAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
