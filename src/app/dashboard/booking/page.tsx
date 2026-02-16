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
import { format, addMinutes, isBefore, startOfToday, getDay, parse, isToday, isSameMonth, isValid } from 'date-fns';
import { Plus, Trash2, Repeat, X, AlertTriangle, List, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// NOSSOS MOTORES DO BANCO DE DADOS
import { getStudents, getTeachers, getUserById } from '@/app/actions/users';
import { createBookings, getLessons } from '@/app/actions/bookings';

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
  const [scheduleEvents, setScheduleEvents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]); 
  const [users, setUsers] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // Estado para o botão não ser clicado 2 vezes
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    
    const loadInitialData = async () => {
      const defaultAvailability = {
        monday: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
        tuesday: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
        wednesday: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
        thursday: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
        friday: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
        saturday: ['09:00', '10:00', '11:00'],
        sunday: [],
      };

      const [teachersResult, studentsResult, lessonsResult] = await Promise.all([getTeachers(), getStudents(), getLessons()]);

      if (teachersResult.success && teachersResult.data) {
        const formattedTeachers = teachersResult.data.map((teacher) => ({
          ...teacher,
          availability: defaultAvailability,
        }));
        setTeachers(formattedTeachers);

        if (teacherIdParam) {
          const teacherFromParam = formattedTeachers.find((teacher) => teacher.id === teacherIdParam);
          if (teacherFromParam?.subject) {
            setSelectedTeacher(teacherIdParam);
            setSelectedSubject(teacherFromParam.subject);
          }
        }
      }

      if (studentsResult.success && studentsResult.data) {
        setUsers(studentsResult.data);
      }

      if (lessonsResult.success && lessonsResult.data) {
        setScheduleEvents(
          lessonsResult.data.map((lesson) => ({
            ...lesson,
            start: new Date(lesson.date),
            end: new Date(lesson.endDate),
          }))
        );
      }

      const loggedUserId = localStorage.getItem('userId');
      if (!loggedUserId) return;

      const loggedResult = await getUserById(loggedUserId);
      if (!loggedResult.success || !loggedResult.data) return;

      const loggedInUser = loggedResult.data;
      const studentToBook =
        studentIdParam && studentsResult.success && studentsResult.data
          ? studentsResult.data.find((student) => student.id === studentIdParam)
          : loggedInUser;

      setCurrentUser(studentToBook || loggedInUser);
    };

    loadInitialData();

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

  const handleDateSelection = (dates: Date[] | undefined) => {
    if (dates && dates.length > 0) {
      setSelectedDates([dates[dates.length - 1]]);
    } else {
      setSelectedDates([]);
    }
  };

  useEffect(() => {
    if (!selectedTeacher && selectedDates.length > 1) {
      setSelectedDates([selectedDates[selectedDates.length - 1]]);
    }
  }, [selectedTeacher, selectedDates]);

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

  const handleConfirmAllBookings = useCallback(async () => {
    const studentToBook = studentIdParam ? users.find(u => u.id === studentIdParam) : currentUser;
    if (bookings.length === 0 || !studentToBook) return;
    
    const nonExperimentalBookings = bookings.filter(b => !b.isExperimental);
    const currentCredits = studentToBook.credits || 0; 

    // Bloqueia se o aluno não tiver crédito suficiente na carteira
    if (currentCredits < nonExperimentalBookings.length) {
      const creditsNeeded = nonExperimentalBookings.length - currentCredits;
      toast({
        variant: 'destructive',
        title: 'Créditos Insuficientes',
        description: `Você precisa de mais ${creditsNeeded} crédito(s) de aula. Compre mais pacotes para continuar.`,
      });
      localStorage.setItem(PENDING_BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
      router.push(`/dashboard/packages?needed=${creditsNeeded}`);
      return;
    }

    setIsSubmitting(true);

    // Prepara os dados para o Prisma
    const payload = bookings.map(b => ({
        subjectId: b.subjectId || 'Geral',
        teacherId: b.teacherId,
        start: b.start,
        end: b.end,
        isExperimental: !!b.isExperimental
    }));

    // Dispara a Action do Banco de Dados
    const result = await createBookings(studentToBook.id, payload);

    if (result.success) {
        toast({
          title: 'Aulas Confirmadas! 🎉',
          description: `Seus agendamentos foram salvos e os créditos debitados com sucesso.`,
        });
        
        setBookings([]);
        localStorage.removeItem(PENDING_BOOKINGS_STORAGE_KEY);
        
        // Atualiza a carteira de créditos do aluno visualmente na hora
        if (currentUser?.id === studentToBook.id) {
            const updatedUser = { ...currentUser, credits: currentCredits - nonExperimentalBookings.length };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('storage')); // Dá um refresh na foto do Menu Lateral
        }

        router.push('/dashboard/schedule');
    } else {
        toast({ variant: 'destructive', title: 'Erro ao agendar', description: result.error });
    }
    
    setIsSubmitting(false);

  }, [bookings, currentUser, toast, studentIdParam, router, users]);

  const getDaySlots = useCallback((dayAvailability: unknown): string[] => {
    if (!Array.isArray(dayAvailability) || dayAvailability.length === 0) return [];
    const slots: string[] = [];
    dayAvailability.forEach((entry) => {
      if (typeof entry === 'string') slots.push(entry);
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
                <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4 bg-slate-50">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <Label>Disciplina</Label>
                        <div className="flex items-center gap-2">
                           <p className="font-semibold text-slate-800">{booking.subjectId}</p>
                           {booking.isExperimental && <Badge variant="secondary" className="bg-brand-yellow text-black font-bold">Experimental</Badge>}
                        </div>
                    </div>
                    <div>
                    <Label>Professor(a)</Label>
                    <p className="font-semibold text-slate-800">{teacher?.name}</p>
                    </div>
                    <div>
                    <Label>Data e Horário</Label>
                    <p className="font-semibold text-brand-yellow">
                        {format(booking.start, "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - {format(booking.end, 'HH:mm')}
                    </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button variant="destructive" size="icon" onClick={() => handleRemoveBooking(booking.id)} title="Remover agendamento" className="shadow-sm">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                </div>
            );
            })}
        </div>
    ) : (
        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
            <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-slate-600">Nenhuma aula adicionada ao resumo ainda.</p>
        </div>
    )
  );

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8 w-full max-w-6xl mx-auto">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold text-slate-900">{pageTitle}</h1>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b pb-4">
            <CardTitle className="font-headline text-slate-800">Passo 1: Selecione a Disciplina e Professor</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
            <div className="grid gap-2">
              <Label htmlFor="subject" className="font-bold text-slate-700">Disciplina</Label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger id="subject" className="h-12 border-slate-300">
                  <SelectValue placeholder="Escolha uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject} className="font-medium">{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teacher" className="font-bold text-slate-700">Professor(a)</Label>
              <Select value={selectedTeacher} onValueChange={handleTeacherChange} disabled={!selectedSubject}>
                <SelectTrigger id="teacher" className="h-12 border-slate-300">
                  <SelectValue placeholder="Escolha um(a) professor(a)" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 border">
                          <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                          <AvatarFallback className="bg-brand-yellow font-bold text-xs">{teacher.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{teacher.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b pb-4">
            <CardTitle className="font-headline text-slate-800">Passo 2: Escolha as Datas e Horários</CardTitle>
            <CardDescription className="text-slate-500 font-medium">A duração de cada aula é de {CLASS_DURATION_MINUTES} minutos.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 items-start pt-6">
            <div className="flex justify-center w-full">
              {isClient ? (
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleDateSelection}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  className="rounded-xl border p-0 sm:p-4 w-full bg-white shadow-sm"
                  locale={ptBR}
                  disabled={disabledDays}
                />
              ) : (
                <div className="rounded-md border p-0 sm:p-3 w-full h-[345px] flex items-center justify-center bg-muted/50 animate-pulse">Carregando calendário...</div>
              )}
            </div>
            <div className="grid gap-4 self-start">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableTimes.map((time) => (
                  <Button
                    key={time.start} variant="outline"
                    onClick={() => setSelectedTime(time.start)}
                    className={cn('text-sm h-12 font-bold transition-all', selectedTime === time.start ? 'bg-brand-yellow text-slate-900 hover:bg-amber-400 border-none shadow-md scale-105' : 'text-slate-600 hover:text-slate-900 border-slate-300')}
                    disabled={!selectedTeacher || selectedDates.length === 0}
                  >
                    {time.start} - {time.end}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardContent className="flex flex-col sm:flex-row items-center justify-end pt-2 pb-6 gap-4">
            <div className="flex gap-3 w-full justify-end">
                <Button variant="outline" onClick={handleClearSelections} className="h-12 px-6 font-bold text-slate-600"><X className="mr-2 h-5 w-5" />Limpar</Button>
                <Button onClick={handleAddBooking} className={cn('h-12 px-8 font-bold shadow-md text-base transition-transform hover:scale-105', isExperimentalOptionAvailable ? 'bg-brand-yellow text-slate-900 hover:bg-amber-400' : 'bg-slate-900 text-white hover:bg-slate-800')}>
                  Adicionar aula <Plus className="ml-2 h-5 w-5" />
                </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b pb-4">
             <CardTitle className="font-headline text-slate-800">Passo 3: Resumo dos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {renderListView()}
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4 pb-12">
          <Button size="lg" disabled={bookings.length === 0 || isSubmitting} onClick={handleConfirmAllBookings} className="h-14 px-10 text-lg bg-brand-yellow text-slate-900 font-bold hover:bg-amber-400 shadow-lg hover:-translate-y-1 transition-all">
            {isSubmitting ? 'Salvando no Banco...' : `Confirmar Agendamentos (${bookings.length})`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="flex h-[50vh] w-full items-center justify-center animate-pulse">Carregando sistema de agendamento...</div>}>
            <BookingPageComponent />
        </Suspense>
    );
}
