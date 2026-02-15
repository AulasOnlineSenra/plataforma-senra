'use client';

import { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, addMinutes, isBefore, startOfToday, getDay, parse, getDaysInMonth, startOfMonth, eachDayOfInterval, endOfMonth, isToday, startOfWeek, endOfWeek, isSameMonth, isValid } from 'date-fns';
import { Plus, Trash2, Repeat, X, AlertTriangle, List, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// DADOS LOCAIS
import { getMockUser, scheduleEvents as initialSchedule, users as initialUsers } from '@/lib/data';

// MOTOR DO BANCO
import { getTeachers } from '@/app/actions/users';

interface Booking {
  id: string;
  subjectId: string;
  teacherId: string;
  studentId: string;
  start: Date;
  end: Date;
  isExperimental?: boolean;
}

type Recurrence = 'none' | 'weekly' | 'biweekly' | 'monthly';
type ViewMode = 'list' | 'calendar';

const CLASS_DURATION_MINUTES = 90;
const PENDING_BOOKINGS_STORAGE_KEY = 'pendingBookings';

function BookingPageComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentIdParam = searchParams.get('studentId');
  const teacherIdParam = searchParams.get('teacherId');
  const studentName = searchParams.get('studentName');
  const pageTitle = studentName ? `Agendar Nova Aula - ${studentName}` : 'Agendar Nova Aula';
  
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>(undefined);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [timezoneDifference, setTimezoneDifference] = useState<string | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<any[]>(initialSchedule);
  const [teachers, setTeachers] = useState<any[]>([]); 
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    
    const loadTeachers = async () => {
        const res = await getTeachers();
        if (res.success && res.data) {
            const defaultAvailability = {
                monday: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
                tuesday: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
                wednesday: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
                thursday: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
                friday: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
                saturday: ['09:00', '10:00', '11:00'],
                sunday: []
            };
            const formattedTeachers = res.data.map(t => ({ ...t, availability: defaultAvailability }));
            setTeachers(formattedTeachers);

            if (teacherIdParam) {
                const teacherFromParam = formattedTeachers.find(t => t.id === teacherIdParam);
                if (teacherFromParam && teacherFromParam.subject) {
                    setSelectedTeacher(teacherIdParam);
                    setSelectedSubject(teacherFromParam.subject);
                }
            }
        }
    };

    loadTeachers();

    const storedSchedule = localStorage.getItem('scheduleEvents');
    if (storedSchedule) {
        setScheduleEvents(JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
    }

    const storedUsers = localStorage.getItem('userList');
    const currentUsers = storedUsers ? JSON.parse(storedUsers) : initialUsers;
    setUsers(currentUsers);
    
    const loggedInUserStr = localStorage.getItem('currentUser');
    let loggedInUser: any = null;
    if (loggedInUserStr) {
        loggedInUser = JSON.parse(loggedInUserStr);
    } else {
        loggedInUser = getMockUser('student');
    }
    
    const studentToBook = studentIdParam ? currentUsers.find((u: any) => u.id === studentIdParam) : loggedInUser;
    setCurrentUser(studentToBook || getMockUser('student'));

    const savedBookings = localStorage.getItem(PENDING_BOOKINGS_STORAGE_KEY);
    if (savedBookings) {
        setBookings(JSON.parse(savedBookings).map((b: any) => ({...b, start: new Date(b.start), end: new Date(b.end)})));
    }

  }, [studentIdParam, teacherIdParam]);
  
  useEffect(() => {
    if (bookings.length > 0) {
        localStorage.setItem(PENDING_BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    } else {
        localStorage.removeItem(PENDING_BOOKINGS_STORAGE_KEY);
    }
  }, [bookings]);

  const availableTeachers = useMemo(() => {
    if (!selectedSubject) return teachers;
    return teachers.filter((t) => t.subject === selectedSubject);
  }, [selectedSubject, teachers]);
  
  const availableSubjects = useMemo(() => {
    if (!selectedTeacher) {
      return Array.from(new Set(teachers.map(t => t.subject).filter(Boolean))) as string[];
    }
    const teacher = teachers.find(t => t.id === selectedTeacher);
    return teacher && teacher.subject ? [teacher.subject] : [];
  }, [selectedTeacher, teachers]);

  const isFirstClassWithTeacher = useMemo(() => {
    const studentToBook = studentIdParam ? users.find(u => u.id === studentIdParam) : currentUser;
    if (!studentToBook || !selectedTeacher) return false;
    const hasPreviousClasses = scheduleEvents.some(
      (event) => event.studentId === studentToBook.id && event.teacherId === selectedTeacher
    );
    return !hasPreviousClasses;
  }, [currentUser, selectedTeacher, scheduleEvents, studentIdParam, users]);

  const isExperimentalOptionAvailable = useMemo(() => {
    return isFirstClassWithTeacher && !bookings.some(b => b.isExperimental);
  }, [isFirstClassWithTeacher, bookings]);

  const handleSubjectChange = (subjectName: string) => {
    setSelectedSubject(subjectName);
    const currentTeacher = teachers.find(t => t.id === selectedTeacher);
    if (currentTeacher && currentTeacher.subject !== subjectName) {
        setSelectedTeacher(undefined);
    }
  };

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacher(teacherId);
    const newTeacher = teachers.find(t => t.id === teacherId);
    if (newTeacher && newTeacher.subject) {
        setSelectedSubject(newTeacher.subject);
    }
  };

  // Lida com a seleção de datas pro Calendário
  const handleDateSelection = (dates: Date[] | undefined) => {
    if (!dates) {
      setSelectedDates([]);
      return;
    }
    if (isExperimentalOptionAvailable) {
      setSelectedDates(dates.length > 0 ? [dates[dates.length - 1]] : []);
    } else {
      setSelectedDates(dates);
    }
  };

  const handleClearSelections = () => {
    setSelectedSubject(undefined);
    setSelectedTeacher(undefined);
    setSelectedDates([]);
    setSelectedTime(undefined);
    setRecurrence('none');
    setBookings([]);
  };

  const isConflict = (newBookingStart: Date, newBookingEnd: Date, studentId: string, teacherId: string): boolean => {
    const activeScheduleEvents = scheduleEvents.filter(event => event.status === 'scheduled');
    return activeScheduleEvents.some(existingBooking => {
      const isTeacherBusy = existingBooking.teacherId === teacherId;
      const isStudentBusy = existingBooking.studentId === studentId;
      if (!isTeacherBusy && !isStudentBusy) return false;
      const existingStarts = new Date(existingBooking.start).getTime();
      const existingEnds = new Date(existingBooking.end).getTime();
      return (newBookingStart.getTime() < existingEnds && newBookingEnd.getTime() > existingStarts);
    });
  }

  const handleAddBooking = () => {
    const studentToBook = studentIdParam ? users.find(u => u.id === studentIdParam) : currentUser;

    if (!selectedSubject || !selectedTeacher || selectedDates.length === 0 || !selectedTime || !studentToBook) {
      toast({ variant: 'destructive', title: 'Campos Incompletos', description: 'Por favor, preencha todos os campos.' });
      return;
    }
    
    const isAddingExperimental = isExperimentalOptionAvailable;

    if (isAddingExperimental && recurrence !== 'none') {
        toast({ variant: 'destructive', title: 'Ação Inválida', description: 'Aulas experimentais não podem ser recorrentes.' });
        return;
    }

    const newBookings: Booking[] = [];
    let conflictFound = false;

    selectedDates.forEach(date => {
        if (conflictFound) return;
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const startDate = new Date(date);
        startDate.setHours(hours, minutes, 0, 0);

        if (isBefore(startDate, startOfToday())) {
            toast({ variant: 'destructive', title: 'Data Inválida', description: `Não agende datas passadas.` });
            conflictFound = true;
            return;
        }

        const endDate = addMinutes(startDate, CLASS_DURATION_MINUTES);
        const bookingConflict = bookings.some(b => 
            (b.teacherId === selectedTeacher || b.studentId === studentToBook.id) &&
            (startDate.getTime() < b.end.getTime() && endDate.getTime() > b.start.getTime())
        );
        
        if (isConflict(startDate, endDate, studentToBook.id, selectedTeacher) || bookingConflict) {
             toast({ variant: 'destructive', title: 'Conflito de Horário', description: `Já existe aula neste horário.` });
            conflictFound = true;
        } else {
             newBookings.push({
                id: `booking-${startDate.getTime()}-${Math.random()}`,
                subjectId: selectedSubject,
                teacherId: selectedTeacher,
                studentId: studentToBook.id,
                isExperimental: isAddingExperimental,
                start: startDate,
                end: endDate,
             });
        }
    });

    if (conflictFound) return; 

    setBookings((prev) => [...prev, ...newBookings].sort((a, b) => a.start.getTime() - b.start.getTime()));
    setSelectedDates([]);
    setSelectedTime(undefined);
    setRecurrence('none');

    toast({ title: 'Aula(s) Adicionada(s)!', description: `${newBookings.length} aula(s) foram adicionadas ao resumo.` });
  };

  const handleRemoveBooking = (id: string) => {
    setBookings(bookings.filter((b) => b.id !== id));
  };

  const handleConfirmAllBookings = useCallback(() => {
    const studentToBook = studentIdParam ? users.find(u => u.id === studentIdParam) : currentUser;
    if (bookings.length === 0 || !studentToBook) return;
    
    const nonExperimentalBookings = bookings.filter(b => !b.isExperimental);
    const experimentalBooking = bookings.find(b => b.isExperimental);
    
    // VERIFICAÇÃO DE CRÉDITOS DO BANCO
    const currentCredits = studentToBook.credits || 0; 

    if (currentCredits < nonExperimentalBookings.length) {
      const creditsNeeded = nonExperimentalBookings.length - currentCredits;
      toast({
        variant: 'destructive',
        title: 'Créditos Insuficientes',
        description: `Você precisa de mais ${creditsNeeded} crédito(s) de aula. Estamos te redirecionando para a compra de pacotes.`,
      });
      localStorage.setItem(PENDING_BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
      router.push(`/dashboard/packages?needed=${creditsNeeded}`);
      return;
    }

    const newScheduleEvents = bookings.map(b => ({
      id: b.id,
      title: `Aula de ${b.subjectId}`,
      start: b.start,
      end: b.end,
      studentId: studentToBook!.id,
      teacherId: b.teacherId,
      subject: b.subjectId,
      status: 'scheduled' as 'scheduled',
      isExperimental: b.isExperimental,
      subjectId: b.subjectId,
    }));
    
    const updatedSchedule = [...scheduleEvents, ...newScheduleEvents];
    localStorage.setItem('scheduleEvents', JSON.stringify(updatedSchedule));
    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Agendamentos Confirmados!',
      description: `Suas ${bookings.length} aulas foram agendadas com sucesso.`,
    });
    setBookings([]);
  }, [bookings, currentUser, scheduleEvents, teachers, users, toast, studentIdParam, router]);

  const getDaySlots = useCallback((dayAvailability: unknown): string[] => {
    if (!Array.isArray(dayAvailability) || dayAvailability.length === 0) return [];
    const slots: string[] = [];
    dayAvailability.forEach((entry) => {
      if (typeof entry === 'string') {
        slots.push(entry);
      }
    });
    return Array.from(new Set(slots)).sort((a, b) => a.localeCompare(b));
  }, []);

  const availableTimes = useMemo(() => {
    const studentToBook = studentIdParam ? users.find(u => u.id === studentIdParam) : currentUser;
    if (!selectedTeacher || selectedDates.length === 0 || !studentToBook) return [];
  
    const teacher = teachers.find(t => t.id === selectedTeacher);
    if (!teacher || !teacher.availability) return [];
  
    const allTimes: { start: string; end: string }[] = [];
  
    (selectedDates || []).forEach(date => {
      const dayOfWeekIndex = getDay(date); 
      const dayOfWeekName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeekIndex] as keyof any;
      const dayAvailability = teacher?.availability?.[dayOfWeekName];
      const daySlots = getDaySlots(dayAvailability);
  
      if (daySlots.length === 0) return;

      daySlots.forEach(slot => {
        const parsedSlot = parse(slot, 'HH:mm', new Date());
        if (!isValid(parsedSlot)) return;

        const slotStart = new Date(date);
        slotStart.setHours(parsedSlot.getHours(), parsedSlot.getMinutes(), 0, 0);
        const slotEnd = addMinutes(slotStart, CLASS_DURATION_MINUTES);

        const existingBookingConflict = bookings.some(b =>
          (b.teacherId === selectedTeacher || b.studentId === studentToBook.id) &&
          (slotStart.getTime() < b.end.getTime() && slotEnd.getTime() > b.start.getTime())
        );

        if (isBefore(slotStart, new Date())) return;

        if (!isConflict(slotStart, slotEnd, studentToBook.id, selectedTeacher) && !existingBookingConflict) {
          allTimes.push({
            start: format(slotStart, 'HH:mm'),
            end: format(slotEnd, 'HH:mm')
          });
        }
      });
    });
  
    const uniqueTimes = Array.from(new Set(allTimes.map(t => t.start))).map(start => {
      return allTimes.find(t => t.start === start)!
    }).sort((a, b) => a.start.localeCompare(b.start));
  
    return uniqueTimes;
  }, [selectedTeacher, selectedDates, teachers, scheduleEvents, bookings, currentUser, studentIdParam, users, getDaySlots]);
  
  const disabledDays = useMemo(() => {
    return [
      { before: startOfToday() },
    ];
  }, [calendarMonth]);
  
  const renderListView = () => (
    bookings.length > 0 ? (
        <div className="space-y-4">
        {bookings
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .map((booking) => {
            const teacher = teachers.find((t) => t.id === booking.teacherId);
            return (
                <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <Label>Disciplina</Label>
                        <div className="flex items-center gap-2">
                           <p className="font-semibold">{booking.subjectId}</p>
                           {booking.isExperimental && <Badge variant="secondary" className="bg-brand-yellow text-black">Experimental</Badge>}
                        </div>
                    </div>
                    <div>
                    <Label>Professor(a)</Label>
                    <p className="font-semibold">{teacher?.name}</p>
                    </div>
                    <div>
                    <Label>Data e Horário</Label>
                    <p className="font-semibold">
                        {format(booking.start, "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - {format(booking.end, 'HH:mm')}
                    </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button variant="destructive" size="icon" onClick={() => handleRemoveBooking(booking.id)} title="Remover agendamento">
                    <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                </div>
            );
            })}
        </div>
    ) : (
        <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma aula adicionada ao resumo ainda.</p>
        </div>
    )
  );

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">{pageTitle}</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Passo 1: Selecione a Disciplina e Professor</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="subject">Disciplina</Label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Escolha uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teacher">Professor(a)</Label>
              <Select value={selectedTeacher} onValueChange={handleTeacherChange} disabled={!selectedSubject}>
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Escolha um(a) professor(a)" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                          <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{teacher.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Passo 2: Escolha as Datas e Horários</CardTitle>
            <CardDescription>A duração de cada aula é de {CLASS_DURATION_MINUTES} minutos.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 items-start">
            <div className="flex justify-center">
              {isClient ? (
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleDateSelection}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  className="rounded-md border p-0 sm:p-3"
                  locale={ptBR}
                  disabled={disabledDays}
                />
              ) : (
                <div className="rounded-md border p-0 sm:p-3 w-full h-[345px] flex items-center justify-center bg-muted/50">Carregando...</div>
              )}
            </div>
            <div className="grid gap-4 self-start">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time.start} variant="outline"
                    onClick={() => setSelectedTime(time.start)}
                    className={cn('text-sm', selectedTime === time.start ? 'bg-brand-yellow text-black hover:bg-brand-yellow/90' : '')}
                    disabled={!selectedTeacher || selectedDates.length === 0}
                  >
                    {time.start} - {time.end}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardContent className="flex flex-col sm:flex-row items-center justify-end pt-4 gap-4">
            <div className="flex gap-2 w-full justify-end">
                <Button variant="ghost" onClick={handleClearSelections}><X className="mr-2" />Limpar</Button>
                <Button onClick={handleAddBooking} className={cn(isExperimentalOptionAvailable ? 'bg-brand-yellow text-black' : 'bg-slate-900 text-white hover:bg-slate-800')}>
                  Adicionar aula <Plus className="ml-2" />
                </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle className="font-headline">Passo 3: Resumo dos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {renderListView()}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleConfirmAllBookings} disabled={bookings.length === 0} className="bg-brand-yellow text-slate-900 font-bold hover:bg-amber-400">
            Confirmar Agendamentos ({bookings.length})
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <BookingPageComponent />
        </Suspense>
    );
}