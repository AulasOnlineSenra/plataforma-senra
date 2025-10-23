'use client';

import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Paperclip, Clock } from 'lucide-react';
import { chatContacts, chatMessages, getMockUser, teachers } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ChatPage() {
    const currentUser = getMockUser('student');
    const activeChatPartner = teachers[0];

    const groupedMessages = chatMessages.reduce((acc, message) => {
        const date = format(message.timestamp, 'yyyy-MM-dd');
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(message);
        return acc;
    }, {} as Record<string, typeof chatMessages>);

    const formatDateSeparator = (dateStr: string) => {
      const date = new Date(dateStr);
      if (isToday(date)) return 'Hoje';
      if (isYesterday(date)) return 'Ontem';
      return format(date, 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR });
    }

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-background to-accent/20 p-0 -m-4 sm:-m-6">
            <div className="grid h-[calc(100vh-5rem)] w-full grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-0 md:gap-4 md:p-4">
                <Card className="flex flex-col rounded-none md:rounded-lg border-0 md:border">
                    <div className="p-4 border-b">
                        <h2 className="font-headline text-xl">Conversas</h2>
                        <div className="relative mt-2">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Pesquisar..." className="pl-8" />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2">
                            {chatContacts.map(contact => (
                                <button key={contact.id} className={cn(
                                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all hover:bg-accent/50",
                                    contact.id === activeChatPartner.id ? "bg-accent/70" : ""
                                )}>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={contact.avatarUrl} alt={contact.name} />
                                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-baseline justify-between">
                                            <p className="font-semibold truncate">{contact.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(contact.lastMessageTimestamp, { locale: ptBR, addSuffix: true })}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                                            {contact.unreadCount > 0 && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{contact.unreadCount}</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>

                <Card className="flex flex-col h-full rounded-none md:rounded-lg border-0 md:border">
                    <div className="flex items-center gap-4 p-4 border-b">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={activeChatPartner.avatarUrl} alt={activeChatPartner.name} />
                            <AvatarFallback>{activeChatPartner.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{activeChatPartner.name}</p>
                            <p className="text-sm text-muted-foreground">Online</p>
                        </div>
                    </div>
                    <ScrollArea className="flex-1 p-4">
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
                                        "flex items-end gap-2",
                                        message.senderId === currentUser.id ? "justify-end" : "justify-start"
                                    )}>
                                        {message.senderId !== currentUser.id && (
                                            <Avatar className="h-8 w-8 self-end">
                                                <AvatarImage src={activeChatPartner.avatarUrl} alt={activeChatPartner.name} />
                                                <AvatarFallback>{activeChatPartner.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "max-w-xs lg:max-w-md rounded-lg p-3 text-sm flex flex-col shadow",
                                            message.senderId === currentUser.id ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none"
                                        )}>
                                            <p>{message.content}</p>
                                            <p className={cn(
                                              "text-xs mt-2 self-end",
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
                    <div className="p-4 border-t bg-card/50">
                        <div className="relative">
                            <Input placeholder="Digite uma mensagem..." className="pr-24" />
                             <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                 <Button type="button" size="icon" variant="ghost">
                                     <Paperclip className="h-5 w-5 text-muted-foreground" />
                                     <span className="sr-only">Anexar</span>
                                 </Button>
                                 <Button type="button" size="icon" variant="ghost">
                                     <Clock className="h-5 w-5 text-muted-foreground" />
                                     <span className="sr-only">Agendar</span>
                                 </Button>
                                <Button type="submit" size="icon" variant="ghost" className="h-8 w-8">
                                    <Send className="h-5 w-5 text-muted-foreground" />
                                    <span className="sr-only">Enviar</span>
                                </Button>
                             </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
