'use client';

import { useEffect, useState } from 'react';
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
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  getAiAgents,
  createAiAgent,
  updateAiAgent,
  deleteAiAgent,
  runAiAgentTest,
  getAvailableProviders
} from '@/app/actions/ia';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
}

const MODELS_BY_PROVIDER: Record<string, { label: string, models: string[] }> = {
  gemini: { label: 'Google Gemini', models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'] },
  openai: { label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  anthropic: { label: 'Anthropic (Claude)', models: ['claude-3-5-sonnet-latest', 'claude-3-opus-latest', 'claude-3-haiku-20240307'] },
  grok: { label: 'xAI (Grok)', models: ['grok-beta'] },
  minimax: { label: 'MiniMax', models: ['abab6.5-chat', 'abab6-chat'] },
  openrouter: { label: 'OpenRouter', models: ['google/gemini-2.0-flash-exp:free', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet'] },
};

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
    model: 'gemini-1.5-flash',
  },
  {
    name: 'Redator de Blog',
    description: 'Cria conteúdos otimizados para SEO e gerencia o blog.',
    instructions: 'Você é um redator especializado em educação. Sua missão é criar posts engajadores para o blog. Sempre verifique posts existentes com searchBlogPosts antes de sugerir novos.',
    tools: ['blog', 'searchBlogPosts'],
    model: 'gemini-1.5-flash',
  },
  {
    name: 'Gestor de Operações',
    description: 'Monitora métricas e gera relatórios de desempenho.',
    instructions: 'Você é um gestor operacional. Sua missão é fornecer uma visão clara da saúde da plataforma. Use getSystemStats para reportar números de alunos e leads.',
    tools: ['stats'],
    model: 'gemini-1.5-flash',
  },
];

export function IaManager() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testPrompt, setTestPrompt] = useState('');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResponse, setTestResponse] = useState('');
  const [toolCalls, setToolCalls] = useState<any[]>([]);

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

  const loadProviders = async () => {
    const result = await getAvailableProviders();
    if (result.success) {
      setAvailableProviders(result.data || []);
    }
  };

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
      setNewAgent({ name: '', description: '', instructions: '', model: 'gemini-2.0-flash', tools: [] });
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
      name: selectedAgent.name,
      description: selectedAgent.description,
      instructions: selectedAgent.instructions,
      model: selectedAgent.model,
      tools: JSON.stringify(selectedAgent.tools || [])
    });

    if (result.success) {
      toast.success("Configurações salvas!");
      loadAgents();
    } else {
      toast.error(result.error || "Erro ao atualizar agente");
    }
    setLoading(false);
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agente?")) return;

    const result = await deleteAiAgent(id);
    if (result.success) {
      toast.success("Agente removido.");
      if (selectedAgent?.id === id) setSelectedAgent(null);
      loadAgents();
    }
  };

  const handleTestAgent = async () => {
    if (!testPrompt || !selectedAgent) return;

    setIsRunningTest(true);
    setTestResponse('');
    setToolCalls([]);
    console.log("Iniciando teste do agente:", selectedAgent.id);
    const result = await runAiAgentTest(selectedAgent.id, testPrompt);
    console.log("Resultado do teste:", result);

    if (result && result.success) {
      setTestResponse(result.response || "");
      setToolCalls(result.toolCalls || []);
    } else {
      const errorMsg = result?.error || "Erro desconhecido ao testar agente";
      toast.error(errorMsg);
      setTestResponse(`Erro: ${errorMsg}`);
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
          <Button variant="outline" className="w-full mt-2 border-dashed" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agente Customizado
          </Button>

          <div className="mt-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Templates Rápidos</p>
            <div className="grid gap-2">
              {AGENT_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setNewAgent({
                      name: template.name,
                      description: template.description,
                      instructions: template.instructions,
                      model: template.model,
                      tools: template.tools
                    });
                    setIsCreateDialogOpen(true);
                  }}
                  className="flex flex-col gap-1 p-3 rounded-xl border bg-card hover:bg-accent text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{template.name}</span>
                    <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">{template.description}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Configuração do Agente */}
      <div className="grid gap-6">
        {selectedAgent ? (
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="config" className="gap-2">
                <Settings2 className="h-4 w-4" /> Configuração
              </TabsTrigger>
              <TabsTrigger value="sandbox" className="gap-2">
                <MessageSquare className="h-4 w-4" /> Sandbox
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Configurar Agente</CardTitle>
                      <CardDescription>Defina as instruções e permissões para {selectedAgent.name}</CardDescription>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteAgent(selectedAgent.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome do Agente</Label>
                      <Input 
                        value={selectedAgent.name} 
                        onChange={e => setSelectedAgent({...selectedAgent, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Modelo Principal</Label>
                      <Select 
                        value={selectedAgent.model} 
                        onValueChange={value => setSelectedAgent({...selectedAgent, model: value})}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecione um modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProviders.length === 0 ? (
                            <SelectItem value="none" disabled>Nenhuma chave de API configurada</SelectItem>
                          ) : (
                            availableProviders.map(provider => (
                              <SelectGroup key={provider}>
                                <SelectLabel>{MODELS_BY_PROVIDER[provider]?.label}</SelectLabel>
                                {MODELS_BY_PROVIDER[provider]?.models.map(m => (
                                  <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                              </SelectGroup>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
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
                      <ShieldCheck className="h-4 w-4 text-green-500" /> 
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

            <TabsContent value="sandbox" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sandbox de Teste</CardTitle>
                  <CardDescription>Simule uma interação com seu agente para validar o comportamento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="min-h-[300px] border rounded-xl bg-slate-50 p-4 font-mono text-sm overflow-y-auto">
                    {testResponse || toolCalls.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Badge variant="outline">User</Badge>
                          <p className="text-slate-600">{testPrompt}</p>
                        </div>
                        
                        {toolCalls.map((call, idx) => (
                          <div key={idx} className="flex gap-2 items-start bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                            <Zap className="h-4 w-4 text-blue-500 mt-1" />
                            <div className="text-xs">
                              <span className="font-bold text-blue-700">Chamando ferramenta: </span>
                              <code className="bg-blue-100 px-1 rounded">{call.name}</code>
                              <pre className="mt-1 text-[10px] text-blue-600 overflow-x-auto">
                                {JSON.stringify(call.args, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ))}

                        {testResponse && (
                          <div className="flex gap-2">
                            <Badge className="bg-primary">IA</Badge>
                            <p className="text-slate-900 whitespace-pre-wrap">{testResponse}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic text-center py-20">Aguardando comando para teste...</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Diga algo ao agente..." 
                      value={testPrompt}
                      onChange={e => setTestPrompt(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleTestAgent()}
                    />
                    <Button onClick={handleTestAgent} disabled={isRunningTest || !testPrompt}>
                      {isRunningTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      Testar
                    </Button>
                  </div>
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
                  value={newAgent.model} 
                  onValueChange={value => setNewAgent({...newAgent, model: value})}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.length === 0 ? (
                      <SelectItem value="none" disabled>Configure as chaves API primeiro</SelectItem>
                    ) : (
                      availableProviders.map(provider => (
                        <SelectGroup key={provider}>
                          <SelectLabel>{MODELS_BY_PROVIDER[provider]?.label}</SelectLabel>
                          {MODELS_BY_PROVIDER[provider]?.models.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
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
