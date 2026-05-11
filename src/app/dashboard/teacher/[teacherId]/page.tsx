'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, FileText, BookCopy, CalendarCheck, Star, GraduationCap, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getUserById, getTeacherAvailability } from '@/app/actions/users';
import { getTeacherAverageRating, getTeacherRatings } from '@/app/actions/ratings';
import { getLessonsForUser } from '@/app/actions/bookings';

type TeacherData = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  subject?: string | null;
  subjects?: string | null;
  education?: string | null;
  bio?: string | null;
};

type RatingData = {
  id: string;
  score: number;
  comment?: string | null;
  createdAt: string;
  student: { id: string; name: string; avatarUrl?: string | null };
};

type CurrentUser = {
  id: string;
  name: string;
  role: string;
};

function TeacherDetailPageComponent() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params?.teacherId as string;

  const formatEducation = (education: string | null | undefined): string => {
    if (!education) return '';
    let eduList: { course: string; university: string }[] = [];
    if (Array.isArray(education)) {
      eduList = education;
    } else if (typeof education === 'string') {
      try {
        eduList = JSON.parse(education);
      } catch {
        return education;
      }
    }
    if (eduList.length > 0) {
      return `${eduList[0].course} - ${eduList[0].university}`;
    }
    return education;
  };

  const getAllEducations = (education: string | null | undefined): { text: string }[] => {
    if (!education) return [];
    
    let eduList = education;
    if (typeof eduList === 'string') {
      try {
        eduList = JSON.parse(eduList);
      } catch {
        return [];
      }
    }
    
    if (!Array.isArray(eduList) || eduList.length === 0) return [];
    
    return eduList
      .filter((e: { course: string; university: string }) => e.course && e.university)
      .map((e: { course: string; university: string }) => ({
        text: `${e.course} - ${e.university}`
      }));
  };

  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [rating, setRating] = useState<{ average: number; count: number }>({ average: 5.0, count: 0 });
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availability, setAvailability] = useState<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[]>([]);

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const userResult = await getUserById(userId);
        if (userResult.success && userResult.data) {
          setCurrentUser(userResult.data as CurrentUser);
        }
      }

      const teacherResult = await getUserById(teacherId);
      if (teacherResult.success && teacherResult.data) {
        setTeacher(teacherResult.data as TeacherData);
      }

      const [avgResult, ratingsResult, availabilityResult] = await Promise.all([
        getTeacherAverageRating(teacherId),
        getTeacherRatings(teacherId),
        getTeacherAvailability(teacherId),
      ]);

      if (avgResult.success && avgResult.data) {
        setRating(avgResult.data);
      }
      if (ratingsResult.success && ratingsResult.data) {
        setRatings(ratingsResult.data as RatingData[]);
      }
      if (availabilityResult.success && availabilityResult.data) {
        setAvailability(availabilityResult.data);
      }

      setIsLoading(false);
    };
    load();
  }, [teacherId]);

  const isAdmin = currentUser?.role === 'admin';

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Quar', 'Quin', 'Sex', 'Sab'];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${parseInt(hours)}:${minutes}`;
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    let startHour = 7;
    let startMinute = 0;
    while (startHour < 22 || (startHour === 22 && startMinute === 0)) {
      const endHour = startHour + 1;
      const endMinute = startMinute + 30;
      let actualEndHour = endHour;
      let actualEndMinute = endMinute;
      if (actualEndMinute >= 60) {
        actualEndHour += 1;
        actualEndMinute -= 60;
      }
      const startStr = `${startHour}:${startMinute.toString().padStart(2, '0')}`;
      const endStr = `${actualEndHour}:${actualEndMinute.toString().padStart(2, '0')}`;
      slots.push(`${formatTime(startStr)} - ${formatTime(endStr)}`);
      startHour = actualEndHour;
      startMinute = actualEndMinute;
    }
    return slots;
  };

  const allTimeSlots = useMemo(() => generateTimeSlots(), []);

  const availabilityByTime = useMemo(() => {
    return allTimeSlots.map((timeSlot) => {
      const [startStr] = timeSlot.split(' - ');
      const startTime = `${startStr.split(':')[0].padStart(2, '0')}:${startStr.split(':')[1].padStart(2, '0')}`;
      const endTimeCalc = (s: string) => {
        const [h, m] = s.split(':').map(Number);
        const endH = h + 1;
        const endM = m + 30;
        const finalH = endM >= 60 ? endH + 1 : endH;
        const finalM = endM >= 60 ? endM - 60 : endM;
        return `${finalH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
      };
      const endTime = endTimeCalc(startTime);
      const daysAvailable: number[] = [];
      availability.forEach((slot) => {
        const slotStart = slot.startTime.substring(0, 5);
        if (slotStart === startTime && !daysAvailable.includes(slot.dayOfWeek)) {
          daysAvailable.push(slot.dayOfWeek);
        }
      });
      return { time: timeSlot, days: daysAvailable.sort() };
    });
  }, [availability, allTimeSlots]);

  const teacherSubjects = teacher?.subjects
    ? (() => {
        try { return JSON.parse(teacher.subjects); } catch { return []; }
      })()
    : teacher?.subject
      ? [teacher.subject]
      : [];

  const filteredRatings = ratings.filter((r) => {
    if (isAdmin) return true;
    return r.score >= 4;
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-500">
        Carregando perfil do professor...
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Professor não encontrado</CardTitle>
            <CardDescription>O perfil deste professor não pôde ser carregado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/teachers">Voltar para Professores</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/teachers" className="hover:underline">Professores</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{teacher.name}</span>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b p-8">
          <div className="flex flex-col lg:flex-row items-start gap-4">
            {/* Lado esquerdo - Informações do professor (sem alterações) */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-28 w-28 border-4 border-brand-yellow shadow-[0_4px_16px_rgba(245,176,0,0.5)]">
                  <AvatarImage src={teacher.avatarUrl || undefined} alt={teacher.name} />
                  <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-4xl">
                    {teacher.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left space-y-3">
                  <h1 className="text-3xl font-bold text-slate-900">{teacher.name}</h1>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    {teacherSubjects.map((subject: string) => (
                      <Badge key={subject} variant="secondary" className="bg-amber-100 text-amber-800 font-semibold">
                        {subject}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-1">
                    {Array(5).fill(0).map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5"
                        style={{ color: '#FFC107', fill: i < Math.round(rating.average) ? '#FFC107' : 'none' }}
                      />
                    ))}
                    <span className="text-sm font-bold ml-1" style={{ color: '#FFC107' }}>
                      {rating.average.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">
                      ({rating.count} {rating.count === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                  </div>

                  {teacher.education && (
                    <div className="space-y-1">
                      {getAllEducations(teacher.education).map((edu: { text: string }, idx: number) => (
                        <div key={idx} className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-600">
                          <GraduationCap className="h-4 w-4 text-brand-yellow" />
                          <span className="font-medium">{edu.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {availability.length > 0 && (
                    <div className="mt-3 w-full h-full">
                      <h4 className="text-sm font-bold text-slate-700 mb-2 pl-[15px]">Disponibilidade</h4>
                      <div className="pl-[15px] overflow-y-auto" style={{ maxHeight: '460px', scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                        <style dangerouslySetInnerHTML={{__html: `
                          .availability-scroll::-webkit-scrollbar { width: 6px; }
                          .availability-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
                          .availability-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                          .availability-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                        `}} />
                        <Table className="text-xs w-full availability-scroll">
                          <TableHeader>
                            <TableRow className="bg-slate-100">
                              <TableHead className="text-center font-bold text-slate-700 w-32">Horários</TableHead>
                              {dayLabels.map((day) => (
                                <TableHead key={day} className="text-center font-bold text-slate-700 w-20">{day}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {availabilityByTime.map((slot) => (
                              <TableRow key={slot.time}>
                                <TableCell className="font-medium text-slate-700 text-center w-32">{slot.time}</TableCell>
                                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                  <TableCell key={day} className="text-center w-20">
                                    {slot.days.includes(day) ? (
                                      <span className="text-green-600 font-bold">✓</span>
                                    ) : (
                                      <span className="text-red-500 font-bold">X</span>
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lado direito - Bio do professor */}
            {teacher.bio && (
              <div className="lg:w-1/3 w-full bg-slate-100 rounded-2xl p-4 max-h-[500px] flex flex-col">
                <h3 className="font-bold text-slate-700 mb-2">Sobre mim</h3>
                <div className="text-sm text-slate-600 overflow-y-auto flex-1 mb-4 bio-scroll" style={{ maxHeight: '400px', scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                  <style dangerouslySetInnerHTML={{__html: `
                    .bio-scroll::-webkit-scrollbar { width: 6px; }
                    .bio-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
                    .bio-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                    .bio-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                  `}} />
                  {teacher.bio}
                </div>
                
                <Button
                  asChild
                  className="w-full h-9 rounded-xl bg-brand-yellow font-bold text-slate-900 shadow-sm transition-all hover:scale-105 hover:bg-brand-yellow/90"
                >
                  <Link href={`/dashboard/booking?teacherId=${teacher.id}`}>
                    Agendar Aula
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <CardContent className="pt-6">
          <Tabs defaultValue="avaliacoes" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-2xl">
              <TabsTrigger value="aulas" className="rounded-xl">
                <CalendarCheck className="mr-2 h-4 w-4" /> Aulas
              </TabsTrigger>
              <TabsTrigger value="materiais" className="rounded-xl">
                <FileText className="mr-2 h-4 w-4" /> Materiais
              </TabsTrigger>
              <TabsTrigger value="simulados" className="rounded-xl">
                <BookCopy className="mr-2 h-4 w-4" /> Simulados
              </TabsTrigger>
              <TabsTrigger value="avaliacoes" className="rounded-xl">
                <Star className="mr-2 h-4 w-4" /> Avaliações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aulas" className="pt-4">
              <div className="text-center py-10 text-slate-400">
                <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nenhuma aula agendada com este professor.</p>
              </div>
            </TabsContent>

            <TabsContent value="materiais" className="pt-4">
              <div className="text-center py-10 text-slate-400">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum material compartilhado ainda.</p>
              </div>
            </TabsContent>

            <TabsContent value="simulados" className="pt-4">
              <div className="text-center py-10 text-slate-400">
                <BookCopy className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum simulado disponível no momento.</p>
              </div>
            </TabsContent>

            <TabsContent value="avaliacoes" className="pt-4">
              {filteredRatings.length > 0 ? (
                <div className="space-y-4">
                  {filteredRatings.map((r) => (
                    <div key={r.id} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <Avatar className="h-10 w-10 border-2 border-brand-yellow">
                        <AvatarImage src={r.student.avatarUrl || undefined} alt={r.student.name} />
                        <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-sm">
                          {r.student.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
<div className="flex-1 w-full">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm text-slate-800">{r.student.name}</p>
                          <span className="text-xs text-slate-400">
                            {format(new Date(r.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array(5).fill(0).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3.5 w-3.5"
                              style={{ color: '#FFC107', fill: i < r.score ? '#FFC107' : 'none' }}
                            />
                          ))}
                        </div>
                        {r.comment && (
                          <p className="text-sm text-slate-500 mt-2">{r.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Star className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma avaliação disponível ainda.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TeacherDetailPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center text-slate-500">Carregando...</div>}>
      <TeacherDetailPageComponent />
    </Suspense>
  );
}
