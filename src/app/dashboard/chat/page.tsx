import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send } from 'lucide-react';
import { chatContacts, chatMessages, getMockUser, teachers } from '@/lib/data';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ChatPage() {
    const currentUser = getMockUser('student');
    const activeChatPartner = teachers[0];

    return (
        <div className="grid h-[calc(100vh-8rem)] w-full grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-4">
            <Card className="flex flex-col">
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
                                 "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all hover:bg-accent",
                                 contact.id === activeChatPartner.id ? "bg-accent" : ""
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

            <Card className="flex flex-col h-full">
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
                    <div className="flex flex-col gap-4">
                        {chatMessages.map(message => (
                            <div key={message.id} className={cn(
                                "flex items-end gap-2",
                                message.senderId === currentUser.id ? "justify-end" : "justify-start"
                            )}>
                                {message.senderId !== currentUser.id && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={activeChatPartner.avatarUrl} alt={activeChatPartner.name} />
                                        <AvatarFallback>{activeChatPartner.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-xs lg:max-w-md rounded-lg p-3 text-sm",
                                    message.senderId === currentUser.id ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                    <p>{message.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t">
                    <div className="relative">
                        <Input placeholder="Digite uma mensagem..." className="pr-12" />
                        <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Enviar</span>
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
