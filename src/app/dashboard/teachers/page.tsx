"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BookOpen, UserPlus, Edit, Trash2, Check, Star, MoreVertical, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { subjects } from "@/lib/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// IMPORTANDO AS FUNÇÕES DO MOTOR
import {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  approveTeacher,
} from "@/app/actions/users";
import { getTeacherAverageRating } from "@/app/actions/ratings";

function TeacherCard({
  teacher,
  currentUser,
  onEdit,
  onDelete,
  onApprove,
  onOpenDetails,
  onToggleVisibility,
}: {
  teacher: any;
  currentUser: any;
  onEdit: (t: any) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onOpenDetails: (id: string) => void;
  onToggleVisibility: (id: string, isHidden: boolean) => void;
}) {
  const isAdmin = currentUser?.role === "admin";
  const isPending = teacher.status === "pending";
  const [rating, setRating] = useState<{ average: number; count: number }>({ average: 5.0, count: 0 });

  useEffect(() => {
    const loadRating = async () => {
      const result = await getTeacherAverageRating(teacher.id);
      if (result.success && result.data) {
        setRating(result.data);
      }
    };
    loadRating();
  }, [teacher.id]);

  const teacherSubjects = (() => {
    let subjList: string[] = [];
    if (teacher.subjects) {
      if (Array.isArray(teacher.subjects)) {
        subjList = teacher.subjects;
      } else if (typeof teacher.subjects === "string") {
        try {
          subjList = JSON.parse(teacher.subjects);
        } catch {
          subjList = [];
        }
      }
    }
    const subjectFallback = teacher.subject ? [teacher.subject] : [];
    return subjList.length > 0 ? subjList : subjectFallback;
  })();

  const teacherEducation = (() => {
    if (!teacher.education) return [];
    
    let eduList = teacher.education;
    
    if (typeof eduList === "string") {
      try {
        eduList = JSON.parse(eduList);
      } catch {
        return [];
      }
    }
    
    if (!Array.isArray(eduList) || eduList.length === 0) return [];
    
    // Função para formatar a formação: university + year, ou university, ou course
    const formatEducation = (edu: any, withIndicator = false) => {
      const remaining = eduList.length - 2;
      const indicator = withIndicator && remaining > 0 ? ` (+${remaining})` : '';
      if (edu.university && edu.conclusionYear) {
        return `${edu.university} - ${edu.conclusionYear}${indicator}`;
      } else if (edu.university) {
        return `${edu.university}${indicator}`;
      } else if (edu.course) {
        return `${edu.course}${indicator}`;
      }
      return null;
    };
    
    // Se tiver 1 formação: mostrar apenas 1
    if (eduList.length === 1) {
      const formatted = formatEducation(eduList[0]);
      if (formatted) {
        return [{ text: formatted, hasIndicator: false }];
      }
      return [];
    }
    
    // Se tiver 2+ formações: mostrar 2 linhas com indicador na 2ª
    const remaining = eduList.length - 2;
    const secondHasIndicator = remaining > 0;
    
    const result = [];
    
    // Primeira formação
    const firstFormatted = formatEducation(eduList[0]);
    if (firstFormatted) {
      result.push({ text: firstFormatted, hasIndicator: false });
    }
    
    // Segunda formação
    const secondFormatted = formatEducation(eduList[1], true);
    if (secondFormatted) {
      result.push({ text: secondFormatted, hasIndicator: secondHasIndicator });
    }
    
    return result;
  })();

  return (
    <Card
      style={{ width: 'calc(100% - 24px)' }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border shadow-sm transition-all cursor-pointer ${
        isPending
          ? "border-blue-400 bg-blue-50/80 hover:border-[#f5b000] hover:shadow-[0_0_16px_2px_#f5b000]"
          : teacher.status === "pending"
            ? "border-amber-300 bg-amber-50/60 hover:border-[#f5b000] hover:shadow-[0_0_16px_2px_#f5b000]"
            : "border-slate-200 bg-white hover:border-[#f5b000] hover:shadow-[0_0_16px_2px_#f5b000]"
      }`}
      onClick={() => onOpenDetails(teacher.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (!isAdmin) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetails(teacher.id);
        }
      }}
    >
      {/* Detalhe de cor no topo do card */}
      <div
        className={`h-16 w-full border-b absolute top-0 left-0 z-0 transition-colors ${
          isPending
            ? "bg-blue-100 border-blue-200"
            : "bg-slate-50 border-slate-100 group-hover:bg-amber-50/50"
        }`}
      ></div>

      {/* Status no canto superior esquerdo */}
      <div className="absolute top-2 left-3 z-10">
        {isPending && (
          <Badge className="border-none bg-blue-100 font-bold text-blue-700 px-3 py-1 rounded-full shadow-none animate-pulse">
            Pendente
          </Badge>
        )}
        {!isPending && (
          <Badge className="border-none bg-emerald-50 font-bold text-emerald-600 px-3 py-1 rounded-full shadow-none">
            Ativo
          </Badge>
        )}
      </div>

      <CardHeader className="items-center text-center pb-2 pt-6 relative z-10">
        {isAdmin && (
          <div className="absolute right-[17px] top-[8px] z-20 flex gap-0.5 rounded-full border border-slate-100 bg-white/80 backdrop-blur-md p-0.5 shadow-sm opacity-100 md:opacity-0 transition-opacity group-hover:opacity-100">
            {teacher.status === "pending" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(teacher.id);
                }}
                title="Aprovar Professor"
              >
                <Check className="h-2.5 w-2.5" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  onClick={(e) => e.stopPropagation()}
                  title="Mais opções"
                >
                  <MoreVertical className="h-2.5 w-2.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(teacher)}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleVisibility(teacher.id, teacher.status === 'hidden')}>
                  {teacher.status === 'hidden' ? (
                    <>
                      <Eye className="mr-2 h-4 w-4" /> Exibir
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" /> Ocultar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    if (confirm("Excluir este professor permanentemente?"))
                      onDelete(teacher.id);
                  }} 
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        

        <div className="relative">
          <Avatar
            className="mb-1 h-20 w-20 border-4 transition-transform group-hover:scale-105 bg-white border-[#f5b000] shadow-[0_0_20px_rgba(245,176,0,0.8)]"
          >
            <AvatarImage
              src={teacher.avatarUrl}
              alt={teacher.name}
              className="object-cover object-center"
            />
            <AvatarFallback className="text-3xl font-bold bg-slate-100 text-slate-400">
              {teacher.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 shadow border" style={{ backgroundColor: '#0f172a' }}>
            {Array(5).fill(0).map((_, i) => (
              <Star
                key={i}
                className="h-3 w-3"
                style={{ color: '#FFC107', fill: i < Math.round(rating.average) ? '#FFC107' : 'none' }}
              />
            ))}
            <span className="text-xs font-bold" style={{ color: '#FFC107' }}>
              {rating.average.toFixed(1)}
            </span>
          </div>
        </div>

        <CardTitle className="font-headline text-base text-slate-900 tracking-tight flex items-center justify-center gap-2 flex-wrap">
          {teacher.name}
        </CardTitle>

        {teacherEducation && (
          <div className="space-y-1 w-full max-w-[calc(100%-1rem)] overflow-hidden">
            {teacherEducation.map((edu: { text: string; hasIndicator: boolean }, idx: number) => (
              <p 
                key={idx} 
                className="text-xs font-medium text-slate-400 truncate w-full overflow-hidden whitespace-nowrap"
                title={edu.text}
              >
                {edu.text}
              </p>
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-px">
          {teacherSubjects.length > 0 ? (
            teacherSubjects.map((subjName: string, idx: number) => (
              <Badge
                key={idx}
                variant="secondary"
                className="border-none bg-transparent font-semibold text-slate-600 px-1 py-0 rounded-full hover:bg-transparent"
              >
                {subjName}
              </Badge>
            ))
          ) : (
            <Badge
              variant="secondary"
              className="border-none bg-transparent font-semibold text-slate-600 px-1 py-0 rounded-full hover:bg-transparent"
            >
              Geral
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 relative z-10 p-0">
      </CardContent>

      <CardFooter className="flex-col gap-1 pb-2 px-6 relative z-10">
        {!isAdmin && (
          <Button
            asChild
            className="w-full h-10 rounded-xl bg-brand-yellow font-bold text-slate-900 shadow-sm transition-all hover:scale-105 hover:bg-brand-yellow/90"
          >
            <Link 
              href={`/dashboard/booking?teacherId=${teacher.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              Agendar Aula
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function TeachersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teacherList, setTeacherList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "active">("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [graphStatusFilter, setGraphStatusFilter] = useState<"all" | "pending" | "active">("all");
  const [graphSubjectFilter, setGraphSubjectFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    subject: "",
  });

  const fetchDBTeachers = async () => {
    setIsLoading(true);
    const storedUser = localStorage.getItem("currentUser");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const showAll = user?.role === "admin";
    const result = await getTeachers(showAll);
    if (result.success && result.data) {
      setTeacherList(result.data);
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível buscar os professores.",
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDBTeachers();
    }
  }, [currentUser]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createTeacher({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      subject: formData.subject,
    });

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Professor cadastrado com sucesso.",
        className: "bg-emerald-600 text-white border-none",
      });
      setIsCreateOpen(false);
      setFormData({ id: "", name: "", email: "", password: "", subject: "" });
      fetchDBTeachers();
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error,
      });
    }
    setIsSubmitting(false);
  };

  const openEditModal = (teacher: any) => {
    setFormData({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      password: "",
      subject: teacher.subject || "",
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateTeacher(formData.id, {
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
    });

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Dados do professor atualizados.",
        className: "bg-emerald-600 text-white border-none",
      });
      setIsEditOpen(false);
      fetchDBTeachers();
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error,
      });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTeacher(id);
    if (result.success) {
      toast({
        title: "Excluído!",
        description: "Professor removido da plataforma.",
      });
      fetchDBTeachers();
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error,
      });
    }
  };

  const handleApprove = async (id: string) => {
    const result = await approveTeacher(id);
    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Professor aprovado com sucesso.",
        className: "bg-emerald-600 text-white border-none",
      });
      fetchDBTeachers();
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Falha ao aprovar professor.",
      });
    }
  };

  const handleToggleVisibility = async (id: string, isCurrentlyHidden: boolean) => {
    const newStatus = isCurrentlyHidden ? 'active' : 'hidden';
    const result = await updateTeacher(id, { status: newStatus });
    if (result.success) {
      toast({
        title: newStatus === 'hidden' ? "Professor ocultado" : "Professor exibido",
        description: newStatus === 'hidden' 
          ? "O professor não aparecerá mais para os alunos."
          : "O professor voltará a aparecer para os alunos.",
        className: "bg-emerald-600 text-white border-none",
      });
      fetchDBTeachers();
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Falha ao alterar visibilidade do professor.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400 animate-pulse font-medium">
        Buscando professores...
      </div>
    );
  }

  return (
    <>
      <div
        id="teacher-list"
        className="mx-auto flex w-full flex-1 flex-col gap-6 md:gap-8"
      >
        {teacherList.length > 0 && currentUser?.role === "admin" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4">
              <h2 className="text-xl font-bold text-slate-900">Análise de Dados</h2>
              <div className="flex gap-3 mt-3 md:mt-0">
                <Select value={graphStatusFilter} onValueChange={(v: "all" | "pending" | "active") => setGraphStatusFilter(v)}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="cursor-pointer">Todos</SelectItem>
                    <SelectItem value="active" className="cursor-pointer">Ativos</SelectItem>
                    <SelectItem value="pending" className="cursor-pointer">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={graphSubjectFilter} onValueChange={setGraphSubjectFilter}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white w-[170px]">
                    <SelectValue placeholder="Disciplina" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="cursor-pointer">Todas</SelectItem>
                    {subjects.map((subj) => (
                      <SelectItem key={subj.id} value={subj.name} className="cursor-pointer">
                        {subj.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Carousel className="w-full">
              <CarouselContent>
                {/* Slide 1: Barras interativas de resumo */}
                <CarouselItem>
                  <Card className="rounded-3xl border border-slate-200 bg-white p-6 h-full">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Métricas da Equipe</CardTitle>
                    </CardHeader>
                    <div className="flex justify-center items-end gap-12 py-8 bg-slate-50 rounded-2xl h-[250px]">
                      {(() => {
                        const filteredForGraph = teacherList.filter(t => {
                          const matchesStatus = graphStatusFilter === "all" || 
                            (graphStatusFilter === "pending" ? t.status === "pending" : t.status !== "pending");
                          let teacherSubjects: string[] = [];
                          if (t.subjects) {
                            if (Array.isArray(t.subjects)) {
                              teacherSubjects = t.subjects;
                            } else if (typeof t.subjects === 'string') {
                              try { teacherSubjects = JSON.parse(t.subjects); } catch {}
                            }
                          }
                          if (t.subject && !teacherSubjects.includes(t.subject)) {
                            teacherSubjects.push(t.subject);
                          }
                          const matchesSubject = graphSubjectFilter === "all" || 
                            teacherSubjects.includes(graphSubjectFilter) || t.subject === graphSubjectFilter;
                          return matchesStatus && matchesSubject;
                        });

                        const activeCount = filteredForGraph.filter(t => t.status !== 'pending').length;
                        const pendingCount = filteredForGraph.filter(t => t.status === 'pending').length;
                        
                        const allSubjects = new Set<string>();
                        filteredForGraph.forEach(t => {
                          if (t.subjects) {
                            if (Array.isArray(t.subjects)) {
                              t.subjects.forEach((s: string) => allSubjects.add(s));
                            } else if (typeof t.subjects === 'string') {
                              try {
                                JSON.parse(t.subjects).forEach((s: string) => allSubjects.add(s));
                              } catch {}
                            }
                          }
                          if (t.subject) allSubjects.add(t.subject);
                        });
                        const subjectCount = allSubjects.size;

                        const maxVal = Math.max(activeCount, pendingCount, subjectCount) || 1;

                        return (
                          <>
                            <div className="flex flex-col items-center cursor-pointer group" onClick={() => setGraphStatusFilter('active')}>
                              <div className="relative">
                                <div 
                                  className="w-16 rounded-t-xl transition-all duration-300 group-hover:opacity-80 group-hover:scale-105"
                                  style={{ 
                                    height: `${(activeCount / maxVal) * 150}px`,
                                    backgroundColor: '#10b981',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                                  }}
                                />
                              </div>
                              <span className="text-lg font-bold text-emerald-600 mt-4">{activeCount}</span>
                              <span className="text-xs font-medium text-slate-500">Ativos</span>
                            </div>

                            <div className="flex flex-col items-center cursor-pointer group" onClick={() => setGraphStatusFilter('pending')}>
                              <div className="relative">
                                <div 
                                  className="w-16 rounded-t-xl transition-all duration-300 group-hover:opacity-80 group-hover:scale-105"
                                  style={{ 
                                    height: `${(pendingCount / maxVal) * 150}px`,
                                    backgroundColor: '#3b82f6',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                                  }}
                                />
                              </div>
                              <span className="text-lg font-bold text-blue-600 mt-4">{pendingCount}</span>
                              <span className="text-xs font-medium text-slate-500">Pendentes</span>
                            </div>

                            <div className="flex flex-col items-center cursor-pointer group" onClick={() => setGraphSubjectFilter('all')}>
                              <div className="relative">
                                <div 
                                  className="w-16 rounded-t-xl transition-all duration-300 group-hover:opacity-80 group-hover:scale-105"
                                  style={{ 
                                    height: `${(subjectCount / maxVal) * 150}px`,
                                    backgroundColor: '#8b5cf6',
                                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
                                  }}
                                />
                              </div>
                              <span className="text-lg font-bold text-violet-600 mt-4">{subjectCount}</span>
                              <span className="text-xs font-medium text-slate-500">Disciplinas</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </Card>
                </CarouselItem>

                {/* Slide 2: Gráfico de Disciplinas */}
                <CarouselItem>
                  <Card className="rounded-3xl border border-slate-200 bg-white p-6 h-full">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Professores por Disciplina</CardTitle>
                    </CardHeader>
                    <div className="bg-slate-50 rounded-2xl p-6 h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(() => {
                            const filteredForGraph = teacherList.filter(t => {
                              const matchesStatus = graphStatusFilter === "all" || 
                                (graphStatusFilter === "pending" ? t.status === "pending" : t.status !== "pending");
                              let teacherSubjects: string[] = [];
                              if (t.subjects) {
                                if (Array.isArray(t.subjects)) {
                                  teacherSubjects = t.subjects;
                                } else if (typeof t.subjects === 'string') {
                                  try { teacherSubjects = JSON.parse(t.subjects); } catch {}
                                }
                              }
                              if (t.subject && !teacherSubjects.includes(t.subject)) {
                                teacherSubjects.push(t.subject);
                              }
                              const matchesSubject = graphSubjectFilter === "all" || 
                                teacherSubjects.includes(graphSubjectFilter) || t.subject === graphSubjectFilter;
                              return matchesStatus && matchesSubject;
                            });

                            const subjectCounts: Record<string, number> = {};
                            filteredForGraph.forEach(t => {
                              let teacherSubjects: string[] = [];
                              if (t.subjects) {
                                if (Array.isArray(t.subjects)) {
                                  teacherSubjects = t.subjects;
                                } else if (typeof t.subjects === 'string') {
                                  try { teacherSubjects = JSON.parse(t.subjects); } catch {}
                                }
                              }
                              if (t.subject && !teacherSubjects.includes(t.subject)) {
                                teacherSubjects.push(t.subject);
                              }
                              teacherSubjects.forEach((s: string) => {
                                subjectCounts[s] = (subjectCounts[s] || 0) + 1;
                              });
                            });
                            return Object.entries(subjectCounts)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 8)
                              .map(([name, value]) => ({ name, value }));
                          })()}
                          margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
                        >
                          <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500 }} angle={-30} textAnchor="end" height={60} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip 
                            cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]}>
                            {/* Gradient-like effect with multiple bars or just a clean color */}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </CarouselItem>

                {/* Slide 3: Distribuição de Status */}
                <CarouselItem>
                  <Card className="rounded-3xl border border-slate-200 bg-white p-6 h-full">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Distribuição de Status</CardTitle>
                    </CardHeader>
                    <div className="bg-slate-50 rounded-2xl p-6 h-[250px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(() => {
                              const active = teacherList.filter(t => t.status !== 'pending').length;
                              const pending = teacherList.filter(t => t.status === 'pending').length;
                              return [
                                { name: 'Ativos', value: active, color: '#10b981' },
                                { name: 'Pendentes', value: pending, color: '#3b82f6' }
                              ];
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={8}
                            dataKey="value"
                          >
                            {/* Color mapping */}
                            <Cell fill="#10b981" />
                            <Cell fill="#3b82f6" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-4 ml-8">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-sm font-semibold text-slate-700">Ativos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-sm font-semibold text-slate-700">Pendentes</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
                {/* Slide 4: Crescimento dos Professores */}
                <CarouselItem>
                  <Card className="rounded-3xl border border-slate-200 bg-white p-6 h-full">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Crescimento da Equipe</CardTitle>
                    </CardHeader>
                    <div className="bg-slate-50 rounded-2xl p-6 h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={(() => {
                            const sortedByDate = [...teacherList].sort((a, b) => 
                              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                            );
                            
                            const growthData: Record<string, number> = {};
                            let runningTotal = 0;
                            
                            sortedByDate.forEach(t => {
                              const month = format(new Date(t.createdAt), 'MMM/yy', { locale: ptBR });
                              runningTotal++;
                              growthData[month] = runningTotal;
                            });
                            
                            return Object.entries(growthData).map(([name, total]) => ({ name, total }));
                          })()}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#f59e0b" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              <div className="flex justify-center gap-2 mt-4">
                 <CarouselPrevious className="static translate-y-0 h-9 w-9 rounded-xl border-slate-200" />
                 <CarouselNext className="static translate-y-0 h-9 w-9 rounded-xl border-slate-200" />
              </div>
            </Carousel>
          </div>
        )}

        {/* HEADER LIMPO E MODERNO */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Corpo Docente
            </h1>
            <p className="mt-1 text-slate-500">
              Gerencie a equipe de professores da plataforma.
            </p>
          </div>

          <div className="flex gap-3 items-center w-full md:w-auto flex-wrap">
            {currentUser?.role === "admin" && (
              <Select value={statusFilter} onValueChange={(v: "all" | "pending" | "active") => setStatusFilter(v)}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="cursor-pointer">Todos</SelectItem>
                  <SelectItem value="active" className="cursor-pointer">Ativos</SelectItem>
                  <SelectItem value="pending" className="cursor-pointer">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white w-[180px]">
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="cursor-pointer">Todas as Disciplinas</SelectItem>
                {subjects.map((subj) => (
                  <SelectItem key={subj.id} value={subj.name} className="cursor-pointer">
                    {subj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {teacherList.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-24 text-slate-400">
            <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-lg font-bold text-slate-600">
              Nenhum professor encontrado.
            </p>
          </div>
        ) : (
          <div className="mt-2">
            <div className={`grid gap-x-0 gap-y-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center`}>
            {(() => {
              const filteredTeachers = teacherList.filter(teacher => {
                const matchesStatus = statusFilter === "all" || 
                  (statusFilter === "pending" ? teacher.status === "pending" : teacher.status === "active" || teacher.status === "hidden");
                
                // Excluir blacklisted da lista principal
                if (teacher.status === 'blacklisted') return false;
                let teacherSubjects: string[] = [];

                if (teacher.subjects) {
                  if (Array.isArray(teacher.subjects)) {
                    teacherSubjects = teacher.subjects;
                  } else if (typeof teacher.subjects === 'string') {
                    try {
                      teacherSubjects = JSON.parse(teacher.subjects);
                    } catch {
                      teacherSubjects = [];
                    }
                  }
                }

                if (teacher.subject && !teacherSubjects.includes(teacher.subject)) {
                  teacherSubjects.push(teacher.subject);
                }

                const matchesSubject = subjectFilter === "all" || 
                  teacherSubjects.includes(subjectFilter);
                return matchesStatus && matchesSubject;
              });

              // Ordenar: ativos primeiro, depois pendentes (quando filtro "all")
              const sortedTeachers = statusFilter === "all"
                ? [...filteredTeachers].sort((a, b) => {
                    // Professores ativos primeiro
                    const aIsActive = a.status !== "pending";
                    const bIsActive = b.status !== "pending";
                    if (aIsActive !== bIsActive) return aIsActive ? -1 : 1;
                    return 0;
                  })
                : statusFilter === "pending"
                ? [...filteredTeachers].sort((a, b) => {
                    // Prioridade 1: Foto de perfil
                    const aHasPhoto = !!(a.avatarUrl && a.avatarUrl.trim() !== "");
                    const bHasPhoto = !!(b.avatarUrl && b.avatarUrl.trim() !== "");
                    if (aHasPhoto !== bHasPhoto) return bHasPhoto ? 1 : -1;

                    // Prioridade 2: Disponibilidade semanal
                    const aHasAvailability = a.Availability && a.Availability.length > 0;
                    const bHasAvailability = b.Availability && b.Availability.length > 0;
                    if (aHasAvailability !== bHasAvailability) return bHasAvailability ? 1 : -1;

                    // Prioridade 3: Formação acadêmica
                    const aHasEducation = !!(a.education && a.education.trim() !== "");
                    const bHasEducation = !!(b.education && b.education.trim() !== "");
                    if (aHasEducation !== bHasEducation) return bHasEducation ? 1 : -1;

                    // Prioridade 4: Disciplinas lecionadas
                    const aHasSubjects = !!(a.subjects && a.subjects.trim() !== "");
                    const bHasSubjects = !!(b.subjects && b.subjects.trim() !== "");
                    if (aHasSubjects !== bHasSubjects) return bHasSubjects ? 1 : -1;

                    // Prioridade 5: Telefone de contato
                    const aHasPhone = !!(a.phone && a.phone.trim() !== "");
                    const bHasPhone = !!(b.phone && b.phone.trim() !== "");
                    if (aHasPhone !== bHasPhone) return bHasPhone ? 1 : -1;

                    // Prioridade 6: Bairro
                    const aHasNeighborhood = !!(a.neighborhood && a.neighborhood.trim() !== "");
                    const bHasNeighborhood = !!(b.neighborhood && b.neighborhood.trim() !== "");
                    if (aHasNeighborhood !== bHasNeighborhood) return bHasNeighborhood ? 1 : -1;

                    // Prioridade 7: Estado
                    const aHasState = !!(a.state && a.state.trim() !== "");
                    const bHasState = !!(b.state && b.state.trim() !== "");
                    if (aHasState !== bHasState) return bHasState ? 1 : -1;

                    // Prioridade 8: Tipo de chave Pix
                    const aHasPixType = !!(a.pixKeyType && a.pixKeyType.trim() !== "");
                    const bHasPixType = !!(b.pixKeyType && b.pixKeyType.trim() !== "");
                    if (aHasPixType !== bHasPixType) return bHasPixType ? 1 : -1;

                    // Prioridade 9: Chave Pix
                    const aHasPixKey = !!(a.pixKey && a.pixKey.trim() !== "");
                    const bHasPixKey = !!(b.pixKey && b.pixKey.trim() !== "");
                    if (aHasPixKey !== bHasPixKey) return bHasPixKey ? 1 : -1;

                    return 0;
                  })
                : filteredTeachers;

              if (sortedTeachers.length === 0) {
                return (
                  <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-slate-400 w-full col-span-full">
                    <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-base font-bold text-slate-500">
                      Nenhum professor encontrado com os filtros selecionados.
                    </p>
                  </div>
                );
              }

              return sortedTeachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  currentUser={currentUser}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onApprove={handleApprove}
                  onOpenDetails={(teacherId) =>
                    router.push(`/dashboard/teacher/${teacherId}`)
                  }
                  onToggleVisibility={handleToggleVisibility}
                />
              ));
            })()}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CRIAR PROFESSOR */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-slate-100 bg-white shadow-xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Novo Professor
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Crie o acesso de um novo professor na plataforma.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">Nome Completo</Label>
              <Input
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Maria Silva"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">
                E-mail de Acesso
              </Label>
              <Input
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="professor@senra.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">
                Matéria Principal
              </Label>
              <Select
                value={formData.subject}
                onValueChange={(v) => setFormData({ ...formData, subject: v })}
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-brand-yellow">
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {subjects.map((subj) => (
                    <SelectItem
                      key={subj.id}
                      value={subj.name}
                      className="cursor-pointer"
                    >
                      {subj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">
                Senha Temporária
              </Label>
              <Input
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="******"
                required
              />
            </div>
            <DialogFooter className="mt-6 gap-3 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl font-bold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-brand-yellow px-8 font-bold text-slate-900 shadow-sm hover:bg-brand-yellow/90"
              >
                {isSubmitting ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDITAR PROFESSOR */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-slate-100 bg-white shadow-xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Editar Professor
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Altere as informações de cadastro deste professor.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">Nome Completo</Label>
              <Input
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">E-mail</Label>
              <Input
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-brand-yellow"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">
                Matéria Principal
              </Label>
              <Select
                value={formData.subject}
                onValueChange={(v) => setFormData({ ...formData, subject: v })}
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-brand-yellow">
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {subjects.map((subj) => (
                    <SelectItem
                      key={subj.id}
                      value={subj.name}
                      className="cursor-pointer"
                    >
                      {subj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-6 gap-3 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl font-bold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-brand-yellow px-8 font-bold text-slate-900 shadow-sm hover:bg-brand-yellow/90"
              >
                {isSubmitting ? "Atualizando..." : "Atualizar Dados"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SEÇÃO BLACKLIST (Apenas Admin) */}
      {currentUser?.role === "admin" && (
        <div className="mt-16 border-t pt-12 pb-24">
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Trash2 className="h-6 w-6 text-red-500" />
              Blacklist
            </h2>
            <p className="text-slate-500">
              Professores que solicitaram exclusão ou foram banidos. Estes usuários não podem se recadastrar.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Professor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Exclusão</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teacherList.filter(t => t.status === 'blacklisted').length > 0 ? (
                    teacherList.filter(t => t.status === 'blacklisted').map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                              <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-slate-900">{teacher.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{teacher.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {format(new Date(teacher.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-emerald-600 font-bold hover:text-emerald-700 hover:bg-emerald-50 rounded-xl"
                            onClick={() => handleApprove(teacher.id)}
                          >
                            Reativar
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                        Nenhum professor na blacklist.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}