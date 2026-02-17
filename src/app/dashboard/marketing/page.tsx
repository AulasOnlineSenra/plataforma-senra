'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { getReferralRanking } from '@/app/actions/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type RankingItem = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  credits: number;
  _count: { referrals: number };
};

export default function MarketingPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const result = await getReferralRanking();
      if (result.success && result.data) {
        setRanking(result.data as RankingItem[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card className="rounded-3xl border-slate-200 bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-50">
            <TrendingUp className="h-5 w-5 text-[#FFC107]" />
            Marketing de Indicacoes
          </CardTitle>
          <CardDescription className="text-slate-300">
            Ranking dos alunos com maior volume de indicacoes.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-slate-900">Ranking de Indicadores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Carregando ranking...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead className="text-center">Indicacoes</TableHead>
                  <TableHead className="text-right">Creditos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                      Nenhum dado de indicacao encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {ranking.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {index < 3 ? (
                        <Badge className="bg-[#FFC107] text-slate-900">
                          <Trophy className="mr-1 h-3 w-3" />
                          {index + 1}
                        </Badge>
                      ) : (
                        <span className="text-slate-600">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">{item.name}</TableCell>
                    <TableCell className="text-slate-600">{item.email}</TableCell>
                    <TableCell className="font-mono text-slate-700">{item.referralCode}</TableCell>
                    <TableCell className="text-center font-semibold text-slate-900">{item._count.referrals}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">{item.credits}</TableCell>
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
