'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Coins, Receipt } from 'lucide-react';
import { getStudentFinancialSummary } from '@/app/actions/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type LessonHistory = {
  id: string;
  subject: string;
  status: string;
  date: string | Date;
  teacher: { name: string };
};

export default function FinanceiroPage() {
  const [role, setRole] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [history, setHistory] = useState<LessonHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const currentRole = localStorage.getItem('userRole');
      const userId = localStorage.getItem('userId');
      setRole(currentRole);

      if (!userId || currentRole !== 'student') {
        setLoading(false);
        return;
      }

      const result = await getStudentFinancialSummary(userId);
      if (result.success && result.data) {
        setCredits(result.data.user.credits);
        setHistory(result.data.lessons as LessonHistory[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const consumedClasses = useMemo(() => history.length, [history]);

  if (loading) {
    return <p className="text-sm text-slate-500">Carregando financeiro...</p>;
  }

  if (role !== 'student') {
    return (
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Financeiro</CardTitle>
          <CardDescription>Esta visao detalhada de creditos e consumo e exclusiva para alunos.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 bg-slate-900 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-50">
              <Coins className="h-5 w-5 text-[#FFC107]" />
              Saldo de Creditos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-[#FFC107]">{credits}</p>
            <p className="mt-1 text-sm text-slate-300">Disponiveis para novos agendamentos.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-slate-50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Receipt className="h-5 w-5 text-[#FFC107]" />
              Consumo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-slate-900">{consumedClasses}</p>
            <p className="mt-1 text-sm text-slate-600">Aulas debitadas da carteira.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-slate-900">Historico de Consumo</CardTitle>
          <CardDescription>Registro real das aulas vinculadas aos seus creditos.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disciplina</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    Nenhum consumo de credito registrado.
                  </TableCell>
                </TableRow>
              )}
              {history.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-semibold text-slate-900">{lesson.subject}</TableCell>
                  <TableCell className="text-slate-600">{lesson.teacher?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{lesson.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {format(new Date(lesson.date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
