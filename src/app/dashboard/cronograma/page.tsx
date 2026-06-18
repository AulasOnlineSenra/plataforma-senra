"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay, nextDay, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LayoutGrid, Plus, Trash2, CalendarRange, TrendingUp, BookOpen, Clock } from "lucide-react";
import { getScheduleStructure, createScheduleBlock, deleteScheduleBlock, updateScheduleBlock, checkScheduleAvailability } from "@/app/actions/schedule-structure";
import { getLessonsForSchedule } from "@/app/actions/bookings";
import { getTeachers, getSubjects, getStudents } from "@/app/actions/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type ScheduleBlock = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: string | null;
  color: string | null;
};

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 22;
const totalHours = GRID_END_HOUR - GRID_START_HOUR;
const HOUR_HEIGHT = 60; // 60px per hour
const HALF_HOUR_HEIGHT = 30;

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const defaultColors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-slate-700"];

export default function CronogramaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [allStudents, setAllStudents] = useState<{ id: string; name: string }[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isValidatingAvailability, setIsValidatingAvailability] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [newBlock, setNewBlock] = useState<{ dayOfWeek: number; startTime: string; endTime: string; subject: string; teacherId: string; color: string }>({
    dayOfWeek: 1,
    startTime: "07:00",
    endTime: "08:30",
    subject: "",
    teacherId: "none",
    color: "bg-emerald-500",
  });

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const role = localStorage.getItem("userRole");
    if (id) {
      setUserId(id);
      setUserRole(role);
      loadData(id, role || "student");
      
      if (role === "admin") {
        getStudents().then((res) => {
          if (res.success && res.data) {
            setAllStudents(res.data as any[]);
          }
        });
      }
    }
  }, []);

  const loadData = async (uid: string, role: string) => {
    setLoading(true);
    try {
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 0 });
      const end = endOfWeek(now, { weekStartsOn: 0 });

      const [structRes, lessonsRes, teachersRes, subjectsRes] = await Promise.all([
        getScheduleStructure(uid),
        getLessonsForSchedule(uid, role, start.toISOString(), end.toISOString()),
        getTeachers(),
        getSubjects()
      ]);

      if (structRes.success) setBlocks(structRes.data as any[]);
      if (lessonsRes.success) setLessons(lessonsRes.data as any[]);
      if (teachersRes.success) setTeachers(teachersRes.data as any[]);
      if (subjectsRes.success) setSubjects(subjectsRes.data as any[]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const validate = async () => {
      if (newBlock.teacherId && newBlock.teacherId !== "none" && newBlock.startTime && newBlock.endTime) {
        setIsValidatingAvailability(true);
        const res = await checkScheduleAvailability(
          newBlock.teacherId,
          newBlock.dayOfWeek,
          newBlock.startTime,
          newBlock.endTime,
          editingBlockId || undefined
        );
        if (!res.available) {
          setAvailabilityError(res.error || "Indisponível");
        } else {
          setAvailabilityError(null);
        }
        setIsValidatingAvailability(false);
      } else {
        setAvailabilityError(null);
      }
    };
    if (isDialogOpen) {
      validate();
    }
  }, [newBlock.teacherId, newBlock.dayOfWeek, newBlock.startTime, newBlock.endTime, isDialogOpen, editingBlockId]);

  const handleCellClick = (dayIndex: number, hour: number, isHalfHour: boolean) => {
    const startStr = `${String(hour).padStart(2, '0')}:${isHalfHour ? '30' : '00'}`;
    const endH = isHalfHour ? hour + 1 : hour;
    const endM = isHalfHour ? '00' : '30';
    const endStr = `${String(endH).padStart(2, '0')}:${endM}`;

    setEditingBlockId(null);
    setNewBlock({ ...newBlock, dayOfWeek: dayIndex, startTime: startStr, endTime: endStr, subject: "", teacherId: "none" });
    setIsDialogOpen(true);
  };

  const handleEditBlock = (block: ScheduleBlock) => {
    setNewBlock({
      dayOfWeek: block.dayOfWeek,
      startTime: block.startTime,
      endTime: block.endTime,
      subject: block.subject,
      teacherId: block.teacherId || "none",
      color: block.color || "bg-emerald-500",
    });
    setEditingBlockId(block.id);
    setIsDialogOpen(true);
  };

  const handleSaveBlock = async () => {
    if (!userId || !newBlock.subject) return;
    const dataToSave = {
      ...newBlock,
      userId,
      teacherId: newBlock.teacherId === "none" ? undefined : newBlock.teacherId,
    };
    
    if (editingBlockId) {
      const res = await updateScheduleBlock(editingBlockId, dataToSave as any);
      if (res.success) {
        setBlocks(blocks.map(b => b.id === editingBlockId ? { ...b, ...dataToSave } : b));
        setIsDialogOpen(false);
        setEditingBlockId(null);
        toast({ title: "Bloco atualizado com sucesso" });
      } else {
        toast({ variant: "destructive", title: "Erro ao atualizar", description: res.error });
      }
    } else {
      const res = await createScheduleBlock(dataToSave as any);
      if (res.success) {
        setBlocks([...blocks, res.data as any]);
        setIsDialogOpen(false);
        toast({ title: "Bloco adicionado com sucesso" });
      } else {
        toast({ variant: "destructive", title: "Erro ao salvar", description: res.error });
      }
    }
  };

  const handleAdicionarAoResumo = () => {
    if (blocks.length === 0) {
      toast({ title: "Cronograma vazio", description: "Adicione blocos antes de prosseguir.", variant: "destructive" });
      return;
    }

    const blocksWithoutTeacher = blocks.filter(b => !b.teacherId || b.teacherId === "none");
    if (blocksWithoutTeacher.length > 0) {
      const confirm = window.confirm(`Atenção: Você tem ${blocksWithoutTeacher.length} disciplina(s) sem professor definido no cronograma. Deseja prosseguir apenas com as aulas que possuem professor ou quer voltar para preencher? (Ok para Prosseguir, Cancelar para Voltar)`);
      if (!confirm) return;
    }

    const validBlocks = blocks.filter(b => b.teacherId && b.teacherId !== "none");
    if (validBlocks.length === 0) {
      toast({ title: "Sem professores", description: "Nenhuma aula com professor definido.", variant: "destructive" });
      return;
    }

    const preBookings = validBlocks.map(b => {
      const teacher = teachers.find(t => t.id === b.teacherId);
      const subject = subjects.find(s => s.id === b.subject);
      
      const now = new Date();
      let targetDate = now.getDay() === b.dayOfWeek ? now : nextDay(now, b.dayOfWeek as any);
      const [h, m] = b.startTime.split(':').map(Number);
      targetDate.setHours(h, m, 0, 0);
      
      if (isBefore(targetDate, now)) {
        targetDate = addDays(targetDate, 7);
      }

      return {
        subjectName: subject?.name || b.subject,
        teacherId: b.teacherId,
        teacherName: teacher?.name || "",
        date: targetDate.toISOString(),
        start: b.startTime,
        end: b.endTime,
        isExperimental: false
      };
    });

    localStorage.setItem('checkoutBookings', JSON.stringify(preBookings));
    router.push(`/dashboard/checkout?needed=${preBookings.length}&current=0`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const res = await deleteScheduleBlock(id);
    if (res.success) {
      setBlocks(blocks.filter(b => b.id !== id));
      toast({ title: "Bloco removido" });
    }
  };

  const handleDrop = async (e: React.DragEvent, dayIndex: number, startHour: number, isHalfHour: boolean) => {
    e.preventDefault();
    const blockId = e.dataTransfer.getData("blockId");
    if (!blockId) return;

    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    // Calculate original duration in minutes
    const [sh, sm] = block.startTime.split(':').map(Number);
    const [eh, em] = block.endTime.split(':').map(Number);
    const durationMin = (eh * 60 + em) - (sh * 60 + sm);

    // Calculate new start time
    const newStartStr = `${String(startHour).padStart(2, '0')}:${isHalfHour ? '30' : '00'}`;
    const startMin = startHour * 60 + (isHalfHour ? 30 : 0);
    const endMin = startMin + durationMin;
    const newEndStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

    // Optimistic update
    const updatedBlocks = blocks.map(b => b.id === blockId ? { ...b, dayOfWeek: dayIndex, startTime: newStartStr, endTime: newEndStr } : b);
    setBlocks(updatedBlocks);

    const res = await updateScheduleBlock(blockId, { dayOfWeek: dayIndex, startTime: newStartStr, endTime: newEndStr });
    if (!res.success) {
      toast({ variant: "destructive", title: "Erro ao mover bloco", description: res.error });
      setBlocks(blocks); // Revert
    }
  };

  const filteredTeachers = teachers.filter(t => {
    if (!newBlock.subject || newBlock.subject === "REDAÇÃO" || newBlock.subject === "Estudo Livre") return true;
    
    const selectedSubject = subjects.find(s => s.id === newBlock.subject);
    const subjectName = selectedSubject?.name || newBlock.subject;

    return t.subject === newBlock.subject || 
           t.subject === subjectName ||
           (t.subjects && t.subjects.includes(newBlock.subject)) ||
           (t.subjects && t.subjects.includes(subjectName));
  });

  // KPI Calculations
  const calculateKPIs = () => {
    let plannedMinutes = 0;
    blocks.forEach(b => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      plannedMinutes += (eh * 60 + em) - (sh * 60 + sm);
    });

    let realMinutes = 0;
    const completedLessons = lessons.filter(l => l.status === "COMPLETED" || l.status === "CONFIRMED");
    completedLessons.forEach(l => {
      const start = new Date(l.date).getTime();
      const end = l.endDate ? new Date(l.endDate).getTime() : start + 90 * 60000;
      realMinutes += (end - start) / 60000;
    });

    return { plannedMinutes, realMinutes, totalClasses: completedLessons.length };
  };

  const kpis = calculateKPIs();
  const adherence = kpis.plannedMinutes > 0 ? Math.min(100, Math.round((kpis.realMinutes / kpis.plannedMinutes) * 100)) : 0;

  if (loading) return <div className="p-8 text-center">Carregando cronograma...</div>;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <LayoutGrid className="h-8 w-8 text-brand-yellow" />
            Estrutura do Cronograma
          </h1>
          <p className="text-slate-500 mt-2">
            Planeje sua semana ideal e acompanhe a execução real das suas aulas.
          </p>
        </div>
        <div className="flex flex-col items-end gap-[5px]">
          {userRole === "admin" && allStudents.length > 0 && (
             <Select value={userId || ""} onValueChange={(val) => {
                setUserId(val);
                loadData(val, "student");
             }}>
               <SelectTrigger className="w-[250px] bg-white border-slate-200">
                 <SelectValue placeholder="Selecione um aluno" />
               </SelectTrigger>
               <SelectContent>
                 {allStudents.map((student) => (
                   <SelectItem key={student.id} value={student.id}>
                     {student.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
          )}
          <Button onClick={handleAdicionarAoResumo} className="bg-emerald-600 text-white w-full sm:w-[250px] hover:bg-emerald-700">
            <BookOpen className="mr-2 h-4 w-4" /> Adicionar ao Resumo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-slate-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-brand-yellow/20 p-3 rounded-2xl">
              <CalendarRange className="h-6 w-6 text-brand-yellow" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tempo Planejado (Semanal)</p>
              <p className="text-2xl font-bold text-slate-900">{Math.round(kpis.plannedMinutes / 60)}h {(kpis.plannedMinutes % 60)}m</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-3xl border-slate-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-2xl">
              <Clock className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tempo Executado (Total)</p>
              <p className="text-2xl font-bold text-slate-900">{Math.round(kpis.realMinutes / 60)}h {(kpis.realMinutes % 60)}m</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Aderência ao Plano</p>
              <p className="text-2xl font-bold text-slate-900">{adherence}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <div className="min-w-[800px] bg-white relative">
            {/* Header */}
            <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-20 shadow-sm">
              <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-slate-50"></div>
              {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => (
                <div key={dayIdx} className="flex-1 py-3 text-center border-r border-slate-200 font-semibold text-slate-700 text-sm bg-slate-50">
                  {DAYS_OF_WEEK[dayIdx]}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex relative">
              <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-slate-50">
                {Array.from({ length: totalHours }, (_, i) => GRID_START_HOUR + i).map(h => (
                  <div key={h} style={{ height: `${HOUR_HEIGHT}px` }} className="border-b border-slate-200 pr-2 pt-1 text-right text-xs font-medium text-slate-400">
                    {h}:00
                  </div>
                ))}
              </div>

              {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => (
                <div key={dayIdx} className="relative flex-1 border-r border-slate-200" style={{ height: `${totalHours * HOUR_HEIGHT}px` }}>
                  {/* Grid Lines */}
                  {Array.from({ length: totalHours * 2 }).map((_, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleCellClick(dayIdx, Math.floor(idx / 2) + GRID_START_HOUR, idx % 2 !== 0)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, dayIdx, Math.floor(idx / 2) + GRID_START_HOUR, idx % 2 !== 0)}
                      className={`absolute left-0 right-0 cursor-pointer hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'border-b border-slate-100 border-dashed' : 'border-b border-slate-200'}`}
                      style={{ top: `${idx * HALF_HOUR_HEIGHT}px`, height: `${HALF_HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {/* Blocks */}
                  {blocks.filter(b => b.dayOfWeek === dayIdx).map(block => {
                    const [sh, sm] = block.startTime.split(':').map(Number);
                    const [eh, em] = block.endTime.split(':').map(Number);
                    const startMin = (sh - GRID_START_HOUR) * 60 + sm;
                    const durationMin = (eh * 60 + em) - (sh * 60 + sm);
                    
                    const topPx = (startMin / 60) * HOUR_HEIGHT;
                    const heightPx = (durationMin / 60) * HOUR_HEIGHT;
                    const teacher = teachers.find(t => t.id === block.teacherId);

                    return (
                      <div
                        key={block.id}
                        draggable
                        onClick={(e) => { e.stopPropagation(); handleEditBlock(block); }}
                        onDragStart={(e) => e.dataTransfer.setData("blockId", block.id)}
                        className={`absolute left-1 right-1 rounded-md p-2 text-white shadow-sm overflow-hidden group cursor-pointer ${block.color || 'bg-emerald-500'}`}
                        style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                      >
                        <p className="font-bold text-xs">{subjects.find(s => s.id === block.subject)?.name || block.subject}</p>
                        {teacher && <p className="text-[10px] opacity-90 truncate">({teacher.name})</p>}
                        <p className="text-[10px] opacity-75 mt-0.5">{block.startTime} - {block.endTime}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20"
                          onClick={(e) => handleDelete(e, block.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Bloco ao Cronograma</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Início</label>
                <Input type="time" value={newBlock.startTime} onChange={(e) => setNewBlock({...newBlock, startTime: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fim</label>
                <Input type="time" value={newBlock.endTime} onChange={(e) => setNewBlock({...newBlock, endTime: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Matéria / Atividade</label>
              <Select value={newBlock.subject} onValueChange={(val) => setNewBlock({...newBlock, subject: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                  <SelectItem value="REDAÇÃO">REDAÇÃO</SelectItem>
                  <SelectItem value="Estudo Livre">Estudo Livre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Professor (Opcional)</label>
              <Select value={newBlock.teacherId} onValueChange={(val) => setNewBlock({...newBlock, teacherId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {filteredTeachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex gap-2">
                {defaultColors.map(color => (
                  <div 
                    key={color} 
                    className={`h-6 w-6 rounded-full cursor-pointer ${color} ${newBlock.color === color ? 'ring-2 ring-offset-2 ring-slate-800' : ''}`}
                    onClick={() => setNewBlock({...newBlock, color})}
                  />
                ))}
              </div>
            </div>
            {availabilityError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm font-medium">{availabilityError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleSaveBlock} 
              className="bg-brand-yellow text-slate-900 hover:bg-amber-400"
              disabled={!!availabilityError || isValidatingAvailability}
            >
              {isValidatingAvailability ? "Verificando..." : "Salvar Bloco"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
