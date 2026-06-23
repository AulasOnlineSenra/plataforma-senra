"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  GripVertical,
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
  secondaryTag: string; // ex: "Química", "Espanhol"
};

type StudentItem = { id: string; name: string };

// 4 Áreas de Conhecimento Oficiais do ENEM
const ENEM_AREAS = [
  "Matemática e suas Tecnologias",
  "Ciências da Natureza e suas Tecnologias",
  "Ciências Humanas e suas Tecnologias",
  "Linguagens, Códigos e suas Tecnologias",
];

// Sub-disciplinas mapeadas
const SUB_DISCIPLINES: Record<string, string[]> = {
  "Matemática e suas Tecnologias": ["Matemática Geral", "Geometria", "Estatística / Probabilidade"],
  "Ciências da Natureza e suas Tecnologias": ["Química", "Física", "Biologia", "Natureza Geral"],
  "Ciências Humanas e suas Tecnologias": ["História", "Geografia", "Filosofia / Sociologia", "Humanas Geral"],
  "Linguagens, Códigos e suas Tecnologias": ["Português", "Espanhol", "Inglês", "Literatura / Artes"],
};

const ALL_SUB_DISCIPLINES = Array.from(
  new Set(Object.values(SUB_DISCIPLINES).flat())
);

const YEARS = Array.from({ length: 16 }, (_, i) => 2024 - i); // 2024 a 2009

// Heurística de classificação inteligente das questões do ENEM
function classifyQuestion(q: any): { disciplineLabel: string; secondaryTag: string } {
  const context = (q.context || "").toLowerCase();
  const subject = (q.subject || "").toLowerCase();
  const discipline = (q.discipline || "").toLowerCase();

  let disciplineLabel = "Linguagens, Códigos e suas Tecnologias";
  let secondaryTag = "Geral";

  // 1. Classificação da Área Principal
  if (discipline.includes("matematica")) {
    disciplineLabel = "Matemática e suas Tecnologias";
  } else if (discipline.includes("natureza")) {
    disciplineLabel = "Ciências da Natureza e suas Tecnologias";
  } else if (discipline.includes("humanas")) {
    disciplineLabel = "Ciências Humanas e suas Tecnologias";
  } else {
    disciplineLabel = "Linguagens, Códigos e suas Tecnologias";
  }

  // 2. Heurísticas de sub-disciplinas (Química, Física, Biologia, História, etc.)
  if (disciplineLabel === "Ciências da Natureza e suas Tecnologias") {
    const chemistryTerms = [
      "reação", "reacao", "química", "quimica", "átomo", "atomo", "molécula", "molecula", "ácido", "acido", "base",
      "solução", "solucao", "ligação", "ligacao", "carbono", "isómero", "isomero", "pH", "elétron", "eletron",
      "tabela periódica", "massa molar", "oxidação", "oxidacao", "redução", "reducao", "hidróxido", "hidroxido",
      "concentração", "concentracao", "destilação", "destilacao"
    ];
    const physicsTerms = [
      "física", "fisica", "velocidade", "aceleração", "aceleracao", "força", "forca", "energia", "trabalho", "potência", "potencia",
      "calor", "temperatura", "pressão", "pressao", "onda", "frequência", "frequencia", "luz", "refração", "refracao",
      "óptica", "optica", "espelho", "lente", "circuito", "corrente", "tensão", "tensao", "resistor", "campo magnético",
      "gravitação", "gravitacao"
    ];
    const biologyTerms = [
      "biologia", "célula", "celula", "DNA", "RNA", "gene", "genética", "genetica", "proteína", "proteina",
      "vírus", "virus", "bactéria", "bacteria", "doença", "doenca", "ecologia", "ecossistema", "espécie", "especie",
      "evolução", "evolucao", "seleção natural", "selecao natural", "planta", "animal", "fisiologia", "fotossíntese"
    ];

    if (chemistryTerms.some((term) => context.includes(term))) {
      secondaryTag = "Química";
    } else if (physicsTerms.some((term) => context.includes(term))) {
      secondaryTag = "Física";
    } else if (biologyTerms.some((term) => context.includes(term))) {
      secondaryTag = "Biologia";
    } else {
      secondaryTag = "Natureza Geral";
    }
  } else if (disciplineLabel === "Ciências Humanas e suas Tecnologias") {
    const historyTerms = [
      "século", "seculo", "história", "historia", "revolução", "revolucao", "guerra", "império", "imperio", "rei",
      "governo", "presidente", "ditadura", "constituição", "constituicao", "escravidão", "escravidao", "antiguidade"
    ];
    const geographyTerms = [
      "geografia", "mapa", "clima", "relevo", "solo", "vegetação", "vegetacao", "população", "populacao", "migração",
      "urbanização", "urbanizacao", "desmatamento", "poluição", "globalização", "fronteira", "país"
    ];
    const philosophyTerms = [
      "filosofia", "sociologia", "pensador", "filósofo", "filosofo", "ética", "etica", "moral", "razão", "razao",
      "cultura", "sociedade", "social", "democracia", "política", "estado", "poder"
    ];

    if (historyTerms.some((term) => context.includes(term))) {
      secondaryTag = "História";
    } else if (geographyTerms.some((term) => context.includes(term))) {
      secondaryTag = "Geografia";
    } else if (philosophyTerms.some((term) => context.includes(term))) {
      secondaryTag = "Filosofia / Sociologia";
    } else {
      secondaryTag = "Humanas Geral";
    }
  } else if (disciplineLabel === "Linguagens, Códigos e suas Tecnologias") {
    if (subject === "espanhol" || subject === "espanõl" || subject === "spanish" || context.includes("espanhol") || context.includes("españa")) {
      secondaryTag = "Espanhol";
    } else if (subject === "inglês" || subject === "ingles" || subject === "english" || context.includes("inglês") || context.includes("english")) {
      secondaryTag = "Inglês";
    } else {
      const literatureTerms = ["poema", "poesia", "verso", "autor", "autora", "literatura", "romance", "conto", "arte", "pintura", "artista"];
      if (literatureTerms.some((term) => context.includes(term))) {
        secondaryTag = "Literatura / Artes";
      } else {
        secondaryTag = "Português";
      }
    }
  } else if (disciplineLabel === "Matemática e suas Tecnologias") {
    const geometryTerms = ["geometria", "área", "area", "volume", "triângulo", "retângulo", "esfera", "cone", "cilindro"];
    const statsTerms = ["média", "media", "mediana", "moda", "gráfico", "grafico", "tabela", "probabilidade", "estatística"];
    if (geometryTerms.some((term) => context.includes(term))) {
      secondaryTag = "Geometria";
    } else if (statsTerms.some((term) => context.includes(term))) {
      secondaryTag = "Estatística / Probabilidade";
    } else {
      secondaryTag = "Matemática Geral";
    }
  }

  return { disciplineLabel, secondaryTag };
}

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

  // Filtro de Áreas Principais (ex: Ciências da Natureza...)
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [isAreasOpen, setIsAreasOpen] = useState(false);

  // Filtro de Sub-disciplinas (ex: Química, Física, Espanhol...)
  const [selectedSubDisciplines, setSelectedSubDisciplines] = useState<string[]>([]);
  const [isSubDisciplinesOpen, setIsSubDisciplinesOpen] = useState(false);

  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  // Questões retornadas
  const [questions, setQuestions] = useState<UnifiedQuestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Questões selecionadas (Carrinho)
  const [selectedQuestions, setSelectedQuestions] = useState<UnifiedQuestion[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Modais de Ação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCompileModal, setShowCompileModal] = useState(false);

  // Formulário: Criar Questão Autoral
  const [newTitle, setNewTitle] = useState("");
  const [newDiscipline, setNewDiscipline] = useState(ENEM_AREAS[0]);
  const [newSubject, setNewSubject] = useState(""); // Campo Assunto (sub-matéria)
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

  // Opções dinâmicas de sub-disciplinas baseadas nas áreas selecionadas
  const availableSubDisciplines = useMemo(() => {
    if (selectedAreas.length === 0) return ALL_SUB_DISCIPLINES;
    const subs: string[] = [];
    selectedAreas.forEach((area) => {
      if (SUB_DISCIPLINES[area]) {
        subs.push(...SUB_DISCIPLINES[area]);
      }
    });
    return Array.from(new Set(subs));
  }, [selectedAreas]);

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

  // Busca de questões dinamicamente baseado nos anos ou no acervo
  const fetchQuestions = async () => {
    if (sourceTab === "enem" && selectedYears.length === 0) {
      setQuestions([]);
      return;
    }
    setIsSearching(true);
    try {
      if (sourceTab === "enem") {
        // Busca via API do ENEM em blocos paralelos para obter as 180 questões do exame
        const yearPromises = selectedYears.flatMap((yearStr) => {
          const year = parseInt(yearStr);
          const offsets = [0, 45, 90, 135];
          return offsets.map((offset) => fetchEnemQuestions(year, 45, offset));
        });
        const results = await Promise.all(yearPromises);
        let combined: UnifiedQuestion[] = [];
        const seenIds = new Set<string>();

        results.forEach((result) => {
          if (result.success && result.data) {
            const apiQuestions = (result.data.questions || []).map((q: any) => {
              const classification = classifyQuestion(q);
              return {
                id: `enem-${q.year}-${q.index}`,
                source: "enem" as const,
                title: `Questão ${q.index} - ENEM ${q.year}`,
                discipline: classification.disciplineLabel,
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
                secondaryTag: classification.secondaryTag,
              };
            });

            apiQuestions.forEach((q: UnifiedQuestion) => {
              if (!seenIds.has(q.id)) {
                seenIds.add(q.id);
                combined.push(q);
              }
            });
          }
        });

        // Ordena pelo número da questão
        combined.sort((a, b) => {
          const indexA = parseInt(a.title?.match(/\d+/)?.[0] || "0");
          const indexB = parseInt(b.title?.match(/\d+/)?.[0] || "0");
          return indexA - indexB;
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
            secondaryTag: q.subject || "Geral",
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

  // Filtro client-side de Áreas e Sub-disciplinas
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Filtragem por Área Principal (ENEM_AREAS)
      if (selectedAreas.length > 0) {
        if (!selectedAreas.includes(q.discipline)) {
          return false;
        }
      }

      // 2. Filtragem por Sub-disciplina (Química, Física, Espanhol, etc.)
      if (selectedSubDisciplines.length > 0) {
        if (!selectedSubDisciplines.includes(q.secondaryTag)) {
          return false;
        }
      }

      // 3. Filtragem por Dificuldade (apenas se for Acervo Interno)
      if (sourceTab === "local" && filterDifficulty !== "all") {
        if (q.difficulty !== filterDifficulty) return false;
      }

      return true;
    });
  }, [questions, selectedAreas, selectedSubDisciplines, filterDifficulty, sourceTab]);

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newSelected = [...selectedQuestions];
      const [draggedItem] = newSelected.splice(draggedIndex, 1);
      newSelected.splice(dragOverIndex, 0, draggedItem);
      setSelectedQuestions(newSelected);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOverContainer = (e: React.DragEvent) => {
    e.preventDefault();
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const { top, bottom } = container.getBoundingClientRect();
    const mouseY = e.clientY;
    
    // Threshold in pixels to start scrolling
    const edgeThreshold = 80;
    
    if (mouseY - top < edgeThreshold) {
      // Scroll up
      container.scrollTop -= 15;
    } else if (bottom - mouseY < edgeThreshold) {
      // Scroll down
      container.scrollTop += 15;
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
        description: "Preencha a sub-disciplina (Assunto) e o enunciado da questão.",
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
      subject: newSubject.trim(), // ex: Química, História
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
    <div className="flex flex-1 flex-col gap-4 max-w-5xl mx-auto w-full px-12 md:px-20 pb-20">
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
            <Plus className="mr-2 h-5 w-5" /> Nova Questão
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
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-5">
        {/* LINHA 1: ABAS DE ORIGEM */}
        <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-slate-100">
          <Button
            variant={sourceTab === "enem" ? "default" : "outline"}
            className={cn(
              "rounded-xl font-bold h-11 px-6 transition-all",
              sourceTab === "enem" ? "bg-slate-900 text-white shadow-sm" : "border-slate-300 text-slate-700 hover:bg-slate-50"
            )}
            onClick={() => setSourceTab("enem")}
          >
            Questões ENEM (Oficiais)
          </Button>
          <Button
            variant={sourceTab === "local" ? "default" : "outline"}
            className={cn(
              "rounded-xl font-bold h-11 px-6 transition-all",
              sourceTab === "local" ? "bg-slate-900 text-white shadow-sm" : "border-slate-300 text-slate-700 hover:bg-slate-50"
            )}
            onClick={() => setSourceTab("local")}
          >
            Acerto Plataforma
          </Button>
        </div>

        {/* LINHA 2: SELETORES DE FILTROS */}
        <div className="flex flex-wrap items-center gap-3">
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
                    ? "Ano"
                    : selectedYears.length === 1
                    ? `Ano: ${selectedYears[0]}`
                    : `Ano (${selectedYears.length})`}
                </span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", isYearsOpen && "rotate-90")} />
              </Button>
              {isYearsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsYearsOpen(false)} />
                  <div className="absolute left-0 mt-2 w-56 max-h-60 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-3 z-50 space-y-2">
                    <p className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">Selecionar Ano</p>
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

          {/* Filtro Multi-Select de Áreas Oficiais do ENEM */}
          <div className="relative">
            <Button
              variant="outline"
              className="rounded-xl h-11 border-slate-300 bg-slate-50 font-semibold px-4 flex items-center justify-between gap-2 min-w-[180px]"
              onClick={() => setIsAreasOpen(!isAreasOpen)}
            >
              <span>
                {selectedAreas.length === 0
                  ? "Áreas Enem"
                  : selectedAreas.length === 1
                  ? `Área: ${selectedAreas[0].split(" ")[0]}`
                  : `Áreas Enem (${selectedAreas.length})`}
              </span>
              <ChevronRight className={cn("h-4 w-4 transition-transform", isAreasOpen && "rotate-90")} />
            </Button>
            {isAreasOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAreasOpen(false)} />
                <div className="absolute left-0 mt-2 w-64 max-h-80 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-3 z-50 space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Áreas Enem</p>
                    {selectedAreas.length > 0 && (
                      <button
                        className="text-xs font-bold text-red-500 hover:text-red-700"
                        onClick={() => {
                          setSelectedAreas([]);
                          setSelectedSubDisciplines([]);
                        }}
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {ENEM_AREAS.map((a) => {
                      const isChecked = selectedAreas.includes(a);
                      return (
                        <label key={a} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              let updated: string[];
                              if (isChecked) {
                                updated = selectedAreas.filter((item) => item !== a);
                              } else {
                                updated = [...selectedAreas, a];
                              }
                              setSelectedAreas(updated);
                              // Reseta sub-disciplinas que não pertencem mais às áreas selecionadas
                              setSelectedSubDisciplines([]);
                            }}
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                          <span className="text-xs leading-tight">{a}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filtro Multi-Select de Sub-disciplinas (ex: Química, Física, etc.) */}
          <div className="relative">
            <Button
              variant="outline"
              className="rounded-xl h-11 border-slate-300 bg-slate-50 font-semibold px-4 flex items-center justify-between gap-2 min-w-[180px]"
              onClick={() => setIsSubDisciplinesOpen(!isSubDisciplinesOpen)}
            >
              <span>
                {selectedSubDisciplines.length === 0
                  ? "Matérias"
                  : selectedSubDisciplines.length === 1
                  ? `Matéria: ${selectedSubDisciplines[0]}`
                  : `Matérias (${selectedSubDisciplines.length})`}
              </span>
              <ChevronRight className={cn("h-4 w-4 transition-transform", isSubDisciplinesOpen && "rotate-90")} />
            </Button>
            {isSubDisciplinesOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSubDisciplinesOpen(false)} />
                <div className="absolute left-0 mt-2 w-60 max-h-80 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-3 z-50 space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matérias</p>
                    {selectedSubDisciplines.length > 0 && (
                      <button
                        className="text-xs font-bold text-red-500 hover:text-red-700"
                        onClick={() => setSelectedSubDisciplines([])}
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {availableSubDisciplines.map((s) => {
                      const isChecked = selectedSubDisciplines.includes(s);
                      return (
                        <label key={s} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                  setSelectedSubDisciplines(selectedSubDisciplines.filter((item) => item !== s));
                              } else {
                                  setSelectedSubDisciplines([...selectedSubDisciplines, s]);
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
                {/* Meta-badges da questão exatamente como na imagem solicitada */}
                <CardHeader className="bg-slate-50/50 border-b pb-4 flex flex-row flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Badge 1 (Filtro Primário - Área do ENEM) */}
                    <Badge className="bg-slate-900 text-white font-bold rounded-full px-3 py-1 text-xs">
                      {q.discipline === "Matemática e suas Tecnologias" ? "matemática" :
                       q.discipline === "Ciências da Natureza e suas Tecnologias" ? "ciências da natureza" :
                       q.discipline === "Ciências Humanas e suas Tecnologias" ? "ciências humanas" : "linguagens"}
                    </Badge>
                    {/* Badge 2 (Filtro Secundário - Sub-matéria / idioma) */}
                    <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white font-semibold rounded-full px-3 py-1 text-xs">
                      {q.secondaryTag.toLowerCase()}
                    </Badge>
                    {/* Badge 3 (Dificuldade) */}
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-bold rounded-full px-3 py-1 text-xs border",
                        q.difficulty === "Fácil" && "border-green-300 text-green-700 bg-green-50/20",
                        q.difficulty === "Médio" && "border-amber-300 text-amber-700 bg-amber-50/20",
                        q.difficulty === "Difícil" && "border-red-300 text-red-700 bg-red-50/20"
                      )}
                    >
                      {q.difficulty}
                    </Badge>
                    {q.source === "local" && (
                      <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-semibold rounded-full px-3 py-1 text-xs">
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
                        "rounded-full font-bold h-9 px-6 text-sm border transition-colors shadow-sm",
                        isSelected ? "bg-slate-900 text-white hover:bg-slate-800 border-none" : "border-slate-300 hover:bg-slate-50"
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
              onClick={() => setShowReviewModal(true)}
            >
              Revisar Questões <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* MODAL 0: REVISAR QUESTÕES SELECIONADAS */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-5xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col animate-in scale-in duration-200">
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Revisar Questões</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedQuestions.length} questão(ões) selecionada(s). Remova as que não quiser antes de compilar.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl h-9 w-9"
                onClick={() => setShowReviewModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div 
              className="p-4 overflow-y-auto flex-1 space-y-3" 
              ref={scrollContainerRef}
              onDragOver={handleDragOverContainer}
            >
              {selectedQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">Nenhuma questão selecionada.</p>
                  <p className="text-sm mt-1">Feche e selecione questões no banco.</p>
                </div>
              ) : (
                selectedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragEnter={(e) => handleDragEnter(e, idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                      "flex items-start gap-4 p-5 bg-white rounded-2xl transition-all group relative cursor-grab active:cursor-grabbing border-2",
                      dragOverIndex === idx ? "border-brand-yellow border-dashed bg-amber-50/30 shadow-inner" : "border-slate-100 hover:border-slate-300",
                      draggedIndex === idx ? "opacity-40 scale-[0.99]" : "opacity-100 scale-100"
                    )}
                  >
                    <div className="flex flex-col items-center gap-3 mt-1 cursor-grab text-slate-300 hover:text-slate-500">
                      <GripVertical className="h-6 w-6" />
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black shadow-md">
                        {idx + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex justify-between items-start mb-3">
                         <h4 className="font-bold text-slate-900 text-lg leading-tight pr-4">{q.title || `Questão ${idx + 1}`}</h4>
                         <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                          <Badge className="bg-slate-100 text-slate-700 shadow-none text-xs font-bold border border-slate-200">{q.secondaryTag}</Badge>
                          <Badge className="bg-amber-100 text-amber-800 shadow-none text-xs font-bold border-none">{q.difficulty}</Badge>
                          {q.source === "enem" && <Badge className="bg-blue-100 text-blue-800 shadow-none text-xs font-bold border-none">ENEM Oficial</Badge>}
                        </div>
                      </div>
                      
                      <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed font-medium mb-4">
                        {q.context}
                      </div>
                      
                      {q.files && q.files.length > 0 && (
                        <div className="flex flex-wrap gap-4 py-4 bg-slate-50 rounded-xl mb-4 border border-slate-100 justify-center">
                          {q.files.map((fileUrl, fIdx) => (
                            <img key={fIdx} src={fileUrl} alt="Ilustração" className="max-h-56 rounded-lg object-contain bg-white border border-slate-200 p-1.5 shadow-sm" />
                          ))}
                        </div>
                      )}
                      
                      <div className="grid gap-2.5">
                        {q.alternatives.map((alt) => {
                          const isCorrect = alt.letter === q.correctAlternative;
                          return (
                            <div key={alt.letter} className={cn("flex items-start gap-3 p-3.5 rounded-xl border-2 transition-colors", isCorrect ? "bg-green-50 border-green-200" : "bg-white border-slate-100")}>
                                <Badge className={cn("w-7 h-7 flex items-center justify-center font-bold text-sm shrink-0 shadow-none", isCorrect ? "bg-green-600 text-white border-none" : "bg-slate-100 text-slate-600 border border-slate-200")}>{alt.letter}</Badge>
                                <div className="text-slate-700 text-sm leading-relaxed font-medium pt-0.5">{alt.text}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl shrink-0 transition-colors absolute top-4 right-4 z-10 bg-white shadow-sm border border-slate-100"
                      onClick={() => setSelectedQuestions(selectedQuestions.filter((item) => item.id !== q.id))}
                      title="Remover questão"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 shrink-0">
              <Button
                variant="outline"
                className="w-full rounded-xl h-12 font-bold border-slate-300"
                onClick={() => setShowReviewModal(false)}
              >
                Continuar Selecionando
              </Button>
              <Button
                disabled={selectedQuestions.length === 0}
                className="w-full rounded-xl bg-brand-yellow text-slate-900 font-bold h-12 hover:bg-amber-400 disabled:opacity-50"
                onClick={() => { setShowReviewModal(false); setShowCompileModal(true); }}
              >
                Compilar Prova ({selectedQuestions.length})
              </Button>
            </div>
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
                  <Label className="font-bold text-slate-700">Área do Conhecimento (ENEM)</Label>
                  <Select value={newDiscipline} onValueChange={setNewDiscipline}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENEM_AREAS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="font-bold text-slate-700">Sub-matéria / Assunto específico</Label>
                  <Input
                    placeholder="Ex: Química, Física, História, Geometria"
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
