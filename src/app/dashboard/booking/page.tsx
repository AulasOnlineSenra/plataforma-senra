

'use client';

import { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { subjects as initialSubjects, teachers as initialTeachers, getMockUser, scheduleEvents as initialSchedule, users as initialUsers, chatContacts as initialChatContacts, chatMessages as initialChatMessages, logActivity, logNotification } from '@/lib/data';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, addMinutes, isBefore, startOfToday, getDay, setHours, setMinutes, parse, getDaysInMonth, startOfMonth, eachDayOfInterval, endOfMonth, isToday, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { Plus, Trash2, Repeat, X, AlertTriangle, List, Calendar as CalendarIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User, Teacher, ScheduleEvent, Subject, ChatMessage, ChatContact } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';


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
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>(undefined);
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [isExperimental, setIsExperimental] = useState(false);
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [timezoneDifference, setTimezoneDifference] = useState<string | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(initialSchedule);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [allUsers, setAllUsers] = useState<(User | Teacher)[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    setIsClient(true);
  }, []);


  const { toast } = useToast();
  
  useEffect(() => {
    const updateData = () => {
        const storedSchedule = localStorage.getItem('scheduleEvents');
        if (storedSchedule) {
            setScheduleEvents(JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
        } else {
            setScheduleEvents(initialSchedule);
        }

        const storedTeachers = localStorage.getItem('teacherList');
        let currentTeachers: Teacher[] = [];
        if (storedTeachers) {
            currentTeachers = JSON.parse(storedTeachers);
            setTeachers(currentTeachers);
        } else {
            currentTeachers = initialTeachers;
            setTeachers(initialTeachers);
        }

        const storedUsers = localStorage.getItem('userList');
        const currentUsers = storedUsers ? JSON.parse(storedUsers) : initialUsers;
        setUsers(currentUsers);
        
        setAllUsers([...currentUsers, ...currentTeachers]);
        
        const loggedInUserStr = localStorage.getItem('currentUser');
        let loggedInUser: User | null = null;
        if (loggedInUserStr) {
            loggedInUser = JSON.parse(loggedInUserStr);
        } else {
            loggedInUser = getMockUser('student');
        }
        
        const studentToBook = studentIdParam ? currentUsers.find((u: User) => u.id === studentIdParam) : loggedInUser;
        setCurrentUser(studentToBook || getMockUser('student'));


        if (teacherIdParam) {
            const teacherFromParam = currentTeachers.find(t => t.id === teacherIdParam);
            if (teacherFromParam && teacherFromParam.subjects.length > 0) {
                setSelectedTeacher(teacherIdParam);
                setSelectedSubject(teacherFromParam.subjects[0]);
            }
        }
        
        const savedBookings = localStorage.getItem(PENDING_BOOKINGS_STORAGE_KEY);
        if (savedBookings) {
            setBookings(JSON.parse(savedBookings).map((b: any) => ({...b, start: new Date(b.start), end: new Date(b.end)})));
        }

    };

    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, [studentIdParam, teacherIdParam]);
  
  useEffect(() => {
    if (bookings.length > 0) {
        localStorage.setItem(PENDING_BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    } else {
        localStorage.removeItem(PENDING_BOOKINGS_STORAGE_KEY);
    }
  }, [bookings]);


  const availableTeachers = useMemo(() => {
    if (!selectedSubject) {
      return teachers.filter(t => t.status === 'active');
    }
    return teachers.filter((t) => t.subjects.includes(selectedSubject) && t.status === 'active');
  }, [selectedSubject, teachers]);

  const isFirstClassWithTeacher = useMemo(() => {
    const studentToBook = studentIdParam ? users.find(u => u.id === studentIdParam) : currentUser;
    if (!studentToBook || !selectedTeacher) {
      return false;
    }
    const hasPreviousClasses = scheduleEvents.some(
      (event) =>
        event.studentId === studentToBook.id &&
        event.teacherId === selectedTeacher
    );
    return !hasPreviousClasses;
  }, [currentUser, selectedTeacher, scheduleEvents, studentIdParam, users]);


  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    // If the currently selected teacher doesn't teach this subject, deselect them
    const currentTeacher = teachers.find(t => t.id === selectedTeacher);
    if (currentTeacher && !currentTeacher.subjects.includes(subjectId)) {
        setSelectedTeacher(undefined);
    }
  };

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacher(teacherId);
  };

  const handleClearSelections = () => {
    setSelectedSubject(undefined);
    setSelectedTeacher(undefined);
    setSelectedDates([]);
    setSelectedTime(undefined);
    setRecurrence('none');
    setBookings([]);
    setIsExperimental(false);
  };

  const isConflict = (newBookingStart: Date, newBookingEnd: Date, studentId: string, teacherId: string): boolean => {
    const activeScheduleEvents = scheduleEvents.filter(event => event.status === 'scheduled');

    return activeScheduleEvents.some(existingBooking => {
      const isTeacherBusy = existingBooking.teacherId === teacherId;
      const isStudentBusy = existingBooking.studentId === studentId;
      
      if (!isTeacherBusy && !isStudentBusy) {
        return false;
      }

      const existingStarts = new Date(existingBooking.start).getTime();
      const existingEnds = new Date(existingBooking.end).getTime();

      return (newBookingStart.getTime() < existingEnds && newBookingEnd.getTime() > existingStarts);
    });
  }


  const handleAddBooking = () => {
    const studentToBook = studentIdParam ? users.find(u => u.id === studentIdParam) : currentUser;

    if (
      !selectedSubject ||
      !selectedTeacher ||
      !selectedDates ||
      selectedDates.length === 0 ||
      !selectedTime ||
      !studentToBook
    ) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description:
          'Por favor, selecione disciplina, professor, pelo menos uma data e um horário.',
      });
      return;
    }
    
    if (isExperimental && recurrence !== 'none') {
        toast({
            variant: 'destructive',
            title: 'Ação Inválida',
            description: 'Aulas experimentais não podem ser recorrentes.',
        });
        return;
    }
    
    if (isExperimental && bookings.some(b => b.isExperimental)) {
         toast({
            variant: 'destructive',
            title: 'Limite de Aula Experimental',
            description: 'Você só pode agendar uma aula experimental por vez.',
        });
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
            toast({
                variant: 'destructive',
                title: 'Data Inválida',
                description: `Não é possível agendar aulas em datas passadas.`,
            });
            conflictFound = true;
            return;
        }

        const endDate = addMinutes(startDate, CLASS_DURATION_MINUTES);

        const bookingConflict = bookings.some(b => 
            (b.teacherId === selectedTeacher || b.studentId === studentToBook.id) &&
            (startDate.getTime() < b.end.getTime() && endDate.getTime() > b.start.getTime())
        );
        
        if (isConflict(startDate, endDate, studentToBook.id, selectedTeacher) || bookingConflict) {
             toast({
                variant: 'destructive',
                title: 'Conflito de Horário',
                description: `Já existe uma aula agendada (sua ou do professor) que entra em conflito com ${format(startDate, "dd/MM 'às' HH:mm")}.`,
            });
            conflictFound = true;
        } else {
             const newBooking: Booking = {
                id: `booking-${startDate.getTime()}-${Math.random()}`,
                subjectId: selectedSubject,
                teacherId: selectedTeacher,
                studentId: studentToBook.id,
                start: startDate,
                end: endDate,
                isExperimental: isExperimental,
             };
             newBookings.push(newBooking);
        }
    });

    if (conflictFound) {
        return; 
    }

    if (recurrence !== 'none') {
      const repeatCount = 4;
      const originalDates = [...newBookings];
      let recurrenceConflictFound = false;

      for (let i = 1; i <= repeatCount; i++) {
        if (recurrenceConflictFound) break;

        originalDates.forEach((booking) => {
          if (recurrenceConflictFound) return;

          const newStartDate = new Date(booking.start);
          if (recurrence === 'weekly') {
            newStartDate.setDate(newStartDate.getDate() + 7 * i);
          } else if (recurrence === 'biweekly') {
            newStartDate.setDate(newStartDate.getDate() + 14 * i);
          } else if (recurrence === 'monthly') {
            newStartDate.setMonth(newStartDate.getMonth() + i);
          }
           const newEndDate = addMinutes(newStartDate, CLASS_DURATION_MINUTES);
           
           const recurringConflict = newBookings.some(b => 
                (b.teacherId === selectedTeacher || b.studentId === studentToBook.id) &&
                (newStartDate.getTime() < b.end.getTime() && newEndDate.getTime() > b.start.getTime())
           );
           
           if (isConflict(newStartDate, newEndDate, studentToBook.id, selectedTeacher) || recurringConflict) {
                toast({
                    variant: 'destructive',
                    title: 'Conflito de Horário na Recorrência',
                    description: `Não foi possível agendar a aula recorrente em ${format(newStartDate, "dd/MM 'às' HH:mm")}.`,
                });
                recurrenceConflictFound = true;
           } else {
               const recurringBooking: Booking = {
                 ...booking,
                 id: `booking-${newStartDate.getTime()}-${Math.random()}`,
                 start: newStartDate,
                 end: newEndDate,
               };
               newBookings.push(recurringBooking);
           }
        });
      }
    }


    setBookings((prev) => [...prev, ...newBookings].sort((a, b) => a.start.getTime() - b.start.getTime()));
    setSelectedDates([]);
    setSelectedTime(undefined);
    setRecurrence('none');
    setIsExperimental(false);


    toast({
      title: 'Aula(s) Adicionada(s)!',
      description: `${newBookings.length} aula(s) foram adicionadas ao resumo.`,
    });
  };

  const handleRemoveBooking = (id: string) => {
    setBookings(bookings.filter((b) => b.id !== id));
  };

  const handleRepeatBooking = (booking: Booking) => {
    const studentToBook = studentIdParam ? users.find(u => u.id === studentIdParam) : currentUser;
    if (!studentToBook || !selectedTeacher) return;
    const newStartDate = addMinutes(booking.end, 15);
    const newEndDate = addMinutes(newStartDate, CLASS_DURATION_MINUTES)
    
    const bookingConflict = bookings.some(b => 
        (b.teacherId === selectedTeacher || b.studentId === studentToBook.id) &&
        (newStartDate.getTime() < b.end.getTime() && newEndDate.getTime() > b.start.getTime())
    );

    if(isConflict(newStartDate, newEndDate, studentToBook.id, selectedTeacher) || bookingConflict) {
        toast({
            variant: 'destructive',
            title: 'Conflito de Horário',
            description: `Não foi possível duplicar a aula para ${format(newStartDate, "dd/MM 'às' HH:mm")}.`,
        });
        return;
    }

    const newBooking: Booking = {
      ...booking,
      id: `booking-${newStartDate.getTime()}-${Math.random()}`,
      start: newStartDate,
      end: newEndDate
    };

    setBookings((prev) => [...prev, newBooking].sort((a, b) => a.start.getTime() - b.start.getTime()));
    toast({
      title: 'Aula Duplicada!',
      description: 'Um novo agendamento idêntico foi adicionado.',
    });
  };

  const sendNotification = useCallback((senderId: string, receiverId: string, content: string) => {
    const allMessagesStr = localStorage.getItem('chatMessages');
    const allContactsStr = localStorage.getItem('chatContacts');
    let allMessages: ChatMessage[] = allMessagesStr ? JSON.parse(allMessagesStr).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : initialChatMessages;
    let allContacts: ChatContact[] = allContactsStr ? JSON.parse(allContactsStr).map((c: any) => ({ ...c, lastMessageTimestamp: new Date(c.lastMessageTimestamp) })) : initialChatContacts;

    const newMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        senderId,
        receiverId,
        content,
        timestamp: new Date(),
    };
    allMessages.push(newMessage);

    const updateContact = (contactOwnerId: string, partnerId: string) => {
        const partnerDetails = allUsers.find(u => u.id === partnerId);
        if (!partnerDetails) return;

        let contactList = allContacts.filter(c => c.id !== partnerId);
        const existingContact = allContacts.find(c => c.id === partnerId);
        
        const newContactEntry: ChatContact = {
            id: partnerDetails.id,
            name: partnerDetails.name,
            avatarUrl: partnerDetails.avatarUrl,
            lastMessage: content,
            lastMessageTimestamp: newMessage.timestamp,
            unreadCount: (existingContact?.id === partnerId && newMessage.receiverId === contactOwnerId) ? (existingContact.unreadCount || 0) + 1 : (existingContact?.unreadCount || 0),
        };

        allContacts = [newContactEntry, ...contactList].sort((a,b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());
    };

    updateContact(receiverId, senderId);
    updateContact(senderId, receiverId);

    localStorage.setItem('chatMessages', JSON.stringify(allMessages));
    localStorage.setItem('chatContacts', JSON.stringify(allContacts));
  }, [allUsers]);

  const handleConfirmAllBookings = useCallback(() => {
    const studentToBook = studentIdParam ? users.find(u => u.id === studentIdParam) : currentUser;
    if (bookings.length === 0 || !studentToBook) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma aula no resumo',
        description: 'Adicione pelo menos uma aula antes de confirmar.',
      });
      return;
    }
    
    const nonExperimentalBookings = bookings.filter(b => !b.isExperimental);
    const experimentalBooking = bookings.find(b => b.isExperimental);
    
    if (experimentalBooking && !isFirstClassWithTeacher) {
        toast({
            variant: 'destructive',
            title: 'Aula Experimental Inválida',
            description: 'Você já teve aulas com este professor. A aula experimental não é permitida.',
        });
        return;
    }


    const currentCredits = studentToBook.classCredits || 0;
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

    const storedSubjectsStr = localStorage.getItem('subjects');
    const currentSubjects: Subject[] = storedSubjectsStr ? JSON.parse(storedSubjectsStr) : initialSubjects;


    const newScheduleEvents = bookings.map(b => ({
      id: b.id,
      title: `Aula de ${currentSubjects.find(s => s.id === b.subjectId)?.name}`,
      start: b.start,
      end: b.end,
      studentId: studentToBook!.id,
      teacherId: b.teacherId,
      subject: currentSubjects.find(s => s.id === b.subjectId)?.name || 'Desconhecida',
      status: 'scheduled' as 'scheduled',
      isExperimental: b.isExperimental,
    }));
    
    const updatedSchedule = [...scheduleEvents, ...newScheduleEvents];
    localStorage.setItem('scheduleEvents', JSON.stringify(updatedSchedule));
    
    const updatedUsers = users.map(u => u.id === studentToBook.id ? { ...u, classCredits: currentCredits - nonExperimentalBookings.length } : u);
    localStorage.setItem('userList', JSON.stringify(updatedUsers));
    localStorage.setItem('currentUser', JSON.stringify(updatedUsers.find(u => u.id === studentToBook.id)));


    const adminUser = allUsers.find(u => u.role === 'admin');
    if (!adminUser) {
        console.error("Admin user not found for notifications");
        return;
    }
    
    if (newScheduleEvents.length > 1) {
        const student = users.find(u => u.id === newScheduleEvents[0].studentId);
        const eventDetails = newScheduleEvents.map(event => {
            const teacher = teachers.find(t => t.id === event.teacherId);
            return {
                subject: event.subject,
                teacher: teacher?.name || 'N/A',
                date: event.start,
            };
        });
        logNotification({
            type: 'group_class_scheduled',
            title: 'Novo grupo de aulas agendado',
            description: `${student?.name} agendou ${newScheduleEvents.length} novas aulas.`,
            userId: student?.id,
            events: eventDetails,
        });

    } else if (newScheduleEvents.length === 1) {
        const event = newScheduleEvents[0];
        const teacher = teachers.find(t => t.id === event.teacherId);
        const student = users.find(u => u.id === event.studentId);
        const description = `${student?.name} agendou uma nova aula de ${event.subject} com o professor(a) ${teacher?.name}.`;
        logNotification({
            type: 'class_scheduled',
            title: 'Nova Aula Agendada',
            description: description,
            userId: student?.id,
        });
    }


    newScheduleEvents.forEach(event => {
        const teacher = teachers.find(t => t.id === event.teacherId);
        const student = users.find(u => u.id === event.studentId);
        const dateStr = format(event.start, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        
        sendNotification(adminUser.id, event.teacherId, `Olá, ${teacher?.name}. Uma nova aula de ${event.subject} com ${student?.name} foi agendada para ${dateStr}.`);
        sendNotification(adminUser.id, event.studentId, `Olá, ${student?.name}. Sua aula de ${event.subject} com ${teacher?.name} foi confirmada para ${dateStr}.`);

        logActivity(`Agendou uma aula de ${event.subject} com ${teacher?.name}`);
    });

    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Agendamentos Confirmados!',
      description: `Suas ${bookings.length} aulas foram agendadas com sucesso.`,
    });
    setBookings([]);
  }, [bookings, currentUser, scheduleEvents, allUsers, teachers, users, toast, sendNotification, studentIdParam, router, isFirstClassWithTeacher]);

  const availableTimes = useMemo(() => {
    const studentToBook = studentIdParam ? users.find(u => u.id === studentIdParam) : currentUser;
    if (!selectedTeacher || !selectedDates || selectedDates.length === 0 || !studentToBook) {
      return [];
    }
  
    const teacher = teachers.find(t => t.id === selectedTeacher);
    if (!teacher || !teacher.availability) return [];
  
    const allTimes: { start: string; end: string }[] = [];
  
    (selectedDates || []).forEach(date => {
      const dayOfWeekIndex = getDay(date); 
      const dayOfWeekName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeekIndex] as keyof Teacher['availability'];
      const dayAvailability = teacher.availability[dayOfWeekName];
  
      if (!dayAvailability) return;
  
      dayAvailability.forEach(range => {
        let currentTime = parse(range.start, 'HH:mm', new Date());
        const endTime = parse(range.end, 'HH:mm', new Date());
  
        while (addMinutes(currentTime, CLASS_DURATION_MINUTES) <= endTime) {
          const slotStart = new Date(date);
          const [hours, minutes] = format(currentTime, 'HH:mm').split(':').map(Number);
          slotStart.setHours(hours, minutes, 0, 0);
          
          const slotEnd = addMinutes(slotStart, CLASS_DURATION_MINUTES);
  
          const existingBookingConflict = bookings.some(b =>
            (b.teacherId === selectedTeacher || b.studentId === studentToBook.id) &&
            (slotStart.getTime() < b.end.getTime() && slotEnd.getTime() > b.start.getTime())
          );
  
          if (isBefore(slotStart, new Date())) {
            // Skip past times
          } else if (!isConflict(slotStart, slotEnd, studentToBook.id, selectedTeacher) && !existingBookingConflict) {
            allTimes.push({
              start: format(slotStart, 'HH:mm'),
              end: format(slotEnd, 'HH:mm')
            });
          }
          currentTime = addMinutes(currentTime, 30); // Correctly increment by 30 minutes
        }
      });
    });
  
    const uniqueTimes = Array.from(new Set(allTimes.map(t => t.start))).map(start => {
      return allTimes.find(t => t.start === start)!
    }).sort((a, b) => a.start.localeCompare(b.start));
  
    return uniqueTimes;
  }, [selectedTeacher, selectedDates, teachers, scheduleEvents, bookings, currentUser, studentIdParam, users]);
  
  useEffect(() => {
    const studentToBook = studentIdParam ? users.find(u => u.id === studentIdParam) : currentUser;
    if (!selectedTeacher || !studentToBook) {
      setTimezoneDifference(null);
      return;
    }

    const teacher = teachers.find(t => t.id === selectedTeacher);
    const studentTimezone = studentToBook.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const teacherTimezone = teacher?.timezone;

    if (teacherTimezone && studentTimezone !== teacherTimezone) {
      const now = new Date();
      const studentTime = now.toLocaleString('pt-BR', { timeZone: studentTimezone, hour: '2-digit', minute: '2-digit', hour12: false });
      const teacherTime = now.toLocaleString('pt-BR', { timeZone: teacherTimezone, hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' });
      
      setTimezoneDifference(`Atualmente são ${studentTime} para você e ${teacherTime} para o professor(a) ${teacher.name}. Os horários são mostrados na hora local do professor.`);
    } else {
      setTimezoneDifference(null);
    }
  }, [selectedTeacher, currentUser, teachers, studentIdParam, users]);
  
  const renderListView = () => (
    bookings.length > 0 ? (
        <div className="space-y-4">
        {bookings
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .map((booking) => {
            const subject = subjects.find(
                (s) => s.id === booking.subjectId
            );
            const teacher = teachers.find(
                (t) => t.id === booking.teacherId
            );
            return (
                <div
                key={booking.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4"
                >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                    <Label>Disciplina</Label>
                    <p className="font-semibold">{subject?.name}</p>
                    {booking.isExperimental && <Badge variant="secondary" className="mt-1">Experimental</Badge>}
                    </div>
                    <div>
                    <Label>Professor(a)</Label>
                    <p className="font-semibold">{teacher?.name}</p>
                    </div>
                    <div>
                    <Label>Data e Horário</Label>
                    <p className="font-semibold">
                        {format(booking.start, "EEEE, dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                        })}{' '}
                        - {format(booking.end, 'HH:mm')}
                    </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRepeatBooking(booking)}
                    title="Repetir agendamento"
                    >
                    <Repeat className="h-4 w-4" />
                    </Button>
                    <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveBooking(booking.id)}
                    title="Remover agendamento"
                    >
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
            <p className="text-sm">
                Use o formulário acima para começar a agendar.
            </p>
        </div>
    )
  );

  const renderCalendarView = () => {
    const calendarMonth = bookings.length > 0 ? startOfMonth(bookings[0].start) : startOfMonth(new Date());
    const firstDay = startOfWeek(calendarMonth);
    const lastDay = endOfWeek(endOfMonth(calendarMonth));
    const daysInGrid = eachDayOfInterval({ start: firstDay, end: lastDay });

    const bookingsByDay = bookings.reduce((acc, booking) => {
        const day = format(booking.start, 'yyyy-MM-dd');
        if (!acc[day]) {
            acc[day] = [];
        }
        acc[day].push(booking);
        return acc;
    }, {} as Record<string, Booking[]>);

    return (
         bookings.length > 0 ? (
            <div className="grid grid-cols-7 border-t border-l">
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(day => (
                    <div key={day} className="p-2 text-center font-semibold text-xs border-b border-r bg-muted/50">{day}</div>
                ))}
                {daysInGrid.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const dayBookings = bookingsByDay[dayKey] || [];
                    const isCurrentMonth = isSameMonth(day, calendarMonth);
                    return (
                        <div key={dayKey} className={cn("h-40 border-b border-r p-2 flex flex-col overflow-hidden", !isCurrentMonth && "bg-muted/30")}>
                            <span className={cn(
                                "font-semibold text-sm",
                                isToday(day) && "text-primary",
                                !isCurrentMonth && "text-muted-foreground/50"
                            )}>
                                {format(day, 'd') === '1' ? format(day, 'd MMM', { locale: ptBR }) : format(day, 'd')}
                            </span>
                            <div className="flex-1 overflow-y-auto text-xs mt-1 space-y-1 pr-1">
                                {dayBookings.map(booking => {
                                    const teacher = teachers.find(t => t.id === booking.teacherId);
                                    return (
                                        <div key={booking.id} className={cn("p-1 rounded", booking.isExperimental ? "bg-purple-100 dark:bg-purple-900/50" : "bg-blue-100 dark:bg-blue-900/50")}>
                                            <p className="font-semibold truncate">{format(booking.start, 'HH:mm')} - {subjects.find(s => s.id === booking.subjectId)?.name}</p>
                                            <p className="text-muted-foreground truncate">{teacher?.name}</p>
                                            {booking.isExperimental && <Badge variant="secondary" className="mt-1 text-xs">Exp.</Badge>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
         ) : (
             <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma aula adicionada ao resumo para exibir no calendário.</p>
             </div>
         )
    )
  };


  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">{pageTitle}</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Passo 1: Selecione a Disciplina e Professor
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="subject">Disciplina</Label>
              <Select
                value={selectedSubject}
                onValueChange={handleSubjectChange}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Escolha uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teacher">Professor(a)</Label>
              <Select
                value={selectedTeacher}
                onValueChange={handleTeacherChange}
                disabled={!selectedSubject}
              >
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Escolha um(a) professor(a)" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={teacher.avatarUrl}
                            alt={teacher.name}
                          />
                          <AvatarFallback>
                            {teacher.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{teacher.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             {timezoneDifference && (
              <div className="md:col-span-2">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atenção ao Fuso Horário!</AlertTitle>
                  <AlertDescription>
                    {timezoneDifference}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Passo 2: Escolha as Datas e Horários
            </CardTitle>
            <CardDescription>
              Você pode selecionar múltiplos dias no calendário. Os horários
              exibidos são baseados na disponibilidade do professor. A duração de cada aula é de {CLASS_DURATION_MINUTES} minutos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 items-start">
            <div className="flex justify-center">
              {isClient ? (
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={setSelectedDates}
                  className="rounded-md border p-0 sm:p-3"
                  locale={ptBR}
                  disabled={{ before: startOfToday() }}
                  classNames={{
                    root: 'w-full',
                    months: 'w-full',
                    month: 'w-full',
                    table: 'w-full',
                    caption_label: 'font-headline text-lg mb-2',
                    head_row: 'w-full flex',
                    head_cell: 'flex-1',
                    row: 'w-full flex mt-2',
                    cell: 'flex-1',
                  }}
                />
              ) : (
                <div className="rounded-md border p-0 sm:p-3 w-full h-[345px] flex items-center justify-center bg-muted/50">
                  Carregando calendário...
                </div>
              )}
            </div>
            <div className="grid gap-4 self-start">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time.start}
                    variant="outline"
                    onClick={() => setSelectedTime(time.start)}
                    className={cn(
                      'text-sm',
                      selectedTime === time.start ? 'bg-brand-yellow text-black hover:bg-brand-yellow/90' : ''
                    )}
                    disabled={!selectedTeacher || (selectedDates || []).length === 0}
                  >
                    {time.start} - {time.end}
                  </Button>
                ))}
                {availableTimes.length === 0 && selectedTeacher && (selectedDates || []).length > 0 && (
                    <p className='col-span-full text-sm text-muted-foreground'>Não há horários disponíveis para este professor no dia selecionado.</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recurrence">Repetir Agendamento</Label>
                <Select
                  value={recurrence}
                  onValueChange={(value) => setRecurrence(value as Recurrence)}
                >
                  <SelectTrigger id="recurrence">
                    <SelectValue placeholder="Não repetir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não repetir</SelectItem>
                    <SelectItem value="weekly">
                      Semanalmente (próximas 4 semanas)
                    </SelectItem>
                    <SelectItem value="biweekly">
                      Quinzenalmente (próximas 4 ocorrências)
                    </SelectItem>
                    <SelectItem value="monthly">
                      Mensalmente (próximos 4 meses)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardContent className="flex flex-col sm:flex-row justify-end pt-4 gap-4">
            {isFirstClassWithTeacher && (
                <div className="flex items-center space-x-2 mr-auto">
                    <Checkbox id="experimental-class" checked={isExperimental} onCheckedChange={(checked) => setIsExperimental(Boolean(checked))} />
                    <Label htmlFor="experimental-class" className="font-semibold text-primary">Agendar como aula experimental gratuita</Label>
                </div>
            )}
            <div className="flex gap-2 self-end">
                <Button variant="ghost" onClick={handleClearSelections}>
                <X className="mr-2" />
                Limpar
                </Button>
                <Button onClick={handleAddBooking} className="bg-sidebar text-sidebar-foreground hover:bg-brand-yellow hover:text-black">
                Adicionar aula <Plus className="ml-2" />
                </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                    <CardTitle className="font-headline">
                    Passo 3: Resumo dos Agendamentos
                    </CardTitle>
                    <CardDescription>
                    Confira as aulas adicionadas antes de confirmar.
                    </CardDescription>
                </div>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />Lista</TabsTrigger>
                        <TabsTrigger value="calendar"><CalendarIcon className="mr-2 h-4 w-4" />Calendário</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'list' ? renderListView() : renderCalendarView()}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleConfirmAllBookings}
            disabled={bookings.length === 0}
            className="bg-sidebar text-sidebar-foreground hover:bg-brand-yellow hover:text-black"
          >
            Confirmar Todos os Agendamentos ({bookings.length})
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
