'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Trash2, Zap, Play, Loader2, X, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutomationCondition {
  type: string;
  value: string;
}

interface AutomationAction {
  type: string;
  params: Record<string, any>;
}

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: Date;
  createdAt: Date;
}

const TRIGGERS = [
  { value: 'LEAD_CREATED', label: 'Quando um lead é criado' },
  { value: 'LEAD_MOVED', label: 'Quando um lead é movido' },
  { value: 'LEAD_UPDATED', label: 'Quando um lead é atualizado' },
];

const CONDITION_TYPES = [
  { value: 'column_equals', label: 'Coluna é', placeholder: 'Nome da coluna' },
  { value: 'temp_equals', label: 'Temperatura é', placeholder: 'frio, morno, quente, muito-quente' },
  { value: 'has_tag', label: 'Tem tag', placeholder: 'Nome da tag' },
  { value: 'source_equals', label: 'Origem é', placeholder: 'Instagram, Site...' },
  { value: 'has_due_date', label: 'Tem prazo definido', placeholder: '' },
  { value: 'due_date_passed', label: 'Prazo já passou', placeholder: '' },
];

const ACTION_TYPES = [
  { value: 'set_temperature', label: 'Definir temperatura', paramLabel: 'Valor', paramPlaceholder: 'frio, morno, quente, muito-quente' },
  { value: 'add_tag', label: 'Adicionar tag', paramLabel: 'Tag', paramPlaceholder: 'Nome da tag' },
  { value: 'move_to_column', label: 'Mover para coluna', paramLabel: 'Coluna', paramPlaceholder: 'Nome da coluna' },
  { value: 'send_notification', label: 'Enviar notificação', paramLabel: 'Mensagem', paramPlaceholder: 'Mensagem para o admin' },
];

export default function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'LEAD_CREATED',
    conditions: [] as AutomationCondition[],
    actions: [] as AutomationAction[],
  });

  const [newCondition, setNewCondition] = useState({ type: 'column_equals', value: '' });
  const [newAction, setNewAction] = useState({ type: 'set_temperature', params: { value: '' } });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    const result = await getAutomationRulesFromServer();
    if (result.success && result.data) {
      setRules(result.data as AutomationRule[]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (formData.actions.length === 0) {
      toast.error('Adicione pelo menos uma ação');
      return;
    }

    const result = editingRule
      ? await updateAutomationRule(editingRule.id, formData)
      : await createAutomationRuleFromServer(formData);

    if (result.success) {
      toast.success(editingRule ? 'Regra atualizada!' : 'Regra criada!');
      setDialogOpen(false);
      resetForm();
      loadRules();
    } else {
      toast.error(result.error || 'Erro ao salvar');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: 'LEAD_CREATED',
      conditions: [],
      actions: [],
    });
    setNewCondition({ type: 'column_equals', value: '' });
    setNewAction({ type: 'set_temperature', params: { value: '' } });
    setEditingRule(null);
  };

  const openEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      trigger: rule.trigger,
      conditions: rule.conditions,
      actions: rule.actions,
    });
    setDialogOpen(true);
  };

  const handleToggle = async (ruleId: string) => {
    const result = await toggleAutomationRule(ruleId);
    if (result.success) {
      loadRules();
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Excluir esta regra?')) return;
    const result = await deleteAutomationRule(ruleId);
    if (result.success) {
      toast.success('Regra excluída');
      loadRules();
    }
  };

  const addCondition = () => {
    if (['has_due_date', 'due_date_passed'].includes(newCondition.type)) {
      setFormData(prev => ({ ...prev, conditions: [...prev.conditions, { type: newCondition.type, value: '' }] }));
    } else if (newCondition.value.trim()) {
      setFormData(prev => ({ ...prev, conditions: [...prev.conditions, { ...newCondition }] }));
      setNewCondition({ type: 'column_equals', value: '' });
    }
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== index) }));
  };

  const addAction = () => {
    if (['set_temperature', 'add_tag', 'move_to_column', 'send_notification'].includes(newAction.type)) {
      const paramKey = ACTION_TYPES.find(a => a.value === newAction.type)?.paramLabel.toLowerCase() || 'value';
      if (newAction.params[paramKey] || ['has_due_date', 'due_date_passed'].includes(newAction.type)) {
        if (!['has_due_date', 'due_date_passed'].includes(newAction.type)) {
          setFormData(prev => ({ ...prev, actions: [...prev.actions, { ...newAction }] }));
        } else {
          setFormData(prev => ({ ...prev, actions: [...prev.actions, { type: newAction.type, params: {} }] }));
        }
        setNewAction({ type: 'set_temperature', params: { value: '' } });
      }
    }
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({ ...prev, actions: prev.actions.filter((_, i) => i !== index) }));
  };

  const getTriggerLabel = (trigger: string) => TRIGGERS.find(t => t.value === trigger)?.label || trigger;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Automações</h2>
          <p className="text-sm text-slate-500">Crie regras para automatizar ações nos seus leads</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Editar Regra' : 'Nova Regra de Automação'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da regra</label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Priorizar leads quentes"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Trigger (Quando)</label>
                <select 
                  className="w-full p-2 border rounded-lg bg-background"
                  value={formData.trigger}
                  onChange={e => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
                >
                  {TRIGGERS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Condições (E)</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 p-2 border rounded-lg bg-background"
                    value={newCondition.type}
                    onChange={e => setNewCondition(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {CONDITION_TYPES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {!['has_due_date', 'due_date_passed'].includes(newCondition.type) && (
                    <Input 
                      className="flex-1"
                      placeholder={CONDITION_TYPES.find(c => c.value === newCondition.type)?.placeholder}
                      value={newCondition.value}
                      onChange={e => setNewCondition(prev => ({ ...prev, value: e.target.value }))}
                    />
                  )}
                  <Button variant="outline" onClick={addCondition}>+</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.conditions.map((cond, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      {CONDITION_TYPES.find(c => c.value === cond.type)?.label}: {cond.value || '(qualquer)'}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeCondition(idx)} />
                    </Badge>
                  ))}
                </div>
                {formData.conditions.length === 0 && (
                  <p className="text-xs text-slate-400">Sem condições (regra vai executar sempre)</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ações (Então)</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 p-2 border rounded-lg bg-background"
                    value={newAction.type}
                    onChange={e => setNewAction(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {ACTION_TYPES.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                  {!['has_due_date', 'due_date_passed'].includes(newAction.type) && (
                    <Input 
                      className="flex-1"
                      placeholder={ACTION_TYPES.find(a => a.value === newAction.type)?.paramPlaceholder}
                      value={newAction.params.value || ''}
                      onChange={e => setNewAction(prev => ({ ...prev, params: { value: e.target.value } }))}
                    />
                  )}
                  <Button variant="outline" onClick={addAction}>+</Button>
                </div>
                <div className="flex flex-col gap-2">
                  {formData.actions.map((action, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">{ACTION_TYPES.find(a => a.value === action.type)?.label}</span>
                      {action.params.value && (
                        <span className="text-xs text-slate-500">→ {action.params.value}</span>
                      )}
                      <X className="h-4 w-4 ml-auto cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeAction(idx)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>{editingRule ? 'Salvar' : 'Criar Regra'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : rules.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma automação criada ainda</p>
            <p className="text-sm text-slate-400 mt-1">Clique em "Nova Regra" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map(rule => (
            <Card key={rule.id} className={`rounded-xl ${rule.isActive ? '' : 'opacity-60'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{rule.name}</h3>
                      <Badge variant="outline" className="text-xs">{getTriggerLabel(rule.trigger)}</Badge>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-slate-500 mt-1">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>{rule.executionCount} execuções</span>
                      {rule.lastExecutedAt && (
                        <span>Última: {formatDistanceToNow(new Date(rule.lastExecutedAt), { locale: ptBR })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={rule.isActive} 
                      onCheckedChange={() => handleToggle(rule.id)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(rule)}>Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(rule.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

async function getAutomationRulesFromServer() {
  const { getAutomationRules } = await import('@/app/actions/automations');
  return getAutomationRules();
}

async function createAutomationRuleFromServer(data: any) {
  const { createAutomationRule } = await import('@/app/actions/automations');
  return createAutomationRule(data);
}

async function updateAutomationRule(id: string, data: any) {
  const { updateAutomationRule } = await import('@/app/actions/automations');
  return updateAutomationRule(id, data);
}

async function deleteAutomationRule(id: string) {
  const { deleteAutomationRule } = await import('@/app/actions/automations');
  return deleteAutomationRule(id);
}

async function toggleAutomationRule(id: string) {
  const { toggleAutomationRule } = await import('@/app/actions/automations');
  return toggleAutomationRule(id);
}