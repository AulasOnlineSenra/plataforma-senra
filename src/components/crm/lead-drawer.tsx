'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, isPast, isToday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { updateCrmLead } from '@/app/actions/crm';
import { toast } from 'sonner';
import { Calendar, Mail, Phone, Tag, Thermometer, Loader2, X } from 'lucide-react';

interface LeadDrawerProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: any) => void;
}

const temperatures = [
  { value: 'frio', label: 'Frio', color: 'bg-slate-200 text-slate-600' },
  { value: 'morno', label: 'Morno', color: 'bg-yellow-200 text-yellow-700' },
  { value: 'quente', label: 'Quente', color: 'bg-orange-200 text-orange-700' },
  { value: 'muito-quente', label: 'Muito Quente', color: 'bg-red-200 text-red-700' },
];

const getDueDateStatus = (dueDate: string | null) => {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  if (isPast(date) && !isToday(date)) return 'atrasado';
  if (isToday(date) || (date <= addDays(new Date(), 2))) return 'vencendo';
  return 'no-prazo';
};

const getDueDateColor = (status: string | null) => {
  switch (status) {
    case 'atrasado': return 'bg-red-100 text-red-700 border-red-200';
    case 'vencendo': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default: return 'bg-green-100 text-green-700 border-green-200';
  }
};

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
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
    }
  }, [lead]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
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
      };

      const result = await updateCrmLead(lead.id, updateData);
      
      if (result.success) {
        const updatedLead = { ...lead, ...updateData };
        if (tagsArray.length > 0) updatedLead.tags = JSON.stringify(tagsArray);
        onSave(updatedLead);
        toast.success('Lead atualizado com sucesso!');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Erro ao atualizar lead');
      }
    } catch (error) {
      toast.error('Erro ao salvar lead');
    }
    setSaving(false);
  };

  const dueDateStatus = getDueDateStatus(formData.dueDate);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-lg">Editar Lead</span>
            {lead?.temperature && (
              <Badge className={temperatures.find(t => t.value === lead.temperature)?.color}>
                {temperatures.find(t => t.value === lead.temperature)?.label}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Edite as informações do lead
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nome do lead"
              className="w-full"
            />
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <Mail className="h-4 w-4" /> Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <Phone className="h-4 w-4" /> Telefone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Origem</label>
            <Input
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              placeholder="Ex: Instagram, Website, Indicação"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Descrição</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Anotações sobre o lead..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <Tag className="h-4 w-4" /> Tags
            </label>
            <Input
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="medicina, urgente, premium (separadas por vírgula)"
            />
            {formData.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.split(',').map((tag, i) => tag.trim() && (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <Thermometer className="h-4 w-4" /> Temperatura
            </label>
            <div className="flex gap-2">
              {temperatures.map((temp) => (
                <button
                  key={temp.value}
                  type="button"
                  onClick={() => handleChange('temperature', temp.value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    formData.temperature === temp.value
                      ? `${temp.color} ring-2 ring-offset-2 ring-slate-400`
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {temp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Prazo
            </label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
            />
            {dueDateStatus && (
              <Badge className={`${getDueDateColor(dueDateStatus)} border`}>
                {dueDateStatus === 'atrasado' ? 'Atrasado' : 
                 dueDateStatus === 'vencendo' ? 'Vencendo em breve' : 'No prazo'}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}