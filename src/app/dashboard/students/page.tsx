'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, CalendarCheck, Coins, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// MOTOR DO BANCO
import { getStudents, addCreditsToStudent, createStudent } from '@/app/actions/users';

function StudentList({ id, title, students, onAddCredits }: { id?: string; title: string; students: any[]; onAddCredits: (student: any) => void; }) {
  const router = useRouter();

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="text-center">Créditos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id} 
                    onClick={() => router.push(`/dashboard/student/${student.id}`)}
                    className="cursor-pointer group hover:bg-slate-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarImage src={student.avatarUrl} alt={student.name} />
                          <AvatarFallback className="bg-brand-yellow font-bold text-slate-800">{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-slate-800">{student.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-slate-500">
                      {student.email}
                    </TableCell>
                    <TableCell className="text-center">
                       <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 shadow-sm font-bold px-3 py-1">
                         {student.credits || 0} Créditos
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost" size="icon"
                        className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 mr-1"
                        title="Adicionar Créditos"
                        onClick={(e) => { e.stopPropagation(); onAddCredits(student); }}
                      >
                        <Coins className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="text-slate-400 hover:text-slate-800"
                        title="Enviar Mensagem"
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/chat?contactId=${student.id}`); }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Nenhum aluno encontrado no banco de dados.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AdminStudentsPage() {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  
  const [selectedStudentForCredits, setSelectedStudentForCredits] = useState<any | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState<number>(1);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  
  // ESTADOS DO MODAL DE NOVO ALUNO
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const { toast } = useToast();
  
  const fetchDBStudents = async () => {
    const result = await getStudents();
    if (result.success && result.data) {
        setAllUsers(result.data);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    fetchDBStudents();
  }, []);

  const activeStudents = useMemo(() => allUsers.filter(u => u.status === 'active'), [allUsers]);
  const inactiveStudents = useMemo(() => allUsers.filter(u => u.status === 'inactive'), [allUsers]);

  const submitCredits = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedStudentForCredits || creditsToAdd <= 0) return;
      setIsAddingCredits(true);
      const result = await addCreditsToStudent(selectedStudentForCredits.id, creditsToAdd);
      if (result.success) {
          toast({ title: 'Créditos Adicionados! 💰', description: `${creditsToAdd} aulas injetadas na conta de ${selectedStudentForCredits.name}.` });
          setAllUsers(prev => prev.map(u => u.id === selectedStudentForCredits.id ? { ...u, credits: result.newTotal } : u));
          setSelectedStudentForCredits(null);
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.error });
      }
      setIsAddingCredits(false);
  };

  // CRIAR ALUNO
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createStudent(formData);
    
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Aluno cadastrado com sucesso.' });
        setIsCreateOpen(false);
        setFormData({ name: '', email: '', password: '' });
        fetchDBStudents();
    } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8 max-w-7xl mx-auto w-full p-4">
      <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
           <h1 className="font-headline text-2xl md:text-3xl font-bold text-slate-900">Gestão de Alunos e Créditos</h1>
           <p className="text-slate-500 mt-1">Gerencie os acessos e injete aulas na conta dos alunos pagantes.</p>
        </div>
        
        {/* BOTÃO RESTAURADO */}
        {currentUser?.role === 'admin' && (
          <Button onClick={() => setIsCreateOpen(true)} className="bg-brand-yellow text-slate-900 hover:bg-amber-400 font-bold shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Novo Aluno
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        <StudentList id="active-students" title="Alunos Ativos" students={activeStudents} onAddCredits={(s) => { setSelectedStudentForCredits(s); setCreditsToAdd(1); }} />
      </div>

      {/* MODAL DE CRÉDITOS */}
      <Dialog open={!!selectedStudentForCredits} onOpenChange={(open) => !open && setSelectedStudentForCredits(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl"><Coins className="w-6 h-6 text-brand-yellow" /> Injetar Créditos</DialogTitle>
            <DialogDescription>Quantas aulas deseja adicionar para <strong className="text-slate-800">{selectedStudentForCredits?.name}</strong>?</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCredits} className="grid gap-6 py-4">
            <div className="flex flex-col items-center justify-center p-6 bg-amber-50 rounded-xl border border-amber-100">
               <Label className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3">Quantidade de Aulas</Label>
               <Input type="number" min="1" value={creditsToAdd} onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 0)} className="text-center text-4xl font-black h-20 w-32 border-2 border-brand-yellow focus:ring-brand-yellow shadow-inner bg-white" />
            </div>
            <DialogFooter className="flex gap-2 w-full">
              <Button type="button" variant="outline" onClick={() => setSelectedStudentForCredits(null)} className="w-full">Cancelar</Button>
              <Button type="submit" disabled={isAddingCredits} className="w-full bg-[#25D366] text-white hover:bg-[#1DA851] font-bold shadow-md">{isAddingCredits ? 'Adicionando...' : 'Confirmar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* NOVO MODAL DE CRIAR ALUNO */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
            <DialogDescription>Crie o acesso de um novo aluno manualmente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome Completo</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: João Silva" required />
            </div>
            <div className="grid gap-2">
              <Label>E-mail de Acesso</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="aluno@email.com" required />
            </div>
            <div className="grid gap-2">
              <Label>Senha Temporária</Label>
              <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="******" required />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">{isSubmitting ? 'Salvando...' : 'Salvar Aluno'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}