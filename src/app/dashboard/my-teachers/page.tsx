
'use client';

import {
  Card,
} from '@/components/ui/card';
import { teachers as initialTeachers, scheduleEvents as initialSchedule, getMockUser, subjects } from '@/lib/data';
import { Teacher, User, ScheduleEvent } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

function TeacherList({ teachers, scheduleEvents }: { teachers: Teacher[], scheduleEvents: ScheduleEvent[] }) {
  const router = useRouter();

  const getSubjectNames = (subjectIds: string[]) => {
    return subjectIds.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ');
  }
  
  const hasUpcomingEvents = (teacherId: string) => {
    return scheduleEvents.some(event => event.teacherId === teacherId && event.status === 'scheduled' && event.start > new Date());
  }

  return (
    <div className="space-y-4">
      {teachers.map((teacher) => (
          <Card 
            key={teacher.id} 
            className="transition-all hover:ring-2 hover:ring-brand-yellow cursor-pointer group"
            onClick={() => router.push(`/dashboard/teacher/${teacher.id}`)}
          >
              <div className="flex items-center p-4">
                  <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                          <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                          <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                          <p className="font-semibold text-lg">{teacher.name}</p>
                          <p className="text-sm text-muted-foreground">{getSubjectNames(teacher.subjects)}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/dashboard/chat?contactId=${teacher.id}`}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Conversar
                          </Link>
                      </Button>
                      {hasUpcomingEvents(teacher.id) && (
                          <Button asChild variant="secondary" size="sm" onClick={(e) => e.stopPropagation()}>
                              <Link href={`/dashboard/schedule?teacherId=${teacher.id}`}>
                                  <CalendarClock className="mr-2 h-4 w-4" />
                                  Ver Aulas
                              </Link>
                          </Button>
                      )}
                  </div>
              </div>
          </Card>
      ))}
    </div>
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
          <TeacherList teachers={myTeachers} scheduleEvents={scheduleEvents} />
        ) : (
          <Card>
            <CardHeader>
                <CardContent className="p-6 text-center text-muted-foreground">
                Você ainda não tem aulas agendadas com nenhum professor.
                <Button asChild variant="link">
                    <Link href="/dashboard/teachers">Ver todos os professores</Link>
                </Button>
                </CardContent>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
