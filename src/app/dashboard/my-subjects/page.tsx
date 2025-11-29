

'use client';

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { teachers as initialTeachers, scheduleEvents as initialSchedule, getMockUser, subjects } from '@/lib/data';
import { Teacher, User, ScheduleEvent, Subject } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookOpen, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"


interface SubjectWithStats extends Subject {
    classCount: number;
    teachers: Teacher[];
}

export default function MySubjectsPage() {
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

  const mySubjects: SubjectWithStats[] = useMemo(() => {
    if (!currentUser) return [];

    const studentClasses = scheduleEvents.filter(event => event.studentId === currentUser.id && event.status === 'completed');
    
    const subjectStats: Record<string, { classCount: number, teacherIds: Set<string> }> = {};

    studentClasses.forEach(event => {
        // Use subjectId directly if it exists
        const subjectId = event.subjectId;
        if (!subjectId) return; // Skip if no ID

        if (!subjectStats[subjectId]) {
            subjectStats[subjectId] = { classCount: 0, teacherIds: new Set() };
        }
        subjectStats[subjectId].classCount++;
        subjectStats[subjectId].teacherIds.add(event.teacherId);
    });

    return Object.entries(subjectStats).map(([subjectId, stats]) => {
        const subject = subjects.find(s => s.id === subjectId);
        const subjectTeachers = teachers.filter(t => stats.teacherIds.has(t.id));
        return {
            ...(subject as Subject),
            classCount: stats.classCount,
            teachers: subjectTeachers
        };
    }).sort((a, b) => b.classCount - a.classCount);

  }, [currentUser, scheduleEvents, teachers]);


  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">Minhas Disciplinas</h1>
      </div>
      <div className="grid gap-6">
        {mySubjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mySubjects.map((subject) => (
                <Card key={subject.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{subject.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-1">
                            <BookOpen className="h-4 w-4" />
                            {subject.classCount} {subject.classCount > 1 ? 'aulas realizadas' : 'aula realizada'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <h4 className="text-sm font-semibold mb-2">Professores</h4>
                        <div className="flex -space-x-2 overflow-hidden">
                          {subject.teachers.map(teacher => (
                             <HoverCard key={teacher.id}>
                                <HoverCardTrigger asChild>
                                  <Link href={`/dashboard/teacher/${teacher.id}`}>
                                      <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                                          <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                                          <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                   </Link>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <div className="flex justify-between space-x-4">
                                      <Avatar>
                                          <AvatarImage src={teacher.avatarUrl} />
                                          <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div className="space-y-1">
                                          <h4 className="text-sm font-semibold">{teacher.name}</h4>
                                          <p className="text-sm text-muted-foreground">{teacher.bio?.substring(0, 80)}...</p>
                                      </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                          ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
                <p>Você ainda não concluiu nenhuma aula.</p>
                <p>Seu histórico de disciplinas aparecerá aqui assim que você completar sua primeira aula.</p>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/dashboard/booking">Agendar uma aula</Link>
                </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
