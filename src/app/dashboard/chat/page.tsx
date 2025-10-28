

'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Paperclip, Clock, X, MessageSquare, File as FileIcon, Smile, Upload, Mic, CircleDot, Edit, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { chatContacts as initialChatContacts, chatMessages as initialChatMessages, getMockUser, teachers as initialTeachers, users as initialUsers, scheduleEvents as initialSchedule } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isToday, isYesterday, addDays, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, UserRole, ChatMessage, ChatContact, Teacher, ScheduleEvent } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TimePicker } from '@/components/ui/time-picker';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';


const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  student: 'Aluno',
  teacher: 'Professor',
};

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

interface ScheduledMessage {
    id: string;
    creatorId: string;
    contactId: string;
    date: Date;
    content: string;
    title?: string;
    recurrence: RecurrenceType;
}

function ScheduleMessagesDialog({
    isOpen,
    onOpenChange,
    activeChatPartner,
    currentUser,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    activeChatPartner: User | Teacher | null;
    currentUser: User | null;
}) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [view, setView] = useState<'list' | 'create'>('list');
    
    const scheduledMessagesQuery = useMemoFirebase(() => {
        if (!firestore || !currentUser?.id) return null;
        return collection(firestore, 'users', currentUser.id, 'scheduledMessages');
    }, [firestore, currentUser?.id]);

    const { data: scheduledMessages, isLoading: isLoadingScheduledMessages } = useCollection<ScheduledMessage>(scheduledMessagesQuery);
    
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [messageContent, setMessageContent] = useState('');
    const [scheduledMessageTitle, setScheduledMessageTitle] = useState('');
    const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | undefined>(new Date());
    const [scheduledMessageRecurrence, setScheduledMessageRecurrence] = useState<RecurrenceType>('none');
    const [isRecording, setIsRecording] = useState(false);
    const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
     const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const handleScheduleMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentUser?.id) {
            toast({
                variant: 'destructive',
                title: 'Erro de Autenticação',
                description: 'Por favor, faça login novamente para agendar mensagens.',
            });
            return;
        }

        if (!messageContent.trim() && !messageContent.includes('file::')) {
            toast({
                variant: 'destructive',
                title: 'Campos Incompletos',
                description: 'Por favor, escreva uma mensagem, anexe um arquivo ou grave um áudio.',
            });
            return;
        }

        if (!activeChatPartner) {
            toast({
                variant: 'destructive',
                title: 'Nenhum contato selecionado',
                description: 'Selecione um contato para agendar a mensagem.',
            });
            return;
        }
        
        if (!selectedScheduleDate) {
            toast({
                variant: 'destructive',
                title: 'Data e Hora inválidos',
                description: 'Por favor, selecione uma data e hora para o agendamento.',
            });
            return;
        }

        if (!firestore) {
            toast({
                variant: 'destructive',
                title: 'Erro de Conexão',
                description: 'Não foi possível conectar ao banco de dados.',
            });
            return;
        }

        const messageData = {
            creatorId: currentUser.id,
            contactId: activeChatPartner.id,
            date: selectedScheduleDate,
            content: messageContent,
            title: scheduledMessageTitle,
            recurrence: scheduledMessageRecurrence,
            createdAt: serverTimestamp(),
        };

        if (editingMessageId) {
            const messageRef = doc(firestore, 'users', currentUser.id, 'scheduledMessages', editingMessageId);
            await updateDoc(messageRef, messageData);
            toast({
                title: 'Mensagem Atualizada',
                description: `Sua mensagem foi reagendada para ${format(selectedScheduleDate, "dd/MM/yyyy 'às' HH:mm")}.`,
            });
        } else {
            const collectionRef = collection(firestore, 'users', currentUser.id, 'scheduledMessages');
            await addDoc(collectionRef, messageData);
            toast({
                title: 'Mensagem Agendada',
                description: `Sua mensagem foi agendada para ${format(selectedScheduleDate, "dd/MM/yyyy 'às' HH:mm")}.`,
            });
        }
        
        setEditingMessageId(null);
        setMessageContent('');
        setScheduledMessageTitle('');
        setScheduledMessageRecurrence('none');
        setView('list');
    };
    
    const handleEditScheduledMessage = (message: ScheduledMessage) => {
        setEditingMessageId(message.id);
        setMessageContent(message.content);
        setScheduledMessageTitle(message.title || '');
        setSelectedScheduleDate(new Date(message.date));
        setScheduledMessageRecurrence(message.recurrence);
        setView('create');
    };

    const handleRemoveScheduledMessage = async (id: string) => {
        if (!currentUser?.id || !firestore) return;
        const messageRef = doc(firestore, 'users', currentUser.id, 'scheduledMessages', id);
        await deleteDoc(messageRef);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                const fileMessage = `file::${file.name}::${dataUrl}`;
                setMessageContent(prev => prev ? `${prev}\n${fileMessage}` : fileMessage);
                 toast({
                    title: "Arquivo Anexado!",
                    description: `O arquivo "${file.name}" foi anexado à sua mensagem agendada.`,
                });
            };
            reader.readAsDataURL(file);

            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    const handleToggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setHasMicPermission(true);
                
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = (event) => {
                    setAudioChunks(prev => [...prev, event.data]);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result as string;
                        const audioMessage = `file::gravacao-${new Date().toISOString()}.mp3::${base64data}`;
                         setMessageContent(prev => prev ? `${prev}\n${audioMessage}` : audioMessage);
                        toast({
                            title: "Gravação Anexada!",
                            description: "Sua gravação de áudio foi anexada à mensagem agendada.",
                        });
                    };
                    reader.readAsDataURL(audioBlob);

                    setAudioChunks([]); 
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsRecording(true);
                
            } catch (error) {
                console.error("Error accessing microphone:", error);
                setHasMicPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Permissão de Microfone Negada',
                    description: 'Por favor, permita o acesso ao microfone nas configurações do seu navegador.',
                });
            }
        }
    };

    const getMessageType = (content: string) => {
        if (content.startsWith('file::')) {
            const [, fileName] = content.split('::');
            if (fileName.endsWith('.mp3') || fileName.endsWith('.ogg') || fileName.endsWith('.webm')) {
                return 'audio';
            }
            return 'file';
        }
        return 'txt';
    }

    const recurrenceLabels: Record<RecurrenceType, string> = {
        none: 'Vazia',
        daily: 'Diária',
        weekly: 'Semanal',
        monthly: 'Mensal',
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
              {view === 'list' ? (
                <>
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Mensagens Agendadas para {activeChatPartner?.name}</DialogTitle>
                    </DialogHeader>
                    <div className='py-4'>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Hora</TableHead>
                                    <TableHead>Recorrência</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(scheduledMessages || []).filter(m => m.contactId === activeChatPartner?.id && m.creatorId === currentUser?.id).map(msg => (
                                    <TableRow key={msg.id}>
                                        <TableCell>{msg.title || 'Não Definido'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={activeChatPartner?.avatarUrl} />
                                                    <AvatarFallback>{activeChatPartner?.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{activeChatPartner?.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getMessageType(msg.content)}</TableCell>
                                        <TableCell>{format(new Date(msg.date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{format(new Date(msg.date), 'HH:mm')}</TableCell>
                                        <TableCell>{recurrenceLabels[msg.recurrence]}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditScheduledMessage(msg)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveScheduledMessage(msg.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                         {isLoadingScheduledMessages ? <p>Carregando...</p> : (scheduledMessages || []).filter(m => m.contactId === activeChatPartner?.id && m.creatorId === currentUser?.id).length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>Nenhuma mensagem agendada para este contato.</p>
                            </div>
                         )}
                    </div>
                    <DialogFooter className="sm:justify-center">
                         <Button type="button" onClick={() => { setEditingMessageId(null); setMessageContent(''); setView('create'); }} className="bg-brand-yellow text-black hover:bg-brand-yellow/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Criar
                        </Button>
                    </DialogFooter>
                </>
              ) : (
                <form onSubmit={handleScheduleMessage}>
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <Button type="button" variant="ghost" size="icon" onClick={() => setView('list')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <DialogTitle className="font-headline text-2xl">{editingMessageId ? 'Editar Agendamento' : 'Criar Agendamento'}</DialogTitle>
                        </div>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="schedule-title">Título (Opcional)</Label>
                            <Input id="schedule-title" placeholder="Insira aqui o título" value={scheduledMessageTitle} onChange={e => setScheduledMessageTitle(e.target.value)} />
                        </div>
                         <div className="grid gap-2 relative">
                            <Label htmlFor="scheduled-message-content">Mensagem</Label>
                            <Textarea
                                id="scheduled-message-content"
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                                placeholder="Insira sua mensagem ou adicione mídia/áudio abaixo..."
                                rows={5}
                                className="pr-10"
                            />
                             <Button type="button" variant="ghost" size="icon" className="absolute bottom-2 right-2 h-8 w-8">
                                <Smile className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                             <Input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,audio/*"
                            />
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                                <Upload className="mr-2 h-4 w-4" />
                                Adicionar Mídia
                            </Button>
                             <Button type="button" variant="outline" onClick={handleToggleRecording} className={cn(isRecording && "text-red-500 border-red-500 hover:text-red-600")}>
                                {isRecording ? <CircleDot className="mr-2 h-4 w-4 animate-pulse" /> : <Mic className="mr-2 h-4 w-4" />}
                                {isRecording ? "Parar Gravação" : "Gravar Áudio"}
                            </Button>
                        </div>
                         {hasMicPermission === false && (
                            <p className="text-xs text-destructive text-center col-span-2">A permissão do microfone é necessária para gravar áudio.</p>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                            <Label>Data</Label>
                            <DatePicker date={selectedScheduleDate} setDate={setSelectedScheduleDate} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="time">Hora</Label>
                                <TimePicker date={selectedScheduleDate} setDate={setSelectedScheduleDate} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="recurrence">Recorrência</Label>
                            <Select value={scheduledMessageRecurrence} onValueChange={(v) => setScheduledMessageRecurrence(v as RecurrenceType)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Nenhuma selecionada" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Não repetir</SelectItem>
                                    <SelectItem value="daily">Diariamente</SelectItem>
                                    <SelectItem value="weekly">Semanalmente</SelectItem>
                                    <SelectItem value="monthly">Mensalmente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" className="bg-brand-yellow text-black hover:bg-brand-yellow/90">{editingMessageId ? 'Salvar Alterações' : 'Criar'}</Button>
                    </DialogFooter>
                </form>
              )}
            </DialogContent>
        </Dialog>
    )
}

function ChatPageComponent() {
    const searchParams = useSearchParams();
    const contactIdParam = searchParams.get('contactId');
    const { user: currentUser } = useUser();
    const { firestore } = useFirebase();

    const [activeChatPartner, setActiveChatPartner] = useState<User | Teacher | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isScheduling, setIsScheduling] = useState(false);
    
    const [allMessages, setAllMessages] = useState<ChatMessage[]>(initialChatMessages);
    const [allUsers, setAllUsers] = useState<(User | Teacher)[]>([]);
    const [schedule, setSchedule] = useState<ScheduleEvent[]>(initialSchedule);
    const [allContacts, setAllContacts] = useState<ChatContact[]>(initialChatContacts);

    const getContactDetails = useCallback((contactId: string) => {
      return allUsers.find(u => u.id === contactId);
    }, [allUsers]);

    const handleContactSelect = useCallback((contactId: string) => {
      const contact = getContactDetails(contactId);
      if (contact && currentUser) {
        setActiveChatPartner(contact);

        const userContactsKey = `chatContacts_${currentUser.id}`;
        const userContactsStr = localStorage.getItem(userContactsKey);
        const userContacts: ChatContact[] = userContactsStr
            ? JSON.parse(userContactsStr)
            : initialChatContacts.filter(c => c.id !== currentUser.id);

        const updatedContacts = userContacts.map(c =>
          c.id === contactId && c.unreadCount && c.unreadCount > 0
          ? { ...c, unreadCount: 0 } 
          : c
        );

        localStorage.setItem(userContactsKey, JSON.stringify(updatedContacts));
        setAllContacts(updatedContacts);
        window.dispatchEvent(new Event('storage')); 
      }
    }, [getContactDetails, currentUser]);

    const updateData = useCallback(() => {
        const storedUsers = localStorage.getItem('userList') || JSON.stringify(initialUsers);
        const storedTeachers = localStorage.getItem('teacherList') || JSON.stringify(initialTeachers);
        const combinedUsers = [...JSON.parse(storedUsers), ...JSON.parse(storedTeachers)];
        setAllUsers(combinedUsers);

        const storedMessages = localStorage.getItem('chatMessages');
        setAllMessages(storedMessages ? JSON.parse(storedMessages).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : initialChatMessages);
        
        if(currentUser) {
            const userContactsKey = `chatContacts_${currentUser.id}`;
            const storedContacts = localStorage.getItem(userContactsKey);
            const parsedContacts = storedContacts ? JSON.parse(storedContacts).map((c: any) => ({ ...c, lastMessageTimestamp: new Date(c.lastMessageTimestamp) })) : initialChatContacts.filter(c => c.id !== currentUser.id);
            setAllContacts(parsedContacts);
        }

        
        const storedSchedule = localStorage.getItem('scheduleEvents');
        setSchedule(storedSchedule ? JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })) : initialSchedule);

    }, [currentUser]);

    useEffect(() => {
        updateData();
        window.addEventListener('storage', updateData);
        return () => window.removeEventListener('storage', updateData);
    }, [updateData]);
    
    useEffect(() => {
        if (contactIdParam && allUsers.length > 0) {
            handleContactSelect(contactIdParam);
        }
    }, [contactIdParam, allUsers, handleContactSelect]);


    const chatContacts = useMemo(() => {
        if (!currentUser) return [];

        const now = new Date();
        const futureScheduledEvents = schedule.filter(e => e.status === 'scheduled' && e.start > now);
        
        let validPartnerIds: string[] = [];

        if (currentUser.role === 'admin') {
            validPartnerIds = allUsers.map(u => u.id);
        } else if (currentUser.role === 'student') {
            const myTeacherIds = futureScheduledEvents
                .filter(e => e.studentId === currentUser.id)
                .map(e => e.teacherId);
            validPartnerIds = [...new Set(myTeacherIds)];
        } else if (currentUser.role === 'teacher') {
            const myStudentIds = futureScheduledEvents
                .filter(e => e.teacherId === currentUser.id)
                .map(e => e.studentId);
            validPartnerIds = [...new Set(myStudentIds)];
        }
        
        const adminIds = allUsers.filter(u => u.role === 'admin').map(u => u.id);
        validPartnerIds.push(...adminIds);


        return allContacts
            .filter(contact => validPartnerIds.includes(contact.id))
            .sort((a,b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());

    }, [currentUser, schedule, allContacts, allUsers]);

    useEffect(() => {
        if (scrollAreaRef.current) {
          const scrollableNode = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
          if (scrollableNode) {
            scrollableNode.scrollTop = scrollableNode.scrollHeight;
          }
        }
    }, [activeChatPartner, allMessages]);
    
    const groupedMessages = useMemo(() => {
        if (!currentUser || !activeChatPartner) return {};
        
        return allMessages
            .filter(m => 
                (m.senderId === currentUser.id && m.receiverId === activeChatPartner.id) ||
                (m.senderId === activeChatPartner.id && m.receiverId === currentUser.id)
            )
            .reduce((acc, message) => {
                const date = format(message.timestamp, 'yyyy-MM-dd');
                if (!acc[date]) {
                    acc[date] = [];
                }
                acc[date].push(message);
                return acc;
            }, {} as Record<string, ChatMessage[]>);
    }, [allMessages, currentUser, activeChatPartner]);

    const formatDateSeparator = (dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00');
      if (isToday(date)) return 'Hoje';
      if (isYesterday(date)) return 'Ontem';
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    
    
    const sendMessage = useCallback((senderId: string, receiverId: string, content: string) => {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: senderId,
        receiverId: receiverId,
        content: content,
        timestamp: new Date(),
      };
  
      const currentMessagesStr = localStorage.getItem('chatMessages');
      const currentMessages: ChatMessage[] = currentMessagesStr ? JSON.parse(currentMessagesStr).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : initialChatMessages;
      const updatedMessages = [...currentMessages, newMessage];
      localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
      
      const updateUserContacts = (
          ownerId: string,
          partnerId: string,
          isReceiver: boolean
      ) => {
          const userContactsKey = `chatContacts_${ownerId}`;
          const allCurrentContactsStr = localStorage.getItem(userContactsKey);
          let allCurrentContacts: ChatContact[] = allCurrentContactsStr 
              ? JSON.parse(allCurrentContactsStr).map((c: any) => ({ ...c, lastMessageTimestamp: new Date(c.lastMessageTimestamp) }))
              : initialChatContacts.filter(c => c.id !== ownerId);

          const partnerDetails = getContactDetails(partnerId);
          if (!partnerDetails) return;

          let contactExists = false;
          const updatedList = allCurrentContacts.map(c => {
              if (c.id === partnerId) {
                  contactExists = true;
                  return {
                      ...c,
                      lastMessage: newMessage.content.startsWith('file::') ? 'Arquivo enviado' : newMessage.content,
                      lastMessageTimestamp: newMessage.timestamp,
                      unreadCount: isReceiver && c.unreadCount !== undefined ? c.unreadCount + 1 : (c.unreadCount || 0),
                  };
              }
              return c;
          });

          if (!contactExists) {
               updatedList.push({
                  id: partnerDetails.id,
                  name: partnerDetails.name,
                  avatarUrl: partnerDetails.avatarUrl,
                  lastMessage: newMessage.content.startsWith('file::') ? 'Arquivo enviado' : newMessage.content,
                  lastMessageTimestamp: newMessage.timestamp,
                  unreadCount: isReceiver ? 1 : 0,
              });
          }
          
          const sortedList = updatedList.sort((a,b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());
          localStorage.setItem(userContactsKey, JSON.stringify(sortedList));
      };
      
      updateUserContacts(newMessage.senderId, newMessage.receiverId, false);
      updateUserContacts(newMessage.receiverId, newMessage.senderId, true);
      
      window.dispatchEvent(new Event('storage'));
    }, [getContactDetails]);

    const [messageInput, setMessageInput] = useState('');

    const handleSendMessage = (e?: React.FormEvent, content?: string) => {
      if (e) e.preventDefault();
      
      const messageToSend = content || messageInput;
      if (!messageToSend.trim() || !activeChatPartner || !currentUser) return;
  
      sendMessage(currentUser.id, activeChatPartner.id, messageToSend);
      
      if (!content) {
          setMessageInput('');
      }
    };
    
      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
        }
      };
      
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                const fileMessage = `file::${file.name}::${dataUrl}`;
                handleSendMessage(undefined, fileMessage);
            };
            reader.readAsDataURL(file);

            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    const renderMessageContent = (message: ChatMessage) => {
        if (message.content.startsWith('file::')) {
            const [, fileName, dataUrl] = message.content.split('::');
            const isAudio = fileName.endsWith('.mp3') || fileName.endsWith('.ogg') || fileName.endsWith('.webm');
            if (isAudio) {
                return (
                    <audio controls src={dataUrl} className="w-full max-w-xs">
                        Seu navegador não suporta o elemento de áudio.
                    </audio>
                )
            }
            return (
                <a href={dataUrl} download={fileName} className="flex items-center gap-2 underline text-current">
                    <FileIcon className="h-4 w-4" />
                    <span>{fileName}</span>
                </a>
            );
        }
        return <p className="break-words whitespace-pre-wrap">{message.content}</p>;
    };

    const scheduledMessagesQuery = useMemoFirebase(() => {
        if (!firestore || !currentUser?.id) return null;
        return collection(firestore, 'users', currentUser.id, 'scheduledMessages');
    }, [firestore, currentUser?.id]);

    const { data: scheduledMessagesForDisplay } = useCollection<ScheduledMessage>(scheduledMessagesQuery);

    const handleRemoveScheduledMessage = async (id: string) => {
        if (!currentUser?.id || !firestore) return;
        const messageRef = doc(firestore, 'users', currentUser.id, 'scheduledMessages', id);
        await deleteDoc(messageRef);
    };


    if (!currentUser) {
        return null;
    }


    return (
      <>
        <div className="grid flex-1 w-full grid-cols-1 md:grid-cols-[450px_1fr] gap-4">
              <Card className="flex flex-col rounded-lg border max-h-[calc(100vh-8rem)]">
                  <div className="p-4 border-b">
                      <h2 className="font-headline text-xl font-bold">Conversas</h2>
                      <div className="relative mt-2">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Pesquisar..." className="pl-8" />
                      </div>
                  </div>
                  <ScrollArea className="flex-1">
                      <div className="p-2">
                          {chatContacts.map(contact => {
                              const contactDetails = getContactDetails(contact.id);
                              if (!contactDetails || contact.id === currentUser.id) return null;
                              
                              return (
                              <button key={contact.id} onClick={() => handleContactSelect(contact.id)} className={cn(
                                  "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-all hover:bg-accent/50",
                                  activeChatPartner && contact.id === activeChatPartner.id ? "bg-accent/70" : ""
                              )}>
                                  <Avatar className="h-10 w-10">
                                      <AvatarImage src={contact.avatarUrl} alt={contact.name} />
                                      <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 overflow-hidden">
                                      <div className="flex items-start justify-between">
                                          <div className="flex flex-col">
                                            <div className='flex items-center gap-2'>
                                              <p className="font-semibold truncate">{contact.name}</p>
                                              {contactDetails.role && <Badge variant="secondary" className="text-xs">{roleLabels[contactDetails.role]}</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                                          </div>
                                          <p className="text-xs text-muted-foreground shrink-0 pt-1">
                                              {formatDistanceToNow(contact.lastMessageTimestamp, { locale: ptBR, addSuffix: true }).replace('cerca de ', '')}
                                          </p>
                                      </div>
                                       {contact.unreadCount > 0 && (
                                          <div className="flex justify-end mt-1">
                                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{contact.unreadCount}</span>
                                          </div>
                                      )}
                                  </div>
                              </button>
                          )})}
                      </div>
                  </ScrollArea>
              </Card>

              { activeChatPartner ? (
                  <Card className="flex flex-col rounded-lg border bg-card max-h-[calc(100vh-8rem)]" style={{
                      backgroundImage: "url('/chat-bg.png')",
                      backgroundRepeat: 'repeat',
                      backgroundSize: '300px',
                    }}>
                      <div className="flex items-center gap-4 p-4 border-b bg-card">
                          <Avatar className="h-10 w-10">
                              <AvatarImage src={activeChatPartner.avatarUrl} alt={activeChatPartner.name} />
                              <AvatarFallback>{activeChatPartner.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-semibold">{activeChatPartner.name}</p>
                              <p className="text-sm text-muted-foreground">Online</p>
                          </div>
                      </div>
                      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                          <div className="flex flex-col gap-2">
                          {Object.keys(groupedMessages).sort().map(date => (
                              <div key={date}>
                                  <div className="flex justify-center my-4">
                                  <div className="text-xs text-muted-foreground bg-card px-3 py-1 rounded-full border">
                                      {formatDateSeparator(date)}
                                  </div>
                                  </div>
                                  <div className="flex flex-col gap-4">
                                  {groupedMessages[date].map(message => (
                                      <div key={message.id} className={cn(
                                          "flex w-full items-end gap-2",
                                          message.senderId === currentUser.id ? "justify-end" : "justify-start"
                                      )}>
                                          {message.senderId !== currentUser.id && activeChatPartner && (
                                              <Avatar className="h-8 w-8 self-end">
                                                  <AvatarImage src={activeChatPartner.avatarUrl} alt={activeChatPartner.name} />
                                                  <AvatarFallback>{activeChatPartner.name.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                          )}
                                          <div className={cn(
                                              "max-w-[75%] md:max-w-[60%] rounded-lg p-3 text-sm flex flex-col shadow",
                                              message.senderId === currentUser.id ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none"
                                          )}>
                                              {renderMessageContent(message)}
                                              <p className={cn(
                                                  "text-xs shrink-0 self-end pt-1",
                                                  message.senderId === currentUser.id ? "text-primary-foreground/70" : "text-muted-foreground"
                                              )}>
                                                  {format(new Date(message.timestamp), 'HH:mm')}
                                              </p>
                                          </div>
                                      </div>
                                  ))}
                                  </div>
                              </div>
                          ))}
                          </div>
                      </ScrollArea>
                      <div className="p-4 border-t bg-card">
                          {(scheduledMessagesForDisplay || []).filter(m => m.contactId === activeChatPartner.id && m.creatorId === currentUser.id).length > 0 && (
                            <div className="space-y-2 mb-2">
                                {(scheduledMessagesForDisplay || [])
                                    .filter(m => m.contactId === activeChatPartner.id && m.creatorId === currentUser.id)
                                    .map((msg) => (
                                  <div key={msg.id} className="flex items-center justify-between bg-accent/50 text-accent-foreground p-2 rounded-md text-sm">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                          <Clock className="h-4 w-4 shrink-0" />
                                          <span className="truncate">"{msg.content}" para {format(new Date(msg.date), "dd/MM 'às' HH:mm")}</span>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemoveScheduledMessage(msg.id)}>
                                          <X className="h-4 w-4" />
                                      </Button>
                                  </div>
                                ))}
                            </div>
                          )}
                          <form onSubmit={handleSendMessage} className="relative">
                              <Input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleFileSelect}
                                  className="hidden"
                                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,audio/*"
                              />
                              <Input 
                                  placeholder="Digite uma mensagem..." 
                                  className="pr-24"
                                  value={messageInput}
                                  onChange={(e) => setMessageInput(e.target.value)}
                                  onKeyDown={handleKeyDown}
                              />
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                  <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                                      <span className="sr-only">Anexar</span>
                                  </Button>
                                  <Button type="button" size="icon" variant="ghost" onClick={() => { setIsScheduling(true); }}>
                                      <Clock className="h-5 w-5 text-muted-foreground" />
                                      <span className="sr-only">Agendar</span>
                                  </Button>
                                  <Button type="submit" size="icon" variant="ghost" className="h-8 w-8">
                                      <Send className="h-5 w-5 text-muted-foreground" />
                                      <span className="sr-only">Enviar</span>
                                  </Button>
                              </div>
                          </form>
                      </div>
                  </Card>
              ) : (
                  <Card className="flex flex-col items-center justify-center h-full rounded-lg border bg-card/80 backdrop-blur-sm">
                      <CardHeader className="text-center">
                          <div className="mx-auto bg-primary/20 rounded-full p-4 w-fit">
                              <MessageSquare className="h-10 w-10 text-primary" />
                          </div>
                          <CardTitle className="mt-4 text-xl font-headline">Bem-vindo ao Chat</CardTitle>
                          <p className="text-muted-foreground">
                              Selecione um contato para começar a conversar.
                          </p>
                      </CardHeader>
                  </Card>
              )}
        </div>
        <ScheduleMessagesDialog 
            isOpen={isScheduling}
            onOpenChange={setIsScheduling}
            activeChatPartner={activeChatPartner}
            currentUser={currentUser}
        />
      </>
    )

}

export default function ChatPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ChatPageComponent />
        </Suspense>
    )
}
    
    
    




    

    




    

    





    

    


