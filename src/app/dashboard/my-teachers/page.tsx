
'use client';

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { teachers as initialTeachers, scheduleEvents as initialSchedule, getMockUser, subjects } from '@/lib/data';
import { Teacher, User, ScheduleEvent } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronDown, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function TeacherList({ teachers, scheduleEvents }: { teachers: Teacher[], scheduleEvents: ScheduleEvent[] }) {

  const getSubjectNames = (subjectIds: string[]) => {
    return subjectIds.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ');
  }
  
  const getEventsForTeacher = (teacherId: string) => {
    return scheduleEvents
        .filter(event => event.teacherId === teacherId && event.status === 'scheduled' && event.start > new Date())
        .sort((a,b) => a.start.getTime() - b.start.getTime());
  }

  return (
    <div className="space-y-4">
      {teachers.map((teacher) => {
        const teacherEvents = getEventsForTeacher(teacher.id);

        return (
          <Collapsible key={teacher.id} asChild>
             <Card>
                <CollapsibleTrigger asChild>
                    <div className="flex items-center p-4 cursor-pointer hover:bg-accent/50 rounded-t-lg">
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
                            {teacherEvents.length > 0 && (
                                <Button variant="ghost" size="icon" className="data-[state=open]:rotate-180 transition-transform">
                                    <ChevronDown className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CollapsibleTrigger>
              <CollapsibleContent>
                 <CardContent className="p-4 border-t">
                     <h4 className="font-semibold mb-3 text-sm ml-2">Próximas aulas com {teacher.name}:</h4>
                     {teacherEvents.length > 0 ? (
                         <ul className="space-y-2">
                             {teacherEvents.map(event => (
                                 <li key={event.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50">
                                     <CalendarClock className="h-5 w-5 text-muted-foreground"/>
                                     <div className="flex-1 flex flex-col sm:flex-row justify-between">
                                         <span className="font-medium">{event.subject}</span>
                                          <span className="text-muted-foreground">{format(event.start, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                                     </div>
                                 </li>
                             ))}
                         </ul>
                     ) : (
                         <p className="text-center text-sm text-muted-foreground py-4">Nenhuma aula futura agendada com este professor.</p>
                     )}
                 </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )
      })}
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
