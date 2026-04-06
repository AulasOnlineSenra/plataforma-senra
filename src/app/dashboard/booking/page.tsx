"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addMinutes,
  format,
  getDay,
  isBefore,
  startOfToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { SearchX, Star, Pencil, Trash2 } from "lucide-react";

import { createBookings, getLessons } from "@/app/actions/bookings";
import {
  getStudents,
  getSubjects,
  getValidatedTeachers,
  getUserById,
  getTeacherAvailability,
} from "@/app/actions/users";
import { getTeacherAverageRating } from "@/app/actions/ratings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { safeLocalStorage } from "@/lib/safe-storage";
import { Separator } from "@/components/ui/separator";

type Teacher = {
  id: string;
  name: string;
  avatarUrl: string | null;
  subject: string | null;
  subjects?: string | null;
  education?: string | null;
  bio?: string | null;
};

type TeacherRating = {
  average: number;
  count: number;
};

type AvailabilitySlot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type Student = {
  id: string;
  name: string;
  credits: number;
};

type Subject = {
  id: string;
  name: string;
};

type Lesson = {
  studentId: string;
  teacherId: string;
  date: Date;
  endDate: Date;
  status: string;
};

type PreBooking = {
  id: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  date: Date;
  start: string;
  end: string;
};

const CLASS_DURATION_MINUTES = 90;

function BookingPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const studentIdParam = searchParams.get("studentId");
  const teacherIdParam = searchParams.get("teacherId");
  const studentName = searchParams.get("studentName");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [teacherRatings, setTeacherRatings] = useState<Map<string, TeacherRating>>(new Map());
  const [teacherAvailability, setTeacherAvailability] = useState<Map<string, AvailabilitySlot[]>>(new Map());

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [preBookings, setPreBookings] = useState<PreBooking[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState("");
  const [editingTeacher, setEditingTeacher] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [editingTime, setEditingTime] = useState("");

  const subjectNameById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.name])),
    [subjects],
  );

  const selectedSubjectName = selectedSubjectId
    ? subjectNameById.get(selectedSubjectId)
    : undefined;

  useEffect(() => {
    if (!currentUser?.id || preBookings.length === 0) return;
    safeLocalStorage.setItem(
      `preBookings-${currentUser.id}`,
      JSON.stringify(preBookings.map((b) => ({ ...b, date: b.date.toISOString() }))),
    );
  }, [preBookings, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const saved = safeLocalStorage.getItem(`preBookings-${currentUser.id}`);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved).map((b: any) => ({
        ...b,
        date: new Date(b.date),
      }));
      setPreBookings(parsed);
    } catch {
      safeLocalStorage.removeItem(`preBookings-${currentUser.id}`);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      const [subjectsResult, teachersResult, lessonsResult, studentsResult] =
        await Promise.all([
          getSubjects(),
          getValidatedTeachers(),
          getLessons(),
          getStudents(),
        ]);

      const loadedSubjects =
        subjectsResult.success && subjectsResult.data
          ? subjectsResult.data
          : [];
      const loadedTeachers =
        teachersResult.success && teachersResult.data
          ? teachersResult.data
          : [];
      const fallbackSubjectsFromTeachers = Array.from(
        new Set(
          loadedTeachers
            .map((teacher) => (teacher.subject || "").trim())
            .filter(Boolean),
        ),
      )
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map((name) => ({
          id: `teacher-subject-${name.toLocaleLowerCase("pt-BR").replace(/\s+/g, "-")}`,
          name,
        }));

      const mergedSubjectsMap = new Map<string, Subject>();
      [...loadedSubjects, ...fallbackSubjectsFromTeachers].forEach(
        (subject) => {
          mergedSubjectsMap.set(
            subject.name.toLocaleLowerCase("pt-BR"),
            subject,
          );
        },
      );
      const normalizedSubjects = Array.from(mergedSubjectsMap.values()).sort(
        (a, b) => a.name.localeCompare(b.name, "pt-BR"),
      );
      const loadedLessons =
        lessonsResult.success && lessonsResult.data
          ? lessonsResult.data.map((lesson) => ({
              studentId: lesson.studentId,
              teacherId: lesson.teacherId,
              date: new Date(lesson.date),
              endDate: new Date(lesson.endDate),
              status: lesson.status,
            }))
          : [];
      const loadedStudents =
        studentsResult.success && studentsResult.data
          ? studentsResult.data
          : [];

      setSubjects(normalizedSubjects);
      setTeachers(loadedTeachers);
      setLessons(loadedLessons);
      setStudents(loadedStudents);

      const ratingsMap = new Map<string, TeacherRating>();
      await Promise.all(
        loadedTeachers.map(async (teacher) => {
          const result = await getTeacherAverageRating(teacher.id);
          if (result.success && result.data) {
            ratingsMap.set(teacher.id, {
              average: result.data.average,
              count: result.data.count,
            });
          }
        }),
      );
      setTeacherRatings(ratingsMap);

      const loggedUserId = localStorage.getItem("userId");
      if (loggedUserId) {
        const userResult = await getUserById(loggedUserId);
        if (userResult.success && userResult.data) {
          const targetStudent =
            studentIdParam && loadedStudents.length > 0
              ? loadedStudents.find((student) => student.id === studentIdParam)
              : userResult.data;

          setCurrentUser((targetStudent || userResult.data) as Student);
        }
      }

      if (teacherIdParam) {
        const teacher = loadedTeachers.find(
          (item) => item.id === teacherIdParam,
        );
        if (teacher) {
          setSelectedTeacherId(teacher.id);
          if (teacher.subject) {
            const matchedSubject = normalizedSubjects.find(
              (subject) => subject.name === teacher.subject,
            );
            if (matchedSubject) {
              setSelectedSubjectId(matchedSubject.id);
            }
          }
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [studentIdParam, teacherIdParam]);

  useEffect(() => {
    if (!selectedTeacherId || teacherAvailability.has(selectedTeacherId)) return;
    const loadAvailability = async () => {
      const result = await getTeacherAvailability(selectedTeacherId);
      if (result.success && result.data) {
        setTeacherAvailability((prev) => {
          const next = new Map(prev);
          next.set(selectedTeacherId, result.data);
          return next;
        });
      }
    };
    loadAvailability();
  }, [selectedTeacherId, teacherAvailability]);

  const teacherTeachesSubject = (teacher: Teacher, subjectName: string): boolean => {
    if (teacher.subject === subjectName) return true;
    try {
      const subjectsArray = JSON.parse(teacher.subjects || "[]");
      return subjectsArray.includes(subjectName);
    } catch {
      return false;
    }
  };

  const availableTeachers = useMemo(() => {
    if (!selectedSubjectName) return [];
    return teachers.filter((teacher) =>
      teacherTeachesSubject(teacher, selectedSubjectName),
    );
  }, [teachers, selectedSubjectName]);

  const editingSubjectName = editingSubject ? subjectNameById.get(editingSubject) : undefined;

  const editingAvailableTeachers = useMemo(() => {
    if (!editingSubjectName) return [];
    return teachers.filter((teacher) =>
      teacherTeachesSubject(teacher, editingSubjectName),
    );
  }, [teachers, editingSubjectName]);

  const availableTimes = useMemo(() => {
    if (!selectedDate || !selectedTeacherId || !currentUser) return [];

    const dayOfWeek = getDay(selectedDate);
    const slots = teacherAvailability.get(selectedTeacherId) || [];
    const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);

    if (daySlots.length === 0) return [];

    const result: { start: string; end: string }[] = [];

    for (const slot of daySlots) {
      const [startH, startM] = slot.startTime.split(":").map(Number);
      const [endH, endM] = slot.endTime.split(":").map(Number);
      const rangeStart = startH * 60 + startM;
      const rangeEnd = endH * 60 + endM;

      for (let mins = rangeStart; mins + CLASS_DURATION_MINUTES <= rangeEnd; mins += 30) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const start = new Date(selectedDate);
        start.setHours(h, m, 0, 0);
        const end = addMinutes(start, CLASS_DURATION_MINUTES);

        if (isBefore(start, new Date())) continue;

        const conflicts = lessons.some((lesson) => {
          if (!["PENDING", "CONFIRMED", "scheduled"].includes(lesson.status))
            return false;
          const teacherConflict = lesson.teacherId === selectedTeacherId;
          const studentConflict = lesson.studentId === currentUser.id;
          if (!teacherConflict && !studentConflict) return false;
          return start < lesson.endDate && end > lesson.date;
        });

        const preBookingConflicts = preBookings.some((booking) => {
          if (booking.teacherId !== selectedTeacherId) return false;
          const bookingStart = new Date(booking.date);
          const [bh, bm] = booking.start.split(":").map(Number);
          bookingStart.setHours(bh, bm, 0, 0);
          const bookingEnd = addMinutes(bookingStart, CLASS_DURATION_MINUTES);
          return start < bookingEnd && end > bookingStart;
        });

        if (conflicts || preBookingConflicts) continue;

        result.push({ start: format(start, "HH:mm"), end: format(end, "HH:mm") });
      }
    }

    return result;
  }, [selectedDate, selectedTeacherId, currentUser, lessons, teacherAvailability, preBookings]);

  const editingAvailableTimes = useMemo(() => {
    if (!editingDate || !editingTeacher || !currentUser) return [];

    const dateObj = new Date(editingDate);
    const dayOfWeek = getDay(dateObj);
    const slots = teacherAvailability.get(editingTeacher) || [];
    const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);

    if (daySlots.length === 0) return [];

    const result: { start: string; end: string }[] = [];

    for (const slot of daySlots) {
      const [startH, startM] = slot.startTime.split(":").map(Number);
      const [endH, endM] = slot.endTime.split(":").map(Number);
      const rangeStart = startH * 60 + startM;
      const rangeEnd = endH * 60 + endM;

      for (let mins = rangeStart; mins + CLASS_DURATION_MINUTES <= rangeEnd; mins += 30) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const start = new Date(editingDate);
        start.setHours(h, m, 0, 0);
        const end = addMinutes(start, CLASS_DURATION_MINUTES);

        if (isBefore(start, new Date())) continue;

        const conflicts = lessons.some((lesson) => {
          if (!["PENDING", "CONFIRMED", "scheduled"].includes(lesson.status))
            return false;
          const teacherConflict = lesson.teacherId === editingTeacher;
          const studentConflict = lesson.studentId === currentUser.id;
          if (!teacherConflict && !studentConflict) return false;
          return start < lesson.endDate && end > lesson.date;
        });

        const preBookingConflicts = preBookings.some((booking) => {
          if (booking.id === editingId) return false;
          if (booking.teacherId !== editingTeacher) return false;
          const bookingStart = new Date(booking.date);
          const [bh, bm] = booking.start.split(":").map(Number);
          bookingStart.setHours(bh, bm, 0, 0);
          const bookingEnd = addMinutes(bookingStart, CLASS_DURATION_MINUTES);
          return start < bookingEnd && end > bookingStart;
        });

        if (conflicts || preBookingConflicts) continue;

        result.push({ start: format(start, "HH:mm"), end: format(end, "HH:mm") });
      }
    }

    return result;
  }, [editingDate, editingTeacher, currentUser, lessons, teacherAvailability, preBookings, editingId]);

  const handleAddPreBooking = () => {
    if (!currentUser || !selectedSubjectName || !selectedTeacherId || !selectedDate || !selectedTime) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Selecione disciplina, professor, data e horário." });
      return;
    }

    const teacher = teachers.find((t) => t.id === selectedTeacherId);
    if (!teacher) return;

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const start = new Date(selectedDate);
    start.setHours(hours, minutes, 0, 0);
    const end = addMinutes(start, CLASS_DURATION_MINUTES);

    if (isBefore(start, startOfToday())) {
      toast({ variant: "destructive", title: "Data inválida", description: "Não é possível agendar aulas no passado." });
      return;
    }

    const conflict = preBookings.some((b) => {
      if (editingId && b.id === editingId) return false;
      if (b.teacherId !== selectedTeacherId) return false;
      const bStart = new Date(b.date);
      const [bh, bm] = b.start.split(":").map(Number);
      bStart.setHours(bh, bm, 0, 0);
      const bEnd = addMinutes(bStart, CLASS_DURATION_MINUTES);
      return start < bEnd && end > bStart;
    });

    if (conflict) {
      toast({ variant: "destructive", title: "Conflito de horário", description: "Já existe uma aula com este professor neste horário." });
      return;
    }

    const newBooking: PreBooking = {
      id: editingId || crypto.randomUUID(),
      subjectId: selectedSubjectId,
      subjectName: selectedSubjectName,
      teacherId: selectedTeacherId,
      teacherName: teacher.name,
      date: selectedDate,
      start: selectedTime,
      end: format(end, "HH:mm"),
    };

    setPreBookings((prev) => {
      if (editingId) return prev.map((b) => (b.id === editingId ? newBooking : b));
      return [...prev, newBooking];
    });

    toast({ title: editingId ? "Aula atualizada no resumo" : "Aula adicionada ao resumo", description: `${selectedSubjectName} - ${teacher.name} - ${format(selectedDate, "dd/MM/yyyy")} - ${selectedTime}` });

    setSelectedSubjectId("");
    setSelectedTeacherId("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setEditingId(null);
  };

  const handleRemovePreBooking = (id: string) => {
    setPreBookings((prev) => prev.filter((b) => b.id !== id));
    toast({ title: "Aula removida do resumo" });
    if (editingId === id) setEditingId(null);
  };

  const handleEditPreBooking = (id: string) => {
    const booking = preBookings.find((b) => b.id === id);
    if (!booking) return;

    const subject = subjects.find((s) => s.name === booking.subjectName);
    if (subject) setEditingSubject(subject.id);
    else setEditingSubject("");
    setEditingTeacher(booking.teacherId);
    setEditingDate(format(new Date(booking.date), "yyyy-MM-dd"));
    setEditingTime(booking.start);
    setEditingId(id);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingSubject || !editingTeacher || !editingDate || !editingTime) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Preencha todos os campos." });
      return;
    }

    const subjectName = subjectNameById.get(editingSubject) || "";
    const teacher = teachers.find((t) => t.id === editingTeacher);
    if (!teacher) return;

    const [hours, minutes] = editingTime.split(":").map(Number);
    const start = new Date(editingDate);
    start.setHours(hours, minutes, 0, 0);
    const end = addMinutes(start, CLASS_DURATION_MINUTES);

    const conflict = preBookings.some((b) => {
      if (b.id === editingId) return false;
      if (b.teacherId !== editingTeacher) return false;
      const bStart = new Date(b.date);
      const [bh, bm] = b.start.split(":").map(Number);
      bStart.setHours(bh, bm, 0, 0);
      const bEnd = addMinutes(bStart, CLASS_DURATION_MINUTES);
      return start < bEnd && end > bStart;
    });

    if (conflict) {
      toast({ variant: "destructive", title: "Conflito de horário", description: "Já existe uma aula com este professor neste horário." });
      return;
    }

    setPreBookings((prev) => prev.map((b) => {
      if (b.id !== editingId) return b;
      return {
        ...b,
        subjectId: editingSubject,
        subjectName,
        teacherId: editingTeacher,
        teacherName: teacher.name,
        date: new Date(editingDate),
        start: editingTime,
        end: format(end, "HH:mm"),
      };
    }));

    setEditingId(null);
    toast({ title: "Aula atualizada" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleConfirmBookings = async () => {
    if (!currentUser || preBookings.length === 0) return;

    if (currentUser.credits < preBookings.length) {
      toast({ variant: "destructive", title: "Créditos insuficientes", description: `Você precisa de ${preBookings.length} crédito(s), mas tem apenas ${currentUser.credits}. Redirecionando para o checkout...` });
      safeLocalStorage.setItem('checkoutBookings', JSON.stringify(preBookings.map((b) => ({
        subjectName: b.subjectName,
        teacherId: b.teacherId,
        teacherName: b.teacherName,
        date: b.date.toISOString(),
        start: b.start,
        end: b.end,
      }))));
      setTimeout(() => router.push(`/dashboard/checkout?needed=${preBookings.length}&current=${currentUser.credits}`), 2000);
      return;
    }

    setIsConfirming(true);

    const bookingsToCreate = preBookings.map((b) => {
      const start = new Date(b.date);
      const [h, m] = b.start.split(":").map(Number);
      start.setHours(h, m, 0, 0);
      const end = addMinutes(start, CLASS_DURATION_MINUTES);
      return { subjectId: b.subjectId, teacherId: b.teacherId, start, end, isExperimental: false };
    });

    const result = await createBookings(currentUser.id, bookingsToCreate);
    setIsConfirming(false);

    if (!result.success) {
      toast({ variant: "destructive", title: "Erro ao confirmar", description: result.error || "Não foi possível concluir os agendamentos." });
      return;
    }

    toast({ title: "Agendamentos confirmados!", description: `${preBookings.length} aula(s) agendada(s) com sucesso.` });
    setPreBookings([]);
    if (currentUser?.id) {
      safeLocalStorage.removeItem(`preBookings-${currentUser.id}`);
    }
    router.push("/dashboard/schedule");
  };

  const pageTitle = studentName
    ? `Agendamento de Aulas - ${studentName}`
    : "Agendamento de Aulas";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 bg-slate-50 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          {pageTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Escolha disciplina, professor e horário para confirmar sua aula.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-3xl border border-slate-100 bg-white shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-900">Novo agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="subject"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Disciplina
                  </Label>
                  <Select
                    value={selectedSubjectId}
                    onValueChange={(value) => {
                      setSelectedSubjectId(value);
                      setSelectedTeacherId("");
                      setSelectedTime("");
                    }}
                  >
                    <SelectTrigger
                      id="subject"
                      className="h-12 rounded-2xl border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-amber-400 focus:ring-offset-0"
                    >
                      <SelectValue
                        placeholder={
                          isLoading
                            ? "Carregando disciplinas..."
                            : "Selecione uma disciplina"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200">
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="teacher"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Professor
                  </Label>
                  <Select
                    value={selectedTeacherId}
                    onValueChange={(value) => {
                      setSelectedTeacherId(value);
                      setSelectedTime("");
                    }}
                    disabled={!selectedSubjectId}
                  >
                    <SelectTrigger
                      id="teacher"
                      className="h-12 rounded-2xl border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-amber-400 focus:ring-offset-0"
                    >
                      <SelectValue placeholder="Selecione um professor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200">
                      {availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Data
                  </Label>
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                    <Calendar
                      mode="single"
                      locale={ptBR}
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime("");
                      }}
                      disabled={(date) => {
                        if (isBefore(date, startOfToday())) return true;
                        if (!selectedTeacherId) return false;
                        const dayOfWeek = getDay(date);
                        const slots = teacherAvailability.get(selectedTeacherId) || [];
                        return !slots.some((s) => s.dayOfWeek === dayOfWeek);
                      }}
                      className="w-full"
                      classNames={{ day_today: "bg-accent text-slate-950" }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Horários disponíveis
                  </Label>
                  <div className="grid max-h-[340px] grid-cols-1 gap-2 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-2">
                    {availableTimes.length > 0 ? (
                      availableTimes.map((time) => (
                        <button
                          key={time.start}
                          type="button"
                          onClick={() => setSelectedTime(time.start)}
                          className={cn(
                            "h-12 rounded-xl border text-sm font-semibold transition",
                            selectedTime === time.start
                              ? "border-[#FFC107] bg-[#FFC107] text-slate-900"
                              : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-slate-900",
                          )}
                        >
                          {time.start} - {time.end}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                        {!selectedTeacherId
                          ? "Selecione um professor para ver os horários."
                          : !selectedDate
                            ? "Selecione uma data para ver os horários."
                            : !(teacherAvailability.get(selectedTeacherId)?.some((s) => s.dayOfWeek === getDay(selectedDate)))
                              ? "Este professor não possui disponibilidade para este dia da semana."
                              : "Não há horários disponíveis para esta data."}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAddPreBooking}
                disabled={
                  !selectedSubjectId ||
                  !selectedTeacherId ||
                  !selectedDate ||
                  !selectedTime
                }
                className="h-12 w-full rounded-2xl bg-[#FFC107] text-base font-bold text-slate-900 transition hover:scale-105 hover:bg-[#FFC107] disabled:opacity-60"
              >
                {editingId ? "Atualizar Resumo" : "Adicionar ao Resumo"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">
                Professores disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedSubjectId ? (
                <p className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                  Selecione uma disciplina para visualizar os professores.
                </p>
              ) : availableTeachers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <SearchX className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                  <p className="font-semibold text-slate-700">
                    Nenhum professor encontrado para esta disciplina.
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Tente selecionar outra matéria para continuar.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableTeachers.map((teacher) => {
                    const rating = teacherRatings.get(teacher.id) || { average: 5.0, count: 0 };
                    const fullStars = Math.floor(rating.average);
                    const hasHalf = rating.average - fullStars >= 0.5;
                    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

                    const teacherEducation = (() => {
                      if (!teacher.education) return [];
                      let eduList: any = teacher.education;
                      if (typeof eduList === "string") {
                        try { eduList = JSON.parse(eduList); } catch { return []; }
                      }
                      if (!Array.isArray(eduList) || eduList.length === 0) return [];

                      if (eduList.length === 1) {
                        const first = eduList[0];
                        if (first.course && first.university) return [{ text: `${first.course} - ${first.university}` }];
                        if (first.course) return [{ text: first.course }];
                        return [];
                      }

                      const remaining = eduList.length - 2;
                      const result: { text: string }[] = [];
                      const first = eduList[0];
                      if (first.course && first.university) result.push({ text: `${first.course} - ${first.university}` });
                      else if (first.course) result.push({ text: first.course });
                      const second = eduList[1];
                      const indicator = remaining > 0 ? ` (+${remaining})` : '';
                      if (second.course && second.university) result.push({ text: `${second.course} - ${second.university}${indicator}` });
                      else if (second.course) result.push({ text: `${second.course}${indicator}` });
                      return result;
                    })();

                    return (
                      <button
                        key={teacher.id}
                        type="button"
                        onClick={() => setSelectedTeacherId(teacher.id)}
                        className={cn(
                          "w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition",
                          selectedTeacherId === teacher.id
                            ? "ring-2 ring-amber-400"
                            : "hover:-translate-y-0.5 hover:border-slate-200",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border border-slate-100 shrink-0">
                            <AvatarImage
                              src={teacher.avatarUrl || ""}
                              alt={teacher.name}
                            />
                            <AvatarFallback className="bg-amber-100 font-bold text-amber-700">
                              {teacher.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {teacher.name}
                            </p>
                            {teacherEducation.length > 0 && (
                              <div className="space-y-0.5">
                                {teacherEducation.map((edu, idx) => (
                                  <p key={idx} className="text-sm font-medium text-slate-400 truncate">
                                    {edu.text}
                                  </p>
                                ))}
                              </div>
                            )}
                            <div className="mt-2 flex items-center gap-1 text-amber-500">
                              {Array.from({ length: fullStars }).map((_, i) => (
                                <Star key={`full-${i}`} className="h-4 w-4 fill-current" />
                              ))}
                              {hasHalf && (
                                <Star className="h-4 w-4 fill-current opacity-50" />
                              )}
                              {Array.from({ length: emptyStars }).map((_, i) => (
                                <Star key={`empty-${i}`} className="h-4 w-4" />
                              ))}
                              <span className="ml-1 text-xs font-semibold text-slate-600">
                                {rating.average.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {preBookings.length > 0 && (
        <Card className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Resumo dos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="grid px-4 py-2.5 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ gridTemplateColumns: "1fr 1fr 100px 100px 80px" }}>
                <span style={{ paddingRight: "6px" }}>Disciplina</span>
                <span style={{ paddingRight: "12px" }}>Professor</span>
                <span style={{ paddingRight: "12px" }}>Data</span>
                <span style={{ paddingRight: "12px" }}>Horário</span>
                <span className="text-right">Ações</span>
              </div>
              {preBookings.map((booking, idx) => {
                const isEditing = editingId === booking.id;

                if (isEditing) {
                  return (
                    <div key={booking.id} className={`grid items-center px-4 py-3 bg-amber-50 ${idx > 0 ? "border-t border-slate-100" : ""}`} style={{ gridTemplateColumns: "1fr 1fr 100px 100px 80px" }}>
                      <div style={{ paddingRight: "6px" }}>
                        <Select value={editingSubject} onValueChange={(v) => { setEditingSubject(v); setEditingTeacher(""); setEditingTime(""); }}>
                          <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-sm">
                            <SelectValue placeholder="Disciplina" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div style={{ paddingRight: "12px" }}>
                        <Select value={editingTeacher} onValueChange={(v) => { setEditingTeacher(v); setEditingTime(""); }} disabled={!editingSubject}>
                          <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-sm">
                            <SelectValue placeholder="Professor" />
                          </SelectTrigger>
                          <SelectContent>
                            {editingAvailableTeachers.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div style={{ paddingRight: "12px" }}>
                        <input type="date" value={editingDate} onChange={(e) => { setEditingDate(e.target.value); setEditingTime(""); }} className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700" />
                      </div>
                      <div style={{ paddingRight: "12px" }}>
                        <Select value={editingTime} onValueChange={setEditingTime} disabled={!editingTeacher || !editingDate}>
                          <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-sm">
                            <SelectValue placeholder="Horário" />
                          </SelectTrigger>
                          <SelectContent>
                            {editingAvailableTimes.map((t) => (
                              <SelectItem key={t.start} value={t.start}>{t.start} - {t.end}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-0.5">
                        <button onClick={handleSaveEdit} className="rounded-full p-1.5 text-green-600 hover:bg-green-100 transition" title="Salvar">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button onClick={handleCancelEdit} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 transition" title="Cancelar">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={booking.id} className={`grid items-center px-4 py-3 ${idx > 0 ? "border-t border-slate-100" : ""}`} style={{ gridTemplateColumns: "1fr 1fr 100px 100px 80px" }}>
                    <span className="text-sm font-bold text-slate-900 truncate" style={{ paddingRight: "6px" }}>{booking.subjectName}</span>
                    <span className="text-sm text-slate-700 truncate" style={{ paddingRight: "12px" }}>{booking.teacherName}</span>
                    <span className="text-sm text-slate-600" style={{ paddingRight: "12px" }}>{format(new Date(booking.date), "dd/MM/yyyy")}</span>
                    <span className="text-sm text-slate-600" style={{ paddingRight: "12px" }}>{booking.start} - {booking.end}</span>
                    <div className="flex justify-end gap-0.5">
                      <button onClick={() => handleEditPreBooking(booking.id)} className="rounded-full p-1.5 text-slate-400 hover:bg-amber-100 hover:text-amber-600 transition" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleRemovePreBooking(booking.id)} className="rounded-full p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 transition" title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total: <span className="font-bold text-slate-900">{preBookings.length} aula(s)</span> • Seus créditos: <span className="font-bold text-slate-900">{currentUser?.credits ?? 0}</span></p>
            </div>
            <Button onClick={handleConfirmBookings} disabled={isConfirming} className="h-12 w-full rounded-2xl bg-[#FFC107] text-base font-bold text-slate-900 transition hover:scale-105 hover:bg-[#FFC107] disabled:opacity-60">
              {isConfirming ? "Confirmando..." : `Confirmar Agendamentos (${preBookings.length})`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center bg-slate-50 text-slate-500">
          Carregando agendamentos...
        </div>
      }
    >
      <BookingPageComponent />
    </Suspense>
  );
}
