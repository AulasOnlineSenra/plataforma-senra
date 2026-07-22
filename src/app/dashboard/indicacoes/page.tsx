'use client';

import { useEffect, useState } from 'react';
import { Copy, Gift, Users, Settings, TrendingUp, DollarSign, UserCheck, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getReferralSummary, getAdminReferralDashboard, updateReferralBonusSettings } from '@/app/actions/users';
import { format, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getPayoutDate(transactionDate: Date) {
  const paymentDay = typeof window !== 'undefined' ? localStorage.getItem('teacherPaymentDay') || 'friday' : 'friday';
  const dayMap = {
    monday: nextMonday,
    tuesday: nextTuesday,
    wednesday: nextWednesday,
    thursday: nextThursday,
    friday: nextFriday,
  };
  const getNext = dayMap[paymentDay as keyof typeof dayMap] || nextFriday;
  return getNext(transactionDate);
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type FirstPurchase = {
  planName: string;
  creditsAdded: number;
  amountPaid: number;
  createdAt: string | Date;
};

type Referral = {
  id: string;
  name: string;
  email: string;
  createdAt: string | Date;
  Transaction?: FirstPurchase[];
};

type ReferralSummary = {
  id: string;
  name: string;
  referralCode: string;
  referrals: Referral[];
};

type Referrer = {
  id: string;
  name: string;
  email: string;
  role: string;
  referralCode: string;
  createdAt: string | Date;
  referrals: Referral[];
};

type BonusSettings = { avulsa: string; evolucao: string; aprovacao: string; referralDiscountPercent?: string };

// ─── Utilitários ──────────────────────────────────────────────────────────────
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function getTier(credits: number): { label: string; color: string } {
  if (credits >= 36) return { label: 'Aprovação', color: 'bg-purple-100 text-purple-700 border-purple-200' };
  if (credits >= 16) return { label: 'Evolução', color: 'bg-blue-100 text-blue-700 border-blue-200' };
  return { label: 'Avulsa', color: 'bg-amber-100 text-amber-700 border-amber-200' };
}

function getBonusForTier(credits: number, settings: BonusSettings): number {
  if (credits >= 36) return parseFloat(settings.aprovacao);
  if (credits >= 16) return parseFloat(settings.evolucao);
  return parseFloat(settings.avulsa);
}

// ─── Modal de Configurações de Bônus (Admin) ─────────────────────────────────
function BonusSettingsModal({
  bonusSettings,
  onClose,
  onSave,
}: {
  bonusSettings: BonusSettings;
  onClose: () => void;
  onSave: (s: BonusSettings) => void;
}) {
  const [avulsa, setAvulsa] = useState(bonusSettings.avulsa);
  const [evolucao, setEvolucao] = useState(bonusSettings.evolucao);
  const [aprovacao, setAprovacao] = useState(bonusSettings.aprovacao);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    const result = await updateReferralBonusSettings(avulsa, evolucao, aprovacao);
    setSaving(false);
    if (result.success) {
      toast({ title: 'Configurações salvas!', description: 'Os bônus foram atualizados com sucesso.' });
      onSave({ avulsa, evolucao, aprovacao });
      onClose();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-amber-100 p-2.5">
            <Settings className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Configurar Bônus</h2>
            <p className="text-sm text-slate-500">Defina o valor de bônus por faixa de aulas</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-600">Faixa Avulsa (1–15 aulas)</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">R$</span>
              <Input value={avulsa} onChange={(e) => setAvulsa(e.target.value)} type="number" step="0.01" className="rounded-xl" />
            </div>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">Faixa Evolução (16–35 aulas)</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">R$</span>
              <Input value={evolucao} onChange={(e) => setEvolucao(e.target.value)} type="number" step="0.01" className="rounded-xl" />
            </div>
          </div>
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-600">Faixa Aprovação (36+ aulas)</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">R$</span>
              <Input value={aprovacao} onChange={(e) => setAprovacao(e.target.value)} type="number" step="0.01" className="rounded-xl" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-2xl">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-2xl bg-amber-500 text-white hover:bg-amber-600">
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Linha de Referrer (Admin) ────────────────────────────────────────────────
function ReferrerRow({ referrer, bonusSettings }: { referrer: Referrer; bonusSettings: BonusSettings }) {
  const [open, setOpen] = useState(false);

  const converted = referrer.referrals.filter((r) => r.Transaction && r.Transaction.length > 0);
  const notConverted = referrer.referrals.filter((r) => !r.Transaction || r.Transaction.length === 0);
  const totalBonus = converted.reduce((acc, r) => {
    const credits = r.Transaction![0].creditsAdded;
    return acc + getBonusForTier(credits, bonusSettings);
  }, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
            {referrer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{referrer.name}</p>
            <p className="text-xs text-slate-500">{referrer.email} · Código: <span className="font-mono font-bold text-amber-600">{referrer.referralCode}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs text-slate-500">Total indicados</p>
            <p className="font-bold text-slate-800">{referrer.referrals.length}</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs text-slate-500">Convertidos</p>
            <p className="font-bold text-green-600">{converted.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Bônus total gerado</p>
            <p className="font-bold text-amber-600">{currencyFormatter.format(totalBonus)}</p>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Alunos Indicados</p>
          <div className="space-y-2">
            {referrer.referrals.map((referral) => {
              const firstPurchase = referral.Transaction?.[0];
              const tier = firstPurchase ? getTier(firstPurchase.creditsAdded) : null;
              const bonus = firstPurchase ? getBonusForTier(firstPurchase.creditsAdded, bonusSettings) : 0;

              return (
                <div key={referral.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{referral.name}</p>
                    <p className="text-xs text-slate-500">
                      {referral.email} · Cadastro em {format(new Date(referral.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {firstPurchase && tier ? (
                      <>
                        <Badge variant="outline" className={`rounded-full text-xs ${tier.color}`}>
                          {tier.label} · {firstPurchase.creditsAdded} aulas
                        </Badge>
                        <span className="text-sm font-bold text-amber-600">{currencyFormatter.format(bonus)}</span>
                      </>
                    ) : (
                      <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-100 text-xs text-slate-500">
                        Sem compra
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Painel Admin ─────────────────────────────────────────────────────────────
function AdminIndicacoesPanel() {
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [bonusSettings, setBonusSettings] = useState<BonusSettings>({ avulsa: '49.50', evolucao: '252.00', aprovacao: '378.00', referralDiscountPercent: '0' });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const load = async () => {
      const result = await getAdminReferralDashboard();
      if (result.success && result.data) {
        setReferrers(result.data.referrers as Referrer[]);
        setBonusSettings(result.data.bonusSettings);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Métricas globais
  const totalReferrers = referrers.length;
  const totalReferrals = referrers.reduce((acc, r) => acc + r.referrals.length, 0);
  const totalConverted = referrers.reduce((acc, r) => acc + r.referrals.filter((ref) => ref.Transaction && ref.Transaction.length > 0).length, 0);
  const totalBonusGenerated = referrers.reduce((acc, r) => {
    return acc + r.referrals.reduce((a2, ref) => {
      if (!ref.Transaction?.[0]) return a2;
      return a2 + getBonusForTier(ref.Transaction[0].creditsAdded, bonusSettings);
    }, 0);
  }, 0);

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Painel de Indicações</h1>
          <p className="text-sm text-slate-500">Visão completa do programa de afiliados da plataforma.</p>
        </div>
        <Button onClick={() => setShowSettings(true)} variant="outline" className="gap-2 rounded-2xl border-slate-200">
          <Settings className="h-4 w-4" />
          Configurar Bônus
        </Button>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Indicadores Ativos</p>
                <p className="text-3xl font-bold text-slate-900">{totalReferrers}</p>
              </div>
              <div className="rounded-xl bg-violet-100 p-2">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Indicados</p>
                <p className="text-3xl font-bold text-slate-900">{totalReferrals}</p>
              </div>
              <div className="rounded-xl bg-sky-100 p-2">
                <UserCheck className="h-5 w-5 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Convertidos</p>
                <p className="text-3xl font-bold text-green-600">{totalConverted}</p>
                <p className="text-xs text-slate-400">
                  {totalReferrals > 0 ? `${Math.round((totalConverted / totalReferrals) * 100)}% taxa` : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-green-100 p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Bônus Gerado</p>
                <p className="text-2xl font-bold text-amber-600">{currencyFormatter.format(totalBonusGenerated)}</p>
              </div>
              <div className="rounded-xl bg-amber-100 p-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de faixas de bônus (resumo) */}
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base">Tabela de Bônus Atual</CardTitle>
          <CardDescription>Clique em "Configurar Bônus" para alterar os valores</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {[
              { label: 'Avulsa', range: '1 a 15 aulas', value: bonusSettings.avulsa, color: 'bg-amber-100 text-amber-700' },
              { label: 'Evolução', range: '16 a 35 aulas', value: bonusSettings.evolucao, color: 'bg-blue-100 text-blue-700' },
              { label: 'Aprovação', range: '36+ aulas', value: bonusSettings.aprovacao, color: 'bg-purple-100 text-purple-700' },
            ].map((tier) => (
              <div key={tier.label} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`rounded-full ${tier.color}`}>{tier.label}</Badge>
                  <span className="text-sm text-slate-600">{tier.range}</span>
                </div>
                <span className="font-bold text-slate-800">{currencyFormatter.format(parseFloat(tier.value))}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de indicadores */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Todos os Indicadores</h2>
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Carregando dados...</div>
        ) : referrers.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 py-16 text-center text-slate-500">
            Nenhuma indicação registrada ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {referrers.map((r) => (
              <ReferrerRow key={r.id} referrer={r} bonusSettings={bonusSettings} />
            ))}
          </div>
        )}
      </div>

      {showSettings && (
        <BonusSettingsModal
          bonusSettings={bonusSettings}
          onClose={() => setShowSettings(false)}
          onSave={(newSettings) => setBonusSettings(newSettings)}
        />
      )}
    </div>
  );
}

// ─── Painel do Usuário (Aluno/Professor) ──────────────────────────────────────
function UserIndicacoesPanel() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [bonusSettings, setBonusSettings] = useState<BonusSettings>({ avulsa: '49.50', evolucao: '252.00', aprovacao: '378.00', referralDiscountPercent: '0' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) { setLoading(false); return; }
      const result = await getReferralSummary(userId);
      if (result.success && result.data) {
        setSummary(result.data as ReferralSummary);
        if (result.bonusSettings) {
          setBonusSettings(result.bonusSettings);
        }
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

  const copyLink = async () => {
    if (!summary?.referralCode) return;
    const link = `${window.location.origin}/register?role=student&ref=${summary.referralCode}`;
    await navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado!', description: 'O link já contém seu código e preencherá automaticamente.' });
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
            Indique alunos e receba bônus em dinheiro sempre que eles contratarem pacotes de aula.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-300">Carregando...</p>
          ) : (
            <div className="flex flex-col rounded-3xl bg-slate-50 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Seu codigo</p>
                  <p className="text-3xl font-bold text-slate-900">{summary?.referralCode || '-'}</p>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Button onClick={copyCode} variant="outline" className="rounded-2xl border-amber-300 text-amber-700 hover:bg-amber-50">
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Codigo
                  </Button>
                  <Button onClick={copyLink} className="rounded-2xl bg-[#FFC107] text-slate-900 hover:bg-amber-300">
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Link
                  </Button>
                </div>
              </div>
              
              {/* Banner de Oferta Integrado */}
              {bonusSettings?.referralDiscountPercent && parseFloat(bonusSettings.referralDiscountPercent) > 0 && (
                <>
                  <div className="my-5 h-px w-full bg-slate-200"></div>
                  <div>
                    <p className="text-amber-800 text-[17px] font-medium leading-relaxed">
                      ⏰ <strong className="font-bold">Promoção por tempo limitado!</strong><br />
                      Use seu link para indicar um amigo: ele ganha <strong className="font-bold">{bonusSettings.referralDiscountPercent}% OFF</strong> na primeira compra e você pode ganhar até <strong className="font-bold">R$380</strong> no pix. Compartilhe agora e aproveite!
                    </p>
                  </div>
                </>
              )}
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
        <CardContent className="p-0">
          {!summary?.referrals?.length ? (
            <div className="p-6">
              <p className="text-sm text-slate-500">Nenhuma indicacao registrada ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[30%]">Aluno</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Situação / Pacote</TableHead>
                  <TableHead>Contratação</TableHead>
                  <TableHead className="text-right">Bônus</TableHead>
                  <TableHead className="text-right">Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.referrals.map((item) => {
                  const firstPurchase = item.Transaction?.[0];
                  const tier = firstPurchase ? getTier(firstPurchase.creditsAdded) : null;
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {tier && firstPurchase ? (
                          <Badge variant="outline" className={`rounded-full text-xs ${tier.color}`}>
                            {tier.label} · {firstPurchase.creditsAdded} aulas
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-100 text-xs text-slate-500">
                            Sem compra
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {firstPurchase ? format(new Date(firstPurchase.createdAt), "dd/MM/yyyy", { locale: ptBR }) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {tier && firstPurchase ? (
                          <span className="font-bold text-amber-600">
                            {currencyFormatter.format(getBonusForTier(firstPurchase.creditsAdded, bonusSettings))}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {firstPurchase ? (
                          <span className="font-medium text-slate-600 text-sm">
                            {format(getPayoutDate(new Date(firstPurchase.createdAt)), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function IndicacoesPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem('userRole'));
  }, []);

  if (role === null) return null;

  if (role === 'admin') return <AdminIndicacoesPanel />;
  return <UserIndicacoesPanel />;
}
