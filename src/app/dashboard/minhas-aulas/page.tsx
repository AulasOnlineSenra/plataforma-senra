"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck2, ExternalLink, Video, History, XCircle, Edit, Pencil, Trash2, Search, User as UserIcon, RotateCcw } from "lucide-react";
import { getLessonsForUser, updateLesson, cancelLesson, deleteLesson } from "@/app/actions/bookings";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStudents } from "@/app/actions/users";

const subjectMap: Record<string, string> = {
  'default-subj-1': 'Matemática',
  'default-subj-2': 'Português',
  'default-subj-3': 'Física',
  'default-subj-4': 'Redação',
  'default-subj-5': 'História',
  'default-subj-6': 'Química',
  'default-subj-7': 'Espanhol',
  'default-subj-8': 'Filosofia',
  'default-subj-9': 'Geografia',
  'default-subj-10': 'Inglês',
  'default-subj-11': 'Sociologia',
  'default-subj-12': 'Biologia',
};
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LessonItem = {
  id: string;
  subject: string;
  status: string;
  date: string | Date;
  endDate: string | Date;
  meetingLink?: string | null;
  student?: { id: string; name: string; avatarUrl?: string | null } | null;
  teacher?: { id: string; name: string; avatarUrl?: string | null; videoUrl?: string | null } | null;
  isExperimental?: boolean;
};

export default function MinhasAulasPage() {
  const { toast } = useToast();
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [lessonToEdit, setLessonToEdit] = useState<LessonItem | null>(null);
  const [lessonToCancel, setLessonToCancel] = useState<LessonItem | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<LessonItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    subject: "",
    date: "",
    time: "",
    duration: "90",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [highlightCompleted, setHighlightCompleted] = useState(false);
  const [highlightCancelled, setHighlightCancelled] = useState(false);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [completedStudentFilter, setCompletedStudentFilter] = useState("all");
  const [cancelledStudentFilter, setCancelledStudentFilter] = useState("all");

  const loadLessons = async (currentUserId: string, currentRole: string) => {
    setLoading(true);
    const response = await getLessonsForUser(currentUserId, currentRole);
    if (response.success && response.data) {
      setLessons(response.data as LessonItem[]);
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possivel carregar as aulas.",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    const currentRole = localStorage.getItem("userRole");
    const currentUserId = localStorage.getItem("userId");
    setRole(currentRole);
    setUserId(currentUserId);
    setIsClient(true);

    if (currentRole && currentUserId) {
      loadLessons(currentUserId, currentRole);
      
      if (currentRole === "admin") {
        getStudents().then(res => {
          if (res.success && res.data) {
            setStudents(res.data.map(s => ({ id: s.id, name: s.name })));
          }
        });
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && lessons.length >= 0) {
      const hash = window.location.hash;
      
      if (hash === '#completed-history') {
        setTimeout(() => {
          const element = document.getElementById('completed-history');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        
        setHighlightCompleted(true);
        setTimeout(() => setHighlightCompleted(false), 1500);
      }
      
      if (hash === '#cancelled-history') {
        setTimeout(() => {
          const element = document.getElementById('cancelled-history');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        
        setHighlightCancelled(true);
        setTimeout(() => setHighlightCancelled(false), 1500);
      }
    }
  }, [loading, lessons]);

  const sortedLessons = useMemo(
    () =>
      [...lessons].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [lessons],
  );

  const futureLessons = useMemo(() => {
    const now = new Date();
    return sortedLessons.filter(
      (l) => new Date(l.date) >= now && ['PENDING', 'CONFIRMED', 'scheduled'].includes(l.status),
    );
  }, [sortedLessons]);

  const groupedCompletedLessons = useMemo(() => {
    let filtered = lessons.filter((l) => l.status === "COMPLETED");
    if (completedStudentFilter !== "all") {
      filtered = filtered.filter(l => l.student?.id === completedStudentFilter);
    }
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const groups: { weekLabel: string; lessons: LessonItem[] }[] = [];
    
    filtered.forEach(lesson => {
      const d = new Date(lesson.date);
      const start = startOfWeek(d, { weekStartsOn: 1 });
      const end = endOfWeek(d, { weekStartsOn: 1 });
      const label = `Semana de ${format(start, "dd/MM")} até ${format(end, "dd/MM/yyyy")}`;
      
      let group = groups.find(g => g.weekLabel === label);
      if (!group) {
        group = { weekLabel: label, lessons: [] };
        groups.push(group);
      }
      group.lessons.push(lesson);
    });
    
    return groups;
  }, [lessons, completedStudentFilter]);

  const cancelledLessons = useMemo(() => {
    let filtered = lessons.filter((l) => l.status === "CANCELLED");
    if (cancelledStudentFilter !== "all") {
      filtered = filtered.filter(l => l.student?.id === cancelledStudentFilter);
    }
    // Reverse order: newest first
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [lessons, cancelledStudentFilter]);

  const calendarMarkedDays = useMemo(() => {
    const now = new Date();
    return sortedLessons
      .filter(l => new Date(l.date) >= now && ['PENDING', 'CONFIRMED', 'scheduled'].includes(l.status))
      .map(lesson => new Date(lesson.date));
  }, [sortedLessons]);

  const canEditOrCancel = (lesson: LessonItem) => {
    if (role === "admin") return true;
    if (role === "teacher" && lesson.teacher?.id === userId) return true;
    if (role === "student" && lesson.student?.id === userId) return true;
    return false;
  };

  const handleOpenEditDialog = (lesson: LessonItem) => {
    const lessonDate = new Date(lesson.date);
    setLessonToEdit(lesson);
    setEditFormData({
      subject: lesson.subject,
      date: format(lessonDate, "yyyy-MM-dd"),
      time: format(lessonDate, "HH:mm"),
      duration: "90",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenCancelDialog = (lesson: LessonItem) => {
    setLessonToCancel(lesson);
    setIsCancelDialogOpen(true);
  };

  const handleOpenDeleteDialog = (lesson: LessonItem) => {
    setLessonToDelete(lesson);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!lessonToEdit) return;
    
    setIsSaving(true);
    
    const newDate = new Date(`${editFormData.date}T${editFormData.time}`);
    const durationMinutes = parseInt(editFormData.duration);
    const endDate = new Date(newDate.getTime() + durationMinutes * 60 * 1000);
    
    const result = await updateLesson(lessonToEdit.id, {
      subject: editFormData.subject,
      date: newDate,
      endDate: endDate,
    });

    setIsSaving(false);

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Aula atualizada com sucesso.",
      });
      setIsEditDialogOpen(false);
      setLessonToEdit(null);
      if (role && userId) {
        loadLessons(userId, role);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Não foi possível atualizar a aula.",
      });
    }
  };

  const handleConfirmCancel = async () => {
    if (!lessonToCancel) return;

    const result = await cancelLesson(lessonToCancel.id);

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Aula cancelada com sucesso.",
      });
      setIsCancelDialogOpen(false);
      setLessonToCancel(null);
      if (role && userId) {
        loadLessons(userId, role);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Não foi possível cancelar a aula.",
      });
    }
  };

  const handleConfirmDelete = async (withRefund = false) => {
    if (!lessonToDelete) return;

    setIsRefunding(true);
    try {
      if (withRefund) {
        const res = await fetch('/api/dashboard/refund-credit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: lessonToDelete.student?.id }),
        });
        if (!res.ok) throw new Error('Falha ao restituir crédito');
      }

      const result = await deleteLesson(lessonToDelete.id);
      if (result.success) {
        toast({
          title: "Sucesso",
          description: withRefund ? "Aula excluída e crédito restituído." : "Registro de aula removido do histórico.",
        });
        setIsDeleteDialogOpen(false);
        setLessonToDelete(null);
        if (role && userId) loadLessons(userId, role);
      } else {
        toast({ variant: "destructive", title: "Erro", description: result.error || "Não foi possível excluir o histórico." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setIsRefunding(false);
    }
  };

  const renderTableRow = (lesson: LessonItem) => {
    const studentName = lesson.student?.name || "-";
    const studentAvatar = lesson.student?.avatarUrl;
    const teacherName = lesson.teacher?.name || "-";
    const teacherAvatar = lesson.teacher?.avatarUrl;

    return (
      <TableRow key={lesson.id}>
        {(role === "admin" || role === "teacher") && (
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={studentAvatar || undefined} alt={studentName} />
                <AvatarFallback>{studentName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{studentName}</span>
            </div>
          </TableCell>
        )}
        {(role === "admin" || role === "student") && (
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={teacherAvatar || undefined} alt={teacherName} />
                <AvatarFallback>{teacherName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{teacherName}</span>
            </div>
          </TableCell>
        )}
        <TableCell>{subjectMap[lesson.subject] || lesson.subject}</TableCell>
        <TableCell>
          {lesson.isExperimental ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Experimental</span> : "-"}
        </TableCell>
        <TableCell>
          {format(new Date(lesson.date), "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) + (lesson.endDate ? ' - ' + format(new Date(lesson.endDate), "HH:mm") : '')}
        </TableCell>
        {role === "admin" && (
          <TableCell className="text-right">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleOpenDeleteDialog(lesson)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TableCell>
        )}
      </TableRow>
    );
  };

  const renderEmptyMessage = (message: string) => (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
      {message}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card className="rounded-3xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-white">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <CalendarCheck2 className="h-5 w-5 text-[#FFC107]" />
            Agenda de aulas
          </CardTitle>
          <CardDescription>
            Lista sincronizada com o banco de dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda: Lista de Aulas */}
            <div className="lg:col-span-2 space-y-4">
              {loading && (
                <p className="text-sm text-slate-500">Carregando aulas...</p>
              )}

              {!loading && futureLessons.length === 0 && (
                renderEmptyMessage("Nenhuma aula agendada.")
              )}

              {!loading &&
                futureLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[#f5b000] hover:shadow-[0_0_20px_rgba(245,176,0,0.5)]"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <p className="font-semibold text-slate-900">{subjectMap[lesson.subject] || lesson.subject}</p>
                      {lesson.isExperimental && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Experimental</span>}
                      <p className="text-sm text-slate-600">
                        {(() => {
                          const d = new Date(lesson.date);
                          const end = new Date(lesson.endDate);
                          const time = `às ${format(d, 'HH:mm')} - ${format(end, 'HH:mm')}`;
                          if (isToday(d)) return `Hoje ${format(d, 'dd/MM/yyyy')} ${time}`;
                          if (isTomorrow(d)) return `Amanhã ${format(d, 'dd/MM/yyyy')} ${time}`;
                          return `${format(d, "EEEE dd/MM/yyyy", { locale: ptBR })} ${time}`;
                        })()}
                      </p>
                      <p className="text-sm text-slate-600">
                        {role === "teacher"
                          ? `Aluno: ${lesson.student?.name || "-"}`
                          : role === "admin"
                            ? `Aluno: ${lesson.student?.name || "-"} | Professor: ${lesson.teacher?.name || "-"}`
                            : `Professor: ${lesson.teacher?.name || "-"}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-[-8px] mb-[-8px]">
                      {lesson.teacher?.videoUrl && (
                        <Button
                          asChild
                          className="rounded-2xl bg-slate-900 px-4 text-slate-50 hover:bg-slate-800 h-8"
                        >
                          <a
                            href={lesson.teacher?.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Entrar na Sala
                            <Video className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {canEditOrCancel(lesson) && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenEditDialog(lesson)}
                            className="rounded-2xl"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenCancelDialog(lesson)}
                            className="rounded-2xl text-red-600 hover:text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
              </div>
            ))}
            </div>

            {/* Coluna Direita: Calendário */}
            <div className="lg:col-span-1">
              <div className="border rounded-xl p-4 bg-slate-50">
                <h3 className="font-semibold text-slate-800 mb-3">Calendário</h3>
                {isClient ? (
                  <Calendar 
                    mode="single" 
                    selected={calendarDate} 
                    onSelect={(date) => date && setCalendarDate(date)} 
                    className="w-full" 
                    locale={ptBR}
                    modifiers={{ scheduled: calendarMarkedDays }}
                    modifiersClassNames={{ scheduled: "bg-[#f5b000] text-black font-bold" }}
                  />
                ) : (
                  <div className="h-[300px] bg-muted/50 rounded-md animate-pulse" />
                )}
                
                {/* Legenda */}
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs text-slate-500">
                    <span className="inline-block w-3 h-3 bg-amber-400 rounded-full mr-1"></span>
                    Dias com aulas agendadas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card id="completed-history" className={`rounded-3xl border-2 shadow-sm transition-all duration-500 ${highlightCompleted ? 'border-[#f5b000] bg-amber-50' : 'border-slate-200'}`}>
        <CardHeader className="border-b border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <History className="h-5 w-5 text-green-600" />
                Histórico de aulas realizadas
              </CardTitle>
              <CardDescription>
                Aulas concluídas com sucesso.
              </CardDescription>
            </div>
            {role === "admin" && (
              <div className="w-full sm:w-64">
                <Select value={completedStudentFilter} onValueChange={setCompletedStudentFilter}>
                  <SelectTrigger className="rounded-2xl">
                    <div className="flex items-center gap-2 truncate">
                      <Search className="h-3 w-3 text-slate-400" />
                      <SelectValue placeholder="Filtrar por aluno" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">Todos os alunos</SelectItem>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!loading && groupedCompletedLessons.length === 0 && (
            renderEmptyMessage("Nenhuma aula realizada.")
          )}

          {!loading && groupedCompletedLessons.length > 0 && (
            <ScrollArea className="h-96">
              <div className="overflow-x-auto">
                {groupedCompletedLessons.map(group => (
                  <div key={group.weekLabel} className="mb-6">
                    <h3 className="font-semibold text-slate-800 bg-slate-100 px-3 py-2 rounded-lg mb-2">
                      {group.weekLabel}
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {(role === "admin" || role === "teacher") && <TableHead>Aluno</TableHead>}
                          {(role === "admin" || role === "student") && <TableHead>Professor</TableHead>}
                          <TableHead>Matéria</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Data/Hora</TableHead>
                          {role === "admin" && <TableHead className="text-right">Ações</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.lessons.map(renderTableRow)}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card id="cancelled-history" className={`rounded-3xl border-2 shadow-sm transition-all duration-500 ${highlightCancelled ? 'border-[#f5b000] bg-amber-50' : 'border-slate-200'}`}>
        <CardHeader className="border-b border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <XCircle className="h-5 w-5 text-red-600" />
                Histórico de aulas canceladas
              </CardTitle>
              <CardDescription>
                Aulas canceladas por qualquer motivo.
              </CardDescription>
            </div>
            {role === "admin" && (
              <div className="w-full sm:w-64">
                <Select value={cancelledStudentFilter} onValueChange={setCancelledStudentFilter}>
                  <SelectTrigger className="rounded-2xl">
                    <div className="flex items-center gap-2 truncate">
                      <Search className="h-3 w-3 text-slate-400" />
                      <SelectValue placeholder="Filtrar por aluno" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">Todos os alunos</SelectItem>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!loading && cancelledLessons.length === 0 && (
            renderEmptyMessage("Nenhuma aula cancelada.")
          )}

          {!loading && cancelledLessons.length > 0 && (
            <ScrollArea className="h-96">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead>Matéria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      {role === "admin" && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cancelledLessons.map((lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={lesson.student?.avatarUrl || undefined} alt={lesson.student?.name} />
                              <AvatarFallback>{lesson.student?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{lesson.student?.name || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={lesson.teacher?.avatarUrl || undefined} alt={lesson.teacher?.name} />
                              <AvatarFallback>{lesson.teacher?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{lesson.teacher?.name || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{subjectMap[lesson.subject] || lesson.subject}</TableCell>
                        <TableCell>
                          {lesson.isExperimental ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Experimental</span> : "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(lesson.date), "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        {role === "admin" && (
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setLessonToDelete(lesson);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Aula</DialogTitle>
            <DialogDescription>
              Altere os dados da aula agendada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Matéria</Label>
              <Input
                id="subject"
                value={editFormData.subject}
                onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                placeholder="Ex: Matemática"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={editFormData.time}
                onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <select
                id="duration"
                value={editFormData.duration}
                onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
                <option value="90">90 minutos</option>
                <option value="120">120 minutos</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Aula</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a aula de {lessonToCancel?.subject} marcada para{" "}
              {lessonToCancel && (() => {
                const lessonDate = new Date(lessonToCancel.date);
                const endDate = new Date(lessonDate.getTime() + 90 * 60 * 1000);
                return format(lessonDate, "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) + ' - ' + format(endDate, "HH:mm");
              })()}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-red-600 hover:bg-red-700">
              Sim, cancelar aula
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aula do Histórico</AlertDialogTitle>
            <AlertDialogDescription>
              O que deseja fazer com este registro de aula?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <AlertDialogCancel
                disabled={isRefunding}
                className="sm:flex-1"
                onClick={() => { setIsDeleteDialogOpen(false); setLessonToDelete(null); }}
              >
                Cancelar
              </AlertDialogCancel>
              <Button
                variant="destructive"
                className="sm:flex-1"
                disabled={isRefunding}
                onClick={() => handleConfirmDelete(false)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Confirmar Exclusão
              </Button>
              <Button
                className="sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isRefunding}
                onClick={() => handleConfirmDelete(true)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isRefunding ? 'Processando...' : 'Excluir e Restituir Crédito'}
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
