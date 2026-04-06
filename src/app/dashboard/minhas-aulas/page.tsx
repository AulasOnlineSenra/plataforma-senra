"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck2, ExternalLink, Video, History, XCircle, Edit, Pencil, Trash2 } from "lucide-react";
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
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

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
    } else {
      setLoading(false);
    }
  }, []);

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

  const completedLessons = useMemo(() => {
    return sortedLessons.filter((l) => l.status === "COMPLETED");
  }, [sortedLessons]);

  const cancelledLessons = useMemo(() => {
    return sortedLessons.filter((l) => l.status === "CANCELLED");
  }, [sortedLessons]);

  const calendarMarkedDays = useMemo(() => {
    return futureLessons.map(lesson => new Date(lesson.date));
  }, [futureLessons]);

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

  const handleConfirmDelete = async () => {
    if (!lessonToDelete) return;

    setLoading(true);
    const result = await deleteLesson(lessonToDelete.id);
    setLoading(false);

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Registro de aula removido do histórico.",
      });
      setIsDeleteDialogOpen(false);
      setLessonToDelete(null);
      if (role && userId) {
        loadLessons(userId, role);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Não foi possível excluir o histórico.",
      });
    }
  };

  const renderTableRow = (lesson: LessonItem) => {
    const studentName = lesson.student?.name || "-";
    const studentAvatar = lesson.student?.avatarUrl;
    const teacherName = lesson.teacher?.name || "-";
    const teacherAvatar = lesson.teacher?.avatarUrl;

    return (
      <TableRow key={lesson.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={studentAvatar} alt={studentName} />
              <AvatarFallback>{studentName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{studentName}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={teacherAvatar} alt={teacherName} />
              <AvatarFallback>{teacherName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{teacherName}</span>
          </div>
        </TableCell>
        <TableCell>{lesson.subject}</TableCell>
        <TableCell>
          {format(new Date(lesson.date), "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) + (lesson.endDate ? ' - ' + format(new Date(lesson.endDate), "HH:mm") : '')}
        </TableCell>
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
                    className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <p className="font-semibold text-slate-900">{lesson.subject}</p>
                      <p className="text-sm text-slate-600">
                        {format(new Date(lesson.date), "EEEE dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}{" "}
                        -{" "}
                        {format(new Date(lesson.endDate), "HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-sm text-slate-600">
                        {role === "teacher"
                          ? `Aluno: ${lesson.student?.name || "-"}`
                          : role === "admin"
                            ? `Aluno: ${lesson.student?.name || "-"} | Professor: ${lesson.teacher?.name || "-"}`
                            : `Professor: ${lesson.teacher?.name || "-"}`}
                      </p>
                    </div>

                    {lesson.teacher?.videoUrl && (
                      <Button
                        asChild
                        className="rounded-2xl bg-slate-900 px-4 text-slate-50 hover:bg-slate-800"
                      >
                        <a
                          href={lesson.teacher?.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Video className="mr-2 h-4 w-4" />
                          Entrar na Sala
                          <ExternalLink className="ml-2 h-4 w-4" />
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

      <Card className="rounded-3xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-white">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <History className="h-5 w-5 text-green-600" />
            Histórico de aulas realizadas
          </CardTitle>
          <CardDescription>
            Aulas concluídas com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!loading && completedLessons.length === 0 && (
            renderEmptyMessage("Nenhuma aula realizada.")
          )}

          {!loading && completedLessons.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Matéria</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedLessons.map(renderTableRow)}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-white">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <XCircle className="h-5 w-5 text-red-600" />
            Histórico de aulas canceladas
          </CardTitle>
          <CardDescription>
            Aulas canceladas por qualquer motivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!loading && cancelledLessons.length === 0 && (
            renderEmptyMessage("Nenhuma aula cancelada.")
          )}

          {!loading && cancelledLessons.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Matéria</TableHead>
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
                            <AvatarImage src={lesson.student?.avatarUrl} alt={lesson.student?.name} />
                            <AvatarFallback>{lesson.student?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{lesson.student?.name || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={lesson.teacher?.avatarUrl} alt={lesson.teacher?.name} />
                            <AvatarFallback>{lesson.teacher?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{lesson.teacher?.name || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{lesson.subject}</TableCell>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro do Histórico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover permanentemente este registro de aula cancelada do histórico? 
              Esta ação não pode ser desfeita e o registro sumirá de todas as visões do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setLessonToDelete(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
