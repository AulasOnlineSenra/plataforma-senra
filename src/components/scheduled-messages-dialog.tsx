"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Plus, Trash2, Pencil, Check, X, Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  createScheduledMessage,
  getScheduledMessages,
  cancelScheduledMessage,
  updateScheduledMessage,
} from "@/app/actions/chat";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

interface ScheduledMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  senderId: string;
  receiverId: string;
  receiverName: string;
}

interface ScheduledMsg {
  id: string;
  content: string;
  scheduledAt: string | Date;
  status: string;
}

export function ScheduledMessagesDialog({
  open,
  onOpenChange,
  senderId,
  receiverId,
  receiverName,
}: ScheduledMessagesDialogProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ScheduledMsg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    const result = await getScheduledMessages(senderId, receiverId);
    if (result.success && result.data) {
      setMessages(
        result.data.map((m: any) => ({
          id: String(m.id),
          content: String(m.content),
          scheduledAt: m.scheduledAt,
          status: String(m.status),
        })),
      );
    }
  }, [senderId, receiverId]);

  useEffect(() => {
    if (open) loadMessages();
  }, [open, loadMessages]);

  const handleEdit = (msg: ScheduledMsg) => {
    setEditingId(msg.id);
    setContent(msg.content);
    const d = msg.scheduledAt instanceof Date ? msg.scheduledAt : new Date(msg.scheduledAt);
    setSelectedDate(new Date(d));
    setSelectedTime(new Date(d));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setContent("");
    setSelectedDate(undefined);
    setSelectedTime(undefined);
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      toast({ variant: "destructive", title: "Erro", description: "Digite a mensagem." });
      return;
    }
    if (!selectedDate) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione a data." });
      return;
    }
    if (!selectedTime) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione a hora." });
      return;
    }

    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

    if (scheduledAt <= new Date()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A data/hora deve ser no futuro.",
      });
      return;
    }

    setIsAdding(true);

    if (editingId) {
      const result = await updateScheduledMessage(editingId, { content: trimmed, scheduledAt });
      setIsAdding(false);
      if (!result.success) { toast({ variant: "destructive", title: "Erro", description: result.error || "Falha ao atualizar." }); return; }
      toast({ title: "Agendamento atualizado!" });
    } else {
      const result = await createScheduledMessage({ senderId, receiverId, content: trimmed, scheduledAt });
      setIsAdding(false);
      if (!result.success) { toast({ variant: "destructive", title: "Erro", description: result.error || "Falha ao agendar." }); return; }
      toast({ title: "Mensagem agendada com sucesso!" });
    }

    setContent("");
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setEditingId(null);
    await loadMessages();
  };

  const handleCancel = async (id: string) => {
    if (editingId === id) handleCancelEdit();
    const result = await cancelScheduledMessage(id);
    if (result.success) await loadMessages();
  };

  const formatScheduledDate = (value: string | Date) => {
    const d = value instanceof Date ? value : new Date(value);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[710px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mensagens Agendadas
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Agende mensagens para <span className="font-medium text-foreground">{receiverName}</span>
        </p>

        {/* Form - Tudo em uma linha */}
        <div className="border-b border-border/50 pb-4">
          {editingId && (<p className="text-xs text-brand-yellow font-medium mb-2">Editando agendamento...</p>)}
          <div className="flex items-center gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite a mensagem agendada..."
              className="h-10 flex-1 rounded-[13px] min-w-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="shrink-0">
              <DatePicker date={selectedDate} setDate={setSelectedDate} />
            </div>
            <div className="shrink-0">
              <TimePicker date={selectedTime} setDate={setSelectedTime} />
            </div>
            {editingId ? (
              <>
                <Button type="button" size="icon" onClick={handleSubmit} disabled={isAdding} className="h-10 w-10 rounded-[13px] bg-green-600 text-white hover:bg-green-700 shrink-0" aria-label="Salvar edição"><Check className="h-5 w-5" /></Button>
                <Button type="button" size="icon" variant="ghost" onClick={handleCancelEdit} className="h-10 w-10 rounded-[13px] shrink-0" aria-label="Cancelar edição"><X className="h-5 w-5" /></Button>
              </>
            ) : (
              <Button type="button" size="icon" onClick={handleSubmit} disabled={isAdding} className="h-10 w-10 rounded-[13px] bg-primary text-primary-foreground hover:bg-primary/90 shrink-0" aria-label="Adicionar mensagem agendada"><Plus className="h-5 w-5" /></Button>
            )}
          </div>
        </div>

        {/* History - Bottom */}
        <div className="flex-1 min-h-0">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Histórico de agendamentos
          </p>
          <ScrollArea className="max-h-[240px]">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma mensagem agendada.
              </p>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatScheduledDate(msg.scheduledAt)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
                      onClick={() => handleEdit(msg)}
                      aria-label="Editar mensagem agendada"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleCancel(msg.id)}
                      aria-label="Cancelar mensagem agendada"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
