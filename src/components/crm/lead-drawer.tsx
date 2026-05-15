'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, isPast, isToday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  updateCrmLead, 
  addCrmComment, 
  getCrmComments 
} from '@/app/actions/crm';
import { toast } from 'sonner';
import { 
  Calendar, 
  Mail, 
  Phone, 
  Tag, 
  Thermometer, 
  Loader2, 
  X, 
  Paperclip, 
  Link as LinkIcon, 
  Plus, 
  CheckSquare, 
  MessageSquare,
  MoreHorizontal,
  Trash2,
  ChevronDown,
  Clock,
  User,
  ExternalLink,
  FileText
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

interface LeadDrawerProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: any) => void;
}

const temperatures = [
  { value: 'frio', label: 'Frio', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  { value: 'morno', label: 'Morno', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  { value: 'quente', label: 'Quente', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { value: 'muito-quente', label: 'Muito Quente', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
];

export default function LeadDrawer({ lead, isOpen, onClose, onSave }: LeadDrawerProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    tags: '',
    description: '',
    temperature: 'frio',
    dueDate: '',
  });
  
  const [attachments, setAttachments] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLink, setNewLink] = useState('');

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || '',
        tags: lead.tags ? JSON.parse(lead.tags).join(', ') : '',
        description: lead.description || '',
        temperature: lead.temperature || 'frio',
        dueDate: lead.dueDate ? format(new Date(lead.dueDate), 'yyyy-MM-dd') : '',
      });
      setAttachments(lead.attachments ? JSON.parse(lead.attachments) : []);
      setChecklist(lead.checklist ? JSON.parse(lead.checklist) : []);
      loadComments();
    }
  }, [lead]);

  const loadComments = async () => {
    if (!lead) return;
    setLoadingComments(true);
    const result = await getCrmComments(lead.id);
    if (result.success) {
      setComments(result.data);
    }
    setLoadingComments(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (overrideData?: any) => {
    setSaving(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
      
      const updateData = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        source: formData.source || undefined,
        tags: JSON.stringify(tagsArray),
        temperature: formData.temperature,
        dueDate: formData.dueDate || undefined,
        description: formData.description,
        attachments: JSON.stringify(attachments),
        checklist: JSON.stringify(checklist),
        ...overrideData
      };

      const result = await updateCrmLead(lead.id, updateData);
      
      if (result.success) {
        onSave({ ...lead, ...updateData });
        toast.success('Alterações salvas!');
      } else {
        toast.error(result.error || 'Erro ao salvar alterações');
      }
    } catch (error) {
      toast.error('Erro ao salvar lead');
    }
    setSaving(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !lead) return;
    
    const stored = localStorage.getItem('currentUser');
    const user = stored ? JSON.parse(stored) : null;
    if (!user) {
      toast.error('Erro ao identificar usuário');
      return;
    }

    const result = await addCrmComment({
      leadId: lead.id,
      userId: user.id,
      content: newComment.trim()
    });

    if (result.success) {
      setNewComment('');
      loadComments();
    } else {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newChecklistItem.trim(),
      completed: false
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewChecklistItem('');
    setIsAddingChecklist(false);
    handleSave({ checklist: JSON.stringify(updated) });
  };

  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    handleSave({ checklist: JSON.stringify(updated) });
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'link',
      url: newLink.trim(),
      name: newLink.trim().split('/').pop() || 'Link',
      createdAt: new Date().toISOString()
    };
    const updated = [...attachments, newItem];
    setAttachments(updated);
    setNewLink('');
    setIsAddingLink(false);
    handleSave({ attachments: JSON.stringify(updated) });
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden p-0 flex flex-col rounded-2xl shadow-2xl border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Coluna Esquerda: Detalhes e Ações */}
            <div className="flex-1 space-y-8">
              
              {/* Cabeçalho do Card */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleSave()}
                      className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent hover:bg-slate-50 transition-colors w-full break-words whitespace-normal"
                      placeholder="Título do Lead"
                    />
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="h-4 w-4" /> Criado em {lead?.createdAt ? format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                    </div>
                  </div>
                </div>

                {/* Botões de Ação Estilo Trello */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white border-slate-200 hover:bg-slate-50 gap-2 h-9">
                        <Tag className="h-4 w-4 text-slate-500" /> Etiquetas
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {temperatures.map((temp) => (
                        <DropdownMenuItem 
                          key={temp.value} 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => {
                            handleChange('temperature', temp.value);
                            handleSave({ temperature: temp.value });
                          }}
                        >
                          <div className={cn("w-3 h-3 rounded-full", temp.dot)} />
                          {temp.label}
                          {formData.temperature === temp.value && <Badge className="ml-auto bg-slate-100 text-slate-600 border-none h-5 px-1.5">Atual</Badge>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white border-slate-200 hover:bg-slate-50 gap-2 h-9"
                    onClick={() => document.getElementById('date-input')?.focus()}
                  >
                    <Calendar className="h-4 w-4 text-slate-500" /> Datas
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white border-slate-200 hover:bg-slate-50 gap-2 h-9"
                    onClick={() => setIsAddingChecklist(true)}
                  >
                    <CheckSquare className="h-4 w-4 text-slate-500" /> Checklist
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white border-slate-200 hover:bg-slate-50 gap-2 h-9"
                    onClick={() => setIsAddingLink(true)}
                  >
                    <Plus className="h-4 w-4 text-slate-500" /> Anexo
                  </Button>
                </div>
              </div>

              {/* Informações de Contato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">E-mail</label>
                  <div className="flex items-center gap-2 group">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <Input
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleSave()}
                      className="border-none p-0 h-7 focus-visible:ring-0 bg-transparent text-sm"
                      placeholder="Adicionar e-mail"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Telefone</label>
                  <div className="flex items-center gap-2 group">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={() => handleSave()}
                      className="border-none p-0 h-7 focus-visible:ring-0 bg-transparent text-sm"
                      placeholder="Adicionar telefone"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <FileText className="h-5 w-5" /> Descrição
                </div>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  onBlur={() => handleSave()}
                  placeholder="Adicione uma descrição mais detalhada..."
                  className="bg-slate-50/50 border-slate-200 focus-visible:ring-primary rounded-xl min-h-[160px] resize-none"
                />
              </div>

              {/* Checklist */}
              {(checklist.length > 0 || isAddingChecklist) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <CheckSquare className="h-5 w-5" /> Checklist
                    </div>
                    {checklist.length > 0 && (
                      <span className="text-sm text-slate-500 font-medium">{Math.round(progress)}%</span>
                    )}
                  </div>
                  
                  {checklist.length > 0 && <Progress value={progress} className="h-2" />}
                  
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 group">
                        <Checkbox 
                          checked={item.completed} 
                          onCheckedChange={() => toggleChecklistItem(item.id)}
                        />
                        <span className={cn("text-sm transition-all", item.completed ? "text-slate-400 line-through" : "text-slate-700")}>
                          {item.text}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" onClick={() => {
                          const updated = checklist.filter(i => i.id !== item.id);
                          setChecklist(updated);
                          handleSave({ checklist: JSON.stringify(updated) });
                        }}>
                          <X className="h-4 w-4 text-slate-400" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {isAddingChecklist ? (
                    <div className="flex flex-col gap-2 pt-2">
                      <Input
                        autoFocus
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        placeholder="Adicionar um item..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddChecklistItem}>Adicionar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsAddingChecklist(false)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="secondary" size="sm" className="bg-slate-100 hover:bg-slate-200" onClick={() => setIsAddingChecklist(true)}>
                      Adicionar um item
                    </Button>
                  )}
                </div>
              )}

              {/* Anexos */}
              {(attachments.length > 0 || isAddingLink) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <Paperclip className="h-5 w-5" /> Anexos
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all group">
                        <div className="bg-slate-100 p-2 rounded-lg">
                          {file.type === 'link' ? <LinkIcon className="h-5 w-5 text-slate-500" /> : <FileText className="h-5 w-5 text-slate-500" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{format(new Date(file.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => {
                            const updated = attachments.filter(a => a.id !== file.id);
                            setAttachments(updated);
                            handleSave({ attachments: JSON.stringify(updated) });
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {isAddingLink ? (
                    <div className="flex flex-col gap-2 pt-2">
                      <Input
                        autoFocus
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        placeholder="Cole o link aqui..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddLink}>Salvar Link</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsAddingLink(false)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Data de Entrega (Oculta mas acessível via botão) */}
              <div className={cn("space-y-2", !formData.dueDate && "hidden")}>
                <label className="text-sm font-medium text-slate-700">Data de Entrega</label>
                <Input
                  id="date-input"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => {
                    handleChange('dueDate', e.target.value);
                    handleSave({ dueDate: e.target.value });
                  }}
                  className="w-full sm:max-w-[200px]"
                />
              </div>

            </div>

            {/* Coluna Direita: Comentários e Atividade */}
            <div className="w-full lg:w-80 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <MessageSquare className="h-5 w-5" /> Atividade
                  </div>
                </div>

                {/* Área de Comentário */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-amber-600" />
                    </div>
                    <Textarea 
                      placeholder="Escreva um comentário..." 
                      className="min-h-[80px] bg-white border-slate-200 text-sm focus-visible:ring-primary rounded-xl"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      onClick={handleAddComment} 
                      disabled={!newComment.trim() || saving}
                      className="rounded-lg px-4"
                    >
                      Comentar
                    </Button>
                  </div>
                </div>

                {/* Lista de Comentários */}
                <div className="space-y-6 pt-4">
                  {loadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">Usuário</span>
                            <span className="text-[10px] text-slate-400">{format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 px-1">
                            <button className="hover:text-slate-900 hover:underline">Editar</button>
                            <span>•</span>
                            <button className="hover:text-red-500 hover:underline">Excluir</button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Nenhum comentário ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
        
        {/* Footer com botão de fechar móvel */}
        <div className="p-4 border-t bg-slate-50/50 flex justify-end gap-3 lg:hidden">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Fechar</Button>
          <Button onClick={() => handleSave()} disabled={saving} className="rounded-xl">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}