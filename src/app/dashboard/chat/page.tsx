
'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
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
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
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


const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  student: 'Aluno',
  teacher: 'Professor',
};

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

interface ScheduledMessage {
    id: string;
    date: Date;
    content: string;
    title?: string;
    recurrence: RecurrenceType;
}

function ChatPageComponent() {
    const searchParams = useSearchParams();
    const contactIdParam = searchParams.get('contactId');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeChatPartner, setActiveChatPartner] = useState<User | Teacher | null>(null);
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDialogView, setScheduleDialogView] = useState<'list' | 'create'>('list');
    const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
    const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | undefined>(new Date());
    const [selectedScheduleTime, setSelectedScheduleTime] = useState<string>('12:00');
    const [scheduledMessageContent, setScheduledMessageContent] = useState('');
    const [scheduledMessageTitle, setScheduledMessageTitle] = useState('');
    const [scheduledMessageRecurrence, setScheduledMessageRecurrence] = useState<RecurrenceType>('none');
    
    const [messageContent, setMessageContent] = useState('');
    const [allMessages, setAllMessages] = useState<ChatMessage[]>(initialChatMessages);
    const [allUsers, setAllUsers] = useState<(User | Teacher)[]>([]);
    const [schedule, setSchedule] = useState<ScheduleEvent[]>(initialSchedule);
    const [allContacts, setAllContacts] = useState<ChatContact[]>(initialChatContacts);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

    const getContactDetails = useCallback((contactId: string) => {
      return allUsers.find(u => u.id === contactId);
    }, [allUsers]);

    const handleContactSelect = useCallback((contactId: string) => {
        const contact = getContactDetails(contactId);
        if (contact) {
            setActiveChatPartner(contact);
            setAllContacts(prevContacts => {
                const updatedContacts = prevContacts.map(c => 
                    c.id === contactId ? { ...c, unreadCount: 0 } : c
                );
                localStorage.setItem('chatContacts', JSON.stringify(updatedContacts));
                return updatedContacts;
            });
        }
    }, [getContactDetails]);

    const updateData = useCallback(() => {
        const loggedInUserStr = localStorage.getItem('currentUser');
        if(loggedInUserStr) {
            setCurrentUser(JSON.parse(loggedInUserStr));
        } else {
            setCurrentUser(getMockUser('student'));
        }

        const storedUsers = localStorage.getItem('userList') || JSON.stringify(initialUsers);
        const storedTeachers = localStorage.getItem('teacherList') || JSON.stringify(initialTeachers);
        const combinedUsers = [...JSON.parse(storedUsers), ...JSON.parse(storedTeachers)];
        setAllUsers(combinedUsers);

        const storedMessages = localStorage.getItem('chatMessages');
        if (storedMessages) {
            setAllMessages(JSON.parse(storedMessages).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        } else {
            setAllMessages(initialChatMessages);
        }
        
        const storedContacts = localStorage.getItem('chatContacts');
        if (storedContacts) {
            const parsedContacts = JSON.parse(storedContacts).map((c: any) => ({ ...c, lastMessageTimestamp: new Date(c.lastMessageTimestamp) }));
            setAllContacts(parsedContacts);
        } else {
            setAllContacts(initialChatContacts);
        }
        
        const storedSchedule = localStorage.getItem('scheduleEvents');
        if (storedSchedule) {
            const parsedSchedule = JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));
            setSchedule(parsedSchedule);
        } else {
            setSchedule(initialSchedule);
        }
    }, []);

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
            // Admins can see everyone
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
        
        // Admins should always be visible
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
    
    const handleScheduleMessage = () => {
        if (!selectedScheduleDate || !selectedScheduleTime || !scheduledMessageContent.trim()) {
            toast({
                variant: 'destructive',
                title: 'Campos Incompletos',
                description: 'Por favor, escreva uma mensagem e selecione uma data e horário.',
            });
            return;
        }

        const [hours, minutes] = selectedScheduleTime.split(':').map(Number);
        const newScheduledDate = new Date(selectedScheduleDate);
        newScheduledDate.setHours(hours, minutes, 0, 0);
        
        const newScheduledMessage: ScheduledMessage = {
            id: `sched-${Date.now()}`,
            date: newScheduledDate,
            content: scheduledMessageContent,
            title: scheduledMessageTitle,
            recurrence: scheduledMessageRecurrence,
        };

        setScheduledMessages(prev => [...prev, newScheduledMessage]);
        
        setScheduledMessageContent('');
        setScheduledMessageTitle('');
        setScheduledMessageRecurrence('none');
        setScheduleDialogView('list');

        toast({
            title: 'Mensagem Agendada',
            description: `Sua mensagem foi agendada para ${format(newScheduledDate, "dd/MM/yyyy 'às' HH:mm")}.`,
        });
    }

    const availableTimes = Array.from({ length: 24 * 2 }, (_, i) => {
        const hours = Math.floor(i / 2);
        const minutes = (i % 2) * 30;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    });

    const handleSendMessage = (e?: React.FormEvent, content?: string) => {
        if (e) e.preventDefault();
        
        const messageToSend = content || messageContent;
        if (!messageToSend.trim() || !activeChatPartner || !currentUser) return;
    
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: currentUser.id,
          receiverId: activeChatPartner.id,
          content: messageToSend,
          timestamp: new Date(),
        };
    
        const updatedMessages = [...allMessages, newMessage];
        setAllMessages(updatedMessages);
        localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
        
        const allCurrentContactsStr = localStorage.getItem('chatContacts');
        const allCurrentContacts: ChatContact[] = allCurrentContactsStr 
            ? JSON.parse(allCurrentContactsStr).map((c: any) => ({ ...c, lastMessageTimestamp: new Date(c.lastMessageTimestamp) }))
            : initialChatContacts;

        const updateUserContacts = (
            currentContactsList: ChatContact[],
            userIdToUpdate: string,
            partnerId: string,
            message: ChatMessage
        ): ChatContact[] => {
            let contacts = currentContactsList.filter(c => c.id !== partnerId);
            const partnerDetails = getContactDetails(partnerId);
            if (!partnerDetails) return contacts;

            const isReceiver = message.receiverId === userIdToUpdate;
            const existingContact = currentContactsList.find(c => c.id === partnerId);
            
            const newContactEntry: ChatContact = {
                id: partnerDetails.id,
                name: partnerDetails.name,
                avatarUrl: partnerDetails.avatarUrl,
                lastMessage: message.content.startsWith('file::') ? 'Arquivo enviado' : message.content,
                lastMessageTimestamp: message.timestamp,
                unreadCount: isReceiver ? (existingContact?.unreadCount || 0) + 1 : (existingContact?.unreadCount || 0),
            };

            return [newContactEntry, ...contacts];
        };

        let myUpdatedContacts = updateUserContacts(allCurrentContacts, currentUser.id, activeChatPartner.id, newMessage);
        let partnerUpdatedContacts = updateUserContacts(myUpdatedContacts, activeChatPartner.id, currentUser.id, newMessage);

        // Ensure both contacts are present in the list, even if they were filtered out before
        const partnerContact = partnerUpdatedContacts.find(c => c.id === activeChatPartner.id);
        const selfContact = partnerUpdatedContacts.find(c => c.id === currentUser.id);

        if (!partnerContact) {
            const partnerDetails = getContactDetails(activeChatPartner.id);
            if(partnerDetails) {
                 partnerUpdatedContacts.push({
                    id: partnerDetails.id,
                    name: partnerDetails.name,
                    avatarUrl: partnerDetails.avatarUrl,
                    lastMessage: newMessage.content,
                    lastMessageTimestamp: newMessage.timestamp,
                    unreadCount: 1, // For the partner
                });
            }
        }
        
        if (!selfContact) {
             const selfDetails = getContactDetails(currentUser.id);
             if(selfDetails) {
                 partnerUpdatedContacts.push({
                    id: selfDetails.id,
                    name: selfDetails.name,
                    avatarUrl: selfDetails.avatarUrl,
                    lastMessage: newMessage.content,
                    lastMessageTimestamp: newMessage.timestamp,
                    unreadCount: 0, // For self
                });
            }
        }

        const finalContacts = Array.from(new Map(partnerUpdatedContacts.map(item => [item.id, item])).values());
        
        setAllContacts(finalContacts.sort((a,b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime()));
        localStorage.setItem('chatContacts', JSON.stringify(finalContacts));

        window.dispatchEvent(new Event('storage'));
        if (!content) {
            setMessageContent('');
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
                if (isScheduling && scheduleDialogView === 'create') {
                    setScheduledMessageContent(prev => prev ? `${prev}\n${fileMessage}` : fileMessage);
                     toast({
                        title: "Arquivo Anexado!",
                        description: `O arquivo "${file.name}" foi anexado à sua mensagem agendada.`,
                    });
                } else {
                    handleSendMessage(undefined, fileMessage);
                    toast({
                        title: "Arquivo Enviado!",
                        description: `O arquivo "${file.name}" foi enviado na conversa.`,
                    });
                }
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
            const isAudio = fileName.endsWith('.wav') || fileName.endsWith('.mp3') || fileName.endsWith('.ogg');
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

    const handleRemoveScheduledMessage = (id: string) => {
        setScheduledMessages(prev => prev.filter(msg => msg.id !== id));
    };

    const handleToggleRecording = async () => {
        if (isRecording) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            // Start recording
            if (!hasMicPermission) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setHasMicPermission(true);
                    
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorderRef.current = mediaRecorder;

                    mediaRecorder.ondataavailable = (event) => {
                        setAudioChunks(prev => [...prev, event.data]);
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64data = reader.result as string;
                             const audioMessage = `file::gravacao-${new Date().toISOString()}.wav::${base64data}`;
                            setScheduledMessageContent(prev => prev ? `${prev}\n${audioMessage}` : audioMessage);
                            toast({
                                title: "Gravação Anexada!",
                                description: "Sua gravação de áudio foi anexada à mensagem agendada.",
                            });
                        };
                        reader.readAsDataURL(audioBlob);

                        setAudioChunks([]); // Clear chunks for next recording
                         // Stop all media tracks to turn off the mic indicator
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
            } else if (mediaRecorderRef.current) {
                 // If permission is already granted, just start recording
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream); // Re-create with a fresh stream
                mediaRecorderRef.current.ondataavailable = (event) => {
                    setAudioChunks(prev => [...prev, event.data]);
                };
                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                     const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64data = reader.result as string;
                             const audioMessage = `file::gravacao-${new Date().toISOString()}.wav::${base64data}`;
                            setScheduledMessageContent(prev => prev ? `${prev}\n${audioMessage}` : audioMessage);
                            toast({
                                title: "Gravação Anexada!",
                                description: "Sua gravação de áudio foi anexada à mensagem agendada.",
                            });
                        };
                        reader.readAsDataURL(audioBlob);

                    setAudioChunks([]);
                    stream.getTracks().forEach(track => track.stop());
                };
                mediaRecorderRef.current.start();
                setIsRecording(true);
            }
        }
    };
    
    const recurrenceLabels: Record<RecurrenceType, string> = {
        none: 'Vazia',
        daily: 'Diária',
        weekly: 'Semanal',
        monthly: 'Mensal',
    };

    const getMessageType = (content: string) => {
        if (content.startsWith('file::')) {
            const [, fileName] = content.split('::');
            if (fileName.endsWith('.wav') || fileName.endsWith('.mp3') || fileName.endsWith('.ogg')) {
                return 'audio';
            }
            return 'file';
        }
        return 'txt';
    }


    if (!currentUser) {
        return null; // Or a loading spinner
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
                                                  {format(message.timestamp, 'HH:mm')}
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
                          {scheduledMessages.filter(m => m.id.includes(activeChatPartner.id)).length > 0 && (
                            <div className="space-y-2 mb-2">
                                {scheduledMessages.map((msg) => (
                                  <div key={msg.id} className="flex items-center justify-between bg-accent/50 text-accent-foreground p-2 rounded-md text-sm">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                          <Clock className="h-4 w-4 shrink-0" />
                                          <span className="truncate">"{msg.content}" para {format(msg.date, "dd/MM 'às' HH:mm")}</span>
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
                                  value={messageContent}
                                  onChange={(e) => setMessageContent(e.target.value)}
                                  onKeyDown={handleKeyDown}
                              />
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                  <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                                      <span className="sr-only">Anexar</span>
                                  </Button>
                                  <Button type="button" size="icon" variant="ghost" onClick={() => { setScheduleDialogView('list'); setIsScheduling(true); }}>
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
        <Dialog open={isScheduling} onOpenChange={setIsScheduling}>
            <DialogContent className="sm:max-w-4xl">
              {scheduleDialogView === 'list' ? (
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
                                {scheduledMessages.map(msg => (
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
                                        <TableCell>{format(msg.date, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{format(msg.date, 'HH:mm')}</TableCell>
                                        <TableCell>{recurrenceLabels[msg.recurrence]}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveScheduledMessage(msg.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                         {scheduledMessages.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>Nenhuma mensagem agendada para este contato.</p>
                            </div>
                         )}
                    </div>
                    <DialogFooter className="sm:justify-center">
                         <Button type="button" onClick={() => setScheduleDialogView('create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar
                        </Button>
                    </DialogFooter>
                </>
              ) : (
                <>
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => setScheduleDialogView('list')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <DialogTitle className="font-headline text-2xl">Criar Agendamento</DialogTitle>
                        </div>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="schedule-title">Título (Opcional)</Label>
                            <Input id="schedule-title" placeholder="Insira aqui o título" value={scheduledMessageTitle} onChange={e => setScheduledMessageTitle(e.target.value)} />
                        </div>
                        <Tabs defaultValue="text" className="w-full">
                            <TabsList>
                                <TabsTrigger value="text">Criar texto</TabsTrigger>
                                <TabsTrigger value="media">Mídia</TabsTrigger>
                                <TabsTrigger value="audio">Áudio</TabsTrigger>
                                <TabsTrigger value="quick-message" disabled>Selecionar mensagem rápida</TabsTrigger>
                            </TabsList>
                            <TabsContent value="text" className="pt-4">
                                <div className="grid gap-2 relative">
                                    <Label htmlFor="scheduled-message-content">Mensagem</Label>
                                    <Textarea
                                        id="scheduled-message-content"
                                        value={scheduledMessageContent}
                                        onChange={(e) => setScheduledMessageContent(e.target.value)}
                                        placeholder="Insira sua mensagem"
                                        rows={5}
                                        className="pr-10"
                                    />
                                    <Button variant="ghost" size="icon" className="absolute bottom-2 right-2 h-8 w-8">
                                        <Smile className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </div>
                            </TabsContent>
                            <TabsContent value="media" className="pt-4">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="media-message-content">Mensagem (Opcional)</Label>
                                        <Textarea
                                            id="media-message-content"
                                            value={scheduledMessageContent}
                                            onChange={(e) => setScheduledMessageContent(e.target.value)}
                                            placeholder="Adicione uma legenda para sua mídia..."
                                            rows={3}
                                        />
                                    </div>
                                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Adicionar arquivo
                                    </Button>
                                </div>
                            </TabsContent>
                            <TabsContent value="audio" className="pt-4">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="audio-message-content">Legenda do Áudio (Opcional)</Label>
                                        <Textarea
                                            id="audio-message-content"
                                            value={scheduledMessageContent}
                                            onChange={(e) => setScheduledMessageContent(e.target.value)}
                                            placeholder="Adicione uma legenda para o seu áudio..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Adicionar áudio
                                        </Button>
                                        <Button variant="outline" onClick={handleToggleRecording} className={cn(isRecording && "text-red-500 border-red-500 hover:text-red-600")}>
                                            {isRecording ? <CircleDot className="mr-2 h-4 w-4 animate-pulse" /> : <Mic className="mr-2 h-4 w-4" />}
                                            {isRecording ? "Parar Gravação" : "Gravar Áudio"}
                                        </Button>
                                    </div>
                                    {hasMicPermission === false && (
                                        <p className="text-xs text-destructive text-center col-span-2">A permissão do microfone é necessária para gravar áudio.</p>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                            <Label>Data</Label>
                            <DatePicker date={selectedScheduleDate} setDate={setSelectedScheduleDate} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="time">Hora</Label>
                                <Select value={selectedScheduleTime} onValueChange={setSelectedScheduleTime}>
                                    <SelectTrigger>
                                    <SelectValue placeholder="--:--" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                    {availableTimes.map((time) => (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
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
                        <Button type="button" variant="outline" onClick={() => setScheduleDialogView('list')}>Cancelar</Button>
                        <Button type="button" onClick={handleScheduleMessage}>Criar</Button>
                    </DialogFooter>
                </>
              )}
            </DialogContent>
        </Dialog>
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
    
    
    




    

    




    

    





    

    
