'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Loader2, 
  Wand2, 
  Settings2, 
  MessageSquare, 
  ShieldCheck,
  LayoutGrid,
  Zap,
  Globe,
  PenTool,
  MessageCircle,
  Database,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  AlertTriangle,
  RotateCcw,
  User,
  X,
  Star,
  Activity,
  CheckCircle2,
  Pause,
  Play,
  Send,
  GitBranch,
  MessageCircleMore,
  HelpCircle,
  ArrowRight,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  getAiAgents, 
  createAiAgent, 
  updateAiAgent, 
  deleteAiAgent, 
  runAiAgentTest,
  getAvailableProviders,
  getAgentMemories,
  createAgentMemory,
  deleteAgentMemory,
  resetAgentMemories
} from '@/app/actions/ia';
import {
  getAgentLoopLogs,
  getOrchestratedEntities,
  adminInterveneLoop
} from '@/app/actions/orchestration';
import {
  getOnboardingAutomations,
  createOnboardingAutomation,
  updateOnboardingAutomation,
  deleteOnboardingAutomation,
  DEFAULT_ONBOARDING_FLOW,
  type FlowNode,
} from '@/app/actions/onboarding-automation';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: { name: string; args: any; result?: any }[];
  executionTimeMs?: number;
  usage?: { promptTokens: number; candidatesTokens: number; totalTokens: number } | null;
  timestamp: Date;
  isError?: boolean;
  retryPrompt?: string;
}

const MODELS_BY_PROVIDER: Record<string, { label: string, models: string[] }> = {
  gemini: { label: 'Google Gemini', models: [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
  ]},
};

const MAX_CONTEXT_TOKENS = 1048576; // 1M tokens (Gemini 3.6 / 3.5)

const AVAILABLE_TOOLS: Tool[] = [
  { id: 'crm', name: 'Gestão de CRM', description: 'Buscar leads, criar e gerenciar funil.', icon: Database },
  { id: 'moveLead', name: 'Mover Leads', description: 'Mover leads entre colunas do CRM.', icon: LayoutGrid },
  { id: 'blog', name: 'Escrita de Blog', description: 'Criar e editar artigos no blog.', icon: PenTool },
  { id: 'searchBlogPosts', name: 'Pesquisar Blog', description: 'Buscar postagens existentes.', icon: Database },
  { id: 'webSearch', name: 'Busca Web', description: 'Pesquisar notícias e dados atuais na internet.', icon: Globe },
  { id: 'stats', name: 'Estatísticas', description: 'Ver métricas de leads, alunos e professores.', icon: Zap },
  { id: 'chat', name: 'Atendimento', description: 'Responder mensagens de clientes.', icon: MessageCircle },
  { id: 'email', name: 'E-mail', description: 'Enviar notificações por e-mail.', icon: MessageSquare },
];

const AGENT_TEMPLATES = [
  {
    name: 'Agente Comercial',
    description: 'Especialista em conversão de leads e gestão de funil.',
    instructions: 'Você é um Agente Comercial sênior. Sua missão é analisar leads, sugerir movimentações no funil e garantir que nenhum contato esfrie. Use a ferramenta searchLeads para encontrar leads e moveLead para organizá-los.',
    tools: ['crm', 'moveLead'],
    model: 'gemini-3.6-flash',
  },
  {
    name: 'Redator de Blog',
    description: 'Cria conteúdos otimizados para SEO e gerencia o blog.',
    instructions: 'Você é um redator especializado em educação. Sua missão é criar posts engajadores para o blog. Sempre verifique posts existentes com searchBlogPosts antes de sugerir novos.',
    tools: ['blog', 'searchBlogPosts'],
    model: 'gemini-3.6-flash',
  },
  {
    name: 'Gestor de Operações',
    description: 'Monitora métricas e gera relatórios de desempenho.',
    instructions: 'Você é um gestor operacional. Sua missão é fornecer uma visão clara da saúde da plataforma. Use getSystemStats para reportar números de alunos e leads.',
    tools: ['stats'],
    model: 'gemini-3.6-flash',
  },
];

export function IaManager() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sandbox');
  const [modelsByProvider, setModelsByProvider] = useState<Record<string, { label: string, models: string[] }>>(MODELS_BY_PROVIDER);
  const [hiddenModels, setHiddenModels] = useState<string[]>([]);
  const [favoriteModels, setFavoriteModels] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('@senra:hiddenModels');
    if (saved) {
      try { setHiddenModels(JSON.parse(saved)); } catch (e) {}
    }
    const savedFav = localStorage.getItem('@senra:favoriteModels');
    if (savedFav) {
      try { setFavoriteModels(JSON.parse(savedFav)); } catch (e) {}
    }
  }, []);

  const handleToggleFavorite = (modelId: string) => {
    setFavoriteModels(prev => {
      const isFav = prev.includes(modelId);
      const newFav = isFav ? prev.filter(id => id !== modelId) : [...prev, modelId];
      localStorage.setItem('@senra:favoriteModels', JSON.stringify(newFav));
      return newFav;
    });
  };

  const handleHideModel = (modelId: string) => {
    setHiddenModels(prev => {
      const newHidden = [...prev, modelId];
      localStorage.setItem('@senra:hiddenModels', JSON.stringify(newHidden));
      return newHidden;
    });
    
    toast('Modelo ocultado da lista', {
      position: 'bottom-left',
      duration: 5000,
      action: {
        label: 'Desfazer',
        onClick: () => {
          setHiddenModels(prev => {
            const restored = prev.filter(m => m !== modelId);
            localStorage.setItem('@senra:hiddenModels', JSON.stringify(restored));
            return restored;
          });
        }
      }
    });
  };
  
  // Chat / Sandbox State
  const [testPrompt, setTestPrompt] = useState('');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    instructions: '',
    model: '',
    tools: [] as string[]
  });

  useEffect(() => {
    loadAgents();
    loadProviders();
  }, []);

  useEffect(() => {
    // Scroll para o fim do chat ao receber mensagens
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isRunningTest]);

  // Limpar chat e carregar memórias ao trocar de agente
  const [agentMemories, setAgentMemories] = useState<any[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('diretriz');

  const loadMemories = async (agentId: string) => {
    setIsLoadingMemories(true);
    try {
      const res = await getAgentMemories(agentId);
      if (res && res.success && res.data) {
        setAgentMemories(res.data);
      }
    } finally {
      setIsLoadingMemories(false);
    }
  };

  useEffect(() => {
    setChatMessages([]);
    if (selectedAgent?.id) {
      loadMemories(selectedAgent.id);
    }
  }, [selectedAgent?.id]);

  const handleAddMemory = async () => {
    if (!selectedAgent?.id || !newMemoryText.trim()) return;
    const res = await createAgentMemory(selectedAgent.id, newMemoryText, newMemoryCategory);
    if (res && res.success) {
      toast.success("Memória gravada com sucesso!");
      setNewMemoryText('');
      loadMemories(selectedAgent.id);
    } else {
      toast.error("Erro ao gravar memória.");
    }
  };

  const handleDeleteMemory = async (id: string) => {
    const res = await deleteAgentMemory(id);
    if (res && res.success) {
      toast.success("Memória descartada.");
      if (selectedAgent?.id) loadMemories(selectedAgent.id);
    } else {
      toast.error("Erro ao excluir memória.");
    }
  };

  const handleResetMemories = async () => {
    if (!selectedAgent?.id) return;
    if (confirm("Tem certeza que deseja apagar todas as memórias acumuladas deste agente?")) {
      const res = await resetAgentMemories(selectedAgent.id);
      if (res && res.success) {
        toast.success("Todas as memórias foram apagadas.");
        loadMemories(selectedAgent.id);
      }
    }
  };

  // Estado de Auditoria e Orquestração Multi-Agente
  const [orchestratedItems, setOrchestratedItems] = useState<any[]>([]);
  const [loopLogs, setLoopLogs] = useState<any[]>([]);
  const [isLoadingOrchestration, setIsLoadingOrchestration] = useState(false);
  const [directInstructions, setDirectInstructions] = useState<Record<string, string>>({});

  const loadOrchestrationData = async () => {
    setIsLoadingOrchestration(true);
    try {
      const [itemsRes, logsRes] = await Promise.all([
        getOrchestratedEntities(),
        getAgentLoopLogs({ limit: 40 })
      ]);
      if (itemsRes && itemsRes.success && itemsRes.data) setOrchestratedItems(itemsRes.data);
      if (logsRes && logsRes.success && logsRes.data) setLoopLogs(logsRes.data);
    } finally {
      setIsLoadingOrchestration(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orchestration') {
      loadOrchestrationData();
    }
  }, [activeTab]);

  const handleAdminIntervene = async (entityId: string, action: "APPROVE" | "PAUSE" | "RESUME" | "DIRECT") => {
    const instruction = directInstructions[entityId] || "";
    if (action === "DIRECT" && !instruction.trim()) {
      toast.error("Por favor, digite a instrução a ser enviada ao agente.");
      return;
    }
    const res = await adminInterveneLoop({ entityId, action, instruction });
    if (res && res.success) {
      toast.success(res.message);
      if (action === "DIRECT") {
        setDirectInstructions(prev => ({ ...prev, [entityId]: "" }));
      }
      loadOrchestrationData();
    } else {
      toast.error(res?.error || "Erro ao aplicar intervenção.");
    }
  };

  // ── Onboarding Automation State ─────────────────────────
  const [onboardingAutomations, setOnboardingAutomations] = useState<any[]>([]);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(false);
  const [editingFlow, setEditingFlow] = useState<{ automationId: string; nodes: FlowNode[] } | null>(null);
  const [isCreatingOnboarding, setIsCreatingOnboarding] = useState(false);
  const [newOnboardingName, setNewOnboardingName] = useState('');
  const [newOnboardingTrigger, setNewOnboardingTrigger] = useState('NEW_USER');

  const loadOnboardingAutomations = async () => {
    setIsLoadingOnboarding(true);
    try {
      const res = await getOnboardingAutomations();
      if (res?.success && res.data) setOnboardingAutomations(res.data);
    } finally {
      setIsLoadingOnboarding(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'automations') {
      loadOnboardingAutomations();
    }
  }, [activeTab]);

  const handleCreateOnboarding = async () => {
    if (!newOnboardingName.trim()) { toast.error('Digite um nome para a automação.'); return; }
    const res = await createOnboardingAutomation({
      name: newOnboardingName,
      triggerType: newOnboardingTrigger,
    });
    if (res?.success) {
      toast.success('Automação criada com sucesso!');
      setNewOnboardingName('');
      setIsCreatingOnboarding(false);
      loadOnboardingAutomations();
    } else {
      toast.error(res?.error || 'Erro ao criar automação.');
    }
  };

  const handleToggleOnboarding = async (id: string, currentActive: boolean) => {
    const res = await updateOnboardingAutomation(id, { isActive: !currentActive });
    if (res?.success) {
      toast.success(!currentActive ? 'Automação ativada!' : 'Automação pausada.');
      loadOnboardingAutomations();
    } else {
      toast.error('Erro ao alterar status.');
    }
  };

  const handleDeleteOnboarding = async (id: string) => {
    if (!confirm('Excluir esta automação?')) return;
    const res = await deleteOnboardingAutomation(id);
    if (res?.success) {
      toast.success('Automação excluída.');
      loadOnboardingAutomations();
      if (editingFlow?.automationId === id) setEditingFlow(null);
    }
  };

  const handleAssignAgent = async (automationId: string, agentId: string) => {
    const res = await updateOnboardingAutomation(automationId, { agentId: agentId === 'none' ? null : agentId });
    if (res?.success) {
      toast.success('Agente atribuído!');
      loadOnboardingAutomations();
    }
  };

  const handleSaveFlow = async () => {
    if (!editingFlow) return;
    const res = await updateOnboardingAutomation(editingFlow.automationId, {
      flowJson: JSON.stringify(editingFlow.nodes),
    });
    if (res?.success) {
      toast.success('Fluxo salvo com sucesso!');
      loadOnboardingAutomations();
    } else {
      toast.error('Erro ao salvar fluxo.');
    }
  };

  const handleUpdateFlowNode = (nodeId: string, field: keyof FlowNode, value: any) => {
    if (!editingFlow) return;
    setEditingFlow(prev => ({
      ...prev!,
      nodes: prev!.nodes.map(n => n.id === nodeId ? { ...n, [field]: value } : n),
    }));
  };

  const handleAddFlowNode = (type: 'message' | 'question') => {
    if (!editingFlow) return;
    const newId = String(Date.now());
    const newNode: FlowNode = type === 'message'
      ? { id: newId, type: 'message', content: 'Nova mensagem...', next: 'end' }
      : { id: newId, type: 'question', content: 'Nova pergunta?', options: [{ label: 'Opção 1', next: 'end' }] };
    setEditingFlow(prev => ({ ...prev!, nodes: [...prev!.nodes, newNode] }));
  };

  const handleRemoveFlowNode = (nodeId: string) => {
    if (!editingFlow) return;
    setEditingFlow(prev => ({ ...prev!, nodes: prev!.nodes.filter(n => n.id !== nodeId) }));
  };

  const loadProviders = async () => {
    const result = await getAvailableProviders();
    if (result.success && result.data) {
      setAvailableProviders(result.data);
      if (result.data.includes('openrouter')) {
        loadOpenRouterModels();
      }
    }
  };

  const loadOpenRouterModels = async () => {
    const { fetchOpenRouterModels } = await import('@/app/actions/ia');
    const res = await fetchOpenRouterModels();
    if (res.success && res.data) {
      const newModels = { ...MODELS_BY_PROVIDER };
      const orModels = res.data as any[];
      // Filter for popular models to not break UI, or just add all
      // We will sort and add all, grouping by their prefix
      orModels.forEach(m => {
        const providerId = m.id.split('/')[0];
        const key = `openrouter_${providerId}`;
        if (!newModels[key]) {
          newModels[key] = { label: `OpenRouter: ${providerId.charAt(0).toUpperCase() + providerId.slice(1)}`, models: [] };
        }
        newModels[key].models.push(`openrouter:${m.id}`);
      });
      setModelsByProvider(newModels);
    }
  };

  const activeProviderKeys = Object.keys(modelsByProvider).filter(k => 
    availableProviders.includes(k) || (availableProviders.includes('openrouter') && k.startsWith('openrouter_'))
  );

  const loadAgents = async () => {
    setLoading(true);
    const result = await getAiAgents();
    if (result.success) {
      setAgents(result.data || []);
      if (result.data?.length > 0 && !selectedAgent) {
        setSelectedAgent(result.data[0]);
      }
    }
    setLoading(false);
  };

  const handleCreateAgent = async () => {
    if (!newAgent.name) {
      toast.error("O nome do agente é obrigatório.");
      return;
    }

    setLoading(true);
    const result = await createAiAgent({
      ...newAgent,
      tools: JSON.stringify(newAgent.tools)
    });

    if (result.success) {
      toast.success("Agente criado com sucesso!");
      setIsCreateDialogOpen(false);
      setNewAgent({ name: '', description: '', instructions: '', model: 'gemini-3.6-flash', tools: [] });
      loadAgents();
    } else {
      toast.error(result.error || "Erro ao criar agente");
    }
    setLoading(false);
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;
    setLoading(true);
    const result = await updateAiAgent(selectedAgent.id, {
      ...selectedAgent,
      tools: JSON.stringify(selectedAgent.tools)
    });

    if (result.success) {
      toast.success("Agente atualizado!");
      loadAgents();
    } else {
      toast.error(result.error || "Erro ao atualizar agente");
    }
    setLoading(false);
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agente?")) return;
    setLoading(true);
    const result = await deleteAiAgent(id);
    if (result.success) {
      toast.success("Agente excluído.");
      setSelectedAgent(null);
      loadAgents();
    } else {
      toast.error(result.error || "Erro ao excluir agente");
    }
    setLoading(false);
  };

  const handleTestAgent = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || testPrompt;
    if (!promptToSend || !selectedAgent || isRunningTest) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: promptToSend,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setTestPrompt('');
    setIsRunningTest(true);

    // Formatar histórico para a Server Action
    const historyPayload = chatMessages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      content: m.content
    }));

    const result = await runAiAgentTest(selectedAgent.id, promptToSend, historyPayload);

    if (result && result.success) {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response || "Sem resposta.",
        toolCalls: result.toolCalls || [],
        executionTimeMs: result.executionTimeMs,
        usage: result.usage,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMsg]);
      // Recarrega memórias aprendidas em tempo real
      setTimeout(() => {
        if (selectedAgent?.id) loadMemories(selectedAgent.id);
      }, 3000);
    } else {
      const errorMsg = result?.error || "Erro desconhecido ao testar agente";
      toast.error(errorMsg);
      const errorChatMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Erro: ${errorMsg}`,
        timestamp: new Date(),
        isError: true,
        retryPrompt: promptToSend,
      };
      setChatMessages(prev => [...prev, errorChatMsg]);
    }
    setIsRunningTest(false);
  };

  const toggleTool = (toolId: string) => {
    if (!selectedAgent) return;
    
    const currentTools = Array.isArray(selectedAgent.tools) 
      ? selectedAgent.tools 
      : JSON.parse(selectedAgent.tools || "[]");
    
    const newTools = currentTools.includes(toolId)
      ? currentTools.filter((id: string) => id !== toolId)
      : [...currentTools, toolId];
    
    setSelectedAgent({ ...selectedAgent, tools: newTools });
  };

  const toggleNewAgentTool = (toolId: string) => {
    setNewAgent(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(id => id !== toolId)
        : [...prev.tools, toolId]
    }));
  };

  const toggleToolAccordion = (toolCallId: string) => {
    setExpandedTools(prev => ({
      ...prev,
      [toolCallId]: !prev[toolCallId]
    }));
  };

  // Calcular total de tokens da conversa atual
  const totalTokensSession = chatMessages.reduce((sum, msg) => sum + (msg.usage?.totalTokens || 0), 0);
  const tokenPercentage = Math.min(100, Math.round((totalTokensSession / MAX_CONTEXT_TOKENS) * 100 * 10) / 10);

  // Determinar cor do medidor de tokens
  const getTokenBadgeColor = () => {
    if (tokenPercentage > 80) return 'bg-red-500/10 text-red-600 border-red-200';
    if (tokenPercentage > 50) return 'bg-amber-500/10 text-amber-600 border-amber-200';
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
  };

  // Prompts Sugeridos Dinâmicos por Agente
  const getSuggestedPrompts = () => {
    const tools = Array.isArray(selectedAgent?.tools) ? selectedAgent.tools : JSON.parse(selectedAgent?.tools || "[]");
    
    if (tools.includes('crm') || tools.includes('moveLead')) {
      return [
        'Buscar os últimos 5 leads cadastrados',
        'Ver estatísticas de conversão de leads',
        'Como você pode me ajudar a gerenciar o funil?'
      ];
    }
    if (tools.includes('blog') || tools.includes('searchBlogPosts')) {
      return [
        'Pesquisar artigos sobre Enem e Vestibular',
        'Sugerir 3 temas de artigos para o blog',
        'Quais ferramentas de blog você possui?'
      ];
    }
    if (tools.includes('stats')) {
      return [
        'Ver estatísticas gerais da plataforma',
        'Qual é o resumo dos nossos números hoje?',
        'Quais relatórios você consegue gerar?'
      ];
    }
    return [
      'Quem é você e qual sua função?',
      'Quais tarefas você consegue realizar?',
      'Faça uma breve apresentação das suas habilidades.'
    ];
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Sidebar: Lista de Agentes */}
      <Card className="h-fit rounded-[15px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold">Meus Agentes</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col p-4 pt-0">
          <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
            {agents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum agente criado.</p>
            )}
            {agents.map((agent) => (
              <button
                key={agent.id}
                title={`${agent.name} (${agent.model})`}
                onClick={() => setSelectedAgent({
                  ...agent,
                  tools: typeof agent.tools === 'string' ? JSON.parse(agent.tools) : agent.tools
                })}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all w-full overflow-hidden shrink-0 ${
                  selectedAgent?.id === agent.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent text-muted-foreground'
                }`}
              >
                <Bot className="h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate text-sm">{agent.name}</p>
                  <p className={`text-xs truncate ${selectedAgent?.id === agent.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {agent.model}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Templates Rápidos */}
          <div className="pt-4 border-t mt-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Templates Rápidos</p>
            <div className="space-y-1">
              {AGENT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => {
                    setNewAgent({
                      name: tpl.name,
                      description: tpl.description,
                      instructions: tpl.instructions,
                      model: tpl.model,
                      tools: tpl.tools
                    });
                    setIsCreateDialogOpen(true);
                  }}
                  className="w-full text-left p-2 text-xs rounded-lg hover:bg-muted transition-colors flex items-center justify-between text-muted-foreground"
                >
                  <span className="font-medium truncate">{tpl.name}</span>
                  <Plus className="h-3 w-3 shrink-0 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área Principal: Configuração & Sandbox */}
      <div>
        {selectedAgent ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between pb-3">
              <TabsList className="bg-slate-100/90 p-1 rounded-2xl border">
                <TabsTrigger value="sandbox" className="rounded-xl gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <MessageSquare className="h-4 w-4 text-primary" /> Sandbox (Chat)
                </TabsTrigger>
                <TabsTrigger value="config" className="rounded-xl gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Settings2 className="h-4 w-4 text-slate-700" /> Configuração do Agente
                </TabsTrigger>
                <TabsTrigger value="orchestration" className="rounded-xl gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Activity className="h-4 w-4 text-emerald-600" /> Auditoria & Loops
                  {orchestratedItems.some(i => i.orchestrationStatus === "AWAITING_ADMIN") && (
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="automations" className="rounded-xl gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <GitBranch className="h-4 w-4 text-violet-600" /> Automa��es
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ABA: CONFIGURAÇÕES */}
            <TabsContent value="config" className="mt-0">
              <Card className="rounded-[15px]">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Perfil e Instruções do Agente</CardTitle>
                    <CardDescription>Defina a personalidade, modelo e permissões de ferramentas.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setActiveTab('sandbox')} title="Testar no Sandbox (Chat)">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteAgent(selectedAgent.id)} title="Excluir Agente">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome do Agente</Label>
                      <Input 
                        value={selectedAgent.name || ""} 
                        onChange={e => setSelectedAgent({...selectedAgent, name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Modelo de IA</Label>
                      <Select 
                        value={selectedAgent.model || "gemini-3.6-flash"} 
                        onValueChange={value => setSelectedAgent({...selectedAgent, model: value})}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProviders.length === 0 ? (
                            <SelectItem value="none" disabled>Configure as chaves API</SelectItem>
                          ) : (
                            <>
                              {/* GRUPO DE FAVORITOS */}
                              {favoriteModels.filter(m => !hiddenModels.includes(m)).length > 0 && (
                                <SelectGroup>
                                  <SelectLabel className="font-bold text-amber-700 bg-amber-50 sticky top-0 z-10 border-b border-amber-100 flex items-center gap-2">
                                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Favoritos
                                  </SelectLabel>
                                  {favoriteModels.filter(m => !hiddenModels.includes(m)).map(m => (
                                    <SelectItem key={`fav-${m}`} value={m} className="group relative pr-8">
                                      <div className="flex items-center justify-between w-full">
                                        <span className="truncate font-medium text-amber-950">{m.replace('openrouter:', '')}</span>
                                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 absolute right-2 z-50 pointer-events-auto cursor-pointer transition-opacity">
                                          <button
                                            type="button"
                                            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleToggleFavorite(m);
                                            }}
                                            className="p-0.5 rounded hover:bg-amber-100 transition-colors"
                                          >
                                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                          </button>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )}

                              {/* OUTROS PROVEDORES */}
                              {activeProviderKeys.map(provider => {
                                // Filtra modelos que NÃO estão ocultos E NÃO estão nos favoritos
                                const providerModels = modelsByProvider[provider]?.models.filter(m => !hiddenModels.includes(m) && !favoriteModels.includes(m)) || [];
                                
                                if (providerModels.length === 0) return null;

                                return (
                                  <SelectGroup key={provider}>
                                    <SelectLabel className="font-bold text-slate-800 bg-slate-50 sticky top-0">{modelsByProvider[provider]?.label}</SelectLabel>
                                    {providerModels.map(m => (
                                      <SelectItem key={m} value={m} className="group relative pr-8">
                                        <div className="flex items-center justify-between w-full">
                                          <span className="truncate">{m.replace('openrouter:', '')}</span>
                                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 absolute right-2 z-50 pointer-events-auto cursor-pointer transition-opacity">
                                            <button
                                              type="button"
                                              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                              onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleToggleFavorite(m);
                                              }}
                                              className="p-0.5 rounded hover:bg-slate-200 transition-colors"
                                            >
                                              <Star className="h-3.5 w-3.5 text-slate-400 hover:text-amber-500" />
                                            </button>
                                            <button
                                              type="button"
                                              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                              onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleHideModel(m);
                                              }}
                                              className="p-0.5 rounded hover:bg-slate-200 transition-colors"
                                            >
                                              <X className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                                            </button>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                );
                              })}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição Curta</Label>
                    <Input 
                      value={selectedAgent.description || ""} 
                      onChange={e => setSelectedAgent({...selectedAgent, description: e.target.value})} 
                    />
                  </div>

                  <div className="space-y-4 pt-2 border-t mt-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      Base de Conhecimento (RAG)
                    </h3>
                    <div className="space-y-2">
                      <Label>URL do Documento (PDF/TXT/Docs)</Label>
                      <Input 
                        placeholder="Ex: https://meuservidor.com/manual-editorial.pdf"
                        value={selectedAgent.knowledgeUrl || ""}
                        onChange={e => setSelectedAgent({...selectedAgent, knowledgeUrl: e.target.value})}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">O agente consultará este documento como fonte da verdade antes de responder.</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t mt-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      Estrutura do Prompt (V2)
                    </h3>
                    
                    <div className="space-y-2">
                      <Label>Papel (Role)</Label>
                      <Input 
                        placeholder="Ex: Você é um Editor Especialista em SEO Educacional."
                        value={selectedAgent.role || ""}
                        onChange={e => setSelectedAgent({...selectedAgent, role: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Objetivo (Goal)</Label>
                      <Textarea 
                        placeholder="Ex: Produzir artigos úteis e confiáveis otimizados para mecanismos de busca."
                        className="min-h-[60px]"
                        value={selectedAgent.goal || ""}
                        onChange={e => setSelectedAgent({...selectedAgent, goal: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Regras Rígidas (Guardrails de Comportamento)</Label>
                      <Textarea 
                        placeholder="Ex: - Não invente dados.&#10;- Não altere informações corretas sem necessidade."
                        className="min-h-[80px]"
                        value={selectedAgent.rules || ""}
                        onChange={e => setSelectedAgent({...selectedAgent, rules: e.target.value})}
                      />
                    </div>

                    {/* Mantém as instruções antigas escondidas caso haja conteúdo legado */}
                    {selectedAgent.instructions && !selectedAgent.role && !selectedAgent.goal && !selectedAgent.rules && (
                      <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mt-2">
                        <Label className="text-amber-800">System Prompt Legado (V1)</Label>
                        <Textarea 
                          className="min-h-[100px] text-xs"
                          value={selectedAgent.instructions || ""}
                          onChange={e => setSelectedAgent({...selectedAgent, instructions: e.target.value})}
                        />
                      </div>
                    )}
                  </div>

                  {/* SEÇÃO DE SEGURANÇA, CAPABILITIES E PERMISSÕES */}
                  <div className="space-y-6 pt-4 border-t mt-4">
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2 text-slate-900">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Módulos de Acesso & Permissões (Capabilities & Security)
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Defina quais ferramentas o agente pode utilizar e quais ações ele tem autorização para executar no banco de dados.
                      </p>
                    </div>

                    {/* SUB-BLOCO 1: FERRAMENTAS HABILITADAS */}
                    <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border">
                      <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-emerald-600" />
                        1. Ferramentas Habilitadas (Quais salas ele pode entrar?)
                      </Label>
                      <div className="grid gap-3 md:grid-cols-2">
                        {AVAILABLE_TOOLS.map(tool => {
                          const isEnabled = (selectedAgent.tools || []).includes(tool.id);
                          return (
                            <button
                              key={tool.id}
                              type="button"
                              onClick={() => toggleTool(tool.id)}
                              className={`flex items-start gap-3 p-3 border rounded-xl text-left transition-all ${
                                isEnabled ? 'border-primary bg-white ring-2 ring-primary/20 shadow-sm' : 'bg-white/50 hover:bg-white opacity-50 border-slate-200'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                <tool.icon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{tool.name}</p>
                                <p className="text-xs text-muted-foreground">{tool.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SUB-BLOCO 2: PERMISSÕES DE AÇÃO */}
                    <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border">
                      <div>
                        <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-amber-600" />
                          2. Permissões de Ação (O que ele pode fazer nas ferramentas ativas?)
                        </Label>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Trava de segurança rígida: mesmo com uma ferramenta ativa, o agente só executará a ação se a permissão correspondente estiver marcada abaixo.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
                        {[
                          { key: 'read', label: 'Ler', desc: 'Consultar dados' },
                          { key: 'create', label: 'Criar', desc: 'Novos rascunhos' },
                          { key: 'update', label: 'Editar', desc: 'Alterar registros' },
                          { key: 'delete', label: 'Excluir', desc: 'Remover itens' },
                          { key: 'publish', label: 'Publicar', desc: 'Publicação direta' },
                        ].map(perm => {
                          let currentPerms = { read: true, create: true, update: true, delete: false, publish: false };
                          try {
                            if (selectedAgent.permissions) {
                              currentPerms = typeof selectedAgent.permissions === 'string' ? JSON.parse(selectedAgent.permissions) : selectedAgent.permissions;
                            }
                          } catch (e) {}
                          
                          const isChecked = !!(currentPerms as any)[perm.key];
                          return (
                            <label 
                              key={perm.key} 
                              className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                                isChecked 
                                  ? 'bg-white border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-sm' 
                                  : 'bg-white/40 border-slate-200 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                  checked={isChecked}
                                  onChange={e => {
                                    const newPerms = { ...currentPerms, [perm.key]: e.target.checked };
                                    setSelectedAgent({...selectedAgent, permissions: JSON.stringify(newPerms)});
                                  }}
                                />
                                <span className={`text-sm font-bold ${isChecked ? "text-slate-900" : "text-slate-500"}`}>{perm.label}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1 ml-6">{perm.desc}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* FORMATO DE SAÍDA */}
                    <div className="space-y-2 pt-2">
                      <Label className="font-semibold text-slate-800 text-sm">Formato de Saída (Output)</Label>
                      <Select 
                        value={selectedAgent.outputFormat || "TEXT"} 
                        onValueChange={value => setSelectedAgent({...selectedAgent, outputFormat: value})}
                      >
                        <SelectTrigger className="rounded-xl max-w-md">
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TEXT">Texto Livre (Markdown)</SelectItem>
                          <SelectItem value="JSON">Estrutura JSON (Obrigatório para Automações)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* SUB-BLOCO 3: MEMÓRIA CONTÍNUA & CURADORIA (MEM0 ENGINE) */}
                    <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                        <div>
                          <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-600" />
                            3. Memória Contínua & Aprendizado (Mem0 Engine)
                            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 ml-1">
                              {agentMemories.length} {agentMemories.length === 1 ? 'memória' : 'memórias'}
                            </Badge>
                          </Label>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            O agente aprende, consolida preferências e descarta regras obsoletas a cada conversa no Sandbox ou manual.
                          </p>
                        </div>
                        {agentMemories.length > 0 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleResetMemories}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8 self-start sm:self-auto"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Zerar Memórias
                          </Button>
                        )}
                      </div>

                      {/* FORMULÁRIO DE ADIÇÃO MANUAL */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <Input
                          placeholder="Ex: Não use termos acadêmicos, mantenha tom informal..."
                          value={newMemoryText}
                          onChange={e => setNewMemoryText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddMemory(); } }}
                          className="text-xs rounded-xl bg-white flex-1"
                        />
                        <Select value={newMemoryCategory} onValueChange={setNewMemoryCategory}>
                          <SelectTrigger className="w-full sm:w-[130px] rounded-xl text-xs bg-white">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diretriz">Diretriz</SelectItem>
                            <SelectItem value="estilo">Estilo</SelectItem>
                            <SelectItem value="restricao">Restrição</SelectItem>
                            <SelectItem value="fato">Fato</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={handleAddMemory}
                          className="rounded-xl text-xs bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Gravar
                        </Button>
                      </div>

                      {/* LISTA DE MEMÓRIAS CULTIVADAS */}
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {isLoadingMemories ? (
                          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Carregando memórias do agente...
                          </div>
                        ) : agentMemories.length === 0 ? (
                          <div className="p-4 bg-white/60 border border-dashed rounded-xl text-center">
                            <p className="text-xs text-muted-foreground">
                              Nenhuma memória gravada ainda. Conforme você conversar com o agente no Sandbox ou adicionar regras acima, o Mem0 irá catalogar e aprender automaticamente.
                            </p>
                          </div>
                        ) : (
                          agentMemories.map(m => {
                            const badgeColors: Record<string, string> = {
                              diretriz: "bg-blue-50 text-blue-700 border-blue-200",
                              estilo: "bg-purple-50 text-purple-700 border-purple-200",
                              restricao: "bg-rose-50 text-rose-700 border-rose-200",
                              fato: "bg-emerald-50 text-emerald-700 border-emerald-200",
                            };
                            return (
                              <div key={m.id} className="flex items-start justify-between gap-3 p-2.5 bg-white rounded-xl border shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-[10px] capitalize px-1.5 py-0 ${badgeColors[m.category] || badgeColors.diretriz}`}>
                                      {m.category}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(m.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-800 leading-relaxed">{m.content}</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteMemory(m.id)}
                                  className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                                  title="Esquecer esta memória"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t p-6">
                  <Button onClick={handleUpdateAgent} className="w-full lg:w-fit ml-auto">
                    Salvar Alterações
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* ABA: SANDBOX INTERATIVO */}
            <TabsContent value="sandbox" className="mt-0">
              <Card className="flex flex-col h-[520px]">
                {/* Header do Sandbox com Agente, Medidor de Tokens & Controles */}
                <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between space-y-0 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">{selectedAgent.name}</CardTitle>
                      <CardDescription className="text-xs">{selectedAgent.description || 'Sem descrição'}</CardDescription>
                    </div>
                  </div>

                  {/* Controles: Medidor de Tokens, Limpar e Ajustes */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono font-medium text-slate-700">
                          {totalTokensSession.toLocaleString()} / {(MAX_CONTEXT_TOKENS / 1000).toFixed(0)}k tokens
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-semibold ${getTokenBadgeColor()}`}>
                          {tokenPercentage}% do contexto
                        </Badge>
                      </div>
                      {/* Barra Visual de Progresso */}
                      <div className="w-36 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            tokenPercentage > 80 ? 'bg-red-500' : tokenPercentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(2, tokenPercentage)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                      {/* Botão de Limpar Chat */}
                      {chatMessages.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Limpar Histórico de Teste"
                          onClick={() => setChatMessages([])}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Botão Ajustes */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Ajustes do Agente"
                        onClick={() => setActiveTab('config')}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Área de Mensagens (Chat Scrollable) */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="p-4 rounded-full bg-primary/5 text-primary border border-primary/10">
                        <Bot className="h-8 w-8" />
                      </div>
                      <div className="max-w-md space-y-1">
                        <p className="font-bold text-slate-800">Pronto para testar o {selectedAgent.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Digite uma mensagem abaixo ou selecione um prompt rápido para simular uma interação real.
                        </p>
                      </div>

                      {/* Prompts Sugeridos Rápidos */}
                      <div className="pt-4 space-y-2 w-full max-w-md">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prompts Sugeridos:</p>
                        <div className="flex flex-col gap-2">
                          {getSuggestedPrompts().map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleTestAgent(prompt)}
                              className="text-left text-xs bg-white p-3 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group shadow-sm"
                            >
                              <span className="text-slate-700 font-medium group-hover:text-primary">{prompt}</span>
                              <Wand2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        {/* Avatar */}
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-slate-800 text-white'
                        }`}>
                          {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>

                        {/* Conteúdo da Mensagem */}
                        <div className="space-y-2">
                          <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            {msg.isError && (
                              <div className="mt-3 pt-3 border-t border-red-100 flex flex-col gap-2">
                                <span className="text-[11px] text-red-600 font-medium">Você quer tentar enviar novamente?</span>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleTestAgent(msg.retryPrompt)}
                                  disabled={isRunningTest}
                                  className="w-fit text-xs gap-1.5 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 rounded-lg h-7"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Refazer
                                </Button>
                              </div>
                            )}

                            {/* Tracing de Chamada de Ferramentas (Accordion de Output) */}
                            {msg.toolCalls && msg.toolCalls.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                  <Zap className="h-3 w-3 text-amber-500" /> Ferramentas Utilizadas ({msg.toolCalls.length}):
                                </p>
                                {msg.toolCalls.map((tc, idx) => {
                                  const isExpanded = expandedTools[`${msg.id}-${idx}`];
                                  return (
                                    <div key={idx} className="border border-blue-100 bg-blue-50/40 rounded-lg text-xs overflow-hidden">
                                      <button
                                        onClick={() => toggleToolAccordion(`${msg.id}-${idx}`)}
                                        className="w-full p-2 flex items-center justify-between hover:bg-blue-100/50 transition-colors text-left"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Badge className="bg-blue-600 text-[10px] px-1.5 py-0">{tc.name}</Badge>
                                          <span className="text-slate-600 font-mono text-[11px] truncate max-w-[200px]">
                                            {JSON.stringify(tc.args)}
                                          </span>
                                        </div>
                                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-blue-500" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-500" />}
                                      </button>
                                      
                                      {/* Detalhes do Resultado da Ferramenta */}
                                      {isExpanded && (
                                        <div className="p-2 border-t border-blue-100 bg-slate-900 text-slate-200 font-mono text-[10px] space-y-1">
                                          <p className="text-blue-400 font-semibold">Parâmetros Enviados:</p>
                                          <pre className="overflow-x-auto p-1 bg-slate-950 rounded">{JSON.stringify(tc.args, null, 2)}</pre>
                                          <p className="text-emerald-400 font-semibold pt-1">Dados Retornados do Banco:</p>
                                          <pre className="overflow-x-auto p-1 bg-slate-950 rounded text-slate-300">{JSON.stringify(tc.result || "Sem retorno", null, 2)}</pre>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Footer da Mensagem (Tempo de Resposta & Tokens) */}
                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground px-1">
                              {msg.executionTimeMs && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  {(msg.executionTimeMs / 1000).toFixed(2)}s
                                </span>
                              )}
                              {msg.usage && (
                                <span>
                                  • {msg.usage.totalTokens} tokens
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Estado de "Pensando" durante execução */}
                  {isRunningTest && (
                    <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                      <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 animate-pulse" />
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs flex items-center gap-2 shadow-sm rounded-tl-none">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span>Processando raciocínio e consultando banco de dados...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </CardContent>

                {/* Footer do Sandbox: Input de Pergunta */}
                <CardFooter className="p-3 border-t bg-white">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleTestAgent();
                    }}
                    className="flex gap-2 w-full"
                  >
                    <Input 
                      placeholder={`Pergunte algo ao ${selectedAgent.name}...`} 
                      value={testPrompt}
                      onChange={e => setTestPrompt(e.target.value)}
                      disabled={isRunningTest}
                      className="rounded-xl"
                    />
                    <Button 
                      type="submit" 
                      disabled={isRunningTest || !testPrompt.trim()}
                      className="rounded-xl px-4"
                    >
                      {isRunningTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      Enviar
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* ABA: AUDITORIA & ORQUESTRAÇÃO MULTI-AGENTE */}
            <TabsContent value="orchestration" className="mt-0 space-y-6">
              <Card className="rounded-[15px]">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-emerald-600" />
                      Auditoria de Loops & Intervenção Humana (Multi-Agente)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Acompanhe os ciclos entre Redator e Revisor, verifique notas de qualidade, travas de segurança e envie direcionamentos diretos.
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadOrchestrationData} 
                    disabled={isLoadingOrchestration}
                    className="rounded-xl text-xs gap-1.5"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 ${isLoadingOrchestration ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* SEÇÃO 1: ITENS ATIVOS NO LOOP COM PONTOS DE INTERVENÇÃO */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        Itens em Processamento / Espera ({orchestratedItems.length})
                      </Label>
                    </div>

                    {isLoadingOrchestration ? (
                      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Carregando itens do fluxo...
                      </div>
                    ) : orchestratedItems.length === 0 ? (
                      <div className="p-6 bg-slate-50 border border-dashed rounded-xl text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-medium text-slate-700">Nenhum item travado ou pendente de revisão no momento.</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Todos os artigos já foram aprovados ou o maestro está ocioso.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {orchestratedItems.map(item => {
                          const isAwaitingAdmin = item.orchestrationStatus === "AWAITING_ADMIN";
                          const isPaused = item.orchestrationStatus === "PAUSED";
                          const score = item.qualityScore;

                          return (
                            <div 
                              key={item.id} 
                              className={`p-4 rounded-xl border transition-all ${
                                isAwaitingAdmin 
                                  ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20 shadow-sm' 
                                  : isPaused
                                  ? 'bg-amber-50/50 border-amber-200'
                                  : 'bg-white border-slate-200 shadow-2xs'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                                    {isAwaitingAdmin && (
                                      <Badge className="bg-rose-600 text-white text-[10px] animate-pulse">
                                        🚨 Trava Acionada: Requer Intervenção (3/3 ciclos)
                                      </Badge>
                                    )}
                                    {isPaused && (
                                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                                        ⏸️ Pausado Manualmente
                                      </Badge>
                                    )}
                                    <Badge variant="secondary" className="text-[10px]">
                                      Status: {item.status} (Ciclo {item.loopIteration || 1}/3)
                                    </Badge>
                                    {score !== null && score !== undefined && (
                                      <Badge className={`text-[10px] ${score >= 80 ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                                        Nota: {score}/100
                                      </Badge>
                                    )}
                                  </div>

                                  {item.lastReviewFeedback && (
                                    <p className="text-xs text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60 mt-1">
                                      <span className="font-semibold text-slate-800">Último parecer do Revisor:</span> {item.lastReviewFeedback}
                                    </p>
                                  )}

                                  {item.adminDirective && (
                                    <p className="text-xs text-purple-900 bg-purple-50 p-2 rounded-lg border border-purple-200 mt-1">
                                      <span className="font-semibold">Direcionamento ativo do Admin:</span> {item.adminDirective}
                                    </p>
                                  )}
                                </div>

                                {/* BOTÕES DE AÇÃO RÁPIDA (HUMAN-IN-THE-LOOP) */}
                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleAdminIntervene(item.id, isPaused ? "RESUME" : "PAUSE")}
                                    className="rounded-xl text-xs h-8"
                                  >
                                    {isPaused ? <Play className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Pause className="h-3.5 w-3.5 mr-1 text-amber-600" />}
                                    {isPaused ? "Retomar" : "Pausar"}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleAdminIntervene(item.id, "APPROVE")}
                                    className="rounded-xl text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Aprovar Manualmente
                                  </Button>
                                </div>
                              </div>

                              {/* ENVIAR DIRECIONAMENTO HUMANO */}
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/60">
                                <Input 
                                  placeholder="Digite uma instrução direta para o agente corrigir..."
                                  value={directInstructions[item.id] || ""}
                                  onChange={e => setDirectInstructions({ ...directInstructions, [item.id]: e.target.value })}
                                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdminIntervene(item.id, "DIRECT"); } }}
                                  className="h-8 text-xs rounded-xl bg-white"
                                />
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  onClick={() => handleAdminIntervene(item.id, "DIRECT")}
                                  className="h-8 text-xs rounded-xl gap-1 shrink-0 bg-purple-100 hover:bg-purple-200 text-purple-800"
                                >
                                  <Send className="h-3 w-3" />
                                  Direcionar
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SEÇÃO 2: LOGS DE AUDITORIA HISTÓRICA */}
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      Histórico Recente de Interações entre Agentes
                    </Label>

                    {loopLogs.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">Nenhum evento registrado ainda.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {loopLogs.map(log => {
                          const actionLabels: Record<string, { label: string, color: string }> = {
                            DRAFT_GENERATED: { label: "Rascunho Gerado", color: "bg-blue-50 text-blue-700 border-blue-200" },
                            QUALITY_CHECK: { label: "Avaliação de Qualidade", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                            REVIEW_ANALYSIS: { label: "Ajuste Solicitado", color: "bg-amber-50 text-amber-700 border-amber-200" },
                            ESCALATED_ADMIN: { label: "Trava de Segurança Acionada", color: "bg-rose-50 text-rose-700 border-rose-200" },
                            HUMAN_APPROVED: { label: "Aprovação Manual", color: "bg-emerald-50 text-emerald-800 border-emerald-300" },
                            HUMAN_PAUSED: { label: "Pausado pelo Admin", color: "bg-slate-100 text-slate-700 border-slate-300" },
                            HUMAN_RESUMED: { label: "Retomado pelo Admin", color: "bg-blue-50 text-blue-700 border-blue-200" },
                            HUMAN_DIRECTED: { label: "Direcionamento Humano", color: "bg-purple-50 text-purple-700 border-purple-200" },
                          };
                          const meta = actionLabels[log.action] || { label: log.action, color: "bg-slate-50 text-slate-700 border-slate-200" };

                          return (
                            <div key={log.id} className="p-2.5 bg-slate-50/70 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{log.agentName}</span>
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${meta.color}`}>
                                    {meta.label}
                                  </Badge>
                                  {log.score !== null && (
                                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                                      Score: {log.score}/100
                                    </span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground ml-auto sm:ml-0">
                                    {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                  <span className="font-medium text-slate-800">[{log.entityTitle || log.entityId}]</span> {log.feedback}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="automations" className="mt-0 space-y-6">
              <Card className="rounded-[15px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-violet-600" /> Fluxos de Onboarding & Atendimento</CardTitle>
                    <CardDescription>Crie automa��es de boas-vindas com fluxos conversacionais ramificados para novos alunos e professores.</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsCreatingOnboarding(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Fluxo
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isCreatingOnboarding && (
                    <div className="border rounded-xl p-4 bg-violet-50 space-y-3">
                      <p className="text-sm font-semibold text-violet-800">Criar nova automa��o</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome</Label>
                          <Input placeholder="Ex: Boas-vindas Aluno" value={newOnboardingName} onChange={e => setNewOnboardingName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Gatilho</Label>
                          <Select value={newOnboardingTrigger} onValueChange={setNewOnboardingTrigger}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NEW_USER">Novo Aluno</SelectItem>
                              <SelectItem value="NEW_TEACHER">Novo Professor</SelectItem>
                              <SelectItem value="MANUAL">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreateOnboarding}>Criar</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsCreatingOnboarding(false)}>Cancelar</Button>
                      </div>
                    </div>
                  )}
                  {isLoadingOnboarding ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-4"><Loader2 className="h-4 w-4 animate-spin" /> Carregando automa��es...</div>
                  ) : onboardingAutomations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitBranch className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhuma automa��o criada ainda. Clique em "Novo Fluxo" para come�ar.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {onboardingAutomations.map((automation: any) => (
                        <div key={automation.id} className="border rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between p-3 bg-slate-50/80">
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleToggleOnboarding(automation.id, automation.isActive)} className="shrink-0">
                                {automation.isActive
                                  ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                                  : <ToggleLeft className="h-6 w-6 text-slate-400" />}
                              </button>
                              <div>
                                <p className="font-semibold text-sm">{automation.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px] px-1.5">
                                    {automation.triggerType === 'NEW_USER' ? '?? Novo Aluno' : automation.triggerType === 'NEW_TEACHER' ? '?? Novo Professor' : '?? Manual'}
                                  </Badge>
                                  {automation.isActive && <Badge className="text-[10px] px-1.5 bg-emerald-500">Ativa</Badge>}
                                  {automation.agent && <Badge variant="secondary" className="text-[10px] px-1.5">?? {automation.agent.name}</Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-40">
                                <Select value={automation.agentId || 'none'} onValueChange={v => handleAssignAgent(automation.id, v)}>
                                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecionar agente" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sem agente</SelectItem>
                                    {agents.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditingFlow({ automationId: automation.id, nodes: JSON.parse(automation.flowJson || '[]') })}>
                                <Edit3 className="h-3 w-3" /> Editar Fluxo
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600" onClick={() => handleDeleteOnboarding(automation.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {editingFlow?.automationId === automation.id && (
                            <div className="p-4 space-y-4 border-t bg-white">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-violet-700 flex items-center gap-2"><GitBranch className="h-4 w-4" /> Editor de Fluxo Conversacional</p>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleAddFlowNode('message')}>
                                    <MessageCircleMore className="h-3 w-3" /> + Mensagem
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleAddFlowNode('question')}>
                                    <HelpCircle className="h-3 w-3" /> + Pergunta
                                  </Button>
                                  <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSaveFlow}>
                                    <CheckCircle2 className="h-3 w-3" /> Salvar Fluxo
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {editingFlow.nodes.map((node, idx) => (
                                  <div key={node.id} className={`border rounded-lg p-3 space-y-2 ${node.type === 'question' ? 'border-amber-300 bg-amber-50/50' : 'border-blue-200 bg-blue-50/50'}`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                                        <Badge variant="outline" className={`text-[10px] px-1.5 ${node.type === 'question' ? 'border-amber-400 text-amber-700' : 'border-blue-400 text-blue-700'}`}>
                                          {node.type === 'question' ? <><HelpCircle className="h-2.5 w-2.5 inline mr-0.5" />Pergunta</> : <><MessageCircleMore className="h-2.5 w-2.5 inline mr-0.5" />Mensagem</>}
                                        </Badge>
                                        <span className="text-[10px] text-slate-400">id: {node.id}</span>
                                      </div>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-rose-400" onClick={() => handleRemoveFlowNode(node.id)}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Textarea
                                      className="text-xs min-h-[60px] resize-none"
                                      value={node.content}
                                      onChange={e => handleUpdateFlowNode(node.id, 'content', e.target.value)}
                                      placeholder="Conte�do da mensagem ou pergunta..."
                                    />
                                    {node.type === 'message' && (
                                      <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <ArrowRight className="h-3 w-3" />
                                        <span>Pr�ximo n�:</span>
                                        <Input
                                          className="h-6 text-xs w-24 py-0"
                                          value={node.next || 'end'}
                                          onChange={e => handleUpdateFlowNode(node.id, 'next', e.target.value)}
                                          placeholder="id ou 'end'"
                                        />
                                      </div>
                                    )}
                                    {node.type === 'question' && node.options && (
                                      <div className="space-y-1.5">
                                        <p className="text-[10px] font-semibold text-amber-700">Op��es de resposta:</p>
                                        {node.options.map((opt, oi) => (
                                          <div key={oi} className="flex items-center gap-2">
                                            <Input
                                              className="h-6 text-xs flex-1 py-0"
                                              value={opt.label}
                                              onChange={e => {
                                                const opts = [...(node.options || [])];
                                                opts[oi] = { ...opts[oi], label: e.target.value };
                                                handleUpdateFlowNode(node.id, 'options', opts);
                                              }}
                                              placeholder="R�tulo da op��o"
                                            />
                                            <span className="text-[10px] text-slate-400 shrink-0">?</span>
                                            <Input
                                              className="h-6 text-xs w-20 py-0"
                                              value={opt.next}
                                              onChange={e => {
                                                const opts = [...(node.options || [])];
                                                opts[oi] = { ...opts[oi], next: e.target.value };
                                                handleUpdateFlowNode(node.id, 'options', opts);
                                              }}
                                              placeholder="id/end"
                                            />
                                            <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-rose-400" onClick={() => {
                                              const opts = (node.options || []).filter((_, i) => i !== oi);
                                              handleUpdateFlowNode(node.id, 'options', opts);
                                            }}><X className="h-2.5 w-2.5" /></Button>
                                          </div>
                                        ))}
                                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => {
                                          const opts = [...(node.options || []), { label: 'Nova op��o', next: 'end' }];
                                          handleUpdateFlowNode(node.id, 'options', opts);
                                        }}>+ Adicionar op��o</Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="h-64 flex flex-col items-center justify-center text-center p-6 border-dashed">
            <Bot className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">Selecione um agente na barra lateral ou crie um novo para começar.</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              Criar Primeiro Agente
            </Button>
          </Card>
        )}
      </div>

      {/* Dialog: Criar Agente */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Agente Inteligente</DialogTitle>
            <DialogDescription>Crie um agente especializado para automatizar sua plataforma.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome do Agente</Label>
                <Input placeholder="Ex: Escritor de Blog" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Modelo Principal</Label>
                <Select 
                  value={newAgent.model || 'gemini-3.6-flash'} 
                  onValueChange={value => setNewAgent({...newAgent, model: value})}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.length === 0 ? (
                      <SelectItem value="none" disabled>Configure as chaves API primeiro</SelectItem>
                    ) : (
                      activeProviderKeys.map(provider => (
                        <SelectGroup key={provider}>
                          <SelectLabel className="font-bold text-slate-800 bg-slate-50 sticky top-0">{modelsByProvider[provider]?.label}</SelectLabel>
                          {modelsByProvider[provider]?.models.filter(m => !hiddenModels.includes(m)).map(m => (
                            <SelectItem key={m} value={m} className="group relative pr-8">
                              <div className="flex items-center justify-between w-full">
                                <span className="truncate">{m.replace('openrouter:', '')}</span>
                                <button
                                  type="button"
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onPointerUp={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleHideModel(m);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 transition-opacity absolute right-6 z-50 pointer-events-auto cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                                </button>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição Curta</Label>
              <Input placeholder="O que este agente faz?" value={newAgent.description} onChange={e => setNewAgent({...newAgent, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Ferramentas Iniciais</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TOOLS.map(tool => (
                  <Badge 
                    key={tool.id} 
                    variant={newAgent.tools.includes(tool.id) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1 text-xs"
                    onClick={() => toggleNewAgentTool(tool.id)}
                  >
                    {tool.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateAgent}>Criar Agente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
