
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { Search, Send, Paperclip, Clock, X, MessageSquare } from 'lucide-react';
import { chatContacts as initialChatContacts, chatMessages as initialChatMessages, getMockUser, teachers as initialTeachers, users as initialUsers } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, UserRole, ChatMessage, ChatContact, Teacher } from '@/lib/types';
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
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';


const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  student: 'Aluno',
  teacher: 'Professor',
};

export default function ChatPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeChatPartner, setActiveChatPartner] = useState<User | Teacher | null>(null);
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
    const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | undefined>(new Date());
    const [selectedScheduleTime, setSelectedScheduleTime] = useState<string>('12:00');
    const [messageContent, setMessageContent] = useState('');
    const [allMessages, setAllMessages] = useState<ChatMessage[]>(initialChatMessages);
    const [chatContacts, setChatContacts] = useState<ChatContact[]>(initialChatContacts);
    const [allUsers, setAllUsers] = useState<(User | Teacher)[]>([]);


    const updateData = useCallback(() => {
        const loggedInUserStr = localStorage.getItem('currentUser');
        if(loggedInUserStr) {
            setCurrentUser(JSON.parse(loggedInUserStr));
        } else {
            setCurrentUser(getMockUser('student'));
        }

        const storedUsers = localStorage.getItem('userList') || JSON.stringify(initialUsers);
        const storedTeachers = localStorage.getItem('teacherList') || JSON.stringify(initialTeachers);
        setAllUsers([...JSON.parse(storedUsers), ...JSON.parse(storedTeachers)]);

        const storedMessages = localStorage.getItem('chatMessages');
        if (storedMessages) {
            setAllMessages(JSON.parse(storedMessages).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        } else {
            setAllMessages(initialChatMessages);
        }
        
        const storedContacts = localStorage.getItem('chatContacts');
        if (storedContacts) {
            const parsedContacts = JSON.parse(storedContacts).map((c: any) => ({ ...c, lastMessageTimestamp: new Date(c.lastMessageTimestamp) }));
            setChatContacts(parsedContacts.sort((a: ChatContact, b: ChatContact) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime()));
        } else {
            setChatContacts(initialChatContacts.sort((a: ChatContact, b: ChatContact) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime()));
        }
    }, []);

    useEffect(() => {
        updateData();
        window.addEventListener('storage', updateData);
        return () => window.removeEventListener('storage', updateData);
    }, [updateData]);


    useEffect(() => {
        if (scrollAreaRef.current) {
          const scrollableNode = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
          if (scrollableNode) {
            scrollableNode.scrollTop = scrollableNode.scrollHeight;
          }
        }
    }, [activeChatPartner, allMessages]);


    const getContactDetails = (contactId: string) => {
        return allUsers.find(u => u.id === contactId);
    }
    
    const handleContactSelect = (contactId: string) => {
        const contact = getContactDetails(contactId);
        if (contact) {
            setActiveChatPartner(contact);
             // Mark messages as read
            const updatedContacts = chatContacts.map(c => 
                c.id === contactId ? { ...c, unreadCount: 0 } : c
            );
            setChatContacts(updatedContacts);
            localStorage.setItem('chatContacts', JSON.stringify(updatedContacts));
        }
    }

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
      const date = new Date(dateStr);
      if (isToday(date)) return 'Hoje';
      if (isYesterday(date)) return 'Ontem';
      return format(date, 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR });
    }
    
    const handleScheduleMessage = () => {
        if (!selectedScheduleDate || !selectedScheduleTime) return;

        const [hours, minutes] = selectedScheduleTime.split(':').map(Number);
        const newScheduledDate = new Date(selectedScheduleDate);
        newScheduledDate.setHours(hours, minutes, 0, 0);

        setScheduledDateTime(newScheduledDate);
        setIsScheduling(false);
        toast({
            title: 'Mensagem Agendada',
            description: `Sua mensagem será enviada em ${format(newScheduledDate, "dd/MM/yyyy 'às' HH:mm")}.`,
        });
    }

    const availableTimes = Array.from({ length: 24 * 2 }, (_, i) => {
        const hours = Math.floor(i / 2);
        const minutes = (i % 2) * 30;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    });

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!messageContent.trim() || !activeChatPartner || !currentUser) return;
    
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: currentUser.id,
          receiverId: activeChatPartner.id,
          content: messageContent,
          timestamp: new Date(),
        };
    
        const updatedMessages = [...allMessages, newMessage];
        setAllMessages(updatedMessages);
        localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
        
        // This is complex because we need to update the contact list for BOTH users.
        // In a real app, this would happen on the backend. Here we simulate it.
        const allCurrentContactsStr = localStorage.getItem('chatContacts');
        const allCurrentContacts: ChatContact[] = allCurrentContactsStr 
            ? JSON.parse(allCurrentContactsStr).map((c: any) => ({ ...c, lastMessageTimestamp: new Date(c.lastMessageTimestamp) }))
            : initialChatContacts;

        const updateUserContacts = (
            userIdToUpdate: string,
            partnerId: string,
            message: ChatMessage
        ): ChatContact[] => {
            let contacts = allCurrentContacts.filter(c => c.id !== partnerId); // Remove existing partner contact to re-insert at top
            const partnerDetails = getContactDetails(partnerId);
            if (!partnerDetails) return contacts;

            const isReceiver = message.receiverId === userIdToUpdate;
            const existingContact = allCurrentContacts.find(c => c.id === partnerId);
            
            const newContactEntry: ChatContact = {
                id: partnerDetails.id,
                name: partnerDetails.name,
                avatarUrl: partnerDetails.avatarUrl,
                lastMessage: message.content,
                lastMessageTimestamp: message.timestamp,
                unreadCount: isReceiver ? (existingContact?.unreadCount || 0) + 1 : (existingContact?.unreadCount || 0),
            };

            return [newContactEntry, ...contacts];
        };

        // Update my contact list
        const myUpdatedContacts = updateUserContacts(currentUser.id, activeChatPartner.id, newMessage);

        // Update partner's contact list
        const partnerUpdatedContacts = updateUserContacts(activeChatPartner.id, currentUser.id, newMessage);

        // This is still a simulation. In a real app, you wouldn't merge lists like this.
        // For this prototype, we'll merge them, assuming the user's view is primary.
        const finalContacts = Array.from(new Map([...myUpdatedContacts, ...partnerUpdatedContacts].map(item => [item.id, item])).values());
        
        setChatContacts(finalContacts.sort((a,b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime()));
        localStorage.setItem('chatContacts', JSON.stringify(finalContacts));

        window.dispatchEvent(new Event('storage'));
        setMessageContent('');
      };
    
      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
        }
      };


    if (!currentUser) {
        return null; // Or a loading spinner
    }


    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="grid h-full w-full grid-cols-1 md:grid-cols-[380px_1fr] gap-4">
            <Card className="flex flex-col rounded-lg border h-full">
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
                <Card className="flex flex-col h-full rounded-lg border bg-card" style={{
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
                                            <p className="break-words whitespace-pre-wrap">{message.content}</p>
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
                        {scheduledDateTime && (
                            <div className="flex items-center justify-between bg-accent/50 text-accent-foreground p-2 rounded-md mb-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Mensagem agendada para: {format(scheduledDateTime, "dd/MM 'às' HH:mm")}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setScheduledDateTime(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="relative">
                            <Input 
                                placeholder="Digite uma mensagem..." 
                                className="pr-24"
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                <Button type="button" size="icon" variant="ghost">
                                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                                    <span className="sr-only">Anexar</span>
                                </Button>
                                <Button type="button" size="icon" variant="ghost" onClick={() => setIsScheduling(true)}>
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>Agendar Mensagem</DialogTitle>
                <DialogDescription>
                    Selecione a data e o horário para enviar esta mensagem.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={selectedScheduleDate}
                            onSelect={setSelectedScheduleDate}
                            className="rounded-md border"
                            locale={ptBR}
                            disabled={{ before: new Date() }}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="time">Horário</Label>
                        <Select value={selectedScheduleTime} onValueChange={setSelectedScheduleTime}>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione um horário" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                            {availableTimes.map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="button" onClick={handleScheduleMessage}>Agendar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
    )

}

    
    
    