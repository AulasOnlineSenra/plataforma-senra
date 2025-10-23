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
import { teachers } from '@/lib/data';
import { Teacher } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

function TeacherList({ title, teachers }: { title: string, teachers: Teacher[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Professor</TableHead>
                            <TableHead className="hidden sm:table-cell">Email</TableHead>
                            <TableHead className="hidden md:table-cell">Disciplinas</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teachers.map((teacher) => (
                            <TableRow key={teacher.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                                            <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium">{teacher.name}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">{teacher.email}</TableCell>
                                <TableCell className="hidden md:table-cell">{teacher.subjects.join(', ')}</TableCell>
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

export default function TeachersPage() {
    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="flex items-center">
                <h1 className="font-headline text-2xl md:text-3xl">Professores</h1>
            </div>
            <div className="grid gap-6">
                <TeacherList title="Todos os Professores" teachers={teachers} />
            </div>
        </div>
    );
}
