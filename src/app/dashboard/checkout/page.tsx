'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card, CardContent,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { safeLocalStorage } from '@/lib/safe-storage';
import {
  Receipt, CreditCard, Copy, Check, ArrowLeft, MessageCircle,
  User, Mail, Calendar, Clock, Hash, Fingerprint, MapPin,
  Upload, X, XCircle, RotateCcw, Coins,
} from 'lucide-react';
import Image from 'next/image';
import { getPlans } from '@/app/actions/plans';
import { getSettings } from '@/app/actions/settings';
import { createPendingTransaction, getTransactionById, requestTransactionReview } from '@/app/actions/finance';
import { sendPaymentChatToAdmins } from '@/app/actions/chat';
import { getUserById } from '@/app/actions/users';

type Plan = {
  id: string;
  name: string;
  lessonsCount: number;
  price: number;
  durationMins: number;
  isPopular: boolean;
};

type CheckoutBooking = {
  subjectName: string;
  teacherId?: string;
  teacherName: string;
  date: string;
  start: string;
  end: string;
};

type StudentInfo = {
  id: string;
  name: string;
  email: string;
  credits: number;
  cpf: string | null;
  state: string | null;
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const txId = searchParams.get('tx');
  const neededTotal = parseInt(searchParams.get('needed') || '0', 10);
  const currentCredits = parseInt(searchParams.get('current') || '0', 10);
  const missingCredits = Math.max(0, neededTotal - currentCredits);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [bookings, setBookings] = useState<CheckoutBooking[]>([]);
  const [isPixDialogOpen, setIsPixDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Transaction view mode
  const [viewTx, setViewTx] = useState<any>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewProofFile, setReviewProofFile] = useState<File | null>(null);
  const [reviewProofPreview, setReviewProofPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // If viewing existing transaction
      if (txId) {
        const txResult = await getTransactionById(txId);
        if (txResult.success && txResult.data) {
          setViewTx(txResult.data);
        }
        setIsLoading(false);
        return;
      }

      const storedUserId = safeLocalStorage.getItem('userId');
      const storedBookings = safeLocalStorage.getItem('checkoutBookings');

      if (storedBookings) {
        try {
          setBookings(JSON.parse(storedBookings));
        } catch { /* ignore */ }
      }

      const [plansResult, settingsResult] = await Promise.all([getPlans(), getSettings()]);

      if (plansResult.success && plansResult.data) {
        setPlans(plansResult.data);
      }

      if (settingsResult.success && settingsResult.data) {
        setPixKey((settingsResult.data as any).pixKey || '27394788000114');
        setPixKeyType((settingsResult.data as any).pixKeyType || 'cnpj');
        setWhatsappNumber((settingsResult.data.whatsapp || '').replace(/\D/g, ''));
      }

      if (storedUserId) {
        const userResult = await getUserById(storedUserId);
        if (userResult.success && userResult.data) {
          setStudent({
            id: userResult.data.id,
            name: userResult.data.name,
            email: userResult.data.email,
            credits: userResult.data.credits,
            cpf: userResult.data.cpf || null,
            state: userResult.data.state || null,
          });
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  const tiers = useMemo(() => {
    return [...plans]
      .sort((a, b) => a.lessonsCount - b.lessonsCount)
      .map((plan, index) => ({
        ...plan,
        pricePerClass: plan.price / plan.lessonsCount,
        tierIndex: index,
      }));
  }, [plans]);

  const getPriceTier = (numClasses: number) => {
    if (tiers.length === 0) return undefined;
    let bestTier = tiers[0];
    for (const tier of tiers) {
      if (numClasses >= tier.lessonsCount) bestTier = tier;
      else break;
    }
    return bestTier;
  };

  const priceCalc = useMemo(() => {
    if (missingCredits <= 0 || tiers.length === 0) {
      return { total: 0, pricePerClass: 0, credits: 0, tierName: '' };
    }
    const tier = getPriceTier(missingCredits);
    const pricePerClass = tier?.pricePerClass ?? tiers[0]?.pricePerClass ?? 0;
    return {
      total: missingCredits * pricePerClass,
      pricePerClass,
      credits: missingCredits,
      tierName: tier?.name ?? '',
    };
  }, [missingCredits, tiers]);

  const handleWhatsAppClick = () => {
    const text = `Olá! Gostaria de pagar *${missingCredits} crédito(s)* no valor de R$ ${priceCalc.total.toFixed(2).replace('.', ',')} (R$ ${priceCalc.pricePerClass.toFixed(2).replace('.', ',')}/aula) para finalizar meus agendamentos na plataforma. Como faço para realizar o pagamento?`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleOpenPix = () => {
    setIsPixDialogOpen(true);
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast({ title: 'Chave Pix Copiada!', description: 'Cole no seu app de banco para pagar.' });
  };

  const handleConfirmPayment = () => {
    setIsPixDialogOpen(false);
    setIsProofDialogOpen(true);
  };

  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'O comprovante deve ter no máximo 5MB.' });
      return;
    }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async () => {
    console.log('[Checkout] handleSubmitProof iniciado');
    console.log('[Checkout] student:', student);
    console.log('[Checkout] missingCredits:', missingCredits);
    console.log('[Checkout] priceCalc.total:', priceCalc.total);
    console.log('[Checkout] bookings:', bookings);
    
    if (!student) {
      console.error('[Checkout] student é null');
      return;
    }

    if (!student.id || missingCredits <= 0 || priceCalc.total <= 0) {
      console.error('[Checkout] Dados inválidos:', { studentId: student.id, missingCredits, total: priceCalc.total });
      return;
    }

    setIsProcessing(true);
    let proofUrl: string | null = null;

    if (proofFile) {
      console.log('[Checkout] Fazendo upload do comprovante...');
      const formData = new FormData();
      formData.append('file', proofFile);
      try {
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        console.log('[Checkout] Upload response:', uploadData);
        
        if (!uploadRes.ok || uploadData.success === false) {
          console.error('[Checkout] Erro no upload:', uploadData.error);
          setIsProcessing(false);
          return;
        }
        if (uploadData.data?.url) {
          proofUrl = uploadData.data.url;
        }
      } catch (err) {
        console.error('[Checkout] Exception no upload:', err);
        setIsProcessing(false);
        return;
      }
    }

    try {
      const planName = priceCalc.tierName || `${missingCredits} aula(s)`;
      
      console.log('[Checkout] Chamando createPendingTransaction...');
      
      const txResult = await createPendingTransaction(
        student.id,
        missingCredits,
        planName,
        priceCalc.total,
        'PIX',
        proofUrl || undefined,
        bookings.length > 0 ? bookings.map((b) => ({
          subjectName: b.subjectName,
          teacherId: b.teacherId || '',
          teacherName: b.teacherName,
          date: b.date,
          start: b.start,
          end: b.end,
        })) : undefined,
      );

      console.log('[Checkout] Resultado:', txResult);

      if (!txResult.success) {
        console.error('[Checkout] Falha:', txResult.error);
        setIsProcessing(false);
        return;
      }

      console.log('[Checkout] Sucesso! Transaction ID:', txResult.data?.id);

      // Enviar notificação via chat (não bloqueia se falhar)
      try {
        await sendPaymentChatToAdmins(
          student.id,
          student.name,
          txResult.data!.id,
          priceCalc.total,
          missingCredits,
          proofUrl,
          bookings.map((b) => ({
            subjectName: b.subjectName,
            teacherName: b.teacherName,
            date: b.date,
            start: b.start,
            end: b.end,
          })),
        );
      } catch (notifyErr) {
        console.warn('[Checkout] Erro ao enviar notificação (não crítico):', notifyErr);
      }

      // Limpar dados
      safeLocalStorage.removeItem('checkoutBookings');
      const userId = safeLocalStorage.getItem('userId');
      if (userId) safeLocalStorage.removeItem(`preBookings-${userId}`);

      setIsProcessing(false);
      setIsProofDialogOpen(false);
      
      // Redirect
      router.push('/dashboard');
      
    } catch (err: any) {
      console.error('[Checkout] Exception:', err);
      setIsProcessing(false);
    }
  };

  const handleReviewProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'O comprovante deve ter no máximo 5MB.' });
      return;
    }
    setReviewProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setReviewProofPreview(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleRequestReview = async () => {
    if (!viewTx) return;
    setIsProcessing(true);

    let proofUrl: string | undefined;
    if (reviewProofFile) {
      const formData = new FormData();
      formData.append('file', reviewProofFile);
      try {
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.data?.url) {
          proofUrl = uploadData.data.url;
        }
      } catch {
        toast({ variant: 'destructive', title: 'Erro no upload', description: 'Não foi possível enviar o comprovante.' });
        setIsProcessing(false);
        return;
      }
    }

    const result = await requestTransactionReview(viewTx.id, proofUrl);
    setIsProcessing(false);

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
      return;
    }

    toast({ title: 'Revisão solicitada!', description: 'Seu pagamento foi reenviado para análise.' });
    router.push('/dashboard?highlight=pending');
  };

  const notaNumber = useMemo(() => {
    return String(Math.floor(Math.random() * 9000) + 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400 font-medium animate-pulse">
        Carregando checkout...
      </div>
    );
  }

  // Transaction view mode
  if (viewTx) {
    const isPendingTx = viewTx.status === 'PENDENTE';
    const isApproved = viewTx.status === 'COMPROVADO';
    const isRejected = viewTx.status === 'CANCELADO';

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 pb-10">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="self-start text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
        </Button>

        <Card className="rounded-3xl border-slate-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`px-8 py-6 ${
            isPendingTx ? 'bg-amber-500' :
            isApproved ? 'bg-emerald-600' :
            'bg-rose-600'
          }`}>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/20 p-2.5">
                {isPendingTx ? <Clock className="h-6 w-6 text-white" /> :
                 isApproved ? <Check className="h-6 w-6 text-white" /> :
                 <XCircle className="h-6 w-6 text-white" />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {isPendingTx ? 'Pagamento em Análise' :
                   isApproved ? 'Pagamento Aprovado!' :
                   'Pagamento Rejeitado'}
                </h1>
                <p className="text-sm text-white/70">
                  {isPendingTx ? 'Aguardando validação do administrador' :
                   isApproved ? 'Créditos adicionados à sua conta' :
                   'Solicite uma revisão abaixo'}
                </p>
              </div>
            </div>
          </div>

          <CardContent className="px-0">
            {/* Transaction details */}
            <div className="px-8 py-5 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Detalhes do Pagamento</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-blue-100 p-2">
                    <Receipt className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Plano</p>
                    <p className="text-sm font-bold text-slate-900">{viewTx.planName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-purple-100 p-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Data</p>
                    <p className="text-sm font-bold text-slate-900">
                      {format(new Date(viewTx.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-amber-100 p-2">
                    <Coins className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Créditos</p>
                    <p className="text-sm font-bold text-slate-900">{viewTx.creditsAdded}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-emerald-100 p-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Valor</p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewTx.amountPaid)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Existing proof */}
            {viewTx.proofUrl && (
              <div className="px-8 py-5 border-b border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Comprovante Enviado</p>
                <div className="rounded-2xl border border-slate-200 overflow-hidden inline-block">
                  <Image
                    src={viewTx.proofUrl}
                    alt="Comprovante"
                    width={300}
                    height={300}
                    className="object-contain max-h-[300px]"
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Status-specific actions */}
            <div className="px-8 py-6">
              {isPendingTx && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="rounded-full bg-amber-100 p-3">
                    <Clock className="h-8 w-8 text-amber-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    Seu pagamento está sendo analisado. Você receberá uma notificação quando for aprovado.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => router.push('/dashboard')}
                  >
                    Voltar ao Dashboard
                  </Button>
                </div>
              )}

              {isApproved && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="rounded-full bg-emerald-100 p-3">
                    <Check className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    Pagamento aprovado! {viewTx.creditsAdded} crédito(s) foram adicionados à sua conta.
                  </p>
                  <Button
                    className="rounded-2xl bg-[#FFC107] font-bold text-slate-900 hover:bg-[#FFC107]/90"
                    onClick={() => router.push('/dashboard/booking')}
                  >
                    Agendar Aulas
                  </Button>
                </div>
              )}

              {isRejected && !isReviewMode && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="rounded-full bg-rose-100 p-3">
                    <XCircle className="h-8 w-8 text-rose-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    Seu pagamento foi rejeitado pelo administrador. Você pode solicitar uma revisão e enviar um novo comprovante.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => router.push('/dashboard')}
                    >
                      Voltar ao Dashboard
                    </Button>
                    <Button
                      className="rounded-2xl bg-[#FFC107] font-bold text-slate-900 hover:bg-[#FFC107]/90"
                      onClick={() => setIsReviewMode(true)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Pedir Revisão
                    </Button>
                  </div>
                </div>
              )}

              {isRejected && isReviewMode && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="rounded-full bg-amber-100 p-3">
                    <RotateCcw className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Solicitar Revisão</h3>
                  <p className="text-sm text-slate-600">
                    Envie um novo comprovante de pagamento (opcional) e solicite que o administrador reavalie seu pagamento.
                  </p>

                  {/* Proof upload for review */}
                  {reviewProofPreview ? (
                    <div className="relative">
                      <Image
                        src={reviewProofPreview}
                        alt="Comprovante"
                        width={280}
                        height={280}
                        className="rounded-2xl border border-slate-200 object-contain max-h-[280px]"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                        onClick={() => { setReviewProofFile(null); setReviewProofPreview(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full max-w-sm h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-brand-yellow hover:bg-amber-50/30 transition-colors">
                      <Upload className="h-6 w-6 text-slate-400 mb-1" />
                      <p className="text-sm font-semibold text-slate-500">Enviar comprovante (opcional)</p>
                      <p className="text-xs text-slate-400">PNG, JPG ou PDF — máx. 5MB</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleReviewProofSelect}
                      />
                    </label>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => setIsReviewMode(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="rounded-2xl bg-[#FFC107] font-bold text-slate-900 hover:bg-[#FFC107]/90"
                      onClick={handleRequestReview}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Enviando...' : 'Confirmar Revisão'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (missingCredits <= 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center py-16">
        <div className="rounded-full bg-green-100 p-4">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Você já tem créditos suficientes!</h1>
        <p className="text-slate-500">Volte para o agendamento e confirme suas aulas.</p>
        <Button onClick={() => router.push('/dashboard/booking')} className="rounded-2xl bg-[#FFC107] font-bold text-slate-900 hover:bg-[#FFC107]/90">
          Voltar para Agendamento
        </Button>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center py-16">
        <div className="rounded-full bg-amber-100 p-4">
          <Clock className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Pagamento pendente de validação</h1>
        <p className="text-slate-500">Seu pagamento está sendo validado. Você será notificado quando for aprovado.</p>
        <Button onClick={() => router.push('/dashboard')} className="rounded-2xl bg-[#FFC107] font-bold text-slate-900 hover:bg-[#FFC107]/90">
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 pb-10">
      {/* Botão voltar */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/booking')}
        className="self-start text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao agendamento
      </Button>

      {/* Nota Fiscal */}
      <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        {/* Cabeçalho da nota */}
        <div className="bg-slate-900 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-brand-yellow/20 p-2.5">
                <Receipt className="h-6 w-6 text-brand-yellow" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Nota Fiscal</h1>
                <p className="text-sm text-slate-400">Plataforma Senra</p>
              </div>
            </div>
            <div className="text-right">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-300">
                <Hash className="h-3.5 w-3.5" /> {notaNumber}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <Calendar className="h-3 w-3" /> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="px-0">
          {/* Dados do aluno */}
          <div className="px-8 py-5 bg-slate-50 border-b border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Dados do Aluno</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-blue-100 p-2">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Nome</p>
                  <p className="text-sm font-bold text-slate-900">{student?.name || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-purple-100 p-2">
                  <Mail className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Email</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{student?.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-amber-100 p-2">
                  <Fingerprint className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">CPF</p>
                  <p className="text-sm font-bold text-slate-900">{student?.cpf || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-rose-100 p-2">
                  <MapPin className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Estado</p>
                  <p className="text-sm font-bold text-slate-900">{student?.state || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de agendamentos */}
          <div className="px-8 py-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Agendamentos Solicitados</p>

            {bookings.length > 0 ? (
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                {/* Header da tabela */}
                <div className="grid bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400" style={{ gridTemplateColumns: '28px 1fr 1fr 90px 120px' }}>
                  <span>#</span>
                  <span>Disciplina</span>
                  <span>Professor</span>
                  <span>Data</span>
                  <span>Horário</span>
                </div>
                {/* Linhas */}
                {bookings.map((b, idx) => (
                  <div
                    key={idx}
                    className={`grid items-center px-4 py-3 text-sm ${idx > 0 ? 'border-t border-slate-50' : ''}`}
                    style={{ gridTemplateColumns: '28px 1fr 1fr 90px 120px' }}
                  >
                    <span className="text-xs font-bold text-slate-300">{idx + 1}</span>
                    <span className="font-bold text-slate-900 truncate pr-2">{b.subjectName}</span>
                    <span className="text-slate-600 truncate pr-2">{b.teacherName}</span>
                    <span className="text-slate-600">{format(new Date(b.date), 'dd/MM')}</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {b.start}–{b.end}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                Nenhum detalhe de agendamento disponível.
              </div>
            )}

            <p className="mt-3 text-xs text-slate-400">
              Total de aulas solicitadas: <span className="font-bold text-slate-600">{neededTotal}</span> •
              {' '}Duração: <span className="font-bold text-slate-600">90 min</span> cada
            </p>
          </div>

          <Separator />

          {/* Resumo financeiro */}
          <div className="px-8 py-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Resumo Financeiro</p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Aulas solicitadas</span>
                <span className="font-semibold text-slate-900">{neededTotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Créditos disponíveis</span>
                <span className="font-semibold text-slate-900">{currentCredits}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700 font-semibold">Créditos faltantes</span>
                <span className="font-bold text-amber-700">{missingCredits}</span>
              </div>

              <Separator className="my-1" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Valor por aula</span>
                <span className="font-semibold text-slate-900">
                  R$ {priceCalc.pricePerClass.toFixed(2).replace('.', ',')}
                </span>
              </div>
              {priceCalc.tierName && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Tabela aplicada</span>
                  <span className="font-medium">{priceCalc.tierName}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="mt-5 rounded-2xl bg-slate-900 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total a pagar</p>
                <p className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
                  R$ {priceCalc.total.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="rounded-xl bg-brand-yellow/20 px-4 py-2 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-yellow">Créditos</p>
                <p className="text-2xl font-extrabold text-brand-yellow">{missingCredits}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Botões de pagamento */}
          <div className="px-8 py-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Forma de Pagamento</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                className="h-14 rounded-2xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#1DA851] transition-transform hover:scale-[1.02]"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
              </Button>
              <Button
                variant="outline"
                className="h-14 rounded-2xl text-sm font-bold border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                onClick={handleOpenPix}
              >
                <CreditCard className="mr-2 h-5 w-5" /> Pagar com Pix
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Pix */}
      <Dialog open={isPixDialogOpen} onOpenChange={setIsPixDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Pagamento via Pix</DialogTitle>
            <DialogDescription>
              {missingCredits} crédito(s) • R$ {priceCalc.total.toFixed(2).replace('.', ',')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {pixKey ? (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixKey)}`}
                    alt="QR Code Pix"
                    width={200}
                    height={200}
                  />
                </div>
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold text-slate-700">Tipo:</Label>
                    <span className="text-sm font-bold text-violet-600">
                      {pixKeyType === 'cpf' ? 'CPF' :
                       pixKeyType === 'cnpj' ? 'CNPJ' :
                       pixKeyType === 'email' ? 'E-mail' :
                       pixKeyType === 'phone' ? 'Telefone' :
                       pixKeyType === 'random' ? 'Chave Aleatória' :
                       pixKeyType.toUpperCase()}
                    </span>
                  </div>
                  <Label className="text-sm font-semibold text-slate-700">Chave Pix (copia e cola)</Label>
                  <div className="relative">
                    <Input readOnly value={pixKey} className="pr-12 text-xs rounded-xl" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={handleCopyPixKey}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Nenhuma chave Pix configurada. Entre em contato com o suporte.
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-2xl">Cancelar</Button>
            </DialogClose>
            <Button
              className="rounded-2xl bg-[#FFC107] font-bold text-slate-900 hover:bg-[#FFC107]/90"
              onClick={handleConfirmPayment}
              disabled={isProcessing || !pixKey}
            >
              {isProcessing ? 'Processando...' : 'Já Paguei'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Comprovante */}
      <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Envie o comprovante do Pix (opcional). As aulas serão enviadas para aprovação do administrador.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {proofPreview ? (
              <div className="relative">
                <Image
                  src={proofPreview}
                  alt="Comprovante"
                  width={280}
                  height={280}
                  className="rounded-2xl border border-slate-200 object-contain max-h-[280px]"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                  onClick={() => { setProofFile(null); setProofPreview(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-brand-yellow hover:bg-amber-50/30 transition-colors">
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-500">Enviar comprovante (opcional)</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG ou PDF — máx. 5MB</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleProofSelect}
                />
              </label>
            )}
          </div>

          <Separator />

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-2xl">Cancelar</Button>
            </DialogClose>
            <Button
              className="rounded-2xl bg-[#FFC107] font-bold text-slate-900 hover:bg-[#FFC107]/90"
              onClick={handleSubmitProof}
              disabled={isProcessing}
            >
              {isProcessing ? 'Enviando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex h-[50vh] items-center justify-center text-slate-400 font-medium animate-pulse">Carregando checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
