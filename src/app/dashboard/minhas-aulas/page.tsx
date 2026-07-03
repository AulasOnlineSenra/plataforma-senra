"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, addDays, eachDayOfInterval, isSameDay, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck2, ExternalLink, Video, History, XCircle, Edit, Pencil, Trash2, Search, User as UserIcon, RotateCcw, LayoutGrid, List, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { getLessonsForUser, updateLesson, cancelLesson, deleteLesson } from "@/app/actions/bookings";
import { getCachedLessons, setCachedLessons } from "@/lib/lessons-cache";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  cancelReason?: string | null;
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
  const [completedMonthFilter, setCompletedMonthFilter] = useState(() => format(new Date(), "MM/yyyy"));
  const [cancelledStudentFilter, setCancelledStudentFilter] = useState("all");
  const [cancelledMonthFilter, setCancelledMonthFilter] = useState(() => format(new Date(), "MM/yyyy"));
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [gridWeekStart, setGridWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [openMenuLessonId, setOpenMenuLessonId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [openMenuLesson, setOpenMenuLesson] = useState<LessonItem | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [cancelReason, setCancelReason] = useState<string>('');
  const [deleteReason, setDeleteReason] = useState<string>('');

  const loadLessons = async (currentUserId: string, currentRole: string) => {
    // 1. Load from cache first for instant feedback
    const cached = getCachedLessons(currentUserId);
    if (cached) {
      setLessons(cached as LessonItem[]);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // 2. Load fresh data from API
    const response = await getLessonsForUser(currentUserId, currentRole);
    if (response.success && response.data) {
      setLessons(response.data as LessonItem[]);
      setCachedLessons(currentUserId, response.data);
    } else if (!cached) {
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

  // Current-time ticker — updates every 30 seconds
  useEffect(() => {
    const tick = () => setCurrentTime(new Date());
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close grid menu on outside click
  useEffect(() => {
    if (!openMenuLessonId) return;
    const close = () => setOpenMenuLessonId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenuLessonId]);

  const handleMenuOpen = (e: React.MouseEvent, lesson: LessonItem) => {
    e.stopPropagation();
    if (openMenuLessonId === lesson.id) {
      setOpenMenuLessonId(null);
      setOpenMenuLesson(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, left: rect.right - 148 });
    setOpenMenuLessonId(lesson.id);
    setOpenMenuLesson(lesson);
  };

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

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    lessons.filter(l => l.status === "COMPLETED").forEach(l => {
      months.add(format(new Date(l.date), "MM/yyyy"));
    });
    return Array.from(months).sort((a, b) => {
      const [mA, yA] = a.split("/");
      const [mB, yB] = b.split("/");
      if (yA !== yB) return Number(yB) - Number(yA);
      return Number(mB) - Number(mA);
    });
  }, [lessons]);

  const groupedCompletedLessons = useMemo(() => {
    let filtered = lessons.filter((l) => l.status === "COMPLETED");
    if (completedStudentFilter !== "all") {
      filtered = filtered.filter(l => l.student?.id === completedStudentFilter);
    }
    if (completedMonthFilter !== "all") {
      filtered = filtered.filter(l => {
        const d = new Date(l.date);
        return format(d, "MM/yyyy") === completedMonthFilter;
      });
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

  const groupedCancelledLessons = useMemo(() => {
    let filtered = lessons.filter((l) => l.status === "CANCELLED");
    if (cancelledStudentFilter !== "all") {
      filtered = filtered.filter(l => l.student?.id === cancelledStudentFilter);
    }
    if (cancelledMonthFilter !== "all") {
      filtered = filtered.filter(l => {
        const d = new Date(l.date);
        return format(d, "MM/yyyy") === cancelledMonthFilter;
      });
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
  }, [lessons, cancelledStudentFilter, cancelledMonthFilter]);

  const calendarMarkedDays = useMemo(() => {
    const now = new Date();
    return sortedLessons
      .filter(l => new Date(l.date) >= now && ['PENDING', 'CONFIRMED', 'scheduled'].includes(l.status))
      .map(lesson => new Date(lesson.date));
  }, [sortedLessons]);

  // Grid view helpers
  const gridWeekDays = useMemo(() => {
    return eachDayOfInterval({ start: gridWeekStart, end: addDays(gridWeekStart, 6) });
  }, [gridWeekStart]);

  const lessonsInGridWeek = useMemo(() => {
    const weekEnd = addDays(gridWeekStart, 7);
    return lessons.filter(l => {
      const d = new Date(l.date);
      return d >= gridWeekStart && d < weekEnd;
    });
  }, [lessons, gridWeekStart]);

  // Build time slots from earliest to latest lesson in week (min 07:00 - 22:00)
  const gridTimeSlots = useMemo(() => {
    const slots: string[] = [];
    let startHour = 7;
    let endHour = 22;
    if (lessonsInGridWeek.length > 0) {
      const hours = lessonsInGridWeek.map(l => new Date(l.date).getHours());
      startHour = Math.min(7, ...hours);
      const endHours = lessonsInGridWeek.map(l => l.endDate ? new Date(l.endDate).getHours() : new Date(l.date).getHours() + 2);
      endHour = Math.max(22, ...endHours);
    }
    for (let h = startHour; h <= endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
  }, [lessonsInGridWeek]);

  const getLessonsForDay = (day: Date) => {
    return lessonsInGridWeek.filter(l => isSameDay(new Date(l.date), day));
  };

  const getLessonsForDayAndSlot = (day: Date, slotHour: number) => {
    return lessonsInGridWeek.filter(l => {
      const d = new Date(l.date);
      return isSameDay(d, day) && d.getHours() === slotHour;
    });
  };

  const getStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'bg-green-100 border-green-400 text-green-800';
    if (status === 'CANCELLED') return 'bg-red-100 border-red-400 text-red-700 opacity-60';
    return 'bg-amber-100 border-[#f5b000] text-slate-900'; // scheduled
  };

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

    const result = await cancelLesson(lessonToCancel.id, cancelReason.trim() || undefined);

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Aula cancelada com sucesso.",
      });
      setIsCancelDialogOpen(false);
      setLessonToCancel(null);
      setCancelReason('');
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

      const result = await cancelLesson(lessonToDelete.id, deleteReason.trim() || "Removida do histórico pelo administrador.");
      if (result.success) {
        toast({
          title: "Sucesso",
          description: withRefund ? "Aula excluída e crédito restituído." : "Registro de aula removido do histórico.",
        });
        setIsDeleteDialogOpen(false);
        setLessonToDelete(null);
        setDeleteReason('');
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

    const handleBulkDelete = async (withRefund = false) => {
    setIsRefunding(true);
    try {
      const idsToDelete = bulkDeleteTarget === 'completed' ? selectedCompleted : selectedCancelled;
      
      if (bulkDeleteTarget === 'completed') {
        for (const id of idsToDelete) {
          await cancelLesson(id, deleteReason.trim() || "Removida do histÃ³rico em massa.");
        }
      } else {
        for (const id of idsToDelete) {
          await deleteLesson(id);
        }
      }
      
      toast({
        title: "Sucesso",
        description: +idsToDelete.length + " aula(s) removida(s).",
      });
      setIsBulkDeleteDialogOpen(false);
      setDeleteReason('');
      if (bulkDeleteTarget === 'completed') setSelectedCompleted([]);
      else setSelectedCancelled([]);
      if (role && userId) loadLessons(userId, role);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setIsRefunding(false);
    }
  };

  const renderTableRow = (lesson: LessonItem, type: 'completed' | 'cancelled') => {
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
          {lesson.isExperimental ? <span className="text-[11px] font-bold text-emerald-600 px-1.5 py-0.5 rounded uppercase">Experimental</span> : "-"}
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
      {/* Page header with view toggle */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            title="Visualização em lista"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="h-4 w-4" />
            Lista
          </button>
          <button
            onClick={() => {
              setViewMode('grid');
              setGridWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
            }}
            title="Visualização em grade"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Grade
          </button>
        </div>
      </div>

      {/* ===== GRID VIEW ===== */}
      {viewMode === 'grid' && (() => {
        const HOUR_HEIGHT = 64; // px per hour
        const GRID_START_HOUR = gridTimeSlots.length > 0 ? parseInt(gridTimeSlots[0].split(':')[0]) : 7;
        const GRID_END_HOUR = gridTimeSlots.length > 0 ? parseInt(gridTimeSlots[gridTimeSlots.length - 1].split(':')[0]) + 1 : 22;
        const totalHours = GRID_END_HOUR - GRID_START_HOUR;
        const now = new Date();

        return (
          <Card className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-200 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-[#FFC107]" />
                  <div>
                    <CardTitle className="text-slate-900">Agenda em Grade</CardTitle>
                    <CardDescription>
                      {format(gridWeekStart, "dd/MM")} – {format(addDays(gridWeekStart, 6), "dd/MM/yyyy")}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setGridWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl"
                    onClick={() => setGridWeekStart(d => addDays(d, -7))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl"
                    onClick={() => setGridWeekStart(d => addDays(d, 7))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[620px]">
                {/* ----- STICKY HEADER: day names ----- */}
                <div className="sticky top-0 z-20 flex border-b border-slate-200 bg-white shadow-sm">
                  {/* Corner spacer aligned with the time label column */}
                  <div className="w-14 flex-shrink-0 border-r border-slate-100 bg-slate-50" />
                  {gridWeekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={`flex flex-1 flex-col items-center justify-center border-r border-slate-100 py-2.5 last:border-r-0 ${
                        isToday(day) ? 'bg-[#fffbeb]' : 'bg-white'
                      }`}
                    >
                      <span className={`text-[10px] font-semibold uppercase tracking-widest ${
                        isToday(day) ? 'text-[#c47f00]' : 'text-slate-400'
                      }`}>
                        {format(day, 'EEE', { locale: ptBR })}
                      </span>
                      <span
                        className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                          isToday(day) ? 'bg-[#f5b000] text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ----- GRID BODY: time labels + day columns ----- */}
                <div className="flex">
                  {/* Time labels */}
                  <div className="w-14 flex-shrink-0 border-r border-slate-100 bg-slate-50">
                    {Array.from({ length: totalHours }, (_, i) => GRID_START_HOUR + i).map(h => (
                      <div
                        key={h}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="flex items-start justify-end border-b border-slate-100 pr-2 pt-1 text-[11px] font-medium text-slate-400"
                      >
                        {`${String(h).padStart(2, '0')}:00`}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {gridWeekDays.map((day) => {
                    const dayLessons = getLessonsForDay(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={`relative flex-1 border-r border-slate-100 last:border-r-0 ${
                          isToday(day) ? 'bg-amber-50/20' : ''
                        }`}
                        style={{ height: `${totalHours * HOUR_HEIGHT}px` }}
                      >
                        {/* Hour separator lines */}
                        {Array.from({ length: totalHours }, (_, i) => (
                          <div
                            key={i}
                            className="absolute left-0 right-0 border-b border-slate-100"
                            style={{ top: `${(i + 1) * HOUR_HEIGHT}px` }}
                          />
                        ))}
                        {/* Half-hour dashed lines */}
                        {Array.from({ length: totalHours }, (_, i) => (
                          <div
                            key={`half-${i}`}
                            className="absolute left-0 right-0 border-b border-dashed border-slate-100"
                            style={{ top: `${i * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                          />
                        ))}

                        {/* Lesson blocks */}
                        {dayLessons.map((lesson) => {
                          const start = new Date(lesson.date);
                          const end = lesson.endDate
                            ? new Date(lesson.endDate)
                            : new Date(start.getTime() + 90 * 60000);
                          const startMinutes = (start.getHours() - GRID_START_HOUR) * 60 + start.getMinutes();
                          const durationMinutes = (end.getTime() - start.getTime()) / 60000;
                          const topPx = (startMinutes / 60) * HOUR_HEIGHT;
                          const heightPx = Math.max(24, (durationMinutes / 60) * HOUR_HEIGHT);

                          const personName = role === 'student'
                            ? lesson.teacher?.name
                            : lesson.student?.name;
                          const teacherName = role === 'admin' ? lesson.teacher?.name : null;
                          const videoUrl = lesson.teacher?.videoUrl;
                          const isFutureScheduled = new Date(lesson.date) >= now &&
                            ['PENDING', 'CONFIRMED', 'scheduled'].includes(lesson.status);

                          return (
                            <div
                              key={lesson.id}
                              style={{
                                top: `${topPx}px`,
                                height: `${heightPx}px`,
                                width: 'calc(100% - 4px)',
                                left: '2px',
                              }}
                              className={`absolute overflow-visible rounded-lg border-l-4 px-1.5 py-0.5 text-[11px] leading-tight shadow-sm ${
                                getStatusColor(lesson.status)
                              }`}
                            >
                              <div className="flex items-start justify-between gap-0.5">
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <p className="truncate font-semibold">{subjectMap[lesson.subject] || lesson.subject}</p>
                                  {lesson.isExperimental && (
                                    <span className="text-[9px] font-bold text-emerald-600 uppercase">Experimental</span>
                                  )}
                                  {personName && (
                                    <p className={`truncate text-[10px] ${role === 'student' ? 'text-blue-700 font-medium opacity-100' : 'opacity-70'}`}>
                                      {personName}
                                    </p>
                                  )}
                                  {teacherName && (
                                    <p className="truncate text-[10px] text-blue-700 font-medium opacity-100 italic">
                                      {teacherName}
                                    </p>
                                  )}
                                  <p className="opacity-60">{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</p>
                                </div>

                                {/* Three-dot menu for future scheduled lessons */}
                                {isFutureScheduled && (
                                  <div className="relative flex-shrink-0">
                                    <button
                                      className="flex h-5 w-5 items-center justify-center rounded hover:bg-black/10"
                                      onClick={(e) => handleMenuOpen(e, lesson)}
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {/* Current time indicator — only in today's column */}
                        {isToday(day) && (() => {
                          const nowH = currentTime.getHours();
                          const nowM = currentTime.getMinutes();
                          const nowMinutes = (nowH - GRID_START_HOUR) * 60 + nowM;
                          if (nowMinutes < 0 || nowMinutes > totalHours * 60) return null;
                          const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;
                          return (
                            <div
                              className="pointer-events-none absolute left-0 right-0 z-30"
                              style={{ top: `${nowTop}px` }}
                            >
                              <div className="relative flex items-center">
                                <div className="absolute -left-1 h-2.5 w-2.5 rounded-full bg-[#f5b000] shadow-md" style={{ boxShadow: '0 0 6px #f5b000' }} />
                                <div className="ml-1.5 h-[2px] w-full bg-[#f5b000] opacity-80" />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>

                {lessonsInGridWeek.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
                    <LayoutGrid className="h-10 w-10 opacity-30" />
                    <p className="font-medium">Nenhuma aula nesta semana.</p>
                    <p className="text-sm">Use as setas para navegar para outra semana.</p>
                  </div>
                )}

                {/* Legend */}
                <div className="sticky bottom-0 flex items-center gap-4 border-t border-slate-100 bg-slate-50/90 px-4 py-2 text-[11px] text-slate-500 backdrop-blur-sm">
                  <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border-l-4 border-[#f5b000] bg-amber-100" />Agendada</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border-l-4 border-green-400 bg-green-100" />Concluída</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border-l-4 border-red-400 bg-red-100" />Cancelada</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* ===== LIST VIEW ===== */}
      {viewMode === 'list' && (
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
                      {lesson.isExperimental && <span className="text-[11px] font-bold text-emerald-600 px-1.5 py-0.5 rounded uppercase">Experimental</span>}
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
      )}

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
              <div className="flex w-full sm:w-auto gap-2 items-center">
                {selectedCompleted.length > 0 && (
                  <Button 
                    variant="destructive" 
                    onClick={() => { setBulkDeleteTarget('completed'); setIsBulkDeleteDialogOpen(true); }}
                  >
                    Excluir selecionados ({selectedCompleted.length})
                  </Button>
                )}
                <div className="w-full sm:w-48">
                  <Select value={completedMonthFilter} onValueChange={setCompletedMonthFilter}>
                    <SelectTrigger className="rounded-2xl">
                      <div className="flex items-center gap-2 truncate">
                        <Search className="h-3 w-3 text-slate-400" />
                        <SelectValue placeholder="Mês/Ano" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">Todos os meses</SelectItem>
                      {availableMonths.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                          {role === "admin" && (
                            <TableHead className="w-[40px]">
                              <Checkbox 
                                checked={group.lessons.length > 0 && group.lessons.every(l => selectedCompleted.includes(l.id))}
                                onCheckedChange={(c) => {
                                  const ids = group.lessons.map(l => l.id);
                                  if (c) {
                                    setSelectedCompleted(prev => Array.from(new Set([...prev, ...ids])));
                                  } else {
                                    setSelectedCompleted(prev => prev.filter(id => !ids.includes(id)));
                                  }
                                }}
                              />
                            </TableHead>
                          )}
                          {(role === "admin" || role === "teacher") && <TableHead>Aluno</TableHead>}
                          {(role === "admin" || role === "student") && <TableHead>Professor</TableHead>}
                          <TableHead>Matéria</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Data/Hora</TableHead>
                          {role === "admin" && <TableHead className="text-right">Ações</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.lessons.map(l => renderTableRow(l, 'completed'))}
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
              <div className="flex w-full sm:w-auto gap-2 items-center">
                {selectedCancelled.length > 0 && (
                  <Button 
                    variant="destructive" 
                    onClick={() => { setBulkDeleteTarget('cancelled'); setIsBulkDeleteDialogOpen(true); }}
                  >
                    Excluir selecionados ({selectedCancelled.length})
                  </Button>
                )}
                <div className="w-full sm:w-48">
                  <Select value={cancelledMonthFilter} onValueChange={setCancelledMonthFilter}>
                    <SelectTrigger className="rounded-2xl">
                      <div className="flex items-center gap-2 truncate">
                        <Search className="h-3 w-3 text-slate-400" />
                        <SelectValue placeholder="Mês/Ano" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">Todos os meses</SelectItem>
                      {availableMonths.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
          {!loading && groupedCancelledLessons.length === 0 && (
            renderEmptyMessage("Nenhuma aula cancelada.")
          )}

          {!loading && groupedCancelledLessons.length > 0 && (
            <ScrollArea className="h-96">
              <div className="overflow-x-auto">
                {groupedCancelledLessons.map(group => (
                  <div key={group.weekLabel} className="mb-6">
                    <h3 className="font-semibold text-slate-800 bg-slate-100 px-3 py-2 rounded-lg mb-2">
                      {group.weekLabel}
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {role === "admin" && (
                            <TableHead className="w-[40px]">
                              <Checkbox 
                                checked={group.lessons.length > 0 && group.lessons.every(l => selectedCancelled.includes(l.id))}
                                onCheckedChange={(c) => {
                                  const ids = group.lessons.map(l => l.id);
                                  if (c) {
                                    setSelectedCancelled(prev => Array.from(new Set([...prev, ...ids])));
                                  } else {
                                    setSelectedCancelled(prev => prev.filter(id => !ids.includes(id)));
                                  }
                                }}
                              />
                            </TableHead>
                          )}
                          <TableHead>Aluno</TableHead>
                          <TableHead>Professor</TableHead>
                          <TableHead>Matéria</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Observações</TableHead>
                          {role === "admin" && <TableHead className="text-right">Ações</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.lessons.map(l => renderTableRow(l, 'cancelled'))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
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

      <AlertDialog open={isCancelDialogOpen} onOpenChange={(open) => { setIsCancelDialogOpen(open); if (!open) setCancelReason(''); }}>
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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <Label htmlFor="cancelReason" className="text-sm font-medium text-slate-700">
              Motivo do cancelamento <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Descreva o motivo do cancelamento..."
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
            />
            {!cancelReason.trim() && (
              <p className="mt-1 text-xs text-red-500">O motivo é obrigatório para cancelar a aula.</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700"
              disabled={!cancelReason.trim()}
            >
              Sim, cancelar aula
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setDeleteReason(''); }}>
        <AlertDialogContent className="sm:max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aula do Histórico</AlertDialogTitle>
            <AlertDialogDescription>
              O que deseja fazer com este registro de aula?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 py-2">
            <Label htmlFor="deleteReason" className="text-sm font-medium text-slate-700">
              Observações (Opcional)
            </Label>
            <textarea
              id="deleteReason"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Adicione uma observação sobre esta exclusão..."
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
            />
          </div>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <AlertDialogCancel
                disabled={isRefunding}
                className="sm:flex-1"
                onClick={() => { setIsDeleteDialogOpen(false); setLessonToDelete(null); setDeleteReason(''); }}
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

      {/* ===== GLOBAL FIXED DROPDOWN MENU FOR GRID VIEW ===== */}
      {openMenuLessonId && openMenuLesson && (
        <div
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="min-w-[160px] rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {openMenuLesson.teacher?.videoUrl && (
            <a
              href={openMenuLesson.teacher.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setOpenMenuLessonId(null)}
            >
              <Video className="h-4 w-4 text-slate-500" /> Entrar na Sala
            </a>
          )}
          {canEditOrCancel(openMenuLesson) && (
            <>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => { setOpenMenuLessonId(null); handleOpenEditDialog(openMenuLesson); }}
              >
                <Pencil className="h-4 w-4 text-slate-500" /> Editar
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => { setOpenMenuLessonId(null); handleOpenCancelDialog(openMenuLesson); }}
              >
                <XCircle className="h-4 w-4" /> Cancelar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

