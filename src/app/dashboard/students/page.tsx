'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Trash2, CalendarCheck, Plus, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { ScheduleEvent } from '@/lib/types';

// IMPORTANDO NOSSO MOTOR DO BANCO
import { getStudents, addCreditsToStudent } from '@/app/actions/users';

const SCHEDULE_STORAGE_KEY = 'scheduleEvents';

function StudentList({
  id,
  title,
  students,
  scheduleEvents,
  onAddCredits,
  teacherId,
}: {
  id?: string;
  title: string;
  students: any[];
  scheduleEvents: ScheduleEvent[];
  onAddCredits: (student: any) => void;
  teacherId?: string;
}) {
  const router = useRouter();

  const getScheduledClassesCount = (studentId: string) => {
    return scheduleEvents.filter(
      (event) => {
        const isStudentMatch = event.studentId === studentId;
        const isScheduled = event.status === 'scheduled';
        const isTeacherMatch = teacherId ? event.teacherId === teacherId : true;
        return isStudentMatch && isScheduled && isTeacherMatch;
      }
    ).length;
  };

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
              <TableHead className="text-center hidden lg:table-cell">Aulas Agendadas</TableHead>
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
                    <TableCell className="text-center hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <CalendarCheck className="h-4 w-4 text-slate-400" />
                        <span className="font-bold text-slate-700">{getScheduledClassesCount(student.id)}</span>
                      </div>
                    </TableCell>
                    
                    {/* COLUNA DE CRÉDITOS */}
                    <TableCell className="text-center">
                       <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 shadow-sm font-bold px-3 py-1">
                         {student.credits || 0} Créditos
                       </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {/* BOTÃO ADICIONAR CRÉDITOS */}
                      <Button
                        variant="ghost" size="icon"
                        className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 mr-1"
                        title="Adicionar Créditos"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddCredits(student);
                        }}
                      >
                        <Coins className="h-5 w-5" />
                        <span className="sr-only">Adicionar Créditos</span>
                      </Button>

                      <Button
                        variant="ghost" size="icon"
                        className="text-slate-400 hover:text-slate-800"
                        title="Enviar Mensagem"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/chat?contactId=${student.id}`);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  
  // Estados para o Modal de Créditos
  const [selectedStudentForCredits, setSelectedStudentForCredits] = useState<any | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState<number>(1);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  
  useEffect(() => {
    // Carrega o usuário atual
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));

    // Carrega os alunos reais do Banco de Dados
    const fetchDBStudents = async () => {
        const result = await getStudents();
        if (result.success && result.data) {
            setAllUsers(result.data);
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível buscar alunos.' });
        }
    };
    fetchDBStudents();

    // Mantém a agenda local por enquanto (até migrarmos)
    const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (storedSchedule) {
        setScheduleEvents(JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
    }
  }, []);

  const { activeStudents, inactiveStudents, pageTitle } = useMemo(() => {
    if (currentUser?.role === 'teacher') {
      const myStudentIds = new Set(scheduleEvents.filter(event => event.teacherId === currentUser.id).map(event => event.studentId));
      const myStudents = allUsers.filter(user => myStudentIds.has(user.id));
      
      return {
        activeStudents: myStudents.filter(s => s.status === 'active'),
        inactiveStudents: myStudents.filter(s => s.status === 'inactive'),
        pageTitle: 'Meus Alunos',
      };
    }

    return {
      activeStudents: allUsers.filter(u => u.status === 'active'),
      inactiveStudents: allUsers.filter(u => u.status === 'inactive'),
      pageTitle: 'Gestão de Alunos e Créditos',
    };
  }, [currentUser, allUsers, scheduleEvents]);


  // Função para abrir o Modal de Créditos
  const handleOpenCreditModal = (student: any) => {
    setSelectedStudentForCredits(student);
    setCreditsToAdd(1);
  };

  // Função que envia os créditos pro banco de dados
  const submitCredits = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedStudentForCredits || creditsToAdd <= 0) return;

      setIsAddingCredits(true);
      const result = await addCreditsToStudent(selectedStudentForCredits.id, creditsToAdd);

      if (result.success) {
          toast({ title: 'Créditos Adicionados! 💰', description: `${creditsToAdd} aulas foram injetadas na conta de ${selectedStudentForCredits.name}.` });
          
          // Atualiza a tela localmente para o Cleyton ver na hora
          setAllUsers(prev => prev.map(u => u.id === selectedStudentForCredits.id ? { ...u, credits: result.newTotal } : u));
          setSelectedStudentForCredits(null);
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.error });
      }
      setIsAddingCredits(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8 max-w-7xl mx-auto w-full p-4">
      <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
           <h1 className="font-headline text-2xl md:text-3xl font-bold text-slate-900">{pageTitle}</h1>
           <p className="text-slate-500 mt-1">Gerencie os acessos e injete aulas na conta dos alunos pagantes.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <StudentList
          id="active-students"
          title="Alunos Ativos"
          students={activeStudents}
          scheduleEvents={scheduleEvents}
          onAddCredits={handleOpenCreditModal}
          teacherId={currentUser?.role === 'teacher' ? currentUser.id : undefined}
        />
      </div>

      {/* JANELA MODAL PARA ADICIONAR CRÉDITOS */}
      <Dialog open={!!selectedStudentForCredits} onOpenChange={(open) => !open && setSelectedStudentForCredits(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
               <Coins className="w-6 h-6 text-brand-yellow" /> Injetar Créditos
            </DialogTitle>
            <DialogDescription>
              Quantas aulas você deseja adicionar na conta de <strong className="text-slate-800">{selectedStudentForCredits?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCredits} className="grid gap-6 py-4">
            
            <div className="flex flex-col items-center justify-center p-6 bg-amber-50 rounded-xl border border-amber-100">
               <Label htmlFor="credits-input" className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3">Quantidade de Aulas</Label>
               <Input
                 id="credits-input" type="number" min="1"
                 value={creditsToAdd}
                 onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 0)}
                 className="text-center text-4xl font-black h-20 w-32 border-2 border-brand-yellow focus:ring-brand-yellow shadow-inner bg-white"
               />
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between w-full">
              <Button type="button" variant="outline" onClick={() => setSelectedStudentForCredits(null)} className="w-full">Cancelar</Button>
              <Button type="submit" disabled={isAddingCredits} className="w-full bg-[#25D366] text-white hover:bg-[#1DA851] font-bold shadow-md">
                {isAddingCredits ? 'Adicionando...' : 'Confirmar e Liberar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}