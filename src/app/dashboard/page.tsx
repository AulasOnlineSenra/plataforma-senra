"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck,
  CheckCircle2,
  Users,
  Briefcase,
  Coins,
  ArrowRight,
  XCircle,
  Star,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUserById } from "@/app/actions/users";
import { getLessonsForUser } from "@/app/actions/bookings";
import { getDashboardStats } from "@/app/actions/dashboard";
import { getUnratedPeopleForUser, submitRating, getUserAverageReceivedRating } from "@/app/actions/ratings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type DashboardUser = {
  id: string;
  name: string;
  role: "admin" | "teacher" | "student";
  credits: number;
  avatarUrl?: string | null;
};

type UnratedPerson = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type LessonItem = {
  id: string;
  subject: string;
  status: string;
  date: string | Date;
  student?: { name: string } | null;
  teacher?: { name: string; avatarUrl?: string | null } | null;
};

type AdminStats = {
  students: number;
  teachers: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  revenue: number;
  upcomingLessons: LessonItem[];
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  href?: string;
}) {
  const body = (
    <Card className="rounded-3xl border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-slate-600">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-[#FFC107]" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );

  if (!href) return body;
  return <Link href={href}>{body}</Link>;
}

export default function DashboardPage() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [unratedPeople, setUnratedPeople] = useState<UnratedPerson[]>([]);
  const [userRating, setUserRating] = useState<{ average: number; count: number }>({ average: 5.0, count: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        window.location.href = "/login";
        return;
      }

      const [userResult] = await Promise.all([getUserById(userId)]);
      if (!userResult.success || !userResult.data) {
        window.location.href = "/login";
        return;
      }

      const dbUser = userResult.data as DashboardUser;
      setUser(dbUser);
      localStorage.setItem("currentUser", JSON.stringify(dbUser));
      localStorage.setItem("userRole", dbUser.role);

      const [lessonsResult, statsResult] = await Promise.all([
        getLessonsForUser(dbUser.id, dbUser.role),
        dbUser.role === "admin"
          ? getDashboardStats()
          : Promise.resolve({ success: true, data: null }),
      ]);

      if (lessonsResult.success && lessonsResult.data) {
        setLessons(lessonsResult.data as LessonItem[]);
      }

      if (dbUser.role === "admin" && statsResult.success && statsResult.data) {
        setAdminStats(statsResult.data as AdminStats);
      }

      if (dbUser.role !== "admin") {
        const [unratedResult, ratingResult] = await Promise.all([
          getUnratedPeopleForUser(dbUser.id, dbUser.role),
          getUserAverageReceivedRating(dbUser.id, dbUser.role),
        ]);
        if (unratedResult.success && unratedResult.data) {
          setUnratedPeople(unratedResult.data as UnratedPerson[]);
        }
        if (ratingResult.success && ratingResult.data) {
          setUserRating(ratingResult.data);
        }
      }

      setIsLoading(false);
    };

    load();
  }, []);

  const now = new Date();

  const scheduled = useMemo(
    () =>
      lessons.filter(
        (l) =>
          ["PENDING", "CONFIRMED"].includes(l.status) &&
          new Date(l.date) >= now,
      ),
    [lessons],
  );

  const completed = useMemo(
    () => lessons.filter((l) => new Date(l.date) < now),
    [lessons],
  );

  const cancelled = useMemo(
    () => lessons.filter((l) => l.status === "CANCELLED"),
    [lessons],
  );

  const completedThisMonth = useMemo(() => {
    return lessons.filter((l) => {
      const d = new Date(l.date);
      return (
        d < now &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
  }, [lessons]);

  if (isLoading || !user) {
    return (
      <div className="flex h-[40vh] items-center justify-center text-slate-500">
        Carregando dashboard...
      </div>
    );
  }

  const handleRate = async (targetId: string, score: number) => {
    if (!user) return;
    const givenBy = user.role as "student" | "teacher";
    const studentId = user.role === "student" ? user.id : targetId;
    const teacherId = user.role === "teacher" ? user.id : targetId;
    await submitRating(studentId, teacherId, score, givenBy);
    setUnratedPeople((prev) => prev.filter((p) => p.id !== targetId));
  };

  return (
    <div className="flex flex-1 flex-col gap-6 bg-slate-50">
      <div>
        <h1 className="font-headline text-3xl font-bold text-slate-900">
          Bem-vindo(a), {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-slate-600">
          Painel em tempo real conectado ao banco de dados.
        </p>
      </div>

      {user.role === "admin" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Alunos Ativos"
              value={adminStats?.students ?? 0}
              description="Contas de aluno ativas"
              icon={Users}
              href="/dashboard/students"
            />
            <StatCard
              title="Professores Ativos"
              value={adminStats?.teachers ?? 0}
              description="Equipe disponível"
              icon={Briefcase}
              href="/dashboard/teachers"
            />
            <StatCard
              title="Aulas Agendadas"
              value={adminStats?.scheduled ?? 0}
              description="Total no sistema"
              icon={CalendarCheck}
              href="/dashboard/minhas-aulas"
            />
            <StatCard
              title="Aulas Concluídas"
              value={adminStats?.completed ?? 0}
              description="Histórico finalizado"
              icon={CheckCircle2}
              href="/dashboard/minhas-aulas"
            />
          </div>

          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-slate-900">
                Próximas Aulas da Plataforma
              </CardTitle>
              <CardDescription>
                Visão operacional para o time administrativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(adminStats?.upcomingLessons || []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-slate-500"
                        >
                          Nenhuma aula agendada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (adminStats?.upcomingLessons || []).map((lesson) => (
                        <TableRow key={lesson.id}>
                          <TableCell>{lesson.student?.name || "N/A"}</TableCell>
                          <TableCell>{lesson.teacher?.name || "N/A"}</TableCell>
                          <TableCell>
                            <Badge className="bg-[#FFC107] text-slate-900">
                              {lesson.subject}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {format(
                              new Date(lesson.date),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR },
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {user.role === "student" ? (
              <>
                <Card className="rounded-3xl border-slate-200 bg-slate-900 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-200">
                      Créditos Disponíveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-extrabold text-[#FFC107]">
                      {user.credits}
                    </p>
                    <Button
                      asChild
                      className="mt-3 rounded-2xl bg-[#FFC107] font-bold text-slate-900 hover:bg-amber-300"
                    >
                      <Link href="/dashboard/packages">Comprar Créditos</Link>
                    </Button>
                  </CardContent>
                </Card>
                <StatCard
                  title="Aulas Agendadas"
                  value={scheduled.length}
                  description="Compromissos futuros"
                  icon={CalendarCheck}
                  href="/dashboard/minhas-aulas"
                />
                <StatCard
                  title="Aulas Concluídas"
                  value={completed.length}
                  description="Histórico total"
                  icon={CheckCircle2}
                  href="/dashboard/historico"
                />
                <StatCard
                  title="Concluídas no Mês"
                  value={completedThisMonth.length}
                  description={format(now, "MMMM 'de' yyyy", { locale: ptBR })}
                  icon={Coins}
                  href="/dashboard/historico"
                />
              </>
            ) : (
              <>
                <StatCard
                  title="Aulas Agendadas"
                  value={scheduled.length}
                  description="Compromissos futuros"
                  icon={CalendarCheck}
                  href="/dashboard/minhas-aulas"
                />
                <StatCard
                  title="Aulas Concluídas"
                  value={completed.length}
                  description="Histórico total"
                  icon={CheckCircle2}
                  href="/dashboard/historico"
                />
                <StatCard
                  title="Aulas Canceladas"
                  value={cancelled.length}
                  description="Total cancelado"
                  icon={XCircle}
                  href="/dashboard/historico"
                />
                <StatCard
                  title="Concluídas no Mês"
                  value={completedThisMonth.length}
                  description={format(now, "MMMM 'de' yyyy", { locale: ptBR })}
                  icon={Coins}
                  href="/dashboard/historico"
                />
              </>
            )}
          </div>

          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-slate-900">Próximas Aulas</CardTitle>
              <CardDescription>
                Agenda real sincronizada com o banco.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>
                        {user.role === "student" ? "Professor" : "Aluno"}
                      </TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduled.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-24 text-center text-slate-500"
                        >
                          Nenhuma aula agendada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      scheduled.slice(0, 8).map((lesson) => (
                        <TableRow key={lesson.id}>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 text-slate-700"
                            >
                              {lesson.subject}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.role === "student"
                              ? lesson.teacher?.name
                              : lesson.student?.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {format(
                              new Date(lesson.date),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR },
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Star className="h-5 w-5 text-[#FFC107]" />
                Feedback
              </CardTitle>
              <CardDescription>
                Avalie suas aulas e veja seu desempenho.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  {unratedPeople.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {unratedPeople.map((person) => (
                        <div
                          key={person.id}
                          className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm"
                        >
                          <Avatar className="h-14 w-14 border-2 border-brand-yellow shadow-md">
                            <AvatarImage src={person.avatarUrl || undefined} alt={person.name} />
                            <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
                              {person.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-bold text-slate-800">{person.name}</p>
                          <p className="text-xs text-slate-500">Como foi sua experiência com a aula?</p>
                          <div className="flex items-center gap-1">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleRate(person.id, i + 1)}
                                  className="transition-transform hover:scale-125"
                                >
                                  <Star className="h-7 w-7 text-[#FFC107] fill-[#FFC107] cursor-pointer" />
                                </button>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-7 w-7 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        Você não tem aulas para avaliar no momento.
                      </p>
                    </div>
                  )}
                </div>

                <div className="md:w-48 flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Seu feedback</p>
                  <Avatar className="h-16 w-16 border-2 border-brand-yellow shadow-md">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                    <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-xl">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-0.5">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5"
                          style={{
                            color: '#FFC107',
                            fill: i < Math.round(userRating.average) ? '#FFC107' : 'none',
                          }}
                        />
                      ))}
                    <span className="text-sm font-bold ml-1" style={{ color: '#FFC107' }}>
                      {userRating.average.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
