

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { users as initialUsers, scheduleEvents as initialSchedule, getMockUser } from '@/lib/data';
import { User, ScheduleEvent, UserRole, Teacher } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Trash2, CalendarCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const USERS_STORAGE_KEY = 'userList';
const SCHEDULE_STORAGE_KEY = 'scheduleEvents';

function StudentList({
  id,
  title,
  students,
  scheduleEvents,
  onDeleteStudent,
  teacherId,
}: {
  id?: string;
  title: string;
  students: User[];
  scheduleEvents: ScheduleEvent[];
  onDeleteStudent: (student: User) => void;
  teacherId?: string;
}) {
  const router = useRouter();

  const getScheduledClassesCount = (studentId: string) => {
    return scheduleEvents.filter(
      (event) => {
        const isStudentMatch = event.studentId === studentId;
        const isScheduled = event.status === 'scheduled';
        // If teacherId is provided, also filter by teacher
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
              <TableHead className="hidden md:table-cell">Último Acesso</TableHead>
              <TableHead className="text-center hidden lg:table-cell">Aulas Agendadas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id} 
                    onClick={() => router.push(`/dashboard/student/${student.id}`)}
                    className="cursor-pointer group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={student.avatarUrl}
                            alt={student.name}
                          />
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{student.name}</div>
                      </div>
                    </TableCell>
                    <TableCell
                      className="hidden sm:table-cell"
                    >
                      {student.email}
                    </TableCell>
                     <TableCell
                      className="hidden md:table-cell text-muted-foreground"
                    >
                      {student.lastAccess ? format(new Date(student.lastAccess), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{getScheduledClassesCount(student.id)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/chat?contactId=${student.id}`);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="sr-only">Enviar Mensagem</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteStudent(student);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum aluno nesta categoria.
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | Teacher | null>(null);
  
  useEffect(() => {
    const updateData = () => {
        const role = localStorage.getItem('userRole') as UserRole | null;
        if (role) {
            const storedUser = localStorage.getItem('currentUser');
            setCurrentUser(storedUser ? JSON.parse(storedUser) : getMockUser(role));
        }

        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        setAllUsers(storedUsers ? JSON.parse(storedUsers) : initialUsers);
        
        const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        setScheduleEvents(storedSchedule ? JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })) : initialSchedule);
    };

    updateData();

    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, []);

  const { activeStudents, inactiveStudents, pageTitle } = useMemo(() => {
    if (currentUser?.role === 'teacher') {
      const myStudentIds = new Set(
        scheduleEvents
          .filter(event => event.teacherId === currentUser.id)
          .map(event => event.studentId)
      );

      const myStudents = allUsers.filter(user => user.role === 'student' && myStudentIds.has(user.id));
      
      return {
        activeStudents: myStudents.filter(s => s.status === 'active'),
        inactiveStudents: myStudents.filter(s => s.status === 'inactive'),
        pageTitle: 'Meus Alunos',
      };
    }

    // Default admin view
    return {
      activeStudents: allUsers.filter(u => u.role === 'student' && u.status === 'active'),
      inactiveStudents: allUsers.filter(u => u.role === 'student' && u.status === 'inactive'),
      pageTitle: 'Gerenciar Alunos',
    };
  }, [currentUser, allUsers, scheduleEvents]);


  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
  

  const handleDeleteRequest = (student: User) => {
    setStudentToDelete(student);
  };

  const handleDeleteStudent = () => {
    if (!studentToDelete) return;
    
    // Cancel future classes for the student being deleted
    const updatedSchedule = scheduleEvents.map(event => {
      if (event.studentId === studentToDelete.id && event.status === 'scheduled') {
        return { ...event, status: 'cancelled' as const };
      }
      return event;
    });
    setScheduleEvents(updatedSchedule);
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updatedSchedule));
    
    // Remove user
    const updatedUsers = allUsers.filter((user) => user.id !== studentToDelete.id);
    setAllUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Aluno Excluído',
      description: `O perfil de ${studentToDelete.name} foi removido e suas aulas futuras foram canceladas.`,
    });
    setStudentToDelete(null);
  };

  const handleCreateStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = newStudentEmail.trim().toLowerCase();
    const trimmedName = newStudentName.trim();

    if (!trimmedName || !normalizedEmail || !newStudentPassword.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha nome, email e senha para cadastrar o aluno.',
      });
      return;
    }

    const emailAlreadyExists = allUsers.some(
      (user) => user.email.toLowerCase() === normalizedEmail
    );

    if (emailAlreadyExists) {
      toast({
        variant: 'destructive',
        title: 'Email já cadastrado',
        description: 'Já existe um usuário com esse email.',
      });
      return;
    }

    const newStudentId = `user-${Date.now()}`;
    const newStudent: User = {
      id: newStudentId,
      name: trimmedName,
      email: normalizedEmail,
      avatarUrl: `https://picsum.photos/seed/${newStudentId}/200/200`,
      role: 'student',
      status: 'active',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      classCredits: 0,
      activePackage: 'Nenhum pacote ativo',
      ratings: [],
      lastAccess: new Date().toISOString(),
    };

    const updatedUsers = [...allUsers, newStudent];
    setAllUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    localStorage.setItem(`savedPassword-${normalizedEmail}`, newStudentPassword);
    window.dispatchEvent(new Event('storage'));

    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentPassword('');
    setIsCreateStudentOpen(false);

    toast({
      title: 'Aluno criado com sucesso',
      description: `${newStudent.name} foi cadastrado(a) como aluno(a).`,
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          {pageTitle}
        </h1>
        {currentUser?.role === 'admin' && (
          <Button onClick={() => setIsCreateStudentOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Aluno
          </Button>
        )}
      </div>
      <div className="grid gap-6">
        <StudentList
          id="active-students"
          title="Alunos Ativos"
          students={activeStudents}
          scheduleEvents={scheduleEvents}
          onDeleteStudent={handleDeleteRequest}
          teacherId={currentUser?.role === 'teacher' ? currentUser.id : undefined}
        />
        <StudentList
          title="Alunos Inativos"
          students={inactiveStudents}
          scheduleEvents={scheduleEvents}
          onDeleteStudent={handleDeleteRequest}
          teacherId={currentUser?.role === 'teacher' ? currentUser.id : undefined}
        />
      </div>

      <Dialog open={isCreateStudentOpen} onOpenChange={setIsCreateStudentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastro Interno de Aluno</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo aluno manualmente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStudent} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="student-name">Nome</Label>
              <Input
                id="student-name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                placeholder="aluno@email.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="student-password">Senha</Label>
              <Input
                id="student-password"
                type="password"
                value={newStudentPassword}
                onChange={(e) => setNewStudentPassword(e.target.value)}
                placeholder="Defina uma senha"
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">Salvar Aluno</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!studentToDelete}
        onOpenChange={() => setStudentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              perfil de{' '}
              <span className="font-bold">{studentToDelete?.name}</span> e
              removerá seus dados de nossos servidores. Todas as suas aulas futuras serão canceladas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
