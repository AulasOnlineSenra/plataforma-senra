

'use client';

import { useState, useEffect } from 'react';
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
import { users as initialUsers, scheduleEvents as initialSchedule } from '@/lib/data';
import { User, ScheduleEvent } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Trash2, CalendarCheck } from 'lucide-react';
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
  const { toast } = useToast();
  
  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      setAllUsers(JSON.parse(storedUsers));
    } else {
      setAllUsers(initialUsers);
    }
    
    const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (storedSchedule) {
      setScheduleEvents(JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
    } else {
      setScheduleEvents(initialSchedule);
    }
  }, []);

  const activeStudents = allUsers.filter(
    (u) => u.role === 'student' && u.status === 'active'
  );
  const inactiveStudents = allUsers.filter(
    (u) => u.role === 'student' && u.status === 'inactive'
  );

  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
  

  const handleDeleteRequest = (student: User) => {
    setStudentToDelete(student);
  };

  const handleDeleteStudent = () => {
    if (!studentToDelete) return;
    const updatedUsers = allUsers.filter((user) => user.id !== studentToDelete.id);
    setAllUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Aluno Excluído',
      description: `O perfil de ${studentToDelete.name} foi removido.`,
    });
    setStudentToDelete(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Gerenciar Alunos
        </h1>
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
              removerá seus dados de nossos servidores.
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
