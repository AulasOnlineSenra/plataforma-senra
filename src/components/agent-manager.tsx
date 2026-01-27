'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Bot, Plus, Trash2, Loader2, Wand2 } from 'lucide-react';
import { financialAnalystAgent } from '@/ai/flows/financial-analyst-agent';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
}

const initialAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Agente Analista Financeiro',
    description:
      'Este agente analisa os dados financeiros da plataforma e fornece insights sobre faturamento, despesas e lucratividade.',
    model: 'googleai/gemini-2.5-flash',
  },
];

const financialData = {
  faturamentoMensal: 45231.89,
  despesasTotais: 28233.5,
  lucroLiquido: 16998.39,
  margemLucro: 37.6,
  detalhesDespesas: {
    professores: 11150.0,
    plataforma: 1500.0,
    anuncios: 12543.0,
    marketing: 8750.0,
    comissoes: 4890.5,
  },
};

export function AgentManager() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(
    initialAgents[0]
  );
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentDescription, setNewAgentDescription] = useState('');
  const [newAgentModel, setNewAgentModel] = useState('');

  const handleRunAgent = async () => {
    if (!prompt || !selectedAgent) {
      toast({
        variant: 'destructive',
        title: 'Entrada Inválida',
        description: 'Por favor, selecione um agente e insira um prompt.',
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const result = await financialAnalystAgent({
        prompt,
        financialData: JSON.stringify(financialData, null, 2),
      });
      setAnalysisResult(result.analysis);
    } catch (error) {
      console.error('Erro ao executar o agente:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Executar Agente',
        description:
          'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== agentId));
    if (selectedAgent?.id === agentId) {
      setSelectedAgent(null);
    }
    toast({
      title: 'Agente Excluído',
      description: 'O agente foi removido com sucesso.',
    });
  };

  const handleCreateAgent = () => {
    if (!newAgentName || !newAgentDescription || !newAgentModel) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description: 'Por favor, preencha todos os campos para criar um agente.',
      });
      return;
    }
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: newAgentName,
      description: newAgentDescription,
      model: newAgentModel,
    };
    setAgents(prev => [...prev, newAgent]);
    toast({
      title: 'Agente Criado!',
      description: `O agente "${newAgentName}" foi criado com sucesso.`,
    });
    // Reset form and close dialog
    setIsCreateDialogOpen(false);
    setNewAgentName('');
    setNewAgentDescription('');
    setNewAgentModel('');
  };

  return (
    <>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciador de Agentes de IA</CardTitle>
            <CardDescription>
              Crie, configure e execute agentes de IA para automatizar tarefas
              administrativas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-lg">Agentes Disponíveis</h3>
              <div className="flex flex-col gap-2">
                {agents.map((agent) => (
                  <div key={agent.id} className="relative group">
                    <button
                      onClick={() => setSelectedAgent(agent)}
                      className={`p-4 border rounded-lg text-left transition-colors w-full ${
                        selectedAgent?.id === agent.id
                          ? 'bg-primary/10 border-primary ring-2 ring-primary'
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bot className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-semibold">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.model}
                          </p>
                        </div>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAgent(agent.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-2" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2" />
                Criar Novo Agente
              </Button>
            </div>
            <Card className="flex flex-col">
              {selectedAgent ? (
                <>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedAgent.name}</CardTitle>
                        <CardDescription>
                          {selectedAgent.description}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAgent(selectedAgent.id)}
                      >
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="agent-prompt">Prompt do Agente</Label>
                      <Textarea
                        id="agent-prompt"
                        placeholder="Ex: Qual foi a maior despesa deste mês e qual a porcentagem dela sobre o faturamento?"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                      />
                    </div>
                    {analysisResult && (
                      <div className="grid gap-2">
                        <Label>Resultado da Análise</Label>
                        <div className="prose prose-sm max-w-none rounded-md border bg-muted p-4 text-muted-foreground">
                          <p>{analysisResult}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handleRunAgent}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2" />
                      )}
                      Executar Agente
                    </Button>
                  </CardFooter>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-muted-foreground">
                  <p>Selecione um agente para começar.</p>
                </div>
              )}
            </Card>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Agente de IA</DialogTitle>
            <DialogDescription>
              Configure um novo agente de IA. Você precisará fornecer o identificador do modelo que deseja usar, conectado através da sua chave de API.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-agent-name">Nome do Agente</Label>
              <Input
                id="new-agent-name"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="Ex: Agente de Suporte ao Cliente"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-agent-description">Descrição</Label>
              <Textarea
                id="new-agent-description"
                value={newAgentDescription}
                onChange={(e) => setNewAgentDescription(e.target.value)}
                placeholder="O que este agente faz?"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-agent-model">Modelo de IA</Label>
              <Input
                id="new-agent-model"
                value={newAgentModel}
                onChange={(e) => setNewAgentModel(e.target.value)}
                placeholder="Ex: googleai/gemini-2.5-flash"
              />
              <p className="text-xs text-muted-foreground">
                Insira o identificador do modelo que você conectou com sua chave de API.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateAgent}>Criar Agente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
