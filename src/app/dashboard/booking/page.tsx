"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addMinutes,
  format,
  getDay,
  isBefore,
  parse,
  startOfToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { SearchX, Star } from "lucide-react";

import { createBookings, getLessons } from "@/app/actions/bookings";
import {
  getStudents,
  getSubjects,
  getTeachers,
  getUserById,
} from "@/app/actions/users";
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

type Teacher = {
  id: string;
  name: string;
  avatarUrl: string | null;
  subject: string | null;
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

const CLASS_DURATION_MINUTES = 90;
const DEFAULT_AVAILABILITY: Record<string, string[]> = {
  monday: [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ],
  tuesday: [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ],
  wednesday: [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ],
  thursday: [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ],
  friday: [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ],
  saturday: ["09:00", "10:00", "11:00"],
  sunday: [],
};

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

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjectNameById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.name])),
    [subjects],
  );

  const selectedSubjectName = selectedSubjectId
    ? subjectNameById.get(selectedSubjectId)
    : undefined;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      const [subjectsResult, teachersResult, lessonsResult, studentsResult] =
        await Promise.all([
          getSubjects(),
          getTeachers(),
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

  const availableTeachers = useMemo(() => {
    if (!selectedSubjectName) return [];
    return teachers.filter(
      (teacher) => teacher.subject === selectedSubjectName,
    );
  }, [teachers, selectedSubjectName]);

  const availableTimes = useMemo(() => {
    if (!selectedDate || !selectedTeacherId || !currentUser) return [];

    const weekday = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][getDay(selectedDate)];
    const baseSlots = DEFAULT_AVAILABILITY[weekday] || [];

    return baseSlots
      .map((slot) => {
        const parsed = parse(slot, "HH:mm", new Date());
        const start = new Date(selectedDate);
        start.setHours(parsed.getHours(), parsed.getMinutes(), 0, 0);
        const end = addMinutes(start, CLASS_DURATION_MINUTES);

        if (isBefore(start, new Date())) return null;

        const conflicts = lessons.some((lesson) => {
          if (!["PENDING", "CONFIRMED", "scheduled"].includes(lesson.status))
            return false;
          const teacherConflict = lesson.teacherId === selectedTeacherId;
          const studentConflict = lesson.studentId === currentUser.id;
          if (!teacherConflict && !studentConflict) return false;
          return start < lesson.endDate && end > lesson.date;
        });

        if (conflicts) return null;

        return { start: format(start, "HH:mm"), end: format(end, "HH:mm") };
      })
      .filter((slot): slot is { start: string; end: string } => Boolean(slot));
  }, [selectedDate, selectedTeacherId, currentUser, lessons]);

  const handleScheduleClass = async () => {
    if (
      !currentUser ||
      !selectedSubjectName ||
      !selectedTeacherId ||
      !selectedDate ||
      !selectedTime
    ) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Selecione disciplina, professor, data e horário.",
      });
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const start = new Date(selectedDate);
    start.setHours(hours, minutes, 0, 0);
    const end = addMinutes(start, CLASS_DURATION_MINUTES);

    if (isBefore(start, startOfToday())) {
      toast({
        variant: "destructive",
        title: "Data inválida",
        description: "Não é possível agendar aulas no passado.",
      });
      return;
    }

    setIsSubmitting(true);

    const result = await createBookings(currentUser.id, [
      {
        subjectId: selectedSubjectName,
        teacherId: selectedTeacherId,
        start,
        end,
        isExperimental: false,
      },
    ]);

    setIsSubmitting(false);

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Erro ao agendar",
        description: result.error || "Não foi possível concluir o agendamento.",
      });
      return;
    }

    toast({
      title: "Aula agendada com sucesso",
      description: "Seu agendamento foi salvo e já está no calendário.",
    });

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
      {/* Trava de créditos — bloqueia o formulário antes de preencher */}
      {currentUser && currentUser.credits < 1 && (
        <Card className="rounded-3xl border-2 border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <span style={{ fontSize: "32px" }}>🪙</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Você não tem créditos disponíveis
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                Para agendar uma aula, você precisa ter pelo menos 1 crédito na
                sua conta.
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/packages")}
              className="h-12 rounded-2xl bg-[#FFC107] px-8 font-bold text-slate-900 hover:bg-amber-400"
            >
              Comprar Créditos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Formulário — só aparece se tiver créditos */}
      {(!currentUser || currentUser.credits >= 1) && (
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
                      disabled={{ before: startOfToday() }}
                      className="w-full"
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
                        Selecione disciplina, professor e data para ver os
                        horários.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleScheduleClass}
                disabled={
                  isSubmitting ||
                  !selectedSubjectId ||
                  !selectedTeacherId ||
                  !selectedDate ||
                  !selectedTime
                }
                className="h-12 w-full rounded-2xl bg-[#FFC107] text-base font-bold text-slate-900 transition hover:scale-105 hover:bg-[#FFC107] disabled:opacity-60"
              >
                {isSubmitting ? "Agendando..." : "Agendar Aula"}
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
                  {availableTeachers.map((teacher) => (
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
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 border border-slate-100">
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
                          <p className="truncate text-xs text-slate-500">
                            {teacher.subject || "Disciplina não informada"}
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4" />
                            <span className="ml-1 text-xs font-semibold text-slate-600">
                              4.8
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
