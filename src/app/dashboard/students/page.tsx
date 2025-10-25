
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
import { users as initialUsers } from '@/lib/data';
import { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { StudentDetails } from '@/components/student-details';
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

const USERS_STORAGE_KEY = 'userList';

function StudentList({
  title,
  students,
  onStudentSelect,
  onDeleteStudent,
}: {
  title: string;
  students: User[];
  onStudentSelect: (student: User) => void;
  onDeleteStudent: (student: User) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} className="group">
                <TableCell
                  onClick={() => onStudentSelect(student)}
                  className="cursor-pointer"
                >
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
                  onClick={() => onStudentSelect(student)}
                  className="hidden sm:table-cell cursor-pointer"
                >
                  {student.email}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStudentSelect(student);
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Detalhes</span>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function StudentsPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      setAllUsers(JSON.parse(storedUsers));
    } else {
      setAllUsers(initialUsers);
    }
  }, []);

  const activeStudents = allUsers.filter(
    (u) => u.role === 'student' && u.status === 'active'
  );
  const inactiveStudents = allUsers.filter(
    (u) => u.role === 'student' && u.status === 'inactive'
  );

  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  

  const handleStudentSelect = (student: User) => {
    setSelectedStudent(student);
    setIsSheetOpen(true);
  };

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
          Meus Alunos
        </h1>
      </div>
      <div className="grid gap-6">
        <StudentList
          title="Alunos Ativos"
          students={activeStudents}
          onStudentSelect={handleStudentSelect}
          onDeleteStudent={handleDeleteRequest}
        />
        <StudentList
          title="Alunos Inativos"
          students={inactiveStudents}
          onStudentSelect={handleStudentSelect}
          onDeleteStudent={handleDeleteRequest}
        />
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg w-[90vw] p-0">
          {selectedStudent && <StudentDetails student={selectedStudent} />}
        </SheetContent>
      </Sheet>

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
