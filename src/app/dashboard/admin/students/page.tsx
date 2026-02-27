'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
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
import { ScheduleEvent, User, UserRole } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarCheck, MessageSquare, MoreHorizontal, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const USERS_STORAGE_KEY = 'userList';
const SCHEDULE_STORAGE_KEY = 'scheduleEvents';

function StudentList({
  id,
  title,
  students,
  scheduleEvents,
  onDeleteStudent,
}: {
  id?: string;
  title: string;
  students: User[];
  scheduleEvents: ScheduleEvent[];
  onDeleteStudent: (student: User) => void;
}) {
  const router = useRouter();

  const getScheduledClassesCount = (studentId: string) => {
    return scheduleEvents.filter(
      (event) => event.studentId === studentId && event.status === 'scheduled'
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
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Último Acesso</TableHead>
              <TableHead className="text-center">Aulas Agendadas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/student/${student.id}`}
                      className="inline-flex"
                      aria-label={`Abrir perfil de ${student.name}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatarUrl} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/student/${student.id}`}
                      className="font-medium transition-colors hover:text-brand-yellow"
                    >
                      {student.name}
                    </Link>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.lastAccess
                      ? format(new Date(student.lastAccess), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
                      : 'Nunca'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{getScheduledClassesCount(student.id)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Ações para ${student.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/student/${student.id}`)}>
                          <Wallet className="mr-2 h-4 w-4" />
                          Adicionar créditos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/chat?contactId=${student.id}`)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDeleteStudent(student)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir perfil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
      setScheduleEvents(
        storedSchedule
          ? JSON.parse(storedSchedule).map((event: any) => ({
              ...event,
              start: new Date(event.start),
              end: new Date(event.end),
            }))
          : initialSchedule
      );
    };

    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, []);

  const { activeStudents, inactiveStudents, pageTitle } = useMemo(() => {
    if (currentUser?.role === 'teacher') {
      const myStudentIds = new Set(
        scheduleEvents
          .filter((event) => event.teacherId === currentUser.id)
          .map((event) => event.studentId)
      );

      const myStudents = allUsers.filter(
        (user) => user.role === 'student' && myStudentIds.has(user.id)
      );

      return {
        activeStudents: myStudents.filter((student) => student.status === 'active'),
        inactiveStudents: myStudents.filter((student) => student.status === 'inactive'),
        pageTitle: 'Meus Alunos',
      };
    }

    return {
      activeStudents: allUsers.filter((user) => user.role === 'student' && user.status === 'active'),
      inactiveStudents: allUsers.filter((user) => user.role === 'student' && user.status === 'inactive'),
      pageTitle: 'Gerenciar Alunos',
    };
  }, [allUsers, currentUser, scheduleEvents]);

  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);

  const handleDeleteRequest = (student: User) => {
    setStudentToDelete(student);
  };

  const handleDeleteStudent = () => {
    if (!studentToDelete) return;

    const updatedSchedule = scheduleEvents.map((event) => {
      if (event.studentId === studentToDelete.id && event.status === 'scheduled') {
        return { ...event, status: 'cancelled' as const };
      }
      return event;
    });
    setScheduleEvents(updatedSchedule);
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updatedSchedule));

    const updatedUsers = allUsers.filter((user) => user.id !== studentToDelete.id);
    setAllUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Aluno Excluido',
      description: `O perfil de ${studentToDelete.name} foi removido e suas aulas futuras foram canceladas.`,
    });
    setStudentToDelete(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl font-bold md:text-3xl">{pageTitle}</h1>
      </div>
      <div className="grid gap-6">
        <StudentList
          id="active-students"
          title="Alunos Ativos"
          students={activeStudents}
          scheduleEvents={scheduleEvents}
          onDeleteStudent={handleDeleteRequest}
        />
        <StudentList
          title="Alunos Inativos"
          students={inactiveStudents}
          scheduleEvents={scheduleEvents}
          onDeleteStudent={handleDeleteRequest}
        />
      </div>

      <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voce tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. Isso excluira permanentemente o perfil de{' '}
              <span className="font-bold">{studentToDelete?.name}</span> e removera seus dados de
              nossos servidores. Todas as suas aulas futuras serao canceladas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
