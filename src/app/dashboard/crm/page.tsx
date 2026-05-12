'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCrmUsers } from '@/app/actions/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3 } from 'lucide-react';
import CrmComercial from './crm-comercial';
import AnalyticsDashboard from '@/components/crm/analytics-dashboard';
import AutomationRules from '@/components/crm/automation-rules';

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
  const [crmType, setCrmType] = useState<string>('comercial');

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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex justify-end">
        <Select value={crmType} onValueChange={setCrmType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="comercial">CRM Comercial</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="automations">Automações</SelectItem>
            <SelectItem value="administrativo">Administrativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {crmType === 'administrativo' ? (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-slate-500">
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : crmType === 'analytics' ? (
        <AnalyticsDashboard />
      ) : crmType === 'automations' ? (
        <AutomationRules />
      ) : (
        <CrmComercial />
      )}
    </div>
  );
}