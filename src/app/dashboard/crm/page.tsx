'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users2, GraduationCap } from 'lucide-react';
import { getCrmUsers, promoteToTeacherAction } from '@/app/actions/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
  const [promoting, setPromoting] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handlePromote = async (userId: string) => {
    setPromoting(userId);
    const result = await promoteToTeacherAction(userId);
    
    if (result.success) {
      toast({ title: "Sucesso!", description: "Usuário promovido a Professor com sucesso!", className: "bg-green-600 text-white" });
      await loadUsers(); // Recarrega a lista para mostrar o novo cargo
    } else {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível promover o usuário." });
    }
    setPromoting(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card className="rounded-3xl border-slate-200 bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-50">
            <Users2 className="h-5 w-5 text-[#FFC107]" />
            CRM Senra
          </CardTitle>
          <CardDescription className="text-slate-300">
            Base premium de usuários para operação administrativa.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-slate-900">Usuários cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Carregando usuários...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-semibold text-slate-900">{user.name}</TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.status === 'active' ? 'bg-[#FFC107] text-slate-900' : ''}>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role === 'student' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePromote(user.id)}
                          disabled={promoting === user.id}
                          className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <GraduationCap className="w-4 h-4 mr-2" />
                          {promoting === user.id ? 'Promovendo...' : 'Virar Professor'}
                        </Button>
                      )}
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