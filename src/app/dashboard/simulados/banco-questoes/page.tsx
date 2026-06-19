"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStudents, getUserById, getMyStudents } from "@/app/actions/users";
import {
  createQuestion,
  listDatabaseQuestions,
  deleteQuestion,
  fetchEnemQuestions,
  upsertSimulado,
} from "@/app/actions/simulados";
import { cn } from "@/lib/utils";

// TIPAGENS
type AlternativeInput = { letter: string; text: string; file?: string };

type UnifiedQuestion = {
  id: string;
  source: "enem" | "local";
  title?: string;
  discipline: string;
  subject: string;
  difficulty: string;
  context: string;
  files: string[];
  correctAlternative: string;
  alternatives: AlternativeInput[];
  creatorName?: string;
};

type StudentItem = { id: string; name: string };

const SUBJECTS = [
  "Matemática",
  "Física",
  "Química",
  "Português",
  "Redação",
  "Biologia",
  "História",
  "Geografia",
  "Inglês",
];

const YEARS = Array.from({ length: 16 }, (_, i) => 2024 - i); // 2024 a 2009

export default function BancoQuestoesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentRole, setCurrentRole] = useState<"admin" | "teacher" | "student" | "">("");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros Horizontais
  const [sourceTab, setSourceTab] = useState<"enem" | "local">("enem");
  const [selectedYears, setSelectedYears] = useState<string[]>(["2023"]);
  const [isYearsOpen, setIsYearsOpen] = useState(false);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [isDisciplinesOpen, setIsDisciplinesOpen] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  // Questões retornadas
  const [questions, setQuestions] = useState<UnifiedQuestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Questões selecionadas (Carrinho)
  const [selectedQuestions, setSelectedQuestions] = useState<UnifiedQuestion[]>([]);

  // Modais de Ação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompileModal, setShowCompileModal] = useState(false);

  // Formulário: Criar Questão Autoral
  const [newTitle, setNewTitle] = useState("");
  const [newDiscipline, setNewDiscipline] = useState("Matemática");
  const [newSubject, setNewSubject] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("Médio");
  const [newContext, setNewContext] = useState("");
  const [newCorrectAlternative, setNewCorrectAlternative] = useState("A");
  const [newAlternatives, setNewAlternatives] = useState<AlternativeInput[]>([
    { letter: "A", text: "" },
    { letter: "B", text: "" },
    { letter: "C", text: "" },
    { letter: "D", text: "" },
    { letter: "E", text: "" },
  ]);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  // Formulário: Compilar Simulado
  const [simuladoTitle, setSimuladoTitle] = useState("");
  const [simuladoDesc, setSimuladoDesc] = useState("");
  const [simuladoStudentId, setSimuladoStudentId] = useState("");
  const [simuladoMaxAttempts, setSimuladoMaxAttempts] = useState(1);
  const [simuladoTimeLimit, setSimuladoTimeLimit] = useState(60);
  const [isCompiling, setIsCompiling] = useState(false);

  // Carrega configurações do usuário e lista de alunos
  const loadUserAndStudents = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
      return;
    }

    const userResult = await getUserById(userId);
    if (!userResult.success || !userResult.data) {
      router.push("/login");
      return;
    }

    const dbUser = userResult.data as any;
    setCurrentUserId(dbUser.id);
    setCurrentRole(dbUser.role);

    if (dbUser.role === "student") {
      setIsLoading(false);
      return;
    }

    const studentsResult =
      dbUser.role === "teacher"
        ? await getMyStudents(dbUser.id)
        : await getStudents();

    if (studentsResult.success && studentsResult.data) {
      setStudents(
        (studentsResult.data as any[]).map((s) => ({ id: s.id, name: s.name }))
      );
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadUserAndStudents();
  }, []);

  // Busca de questões dinamicamente baseado nos filtros selecionados
  const fetchQuestions = async () => {
    if (sourceTab === "enem" && selectedYears.length === 0) {
      setQuestions([]);
      return;
    }
    setIsSearching(true);
    try {
      if (sourceTab === "enem") {
        // Busca via API do ENEM
        const promises = selectedYears.map((yearStr) => {
          const year = parseInt(yearStr);
          return fetchEnemQuestions(year, 45, 0);
        });
        const results = await Promise.all(promises);
        let combined: UnifiedQuestion[] = [];
        results.forEach((result) => {
          if (result.success && result.data) {
            const apiQuestions = (result.data.questions || []).map((q: any) => ({
              id: `enem-${q.year}-${q.index}`,
              source: "enem" as const,
              title: `Questão ${q.index} - ENEM ${q.year}`,
              discipline: q.discipline || "Geral",
              subject: q.language || "Geral",
              difficulty: "Médio",
              context: q.context || "",
              files: q.files || [],
              correctAlternative: q.correctAlternative || "",
              alternatives: (q.alternatives || []).map((alt: any) => ({
                letter: alt.letter,
                text: alt.text,
                file: alt.file,
              })),
            }));
            combined = [...combined, ...apiQuestions];
          }
        });
        setQuestions(combined);
      } else {
        // Busca do Banco Local
        const result = await listDatabaseQuestions({});

        if (result.success && result.data) {
          const localQuestions = (result.data as any[]).map((q) => ({
            id: q.id,
            source: "local" as const,
            title: q.title || `Questão Autoral - ID ${q.id.substring(0, 5)}`,
            discipline: q.discipline,
            subject: q.subject,
            difficulty: q.difficulty,
            context: q.context,
            files: q.files || [],
            correctAlternative: q.correctAlternative,
            alternatives: q.alternatives as AlternativeInput[],
            creatorName: q.creator?.name || "Professor",
          }));
          setQuestions(localQuestions);
        } else {
          setQuestions([]);
        }
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao buscar",
        description: "Falha ao carregar as questões.",
      });
    }
    setIsSearching(false);
  };

  useEffect(() => {
    if (currentUserId && currentRole !== "student") {
      fetchQuestions();
    }
  }, [currentUserId, sourceTab, selectedYears]);

  // Filtro client-side de disciplinas e dificuldades
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Filtragem por Disciplinas
      if (selectedDisciplines.length > 0) {
        if (q.source === "enem") {
          // Normaliza disciplina do ENEM para bater com a nossa lista
          const mappedEnemDiscipline = (q.discipline || "").toLowerCase();
          const matches = selectedDisciplines.some((disc) => {
            const d = disc.toLowerCase();
            if (d === "matemática") return mappedEnemDiscipline.includes("matematica");
            if (d === "português" || d === "inglês" || d === "redação") return mappedEnemDiscipline.includes("linguagens");
            if (d === "história" || d === "geografia") return mappedEnemDiscipline.includes("humanas");
            if (d === "física" || d === "química" || d === "biologia") return mappedEnemDiscipline.includes("natureza");
            return false;
          });
          if (!matches) return false;
        } else {
          // Para local, compara a disciplina exata
          if (!selectedDisciplines.includes(q.discipline)) return false;
        }
      }

      // 2. Filtragem por Dificuldade (apenas se tab for local e selecionado algo diferente de 'all')
      if (sourceTab === "local" && filterDifficulty !== "all") {
        if (q.difficulty !== filterDifficulty) return false;
      }

      return true;
    });
  }, [questions, selectedDisciplines, filterDifficulty, sourceTab]);

  // Adicionar/Remover do Carrinho
  const toggleSelectQuestion = (q: UnifiedQuestion) => {
    const exists = selectedQuestions.some((item) => item.id === q.id);
    if (exists) {
      setSelectedQuestions(selectedQuestions.filter((item) => item.id !== q.id));
    } else {
      setSelectedQuestions([...selectedQuestions, q]);
      toast({
        title: "Questão adicionada!",
        description: "A questão foi inclusa no seu rascunho de simulado.",
      });
    }
  };

  // Excluir Questão Local do BD
  const handleDeleteLocalQuestion = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta questão permanentemente do banco?")) return;
    const result = await deleteQuestion(id);
    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Questão removida do banco.",
      });
      fetchQuestions();
      setSelectedQuestions(selectedQuestions.filter((item) => item.id !== id));
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Falha ao deletar.",
      });
    }
  };

  // Criar Questão Autoral
  const handleSaveAuthorialQuestion = async () => {
    if (!newSubject.trim() || !newContext.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha o assunto e o enunciado da questão.",
      });
      return;
    }

    // Validar alternativas vazias
    for (let alt of newAlternatives) {
      if (!alt.text.trim()) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: `Preencha o texto da alternativa ${alt.letter}.`,
        });
        return;
      }
    }

    setIsSavingQuestion(true);
    const result = await createQuestion({
      title: newTitle.trim() || undefined,
      discipline: newDiscipline,
      subject: newSubject.trim(),
      difficulty: newDifficulty,
      context: newContext.trim(),
      correctAlternative: newCorrectAlternative,
      alternatives: newAlternatives,
      creatorId: currentUserId,
    });

    if (result.success) {
      toast({
        title: "Questão Criada! 🎯",
        description: "Ela já está disponível no Acervo Interno.",
      });
      setNewTitle("");
      setNewSubject("");
      setNewContext("");
      setNewAlternatives([
        { letter: "A", text: "" },
        { letter: "B", text: "" },
        { letter: "C", text: "" },
        { letter: "D", text: "" },
        { letter: "E", text: "" },
      ]);
      setShowCreateModal(false);
      setSourceTab("local");
      fetchQuestions();
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Falha ao salvar questão.",
      });
    }
    setIsSavingQuestion(false);
  };

  // Compilar e Criar Simulado
  const handleCompileSimulado = async () => {
    if (!simuladoTitle.trim() || !simuladoStudentId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Dê um título ao simulado e selecione o aluno.",
      });
      return;
    }

    setIsCompiling(true);

    const mappedQuestions = selectedQuestions.map((sq, index) => ({
      id: sq.id,
      title: sq.title || `Questão ${index + 1}`,
      type: "multiple-choice" as const,
      isRequired: true,
      options: sq.alternatives.map((alt) => ({
        id: alt.letter,
        text: alt.text,
        isCorrect: alt.letter === sq.correctAlternative,
      })),
    }));

    const result = await upsertSimulado({
      title: simuladoTitle.trim(),
      description: simuladoDesc.trim(),
      subject: selectedQuestions[0]?.discipline || "Geral",
      creatorId: currentUserId,
      studentId: simuladoStudentId,
      maxAttempts: simuladoMaxAttempts,
      timeLimitMinutes: simuladoTimeLimit,
      questions: mappedQuestions,
    });

    if (result.success) {
      toast({
        title: "Simulado Gerado! 🚀",
        description: "O simulado foi criado com sucesso e enviado ao aluno.",
      });
      setSelectedQuestions([]);
      setShowCompileModal(false);
      router.push("/dashboard/simulados");
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao gerar",
        description: result.error || "Falha ao salvar o simulado.",
      });
    }
    setIsCompiling(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse font-medium">
        Carregando Banco de Questões...
      </div>
    );
  }

  // BLOQUEIO DE ALUNO
  if (currentRole === "student") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Acesso Restrito</h2>
        <p className="text-slate-500 mt-2 max-w-md">
          Apenas professores e administradores podem acessar o Banco de Questões para criar simulados.
        </p>
        <Button
          className="mt-6 rounded-xl bg-slate-900 text-white font-bold px-6 h-12 hover:bg-slate-800"
          onClick={() => router.push("/dashboard/simulados")}
        >
          Voltar para Meus Simulados
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-20 max-w-5xl mx-auto w-full px-12 md:px-20 pb-20">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => router.push("/dashboard/simulados")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-headline text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-brand-yellow" /> Banco de Questões
            </h1>
            <p className="text-sm md:text-base text-slate-500 mt-1 font-medium">
              Misture questões oficiais do ENEM com questões criadas por professores.
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            className="rounded-xl border-slate-300 font-bold h-12 w-full md:w-auto hover:bg-slate-100"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="mr-2 h-5 w-5" /> Criar Questão Autoral
          </Button>
          {selectedQuestions.length > 0 && (
            <Button
              className="rounded-xl bg-brand-yellow text-slate-900 font-bold h-12 w-full md:w-auto hover:bg-amber-400"
              onClick={() => setShowCompileModal(true)}
            >
              Compilar Simulado ({selectedQuestions.length})
            </Button>
          )}
        </div>
      </div>

      {/* PAINEL DE FILTROS HORIZONTAIS NO TOPO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {/* FILTROS PRINCIPAIS */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Abas de Origem */}
            <Button
              variant={sourceTab === "enem" ? "default" : "outline"}
              className={cn(
                "rounded-xl font-bold h-11 px-4",
                sourceTab === "enem" ? "bg-slate-900 text-white" : "border-slate-300 text-slate-700"
              )}
              onClick={() => setSourceTab("enem")}
            >
              Questões do ENEM (Oficiais)
            </Button>
            <Button
              variant={sourceTab === "local" ? "default" : "outline"}
              className={cn(
                "rounded-xl font-bold h-11 px-4",
                sourceTab === "local" ? "bg-slate-900 text-white" : "border-slate-300 text-slate-700"
              )}
              onClick={() => setSourceTab("local")}
            >
              Acervo Interno (Plataforma)
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* Filtro Multi-Select de Anos (Apenas para ENEM) */}
            {sourceTab === "enem" && (
              <div className="relative">
                <Button
                  variant="outline"
                  className="rounded-xl h-11 border-slate-300 bg-slate-50 font-semibold px-4 flex items-center justify-between gap-2 min-w-[140px]"
                  onClick={() => setIsYearsOpen(!isYearsOpen)}
                >
                  <span>
                    {selectedYears.length === 0
                      ? "Selecionar Anos"
                      : selectedYears.length === 1
                      ? `ENEM ${selectedYears[0]}`
                      : `${selectedYears.length} Anos`}
                  </span>
                  <ChevronRight className={cn("h-4 w-4 transition-transform", isYearsOpen && "rotate-90")} />
                </Button>
                {isYearsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsYearsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 max-h-60 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-3 z-50 space-y-2">
                      <p className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">Selecionar Anos</p>
                      <div className="space-y-1">
                        {YEARS.map((y) => {
                          const isChecked = selectedYears.includes(String(y));
                          return (
                            <label key={y} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedYears(selectedYears.filter((item) => item !== String(y)));
                                  } else {
                                    setSelectedYears([...selectedYears, String(y)]);
                                  }
                                }}
                                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                              />
                              <span>ENEM {y}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Filtro Multi-Select de Disciplinas (Visível para ambos) */}
            <div className="relative">
              <Button
                variant="outline"
                className="rounded-xl h-11 border-slate-300 bg-slate-50 font-semibold px-4 flex items-center justify-between gap-2 min-w-[180px]"
                onClick={() => setIsDisciplinesOpen(!isDisciplinesOpen)}
              >
                <span>
                  {selectedDisciplines.length === 0
                    ? "Todas Disciplinas"
                    : selectedDisciplines.length === 1
                    ? selectedDisciplines[0]
                    : `${selectedDisciplines.length} Disciplinas`}
                </span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", isDisciplinesOpen && "rotate-90")} />
              </Button>
              {isDisciplinesOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDisciplinesOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-3 z-50 space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disciplinas</p>
                      {selectedDisciplines.length > 0 && (
                        <button
                          className="text-xs font-bold text-red-500 hover:text-red-700"
                          onClick={() => setSelectedDisciplines([])}
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {SUBJECTS.map((s) => {
                        const isChecked = selectedDisciplines.includes(s);
                        return (
                          <label key={s} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedDisciplines(selectedDisciplines.filter((item) => item !== s));
                                } else {
                                  setSelectedDisciplines([...selectedDisciplines, s]);
                                }
                              }}
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span>{s}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Filtro de Dificuldade (Apenas para Local) */}
            {sourceTab === "local" && (
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="rounded-xl h-11 border-slate-300 bg-slate-50 font-semibold w-40">
                  <SelectValue placeholder="Dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Dificuldades</SelectItem>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* GRILL DE QUESTÕES */}
      {isSearching ? (
        <div className="flex h-[40vh] items-center justify-center flex-col gap-3 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-brand-yellow" />
          <span className="font-semibold text-base">Buscando questões...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed rounded-3xl p-16 text-center max-w-2xl mx-auto w-full">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-700">Nenhuma questão encontrada</h3>
          <p className="text-slate-400 text-sm mt-1">
            Tente ajustar os filtros horizontais no topo.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredQuestions.map((q) => {
            const isSelected = selectedQuestions.some((item) => item.id === q.id);
            return (
              <Card
                key={q.id}
                className={cn(
                  "rounded-3xl border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all",
                  isSelected && "border-brand-yellow border-2"
                )}
              >
                {/* Meta-badges da questão */}
                <CardHeader className="bg-slate-50/50 border-b pb-4 flex flex-row flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-slate-800 text-white font-bold">
                      {q.discipline}
                    </Badge>
                    <Badge variant="outline" className="border-slate-300 text-slate-600 bg-white font-semibold">
                      {q.subject}
                    </Badge>
                    <Badge
                      className={cn(
                        "font-bold",
                        q.difficulty === "Fácil" && "bg-green-50 text-green-700 border-green-200",
                        q.difficulty === "Médio" && "bg-amber-50 text-amber-700 border-amber-200",
                        q.difficulty === "Difícil" && "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {q.difficulty}
                    </Badge>
                    {q.source === "local" && (
                      <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                        Criada por {q.creatorName}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {q.source === "local" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                        onClick={() => handleDeleteLocalQuestion(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "rounded-xl font-bold h-9 px-4",
                        isSelected ? "bg-brand-yellow text-slate-900 hover:bg-amber-400 border-none" : "border-slate-300"
                      )}
                      onClick={() => toggleSelectQuestion(q)}
                    >
                      {isSelected ? "Selecionada" : "Selecionar"}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {/* Contexto / Enunciado */}
                  <div className="text-slate-800 font-medium text-base leading-relaxed whitespace-pre-line">
                    {q.title && <h3 className="font-bold text-slate-900 mb-2">{q.title}</h3>}
                    {q.context}
                  </div>

                  {/* Imagens de apoio */}
                  {q.files.length > 0 && (
                    <div className="flex flex-wrap gap-4 justify-center py-2 bg-slate-50 rounded-2xl border border-slate-100">
                      {q.files.map((fileUrl, idx) => (
                        <img
                          key={idx}
                          src={fileUrl}
                          alt="Ilustração da questão"
                          className="max-h-64 rounded-xl object-contain border bg-white"
                        />
                      ))}
                    </div>
                  )}

                  {/* Alternativas */}
                  <div className="grid gap-3">
                    {q.alternatives.map((alt) => {
                      const isCorrect = alt.letter === q.correctAlternative;
                      return (
                        <div
                          key={alt.letter}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-2xl border transition-colors",
                            isCorrect ? "bg-green-50/50 border-green-300" : "bg-white border-slate-200"
                          )}
                        >
                          <Badge
                            className={cn(
                              "w-7 h-7 flex items-center justify-center font-bold text-sm shrink-0",
                              isCorrect ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700 shadow-none border"
                            )}
                          >
                            {alt.letter}
                          </Badge>
                          <div className="text-slate-700 font-medium pt-0.5 leading-relaxed">
                            {alt.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* SEÇÃO FLUTUANTE DE COMPILAR SIMULADO */}
      {selectedQuestions.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 z-40 border border-slate-800 animate-in fade-in slide-in-from-bottom-6 duration-300 w-[90%] max-w-2xl justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-brand-yellow animate-pulse shrink-0" />
            <div>
              <p className="font-bold text-sm text-slate-300">Simulado em construção</p>
              <p className="text-xs text-slate-400">
                Você selecionou <strong className="text-brand-yellow">{selectedQuestions.length}</strong> questão(ões).
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-slate-300 hover:text-white rounded-xl hover:bg-slate-800"
              onClick={() => setSelectedQuestions([])}
            >
              Limpar
            </Button>
            <Button
              className="bg-brand-yellow text-slate-900 font-bold rounded-xl h-11 px-5 hover:bg-amber-400"
              onClick={() => setShowCompileModal(true)}
            >
              Compilar Prova <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* MODAL 1: CRIAR QUESTÃO AUTORAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col animate-in scale-in duration-200">
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Criar Questão Autoral</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adicione perguntas personalizadas ao acervo de professores da plataforma.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl h-9 w-9"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Título / Identificador (Opcional)</Label>
                  <Input
                    placeholder="Ex: Questão 1 - Geometria Espacial"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Matéria</Label>
                  <Select value={newDiscipline} onValueChange={setNewDiscipline}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Assunto Específico</Label>
                  <Input
                    placeholder="Ex: Trigonometria, Revolução Francesa"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Dificuldade</Label>
                  <Select value={newDifficulty} onValueChange={setNewDifficulty}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fácil">Fácil</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Difícil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="font-bold text-slate-700">Enunciado da Questão / Contexto</Label>
                <Textarea
                  placeholder="Escreva a introdução, dados e pergunta da questão aqui..."
                  rows={4}
                  value={newContext}
                  onChange={(e) => setNewContext(e.target.value)}
                />
              </div>

              {/* Alternativas */}
              <div className="space-y-3">
                <Label className="font-bold text-slate-700">Alternativas (Digite o texto de cada uma)</Label>
                {newAlternatives.map((alt, idx) => (
                  <div key={alt.letter} className="flex items-center gap-3">
                    <Badge className="w-8 h-8 shrink-0 flex items-center justify-center bg-slate-200 text-slate-700 text-lg shadow-none">
                      {alt.letter}
                    </Badge>
                    <Input
                      placeholder={`Texto da alternativa ${alt.letter}`}
                      value={alt.text}
                      onChange={(e) => {
                        const next = [...newAlternatives];
                        next[idx].text = e.target.value;
                        setNewAlternatives(next);
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Gabarito */}
              <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-sm text-green-950">Gabarito Correto</p>
                  <p className="text-xs text-green-700">
                    Defina qual alternativa acima é a correta.
                  </p>
                </div>
                <Select value={newCorrectAlternative} onValueChange={setNewCorrectAlternative}>
                  <SelectTrigger className="w-32 bg-white border-green-200 font-bold text-green-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C", "D", "E"].map((letter) => (
                      <SelectItem key={letter} value={letter} className="font-bold">
                        Letra {letter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 shrink-0">
              <Button
                variant="outline"
                className="w-full rounded-xl h-12 font-bold border-slate-300"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button
                disabled={isSavingQuestion}
                className="w-full rounded-xl bg-slate-900 text-white font-bold h-12 hover:bg-slate-800"
                onClick={handleSaveAuthorialQuestion}
              >
                {isSavingQuestion ? "Salvando..." : "Adicionar ao Banco"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPILAR SIMULADO COM QUESTÕES SELECIONADAS */}
      {showCompileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col animate-in scale-in duration-200">
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Compilar Simulado</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preencha os dados finais para atribuir a prova ao aluno.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl h-9 w-9"
                onClick={() => setShowCompileModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid gap-2">
                <Label className="font-bold text-slate-700">Título do Simulado</Label>
                <Input
                  placeholder="Ex: Simulado Avançado de Medicina - Bio/Quim"
                  value={simuladoTitle}
                  onChange={(e) => setSimuladoTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label className="font-bold text-slate-700">Atribuir ao Aluno</Label>
                <Select value={simuladoStudentId} onValueChange={setSimuladoStudentId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione o aluno destinatário" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Tentativas (Máx)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={simuladoMaxAttempts}
                    onChange={(e) => setSimuladoMaxAttempts(Math.max(1, Number(e.target.value)))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Tempo limite (Minutos)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={simuladoTimeLimit}
                    onChange={(e) => setSimuladoTimeLimit(Math.max(1, Number(e.target.value)))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="font-bold text-slate-700">Instruções para o Aluno (Opcional)</Label>
                <Textarea
                  placeholder="Mensagem ou dicas antes de começar..."
                  rows={3}
                  value={simuladoDesc}
                  onChange={(e) => setSimuladoDesc(e.target.value)}
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-700" />
                <p className="text-xs text-amber-950 font-medium">
                  A prova conterá <strong>{selectedQuestions.length}</strong> questões mescladas do banco de dados e ENEM.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 shrink-0">
              <Button
                variant="outline"
                className="w-full rounded-xl h-12 font-bold border-slate-300"
                onClick={() => setShowCompileModal(false)}
              >
                Cancelar
              </Button>
              <Button
                disabled={isCompiling}
                className="w-full rounded-xl bg-brand-yellow text-slate-900 font-bold h-12 hover:bg-amber-400"
                onClick={handleCompileSimulado}
              >
                {isCompiling ? "Processando..." : "Gerar Simulado"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
