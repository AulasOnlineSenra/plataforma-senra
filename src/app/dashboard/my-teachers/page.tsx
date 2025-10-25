
'use client';

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
import { teachers as initialTeachers, scheduleEvents as initialSchedule, getMockUser } from '@/lib/data';
import { Teacher, User, ScheduleEvent } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';

function TeacherList({ title, teachers }: { title: string; teachers: Teacher[] }) {
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
                <TableCell className="hidden md:table-cell">
                  {teacher.subjects.join(', ')}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/chat">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Conversar
                    </Link>
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

export default function MyTeachersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(initialSchedule);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);

  useEffect(() => {
    const updateData = () => {
        const loggedInUserStr = localStorage.getItem('currentUser');
        if (loggedInUserStr) {
            setCurrentUser(JSON.parse(loggedInUserStr));
        } else {
            setCurrentUser(getMockUser('student'));
        }

        const storedSchedule = localStorage.getItem('scheduleEvents');
        if (storedSchedule) {
            setScheduleEvents(JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
        } else {
            setScheduleEvents(initialSchedule);
        }
        
        const storedTeachers = localStorage.getItem('teacherList');
        if (storedTeachers) {
            setTeachers(JSON.parse(storedTeachers));
        } else {
            setTeachers(initialTeachers);
        }
    };
    
    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, []);

  const myTeachers = useMemo(() => {
    if (!currentUser) return [];

    const myTeacherIds = [
      ...new Set(
        scheduleEvents
          .filter((event) => event.studentId === currentUser?.id)
          .map((event) => event.teacherId)
      ),
    ];
  
    return teachers.filter((teacher) => myTeacherIds.includes(teacher.id) && teacher.status === 'active');
  }, [currentUser, scheduleEvents, teachers]);


  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">Meus Professores</h1>
      </div>
      <div className="grid gap-6">
        {myTeachers.length > 0 ? (
          <TeacherList title="Professores com aulas agendadas" teachers={myTeachers} />
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Você ainda não tem aulas agendadas com nenhum professor.
              <Button asChild variant="link">
                  <Link href="/dashboard/teachers">Ver todos os professores</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

    