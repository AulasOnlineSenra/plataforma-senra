'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
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
  getCrmComments,
  getCrmChecklistTemplates,
  createCrmChecklistTemplate,
  deleteCrmChecklistTemplate
} from '@/app/actions/crm';
import { toast } from 'sonner';
import { 
  Calendar, 
  Mail, 
  Phone, 
  Tag, 
  Loader2, 
  X, 
  GripVertical, 
  Copy, 
  Bookmark, 
  Paperclip, 
  Link as LinkIcon, 
  Plus, 
  CheckSquare, 
  MessageSquare,
  Trash2,
  ChevronDown,
  Clock,
  User,
  ExternalLink,
  FileText,
  Upload,
  Image as ImageIcon
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
  const [showDateInput, setShowDateInput] = useState(false);
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<string | null>(null);
  const [editingChecklistText, setEditingChecklistText] = useState('');
  const checklistEditInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingChecklistItemId && checklistEditInputRef.current) {
      checklistEditInputRef.current.focus();
    }
  }, [editingChecklistItemId]);

  const onChecklistDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(checklist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setChecklist(items);
    handleSave({ checklist: JSON.stringify(items) });
  };

  const updateChecklistItemText = (id: string) => {
    if (!editingChecklistText.trim()) {
      setEditingChecklistItemId(null);
      return;
    }
    const updated = checklist.map(item => 
      item.id === id ? { ...item, text: editingChecklistText } : item
    );
    setChecklist(updated);
    handleSave({ checklist: JSON.stringify(updated) });
    setEditingChecklistItemId(null);
  };

  const handleChecklistEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      updateChecklistItemText(id);
    } else if (e.key === 'Escape') {
      setEditingChecklistItemId(null);
    }
  };
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    const result = await getCrmChecklistTemplates();
    if (result.success && result.data) {
      setTemplates(result.data);
    }
    setLoadingTemplates(false);
  };

  const applyTemplate = (template: any) => {
    let parsedItems = [];
    try {
      parsedItems = JSON.parse(template.items || "[]");
    } catch {
      parsedItems = [];
    }
    
    const newItems = parsedItems.map((t: string) => ({
      id: Math.random().toString(36).substr(2, 9),
      text: t,
      completed: false
    }));
    const updated = [...checklist, ...newItems];
    setChecklist(updated);
    handleSave({ checklist: JSON.stringify(updated) });
    toast.success('Modelo aplicado!');
  };

  const saveAsTemplate = async () => {
    if (checklist.length === 0) {
      toast.error('O checklist está vazio');
      return;
    }
    const name = prompt('Nome do novo modelo de checklist:');
    if (!name) return;
    
    const itemsText = checklist.map(i => i.text);
    const result = await createCrmChecklistTemplate({
      name,
      items: JSON.stringify(itemsText)
    });
    
    if (result.success) {
      toast.success('Modelo salvo com sucesso!');
      loadTemplates();
    } else {
      toast.error('Erro ao salvar modelo');
    }
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Excluir este modelo?')) {
      await deleteCrmChecklistTemplate(id);
      loadTemplates();
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lead) {
      let formattedDueDate = '';
      if (lead.dueDate) {
        const d = new Date(lead.dueDate);
        if (!isNaN(d.getTime())) {
          try {
            formattedDueDate = format(d, "yyyy-MM-dd'T'HH:mm");
          } catch (e) {
            console.error('Data inválida no banco:', lead.dueDate);
          }
        }
      }

      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || '',
        tags: lead.tags ? JSON.parse(lead.tags).join(', ') : '',
        description: lead.description || '',
        temperature: lead.temperature || 'frio',
        dueDate: formattedDueDate,
      });
      setAttachments(lead.attachments ? JSON.parse(lead.attachments) : []);
      setChecklist(lead.checklist ? JSON.parse(lead.checklist) : []);
      setShowDateInput(!!lead.dueDate);
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

  // === FILE UPLOAD: Converts file to base64 and stores inline ===
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: dataUrl,
          name: file.name,
          size: file.size,
          createdAt: new Date().toISOString()
        };
        setAttachments(prev => {
          const updated = [...prev, newItem];
          handleSave({ attachments: JSON.stringify(updated) });
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // === PASTE IMAGE: Capture ctrl+v paste anywhere in the dialog ===
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const dt = new DataTransfer();
          dt.items.add(file);
          handleFileUpload(dt.files);
        }
      }
    }
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden p-0 flex flex-col rounded-2xl shadow-2xl border-slate-200"
        onClick={(e) => e.stopPropagation()}
        onPaste={handlePaste}
      >
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Coluna Esquerda: Detalhes e Ações */}
            <div className="flex-1 space-y-8">
              
              {/* Cabeçalho do Card - nome editável */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
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

                  {/* DATA: Toggle que mostra/esconde o input de data */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn("border-slate-200 hover:bg-slate-50 gap-2 h-9", showDateInput ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white")}
                    onClick={() => {
                      setShowDateInput(true);
                      setTimeout(() => dateInputRef.current?.showPicker?.(), 100);
                    }}
                  >
                    <Calendar className="h-4 w-4" /> 
                    {formData.dueDate 
                      ? (!isNaN(new Date(formData.dueDate).getTime()) 
                          ? (() => {
                              try { return format(new Date(formData.dueDate), 'dd/MM/yyyy HH:mm'); }
                              catch (e) { return 'Data Inválida'; }
                            })()
                          : 'Data Inválida') 
                      : 'Datas'}
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white border-slate-200 hover:bg-slate-50 gap-2 h-9"
                    onClick={() => setIsAddingChecklist(true)}
                  >
                    <CheckSquare className="h-4 w-4 text-slate-500" /> Checklist
                  </Button>

                  {/* ANEXO: Abre seletor de arquivo */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white border-slate-200 hover:bg-slate-50 gap-2 h-9"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4 text-slate-500" /> Anexo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </div>
              </div>

              {/* Input de Data — visível quando ativado */}
              {showDateInput && (
                <div className="space-y-2 bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Data de Entrega / Alarme
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400"
                      onClick={() => {
                        setShowDateInput(false);
                        handleChange('dueDate', '');
                        handleSave({ dueDate: undefined });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <input
                    ref={dateInputRef}
                    id="date-input"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => {
                      handleChange('dueDate', e.target.value);
                      handleSave({ dueDate: e.target.value });
                    }}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              )}

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
                    <div className="flex items-center gap-3">
                      {checklist.length > 0 && (
                        <span className="text-sm text-slate-500 font-medium">{Math.round(progress)}%</span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-500 hover:text-slate-700 bg-slate-100/50">
                            Modelos <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Modelos Salvos
                          </div>
                          {templates.length === 0 ? (
                            <div className="px-2 py-2 text-xs text-slate-400">Nenhum modelo salvo</div>
                          ) : (
                            templates.map((tpl) => (
                              <DropdownMenuItem key={tpl.id} onClick={() => applyTemplate(tpl)} className="flex items-center justify-between cursor-pointer group">
                                <span className="truncate pr-2">{tpl.name}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-5 w-5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                  onClick={(e) => handleDeleteTemplate(e, tpl.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </DropdownMenuItem>
                            ))
                          )}
                          {checklist.length > 0 && (
                            <>
                              <div className="my-1 border-t border-slate-100" />
                              <DropdownMenuItem onClick={saveAsTemplate} className="text-primary font-medium cursor-pointer">
                                <Plus className="h-3 w-3 mr-2" />
                                Salvar atual como modelo
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {checklist.length > 0 && <Progress value={progress} className="h-2" />}
                  
                  <DragDropContext onDragEnd={onChecklistDragEnd}>
                    <Droppable droppableId="checklist">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {checklist.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={cn("flex items-start gap-3 group p-1.5 rounded-lg -ml-1.5 transition-colors", snapshot.isDragging ? "bg-slate-50 shadow-sm" : "hover:bg-slate-50")}
                                >
                                  <div {...provided.dragHandleProps} className="mt-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing">
                                    <GripVertical className="h-4 w-4 text-slate-300 hover:text-slate-500" />
                                  </div>
                                  <Checkbox 
                                    className="mt-0.5"
                                    checked={item.completed} 
                                    onCheckedChange={() => toggleChecklistItem(item.id)}
                                  />
                                  <div className="flex-1 min-w-0 flex items-start">
                                    {editingChecklistItemId === item.id ? (
                                      <Input
                                        ref={checklistEditInputRef}
                                        value={editingChecklistText}
                                        onChange={(e) => setEditingChecklistText(e.target.value)}
                                        onKeyDown={(e) => handleChecklistEditKeyDown(e, item.id)}
                                        onBlur={() => updateChecklistItemText(item.id)}
                                        className="h-7 py-0 px-2 -ml-2 text-sm focus-visible:ring-1 bg-white"
                                      />
                                    ) : (
                                      <span 
                                        className={cn("text-sm transition-all cursor-text py-0.5", item.completed ? "text-slate-400 line-through" : "text-slate-700")}
                                        onClick={() => {
                                          setEditingChecklistItemId(item.id);
                                          setEditingChecklistText(item.text);
                                        }}
                                      >
                                        {item.text}
                                      </span>
                                    )}
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" onClick={() => {
                                    const updated = checklist.filter(i => i.id !== item.id);
                                    setChecklist(updated);
                                    handleSave({ checklist: JSON.stringify(updated) });
                                  }}>
                                    <X className="h-4 w-4 text-slate-400" />
                                  </Button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

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
              {attachments.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <Paperclip className="h-5 w-5" /> Anexos
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all group">
                        <div className="bg-slate-100 p-2 rounded-lg shrink-0">
                          {file.type === 'image' ? (
                            <img src={file.url} alt={file.name} className="h-10 w-10 object-cover rounded" />
                          ) : file.type === 'link' ? (
                            <LinkIcon className="h-5 w-5 text-slate-500" />
                          ) : (
                            <FileText className="h-5 w-5 text-slate-500" />
                          )}
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

                  {/* Drop Zone */}
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 text-sm cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileUpload(e.dataTransfer.files);
                    }}
                  >
                    <Upload className="h-5 w-5 mx-auto mb-1 text-slate-300" />
                    Clique ou arraste arquivos · Cole imagem com Ctrl+V
                  </div>
                </div>
              )}

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