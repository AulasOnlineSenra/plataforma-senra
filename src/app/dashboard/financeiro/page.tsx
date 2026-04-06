'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Coins, ReceiptText, Wallet } from 'lucide-react';
import { getStudentTransactions } from '@/app/actions/finance';
import { getUserById } from '@/app/actions/users';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminFinancials from '@/components/admin-financials';

type TransactionHistory = {
  id: string;
  planName: string;
  creditsAdded: number;
  amountPaid: number;
  paymentMethod: string;
  status: string;
  createdAt: string | Date;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatDateTime(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

function getStatusBadgeClass(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === 'COMPROVADO') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (normalized === 'PENDENTE') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (normalized === 'CANCELADO') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function StudentFinancialPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditsAvailable, setCreditsAvailable] = useState(0);
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadFinancialData = async () => {
      setLoading(true);
      setError(null);

      const studentId = localStorage.getItem('userId');
      if (!studentId) {
        if (isMounted) {
          setError('Não foi possivel identificar o aluno atual.');
          setLoading(false);
        }
        return;
      }

      const [transactionsResult, userResult] = await Promise.all([
        getStudentTransactions(studentId),
        getUserById(studentId),
      ]);

      if (!isMounted) return;

      if (transactionsResult.success && transactionsResult.data) {
        setTransactions(transactionsResult.data as TransactionHistory[]);
      } else {
        setError(transactionsResult.error || 'Falha ao carregar histórico de compras.');
      }

      if (userResult.success && userResult.data) {
        setCreditsAvailable(userResult.data.credits ?? 0);
      }

      setLoading(false);
    };

    loadFinancialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalInvested = useMemo(() => {
    return transactions.reduce((sum, transaction) => sum + (transaction.amountPaid || 0), 0);
  }, [transactions]);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-slate-50/50">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Painel Financeiro</h1>
        <p className="text-sm text-slate-500">
          Acompanhe seus créditos e o histórico completo de compras da sua conta.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Créditos Disponiveis</p>
                <p className="text-3xl font-bold text-slate-900">{creditsAvailable}</p>
                <p className="text-xs text-slate-500">Prontos para novos agendamentos.</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5">
                <Coins className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Total Investido</p>
                <p className="text-3xl font-bold text-slate-900">{currencyFormatter.format(totalInvested)}</p>
                <p className="text-xs text-slate-500">Soma de todas as transações confirmadas.</p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-2.5">
                <Wallet className="h-5 w-5 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-slate-900">Histórico de Compras</CardTitle>
          <CardDescription>
            Aqui voce pode ver um registro de todos os pacotes de aulas que voce adquiriu.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-sm text-slate-500">Carregando transações...</div>
          ) : error ? (
            <div className="p-8 text-sm text-rose-600">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <ReceiptText className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Ainda não ha compras registradas</h3>
              <p className="max-w-md text-sm text-slate-500">
                Assim que voce adquirir um pacote, as transações aparecerao aqui com data, metodo de
                pagamento, status e valor.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pacote</TableHead>
                  <TableHead>Data da Compra</TableHead>
                  <TableHead>Metodo de Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-semibold text-slate-900">{transaction.planName}</TableCell>
                    <TableCell className="text-slate-600">{formatDateTime(transaction.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                        {transaction.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeClass(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-amber-500">+{transaction.creditsAdded}</TableCell>
                    <TableCell className="text-right font-medium text-slate-700">
                      {currencyFormatter.format(transaction.amountPaid)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminFinancialPanel() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Painel Financeiro</h1>
          <p className="text-sm text-slate-500">
            Visão geral das finanças da plataforma.
          </p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
        />
      </div>
      <AdminFinancials selectedMonth={selectedMonth} />
    </div>
  );
}

export default function FinanceiroPage() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole'));
  }, []);

  if (userRole === null) return null;

  if (userRole === 'admin') {
    return <AdminFinancialPanel />;
  }

  return <StudentFinancialPanel />;
}
