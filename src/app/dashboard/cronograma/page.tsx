"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LayoutGrid, Plus, Trash2, CalendarRange, TrendingUp, BookOpen, Clock } from "lucide-react";
import { getScheduleStructure, createScheduleBlock, deleteScheduleBlock } from "@/app/actions/schedule-structure";
import { getLessonsForUser } from "@/app/actions/bookings";
import { getTeachers } from "@/app/actions/users";
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
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      loadData(id, role || "student");
    }
  }, []);

  const loadData = async (uid: string, role: string) => {
    setLoading(true);
    try {
      const [structRes, lessonsRes, teachersRes] = await Promise.all([
        getScheduleStructure(uid),
        getLessonsForUser(uid, role),
        getTeachers()
      ]);

      if (structRes.success) setBlocks(structRes.data as any[]);
      if (lessonsRes.success) setLessons(lessonsRes.data as any[]);
      if (teachersRes.success) setTeachers(teachersRes.data as any[]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCellClick = (dayIndex: number, hour: number, isHalfHour: boolean) => {
    const startStr = `${String(hour).padStart(2, '0')}:${isHalfHour ? '30' : '00'}`;
    const endH = isHalfHour ? hour + 1 : hour;
    const endM = isHalfHour ? '00' : '30';
    const endStr = `${String(endH).padStart(2, '0')}:${endM}`;

    setNewBlock({ ...newBlock, dayOfWeek: dayIndex, startTime: startStr, endTime: endStr });
    setIsDialogOpen(true);
  };

  const handleSaveBlock = async () => {
    if (!userId || !newBlock.subject) return;
    const dataToSave = {
      ...newBlock,
      userId,
      teacherId: newBlock.teacherId === "none" ? undefined : newBlock.teacherId,
    };
    const res = await createScheduleBlock(dataToSave as any);
    if (res.success) {
      setBlocks([...blocks, res.data as any]);
      setIsDialogOpen(false);
      toast({ title: "Bloco adicionado com sucesso" });
    } else {
      toast({ variant: "destructive", title: "Erro ao salvar", description: res.error });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const res = await deleteScheduleBlock(id);
    if (res.success) {
      setBlocks(blocks.filter(b => b.id !== id));
      toast({ title: "Bloco removido" });
    }
  };

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
        <Button onClick={() => setIsDialogOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800">
          <Plus className="mr-2 h-4 w-4" /> Adicionar Bloco
        </Button>
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
        <div className="overflow-x-auto">
          <div className="min-w-[800px] bg-white">
            {/* Header */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <div className="w-16 flex-shrink-0 border-r border-slate-200"></div>
              {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => (
                <div key={dayIdx} className="flex-1 py-3 text-center border-r border-slate-200 font-semibold text-slate-700 text-sm">
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
                        className={`absolute left-1 right-1 rounded-md p-2 text-white shadow-sm overflow-hidden group ${block.color || 'bg-emerald-500'}`}
                        style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                      >
                        <p className="font-bold text-xs">{block.subject}</p>
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
              <Input placeholder="Ex: Matemática, Redação..." value={newBlock.subject} onChange={(e) => setNewBlock({...newBlock, subject: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Professor (Opcional)</label>
              <Select value={newBlock.teacherId} onValueChange={(val) => setNewBlock({...newBlock, teacherId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {teachers.map((t) => (
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveBlock} className="bg-brand-yellow text-slate-900 hover:bg-amber-400">Salvar Bloco</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
