
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
import { teachers as initialTeachers, scheduleEvents as initialSchedule, getMockUser, subjects } from '@/lib/data';
import { Teacher, User, ScheduleEvent } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronDown, ChevronRight, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo, Fragment } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function TeacherList({ title, teachers, scheduleEvents }: { title: string; teachers: Teacher[], scheduleEvents: ScheduleEvent[] }) {
  const [openTeacherId, setOpenTeacherId] = useState<string | null>(null);

  const getSubjectNames = (subjectIds: string[]) => {
    return subjectIds.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ');
  }
  
  const getEventsForTeacher = (teacherId: string) => {
    return scheduleEvents
        .filter(event => event.teacherId === teacherId && event.status === 'scheduled' && event.start > new Date())
        .sort((a,b) => a.start.getTime() - b.start.getTime());
  }

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
            {teachers.map((teacher) => {
              const teacherEvents = getEventsForTeacher(teacher.id);
              const isCollapsibleOpen = openTeacherId === teacher.id;

              return (
                 <Collapsible asChild key={teacher.id} open={isCollapsibleOpen} onOpenChange={() => setOpenTeacherId(isCollapsibleOpen ? null : teacher.id)}>
                   <Fragment>
                     <TableRow className="align-middle">
                         <CollapsibleTrigger asChild>
                            <TableCell className="cursor-pointer">
                                 <div className="flex items-center gap-3">
                                     <span className="w-[20px]">
                                         {teacherEvents.length > 0 && (
                                             isCollapsibleOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                                         )}
                                     </span>
                                     <Avatar className="h-10 w-10">
                                     <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                                     <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                                     </Avatar>
                                     <div className="font-medium">{teacher.name}</div>
                                 </div>
                            </TableCell>
                         </CollapsibleTrigger>
                         <TableCell className="hidden md:table-cell">
                            {getSubjectNames(teacher.subjects)}
                         </TableCell>
                         <TableCell className="text-right">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/dashboard/chat?contactId=${teacher.id}`}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Conversar
                                </Link>
                            </Button>
                         </TableCell>
                     </TableRow>
                    <CollapsibleContent asChild>
                       <tr className={cn("bg-accent/20", !isCollapsibleOpen && 'hidden')}>
                           <TableCell colSpan={4} className="p-0">
                               <div className="p-4">
                                   <h4 className="font-semibold mb-2 text-sm ml-2">Próximas aulas com {teacher.name}:</h4>
                                   {teacherEvents.length > 0 ? (
                                       <ul className="space-y-2">
                                           {teacherEvents.map(event => (
                                               <li key={event.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50">
                                                   <CalendarClock className="h-5 w-5 text-muted-foreground"/>
                                                   <div className="flex-1 flex justify-between">
                                                       <span className="font-medium">{event.subject}</span>
                                                        <span className="text-muted-foreground">{format(event.start, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                                                   </div>
                                               </li>
                                           ))}
                                       </ul>
                                   ) : (
                                       <p className="text-center text-sm text-muted-foreground py-4">Nenhuma aula futura agendada com este professor.</p>
                                   )}
                               </div>
                           </TableCell>
                       </tr>
                    </CollapsibleContent>
                   </Fragment>
                 </Collapsible>
              )
            })}
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
          <TeacherList title="Professores com aulas agendadas" teachers={myTeachers} scheduleEvents={scheduleEvents} />
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
