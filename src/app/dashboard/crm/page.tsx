'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCrmUsers } from '@/app/actions/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen } from 'lucide-react';

type CrmUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string | Date;
};

export default function CrmPage() {
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    const result = await getCrmUsers();
    if (result.success && result.data) {
      setUsers(result.data as CrmUser[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const alunos = users.filter((u) => u.role === 'aluno' || u.role === 'student' || u.role === 'STUDENT' || u.role === 'ALUNO');
  const professores = users.filter((u) => u.role === 'professor' || u.role === 'teacher' || u.role === 'TEACHER' || u.role === 'PROFESSOR');
  // Fallback: if role buckets don't match precisely, group by non-admin
  const otherRoles = users.filter(
    (u) => !alunos.includes(u) && !professores.includes(u)
  );

  const renderTable = (list: CrmUser[]) => (
    <div className="overflow-y-auto max-h-[320px]">
      <Table>
        <TableHeader className="sticky top-0 bg-white z-10">
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cadastro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-16 text-center text-slate-400 text-sm">
                Nenhum usuário neste grupo.
              </TableCell>
            </TableRow>
          )}
          {list.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-semibold text-slate-900">{user.name}</TableCell>
              <TableCell className="text-slate-600 text-sm">{user.email}</TableCell>
              <TableCell>
                <Badge className={user.status === 'active' ? 'bg-[#FFC107] text-slate-900' : ''}>{user.status}</Badge>
              </TableCell>
              <TableCell className="text-slate-600 text-sm">
                {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CRM</h1>
        <p className="text-sm text-slate-500">Visão geral dos usuários cadastrados na plataforma.</p>
      </div>

      <div className="space-y-0 border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {/* Alunos */}
        <Card className="rounded-none border-x-0 border-t-0 border-b border-slate-200 shadow-none">
          <CardHeader className="border-b border-slate-200 pb-3">
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              Alunos
              <span className="ml-auto text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {loading ? '...' : alunos.length} cadastrados
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-sm text-slate-500">Carregando...</p>
            ) : (
              renderTable(alunos)
            )}
          </CardContent>
        </Card>

        {/* Professores */}
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="border-b border-slate-200 pb-3">
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-500" />
              Professores
              <span className="ml-auto text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {loading ? '...' : professores.length} cadastrados
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-sm text-slate-500">Carregando...</p>
            ) : (
              renderTable(professores)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Outros papéis (se houver) */}
      {!loading && otherRoles.length > 0 && (
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 pb-3">
            <CardTitle className="text-slate-900 flex items-center gap-2">
              Outros usuários
              <span className="ml-auto text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {otherRoles.length} cadastrados
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {renderTable(otherRoles)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}