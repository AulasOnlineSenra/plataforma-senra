"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Pause,
  Activity,
  Bot,
  ArrowRight,
  ShieldAlert,
  LayoutDashboard,
  Loader2,
  PlayCircle,
  Plus,
  Sparkles,
  PenTool,
  GitBranch,
  MessageCircleMore,
  HelpCircle,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  X,
  User,
  GraduationCap,
  Wrench,
} from "lucide-react";
import {
  runAiSupervisor,
  getAutomationWorkflows,
  updateAutomationWorkflow,
} from "@/app/actions/automation";
import { getAiAgents } from "@/app/actions/ia";
import {
  getOnboardingAutomations,
  createOnboardingAutomation,
  updateOnboardingAutomation,
  deleteOnboardingAutomation,
  type FlowNode,
} from "@/app/actions/onboarding-automation";
import { toast } from "sonner";

export function AutomationManager() {
  const [activeTab, setActiveTab] = useState<"onboarding" | "blog">("onboarding");

  // ─── Estado do Blog Maestro ──────────────────────────────
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [frequency, setFrequency] = useState("hourly");
  const [batchSize, setBatchSize] = useState("2");
  const [queueOrder, setQueueOrder] = useState("FIFO");
  const [steps, setSteps] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stepMessages, setStepMessages] = useState<
    Record<string, { text: string; type: "error" | "success" }>
  >({});

  // ─── Estado do Onboarding ────────────────────────────────
  const [onboardingAutomations, setOnboardingAutomations] = useState<any[]>([]);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(false);
  const [editingFlow, setEditingFlow] = useState<{
    automationId: string;
    nodes: FlowNode[];
  } | null>(null);
  const [isCreatingOnboarding, setIsCreatingOnboarding] = useState(false);
  const [newOnboardingName, setNewOnboardingName] = useState("");
  const [newOnboardingTrigger, setNewOnboardingTrigger] = useState("NEW_USER");

  useEffect(() => {
    loadData();
    loadOnboardingData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [workflowsRes, agentsRes] = await Promise.all([
        getAutomationWorkflows(),
        getAiAgents(),
      ]);

      if (agentsRes.success && agentsRes.data) setAgents(agentsRes.data);
      if (workflowsRes.success && workflowsRes.data) {
        setWorkflows(workflowsRes.data);
        if (workflowsRes.data.length > 0) {
          selectWorkflow(workflowsRes.data[0]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadOnboardingData = async () => {
    setIsLoadingOnboarding(true);
    try {
      const res = await getOnboardingAutomations();
      if (res?.success && res.data) setOnboardingAutomations(res.data);
    } finally {
      setIsLoadingOnboarding(false);
    }
  };

  const selectWorkflow = (workflow: any) => {
    setSelectedWorkflowId(workflow.id);
    setIsActive(workflow.isActive);
    setFrequency(workflow.frequency);
    setBatchSize(workflow.batchSize.toString());
    setQueueOrder(workflow.queueOrder);
    setSteps(workflow.steps || []);
  };

  const handleSave = async () => {
    if (!selectedWorkflowId) return;
    setIsSaving(true);
    const result = await updateAutomationWorkflow(
      selectedWorkflowId,
      {
        isActive,
        frequency,
        batchSize,
        queueOrder,
        supervisorAgentId: workflows.find((w) => w.id === selectedWorkflowId)
          ?.supervisorAgentId,
      },
      steps
    );

    if (result.success) {
      toast.success("Configurações do Maestro salvas com sucesso!");
      loadData();
    } else {
      toast.error(result.error || "Erro ao salvar configurações.");
    }
    setIsSaving(false);
  };

  const handleRunManualTest = async () => {
    setIsTesting(true);
    try {
      const result = await runAiSupervisor();
      if (result.success) {
        if ((result as any).stepResults) {
          const res = (result as any).stepResults;
          const newMsgs: Record<
            string,
            { text: string; type: "success" | "error" }
          > = {};
          if (res.DRAFT) newMsgs["DRAFT"] = { text: res.DRAFT, type: "success" };
          if (res.REVIEW) newMsgs["REVIEW"] = { text: res.REVIEW, type: "success" };
          setStepMessages(newMsgs);
        }
        toast.success(result.message || "Ciclo do Maestro finalizado!");
      } else {
        toast.error(result.message || result.error || "Erro no Maestro.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro crítico ao rodar teste.");
    }
    setIsTesting(false);
  };

  // ─── Ações de Onboarding ─────────────────────────────────
  const handleCreateOnboarding = async () => {
    if (!newOnboardingName.trim()) {
      toast.error("Digite um nome para a automação.");
      return;
    }
    const res = await createOnboardingAutomation({
      name: newOnboardingName,
      triggerType: newOnboardingTrigger,
    });
    if (res?.success) {
      toast.success("Automação criada com sucesso!");
      setNewOnboardingName("");
      setIsCreatingOnboarding(false);
      loadOnboardingData();
    } else {
      toast.error(res?.error || "Erro ao criar automação.");
    }
  };

  const handleToggleOnboarding = async (
    id: string,
    currentActive: boolean
  ) => {
    const res = await updateOnboardingAutomation(id, {
      isActive: !currentActive,
    });
    if (res?.success) {
      toast.success(!currentActive ? "Automação ativada!" : "Automação pausada.");
      loadOnboardingData();
    } else {
      toast.error("Erro ao alterar status.");
    }
  };

  const handleDeleteOnboarding = async (id: string) => {
    if (!confirm("Excluir esta automação de onboarding?")) return;
    const res = await deleteOnboardingAutomation(id);
    if (res?.success) {
      toast.success("Automação excluída.");
      loadOnboardingData();
      if (editingFlow?.automationId === id) setEditingFlow(null);
    }
  };

  const handleAssignAgent = async (
    automationId: string,
    agentId: string
  ) => {
    const res = await updateOnboardingAutomation(automationId, {
      agentId: agentId === "none" ? null : agentId,
    });
    if (res?.success) {
      toast.success("Agente atribuído com sucesso!");
      loadOnboardingData();
    }
  };

  const handleSaveFlow = async () => {
    if (!editingFlow) return;
    const res = await updateOnboardingAutomation(editingFlow.automationId, {
      flowJson: JSON.stringify(editingFlow.nodes),
    });
    if (res?.success) {
      toast.success("Fluxo conversacional salvo com sucesso!");
      loadOnboardingData();
    } else {
      toast.error("Erro ao salvar fluxo.");
    }
  };

  const handleUpdateFlowNode = (
    nodeId: string,
    field: keyof FlowNode,
    value: any
  ) => {
    if (!editingFlow) return;
    setEditingFlow((prev) => ({
      ...prev!,
      nodes: prev!.nodes.map((n) =>
        n.id === nodeId ? { ...n, [field]: value } : n
      ),
    }));
  };

  const handleAddFlowNode = (type: "message" | "question") => {
    if (!editingFlow) return;
    const newId = String(Date.now());
    const newNode: FlowNode =
      type === "message"
        ? { id: newId, type: "message", content: "Nova mensagem...", next: "end" }
        : {
            id: newId,
            type: "question",
            content: "Nova pergunta?",
            options: [{ label: "Opção 1", next: "end" }],
          };
    setEditingFlow((prev) => ({ ...prev!, nodes: [...prev!.nodes, newNode] }));
  };

  const handleRemoveFlowNode = (nodeId: string) => {
    if (!editingFlow) return;
    setEditingFlow((prev) => ({
      ...prev!,
      nodes: prev!.nodes.filter((n) => n.id !== nodeId),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId);

  return (
    <div className="space-y-6">
      {/* NAVEGAÇÃO DE TIPO DE AUTOMAÇÃO */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "onboarding" | "blog")}
        className="w-full"
      >
        <div className="flex items-center justify-between pb-2">
          <TabsList className="bg-slate-100/90 p-1 rounded-2xl border">
            <TabsTrigger
              value="onboarding"
              className="rounded-xl gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <GitBranch className="h-4 w-4 text-violet-600" /> Fluxos de Onboarding
              {onboardingAutomations.length > 0 && (
                <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded-full ml-1">
                  {onboardingAutomations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="blog"
              className="rounded-xl gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <PenTool className="h-4 w-4 text-primary" /> Esteira do Blog (Maestro)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── ABA 1: ONBOARDING & ATENDIMENTO ───────────────── */}
        <TabsContent value="onboarding" className="mt-0 space-y-6">
          <Card className="rounded-[15px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-violet-600" /> Fluxos de Onboarding & Atendimento
                </CardTitle>
                <CardDescription>
                  Crie automações de boas-vindas com fluxos conversacionais ramificados para novos alunos e professores.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setIsCreatingOnboarding(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Novo Fluxo
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCreatingOnboarding && (
                <div className="border rounded-xl p-4 bg-violet-50/70 border-violet-200 space-y-3">
                  <p className="text-sm font-semibold text-violet-900">
                    Criar nova automação
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome da Automação</Label>
                      <Input
                        placeholder="Ex: Acompanhamento Aluno Novo"
                        value={newOnboardingName}
                        onChange={(e) => setNewOnboardingName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Gatilho de Disparo</Label>
                      <Select
                        value={newOnboardingTrigger}
                        onValueChange={setNewOnboardingTrigger}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW_USER">👤 Novo Aluno</SelectItem>
                          <SelectItem value="NEW_TEACHER">🎓 Novo Professor</SelectItem>
                          <SelectItem value="MANUAL">🔧 Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleCreateOnboarding}>
                      Criar Fluxo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsCreatingOnboarding(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {isLoadingOnboarding ? (
                <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando fluxos de onboarding...
                </div>
              ) : onboardingAutomations.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl p-6">
                  <GitBranch className="h-10 w-10 mx-auto mb-2 opacity-30 text-violet-500" />
                  <p className="text-sm font-medium">Nenhum fluxo de onboarding cadastrado.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique em "+ Novo Fluxo" para criar um roteiro com o template de boas-vindas.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {onboardingAutomations.map((automation: any) => (
                    <div
                      key={automation.id}
                      className="border rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between p-3.5 bg-slate-50/80">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleToggleOnboarding(
                                automation.id,
                                automation.isActive
                              )
                            }
                            className="shrink-0 transition-transform active:scale-95"
                            title={automation.isActive ? "Pausar automação" : "Ativar automação"}
                          >
                            {automation.isActive ? (
                              <ToggleRight className="h-6 w-6 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-slate-400" />
                            )}
                          </button>
                          <div>
                            <p className="font-semibold text-sm text-slate-800">
                              {automation.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-2 py-0.5 flex items-center gap-1 font-medium bg-white"
                              >
                                {automation.triggerType === "NEW_USER" ? (
                                  <>
                                    <User className="h-2.5 w-2.5 text-blue-500" />
                                    Novo Aluno
                                  </>
                                ) : automation.triggerType === "NEW_TEACHER" ? (
                                  <>
                                    <GraduationCap className="h-2.5 w-2.5 text-amber-500" />
                                    Novo Professor
                                  </>
                                ) : (
                                  <>
                                    <Wrench className="h-2.5 w-2.5 text-slate-500" />
                                    Manual
                                  </>
                                )}
                              </Badge>
                              {automation.isActive ? (
                                <Badge className="text-[10px] px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 font-semibold">
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 text-slate-500">
                                  Pausada
                                </Badge>
                              )}
                              {automation.agent ? (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-2 py-0.5 flex items-center gap-1 bg-violet-100 text-violet-800 border border-violet-200"
                                >
                                  <Bot className="h-2.5 w-2.5 text-violet-600" />
                                  {automation.agent.name}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-2 py-0.5 text-rose-500 border-rose-200 bg-rose-50"
                                >
                                  Sem agente vinculado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-44">
                            <Select
                              value={automation.agentId || "none"}
                              onValueChange={(v) =>
                                handleAssignAgent(automation.id, v)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs bg-white">
                                <SelectValue placeholder="Selecionar agente..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem agente</SelectItem>
                                {agents.map((a: any) => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5"
                            onClick={() =>
                              setEditingFlow({
                                automationId: automation.id,
                                nodes: JSON.parse(automation.flowJson || "[]"),
                              })
                            }
                          >
                            <Edit3 className="h-3 w-3" /> Editar Fluxo
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDeleteOnboarding(automation.id)}
                            title="Excluir fluxo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Editor de Nós Ramificados */}
                      {editingFlow?.automationId === automation.id && (
                        <div className="p-4 space-y-4 border-t bg-white">
                          <div className="flex items-center justify-between pb-2 border-b">
                            <p className="text-sm font-semibold text-violet-800 flex items-center gap-2">
                              <GitBranch className="h-4 w-4 text-violet-600" /> Editor de Fluxo Conversacional
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => handleAddFlowNode("message")}
                              >
                                <MessageCircleMore className="h-3.5 w-3.5" /> + Mensagem
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => handleAddFlowNode("question")}
                              >
                                <HelpCircle className="h-3.5 w-3.5" /> + Pergunta
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                                onClick={handleSaveFlow}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Salvar Fluxo
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                            {editingFlow.nodes.map((node, idx) => (
                              <div
                                key={node.id}
                                className={`border rounded-xl p-3.5 space-y-2.5 transition-all ${
                                  node.type === "question"
                                    ? "border-amber-300 bg-amber-50/50"
                                    : "border-blue-200 bg-blue-50/40"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500">
                                      #{idx + 1}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] px-2 py-0.5 font-semibold ${
                                        node.type === "question"
                                          ? "border-amber-400 text-amber-800 bg-amber-100/60"
                                          : "border-blue-400 text-blue-800 bg-blue-100/60"
                                      }`}
                                    >
                                      {node.type === "question" ? (
                                        <>
                                          <HelpCircle className="h-2.5 w-2.5 inline mr-1" />
                                          Pergunta com Opções
                                        </>
                                      ) : (
                                        <>
                                          <MessageCircleMore className="h-2.5 w-2.5 inline mr-1" />
                                          Mensagem
                                        </>
                                      )}
                                    </Badge>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      id: {node.id}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                    onClick={() => handleRemoveFlowNode(node.id)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <Textarea
                                  className="text-xs min-h-[64px] bg-white resize-none"
                                  value={node.content}
                                  onChange={(e) =>
                                    handleUpdateFlowNode(
                                      node.id,
                                      "content",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Conteúdo da mensagem ou pergunta (use {nome} para o nome do usuário)..."
                                />
                                {node.type === "message" && (
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <ArrowRight className="h-3 w-3 text-slate-400" />
                                    <span>Próximo nó:</span>
                                    <Input
                                      className="h-6 text-xs w-28 py-0 bg-white"
                                      value={node.next || "end"}
                                      onChange={(e) =>
                                        handleUpdateFlowNode(
                                          node.id,
                                          "next",
                                          e.target.value
                                        )
                                      }
                                      placeholder="id ou 'end'"
                                    />
                                    <span className="text-[10px] text-slate-400">
                                      (digite "end" para finalizar a conversa)
                                    </span>
                                  </div>
                                )}
                                {node.type === "question" && node.options && (
                                  <div className="space-y-2 pt-1 border-t border-amber-200/60">
                                    <p className="text-[11px] font-semibold text-amber-800">
                                      Opções de resposta e ramificações:
                                    </p>
                                    {node.options.map((opt, oi) => (
                                      <div
                                        key={oi}
                                        className="flex items-center gap-2"
                                      >
                                        <Input
                                          className="h-6 text-xs flex-1 py-0 bg-white"
                                          value={opt.label}
                                          onChange={(e) => {
                                            const opts = [
                                              ...(node.options || []),
                                            ];
                                            opts[oi] = {
                                              ...opts[oi],
                                              label: e.target.value,
                                            };
                                            handleUpdateFlowNode(
                                              node.id,
                                              "options",
                                              opts
                                            );
                                          }}
                                          placeholder="Rótulo da opção (ex: ENEM)"
                                        />
                                        <span className="text-xs text-slate-400 shrink-0 font-bold">
                                          → nó
                                        </span>
                                        <Input
                                          className="h-6 text-xs w-20 py-0 bg-white"
                                          value={opt.next}
                                          onChange={(e) => {
                                            const opts = [
                                              ...(node.options || []),
                                            ];
                                            opts[oi] = {
                                              ...opts[oi],
                                              next: e.target.value,
                                            };
                                            handleUpdateFlowNode(
                                              node.id,
                                              "options",
                                              opts
                                            );
                                          }}
                                          placeholder="id ou end"
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 w-5 p-0 text-rose-400 hover:text-rose-600"
                                          onClick={() => {
                                            const opts = (
                                              node.options || []
                                            ).filter((_, i) => i !== oi);
                                            handleUpdateFlowNode(
                                              node.id,
                                              "options",
                                              opts
                                            );
                                          }}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-[10px] bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                                      onClick={() => {
                                        const opts = [
                                          ...(node.options || []),
                                          { label: "Nova opção", next: "end" },
                                        ];
                                        handleUpdateFlowNode(
                                          node.id,
                                          "options",
                                          opts
                                        );
                                      }}
                                    >
                                      + Adicionar opção
                                    </Button>
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

        {/* ─── ABA 2: BLOG MAESTRO ──────────────────────────── */}
        <TabsContent value="blog" className="mt-0 space-y-6">
          <Card className="rounded-[15px] border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-600"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isActive ? (
                    <Activity className="h-6 w-6 animate-pulse" />
                  ) : (
                    <Pause className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={selectedWorkflow?.supervisorAgentId || "none"}
                      onValueChange={(val) => {
                        const newId = val === "none" ? null : val;
                        setWorkflows((prev) =>
                          prev.map((w) =>
                            w.id === selectedWorkflowId
                              ? { ...w, supervisorAgentId: newId }
                              : w
                          )
                        );
                      }}
                    >
                      <SelectTrigger className="text-xl font-bold text-slate-900 border-none bg-transparent hover:bg-black/5 rounded-xl h-auto py-1 px-2 -ml-2 w-fit gap-2">
                        <SelectValue placeholder="Selecione o Maestro..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum Agente</SelectItem>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-300 text-slate-600"
                      }`}
                    >
                      {isActive ? "Ativo" : "Pausado"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 ml-2">
                    {selectedWorkflow?.description || "Automação de redação e revisão do Blog"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-xs border">
                <Label
                  className="text-sm font-semibold text-slate-700 cursor-pointer"
                  htmlFor="kill-switch"
                >
                  {isActive ? "Pausar Automação" : "Ligar Automação"}
                </Label>
                <Switch
                  id="kill-switch"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            {/* COLUNA ESQUERDA: CONFIGURAÇÕES */}
            <Card className="rounded-[15px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-primary" />
                  Parâmetros Globais
                </CardTitle>
                <CardDescription>
                  Defina as regras de funcionamento da sua esteira de conteúdo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="font-semibold text-slate-700">
                      Frequência de Execução
                    </Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15m">A cada 15 minutos</SelectItem>
                        <SelectItem value="30m">A cada 30 minutos</SelectItem>
                        <SelectItem value="hourly">A cada 1 hora</SelectItem>
                        <SelectItem value="6h">A cada 6 horas</SelectItem>
                        <SelectItem value="daily">
                          1 vez ao dia (00:00)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      De quanto em quanto tempo o Maestro verifica o Kanban.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold text-slate-700">
                      Lote de Processamento (Batch)
                    </Label>
                    <Select value={batchSize} onValueChange={setBatchSize}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione o tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 artigo por ciclo</SelectItem>
                        <SelectItem value="2">2 artigos por ciclo</SelectItem>
                        <SelectItem value="5">5 artigos por ciclo</SelectItem>
                        <SelectItem value="10">10 artigos por ciclo</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Máximo de artigos movidos por execução para estabilidade.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold text-slate-700">
                      Ordem de Fila
                    </Label>
                    <Select value={queueOrder} onValueChange={setQueueOrder}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione a ordem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIFO">
                          Mais Antigos Primeiro (FIFO)
                        </SelectItem>
                        <SelectItem value="LIFO">
                          Mais Recentes Primeiro (LIFO)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Define qual rascunho tem prioridade na fila de redação.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Limite de Falhas (Retries)
                    </Label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 flex justify-between items-center">
                      <span>Máx. Tentativas:</span>
                      <span className="bg-amber-100 text-amber-800 px-2 rounded-full text-xs font-bold">
                        Travado em 2
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Se a IA falhar 2x no mesmo artigo, ele pausa para intervenção humana.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <Button
                  variant="outline"
                  className="w-full sm:w-fit rounded-xl gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                  onClick={handleRunManualTest}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                  {isTesting ? "Rodando..." : "Rodar Maestro Agora"}
                </Button>
                <Button
                  className="w-full sm:w-fit rounded-xl"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Salvar Configurações
                </Button>
              </CardFooter>
            </Card>

            {/* COLUNA DIREITA: MAPA DO FLUXO */}
            <Card className="rounded-[15px] bg-slate-900 text-slate-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <LayoutDashboard className="h-40 w-40" />
              </div>

              <CardHeader>
                <CardTitle className="text-lg text-white">
                  Mapa da Esteira
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Fluxo atual orquestrado pelo Supervisor.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                {steps.map((step, index) => {
                  const isStepProcessing =
                    isTesting ||
                    selectedWorkflow?.currentProcessingStep ===
                      step.triggerState;
                  const msg = stepMessages[step.triggerState];

                  return (
                    <div
                      key={step.id}
                      className={`flex flex-col gap-1.5 p-3.5 rounded-xl border transition-all duration-300 ${
                        isStepProcessing
                          ? "bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse"
                          : "bg-slate-800/80 border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Passo {index + 1}
                        </span>
                        {isStepProcessing ? (
                          <span className="flex items-center gap-1.5 text-[10px] text-blue-400 font-bold bg-blue-900/80 border border-blue-500/50 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)] animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" /> PROCESSANDO
                          </span>
                        ) : (
                          <Bot className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <p className="text-sm font-semibold flex items-center gap-2">
                        {step.triggerState}{" "}
                        <ArrowRight className="h-3 w-3 text-slate-500" />{" "}
                        {step.actionState}
                      </p>
                      <div className="mt-1 flex flex-col gap-2">
                        <p className="text-[10px] text-slate-400">
                          Sincronizado com Assistente do Blog
                        </p>
                        {msg && (
                          <div
                            className={`text-[11px] p-2.5 rounded-lg font-medium flex items-start gap-2 ${
                              msg.type === "error"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {msg.type === "error" ? (
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                            )}
                            <span className="leading-snug">{msg.text}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="flex flex-col gap-1 p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      Parada Obrigatória
                    </span>
                    <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">Coluna Final</p>
                  <p className="text-[11px] text-slate-300">
                    A partir daqui, a intervenção humana é necessária.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
