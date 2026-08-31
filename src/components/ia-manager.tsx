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
  X
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
  getAvailableProviders
} from '@/app/actions/ia';

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

  useEffect(() => {
    const saved = localStorage.getItem('@senra:hiddenModels');
    if (saved) {
      try { setHiddenModels(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

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

  // Limpar chat ao trocar de agente
  useEffect(() => {
    setChatMessages([]);
  }, [selectedAgent?.id]);

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
      <Card className="h-fit">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold">Meus Agentes</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="grid gap-2 p-4 pt-0">
          {agents.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum agente criado.</p>
          )}
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent({
                ...agent,
                tools: typeof agent.tools === 'string' ? JSON.parse(agent.tools) : agent.tools
              })}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                selectedAgent?.id === agent.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-accent text-muted-foreground'
              }`}
            >
              <Bot className="h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold truncate text-sm">{agent.name}</p>
                <p className={`text-xs truncate ${selectedAgent?.id === agent.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {agent.model}
                </p>
              </div>
            </button>
          ))}

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
            {/* ABA: CONFIGURAÇÕES */}
            <TabsContent value="config" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('sandbox')} className="h-7 text-xs">
                        ← Voltar ao Sandbox
                      </Button>
                    </div>
                    <CardTitle>Perfil e Instruções do Agente</CardTitle>
                    <CardDescription>Defina a personalidade, modelo e permissões de ferramentas.</CardDescription>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAgent(selectedAgent.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Excluir
                  </Button>
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
                    <Input 
                      value={selectedAgent.description || ""} 
                      onChange={e => setSelectedAgent({...selectedAgent, description: e.target.value})} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Instruções de Personalidade (System Prompt)</Label>
                    <Textarea 
                      placeholder="Ex: Você é um assistente focado em CRM. Sua missão é garantir que todos os leads..."
                      className="min-h-[150px] font-mono text-sm"
                      value={selectedAgent.instructions || ""}
                      onChange={e => setSelectedAgent({...selectedAgent, instructions: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground italic">
                      Dica: Descreva o tom de voz, o que ele deve priorizar e o que ele NÃO deve fazer.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" /> 
                      Ferramentas Habilitadas (Capabilities)
                    </Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {AVAILABLE_TOOLS.map(tool => {
                        const isEnabled = (selectedAgent.tools || []).includes(tool.id);
                        return (
                          <button
                            key={tool.id}
                            onClick={() => toggleTool(tool.id)}
                            className={`flex items-start gap-3 p-3 border rounded-xl text-left transition-all ${
                              isEnabled ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent opacity-60'
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                              <tool.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{tool.name}</p>
                              <p className="text-xs text-muted-foreground">{tool.description}</p>
                            </div>
                          </button>
                        );
                      })}
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
              <Card className="flex flex-col h-[565px]">
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
