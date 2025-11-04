

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
import { chatContacts as initialChatContacts, chatMessages as initialChatMessages, getMockUser, users as initialRegularUsers, teachers as initialTeachers, logActivity } from '@/lib/data';
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
import { useCollection, useFirebase, useUser, useMemoFirebase, useAuth, useFirestore } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';


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

function ChatPageComponent() {
    const searchParams = useSearchParams();
    const contactIdParam = searchParams.get('contactId');
    const { user: currentUser, isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [activeChatPartner, setActiveChatPartner] = useState<User | Teacher | null>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // State for the scheduling dialog
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [messageTitle, setMessageTitle] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
    const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
    const [isRecording, setIsRecording] = useState(false);

    
    const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
    const [chatContacts, setChatContacts] = useState<ChatContact[]>([]);
    const [allUsers, setAllUsers] = useState<(User | Teacher)[]>([]);

    
    const getAllUsers = useCallback((): (User | Teacher)[] => {
        const storedUsers = localStorage.getItem('userList');
        const currentUsers = storedUsers ? JSON.parse(storedUsers) : initialRegularUsers;

        const storedTeachers = localStorage.getItem('teacherList');
        const currentTeachers = storedTeachers ? JSON.parse(storedTeachers) : initialTeachers;

        return [...currentUsers, ...currentTeachers];
    }, []);

    useEffect(() => {
        const users = getAllUsers();
        setAllUsers(users);
        const storedMessages = localStorage.getItem('chatMessages');
        setAllMessages(storedMessages ? JSON.parse(storedMessages).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : initialChatMessages);
    }, [getAllUsers]);

    useEffect(() => {
        if (!currentUser || allUsers.length === 0) return;
    
        const userContactsKey = `chatContacts_${currentUser.id}`;
        const storedContactsStr = localStorage.getItem(userContactsKey);
        const contactsData: ChatContact[] = storedContactsStr ? JSON.parse(storedContactsStr).map((c: any) => ({ ...c, lastMessageTimestamp: new Date(c.lastMessageTimestamp) })) : [];
        const contactsMap = new Map(contactsData.map(c => [c.id, c]));
    
        let potentialPartners: (User | Teacher)[] = [];
    
        if (currentUser.role === 'admin') {
            potentialPartners = allUsers.filter(u => u.id !== currentUser.id);
        } else if (currentUser.role === 'student') {
            potentialPartners = allUsers.filter(u => u.role === 'teacher' || u.role === 'admin');
        } else if (currentUser.role === 'teacher') {
            potentialPartners = allUsers.filter(u => u.role === 'student' || u.role === 'admin');
        }
    
        const fullContactList: ChatContact[] = potentialPartners.map(partner => {
            const existingContact = contactsMap.get(partner.id);
            return {
                id: partner.id,
                name: partner.name,
                avatarUrl: partner.avatarUrl,
                role: partner.role,
                lastMessage: existingContact?.lastMessage || 'Nenhuma mensagem ainda.',
                lastMessageTimestamp: existingContact?.lastMessageTimestamp || new Date(0),
                unreadCount: existingContact?.unreadCount || 0,
            };
        }).sort((a, b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());
    
        setChatContacts(fullContactList);
    
    }, [currentUser, allUsers]);

    const handleContactSelect = useCallback((contactId: string) => {
        const contact = allUsers.find(u => u.id === contactId);

        if (contact && currentUser) {
            setActiveChatPartner(contact);

            const userContactsKey = `chatContacts_${currentUser.id}`;
            const storedContacts = localStorage.getItem(userContactsKey);
            let currentContacts: ChatContact[] = storedContacts ? JSON.parse(storedContacts).map((c: any) => ({...c, lastMessageTimestamp: new Date(c.lastMessageTimestamp)})) : [];
            
            let contactFound = false;
            const updatedContacts = currentContacts.map((c: ChatContact) => {
            if (c.id === contactId) {
                contactFound = true;
                return c.unreadCount && c.unreadCount > 0 ? { ...c, unreadCount: 0 } : c;
            }
            return c;
            });

            if (!contactFound && contact) {
                updatedContacts.push({
                    id: contact.id,
                    name: contact.name,
                    avatarUrl: contact.avatarUrl,
                    role: contact.role,
                    lastMessage: 'Nenhuma mensagem ainda.',
                    lastMessageTimestamp: new Date(0),
                    unreadCount: 0,
                });
            }

            localStorage.setItem(userContactsKey, JSON.stringify(updatedContacts));
            window.dispatchEvent(new Event('storage')); 
        }
    }, [currentUser, allUsers]);
    
    useEffect(() => {
        if (contactIdParam && allUsers.length > 0) {
            handleContactSelect(contactIdParam);
        }
    }, [contactIdParam, handleContactSelect, allUsers]);


    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
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
              : [];

          const partnerDetails = allUsers.find(u => u.id === partnerId);
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
                  role: partnerDetails.role,
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
      
      const receiver = allUsers.find(u => u.id === receiverId);
      if (receiver) {
        logActivity(`Enviou uma mensagem para ${receiver.name}`);
      }

      window.dispatchEvent(new Event('storage'));
    }, [allUsers]);

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

    const handleScheduleMessage = async (e: FormEvent) => {
        e.preventDefault();
        
        const authUser = auth.currentUser;
        if (!authUser?.uid || !activeChatPartner?.id) {
            toast({
                variant: 'destructive',
                title: 'Erro de Autenticação',
                description: 'Você precisa estar logado e ter um chat ativo para agendar mensagens.',
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

        const messageData = {
            creatorId: authUser.uid,
            contactId: activeChatPartner.id,
            title: messageTitle,
            content: messageContent,
            date: scheduledDate,
            recurrence: recurrence,
        };

        const collectionRef = collection(firestore, 'users', authUser.uid, 'scheduledMessages');
        try {
            await addDoc(collectionRef, messageData);
            toast({
                title: 'Mensagem Agendada',
                description: `Sua mensagem para ${activeChatPartner.name} foi agendada para ${format(scheduledDate!, "'dia' dd/MM 'às' HH:mm")}.`,
            });

            // Reset form and close dialog
            setMessageTitle('');
            setMessageContent('');
            setScheduledDate(new Date());
            setRecurrence('none');
            setIsScheduleDialogOpen(false);
        } catch (error) {
            const contextualError = new FirestorePermissionError({
                path: collectionRef.path,
                operation: 'create',
                requestResourceData: messageData,
            });
            errorEmitter.emit('permission-error', contextualError);
        }
    };

    const handleScheduleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                const fileIdentifier = `file::${file.name}::${dataUrl}`;
                setMessageContent(prev => prev ? `${prev}\n${fileIdentifier}` : fileIdentifier);
            };
            reader.readAsDataURL(file);

            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    const handleToggleRecording = () => {
        setIsRecording(!isRecording);
        const audioIdentifier = `file::audio-gravado-${Date.now()}.mp3::data:audio/mpeg;base64,SUQz...`;
        if (!isRecording) { // When starting recording
            toast({ title: 'Gravação Iniciada', description: 'Clique novamente para parar.' });
        } else { // When stopping recording
            setMessageContent(prev => prev ? `${prev}\n${audioIdentifier}` : audioIdentifier);
            toast({ title: 'Gravação Finalizada', description: 'Áudio anexado à mensagem.' });
        }
    };


    if (isUserLoading) {
        return <div>Carregando...</div>;
    }
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
                              if (!contact || contact.id === currentUser?.id) return null;
                              
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
                                              {contact.role && <Badge variant="secondary" className="text-xs">{roleLabels[contact.role]}</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                                          </div>
                                          <p className="text-xs text-muted-foreground shrink-0 pt-1">
                                              {contact.lastMessageTimestamp > new Date(0) ? formatDistanceToNow(contact.lastMessageTimestamp, { locale: ptBR, addSuffix: true }).replace('cerca de ', '') : ''}
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
                      backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABOUlEQVR4Ae3ToY1EMRCF0UvUf2wB3sImsQvsQ7AP2Ics2EWwBwuwC+xCGSBD5jZ5Y+Pj/yc5CZvMk49KKaXEV4/iXkCgGvA5sAV4IwsQ7wJ0fQc8oYoSnGQCbAN2eAI8EucK9xTQZwJ8ATY5wE0S53pHcAJMHeAJsMkBfCVx/sYJcALMHeAIsMkBfCdxvsYJcALMfeAIsMkBCv5KOXeMOcA+gCvAJgf4k4RznZwD7AO4wJuE8wacA+wDuMA3necMHARwD+D/e+3u4BwR7gFc4Pu88xacA/gL4MG88zYcBGRI2LwJMO8ARpiAnwJ3AON+gK0J9zVwFaDvAkyb4C/A1sT5GjgL0HcCbE24/wE2Jc4V7inAcYjsBdgK3LvAFYlzdY0dK6WU/At/AD5ZUU6Z2QJRAAAAAElFTkSuQmCC')",
                      backgroundRepeat: 'repeat',
                      backgroundSize: '200px',
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
                      <ScrollArea className="flex-1 p-4" viewportRef={viewportRef}>
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
                                          message.senderId === currentUser?.id ? "justify-end" : "justify-start"
                                      )}>
                                          {message.senderId !== currentUser?.id && activeChatPartner && (
                                              <Avatar className="h-8 w-8 self-end">
                                                  <AvatarImage src={activeChatPartner.avatarUrl} alt={activeChatPartner.name} />
                                                  <AvatarFallback>{activeChatPartner.name.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                          )}
                                          <div className={cn(
                                              "relative max-w-[75%] md:max-w-[60%] rounded-lg p-3 text-sm flex flex-col shadow",
                                              message.senderId === currentUser?.id ? "bg-[#D0EFB1] text-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none"
                                          )}>
                                              <div className={cn(
                                                  'absolute w-3 h-3',
                                                  message.senderId === currentUser?.id ? '-right-2 bottom-0 bg-[#D0EFB1] text-foreground' : '-left-2 bottom-0 bg-card'
                                              )}
                                               style={{
                                                    clipPath: message.senderId === currentUser?.id
                                                    ? 'polygon(100% 100%, 0 0, 100% 0)'
                                                    : 'polygon(0 0, 100% 100%, 0 100%)',
                                                }}
                                              />
                                              {renderMessageContent(message)}
                                              <p className={cn(
                                                  "text-xs shrink-0 self-end pt-1",
                                                  message.senderId === currentUser?.id ? "text-foreground/70" : "text-muted-foreground"
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
                          {(scheduledMessagesForDisplay || []).filter(m => m.contactId === activeChatPartner.id && m.creatorId === currentUser?.id).length > 0 && (
                            <div className="space-y-2 mb-2">
                                {(scheduledMessagesForDisplay || [])
                                    .filter(m => m.contactId === activeChatPartner.id && m.creatorId === currentUser?.id)
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
                                  className="pr-32"
                                  value={messageInput}
                                  onChange={(e) => setMessageInput(e.target.value)}
                                  onKeyDown={handleKeyDown}
                              />
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                  <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                                      <span className="sr-only">Anexar</span>
                                  </Button>
                                   <Button type="button" size="icon" variant="ghost" onClick={() => setIsScheduleDialogOpen(true)}>
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
        {activeChatPartner && (
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <form onSubmit={handleScheduleMessage}>
                        <DialogHeader>
                            <DialogTitle>Criar Agendamento</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="scheduled-message-title">Título (Opcional)</Label>
                                <Input
                                    id="scheduled-message-title"
                                    value={messageTitle}
                                    onChange={(e) => setMessageTitle(e.target.value)}
                                    placeholder="Ex: Lembrete de aula"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="scheduled-message-content">Mensagem</Label>
                                <Textarea
                                    id="scheduled-message-content"
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    placeholder="Escreva sua mensagem, anexe um arquivo ou grave um áudio..."
                                    rows={5}
                                />
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleScheduleFileSelect}
                                        className="hidden"
                                        accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,audio/*"
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2" /> Adicionar Mídia
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={handleToggleRecording}>
                                        <Mic className={cn("mr-2", isRecording && "text-red-500 animate-pulse")} />
                                        {isRecording ? 'Parar Gravação' : 'Gravar Áudio'}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="scheduled-date">Data</Label>
                                    <DatePicker date={scheduledDate} setDate={setScheduledDate} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="scheduled-time">Hora</Label>
                                    <TimePicker date={scheduledDate} setDate={setScheduledDate} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="recurrence">Recorrência</Label>
                                    <Select value={recurrence} onValueChange={(value) => setRecurrence(value as RecurrenceType)}>
                                        <SelectTrigger id="recurrence">
                                            <SelectValue placeholder="Selecione" />
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
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit">
                                Criar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        )}
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

    

    




    




    



    

    
