
'use client';

import { useState } from 'react';
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
import { users } from '@/lib/data';
import { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { StudentDetails } from '@/components/student-details';

function StudentList({ title, students, onStudentSelect }: { title: string, students: User[], onStudentSelect: (student: User) => void }) {
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
                            <TableRow key={student.id} onClick={() => onStudentSelect(student)} className="cursor-pointer">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={student.avatarUrl} alt={student.name} />
                                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium">{student.name}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">{student.email}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Ações</span>
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
    const allStudents = users.filter(u => u.role === 'student');
    const activeStudents = allStudents.filter(s => s.status === 'active');
    const inactiveStudents = allStudents.filter(s => s.status === 'inactive');
    
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleStudentSelect = (student: User) => {
        setSelectedStudent(student);
        setIsSheetOpen(true);
    };

    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="flex items-center">
                <h1 className="font-headline text-2xl md:text-3xl font-bold">Meus Alunos</h1>
            </div>
            <div className="grid gap-6">
                <StudentList title="Alunos Ativos" students={activeStudents} onStudentSelect={handleStudentSelect} />
                <StudentList title="Alunos Inativos" students={inactiveStudents} onStudentSelect={handleStudentSelect} />
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-lg w-[90vw] p-0">
                    {selectedStudent && <StudentDetails student={selectedStudent} />}
                </SheetContent>
            </Sheet>
        </div>
    );
}
