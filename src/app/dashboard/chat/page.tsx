'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, CheckCheck, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getChatMessagesForUser, getChatUsers, markConversationAsRead, sendChatMessage } from '@/app/actions/chat';

type UserRole = 'admin' | 'student' | 'teacher' | string;

interface ChatUser {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string | Date;
  readAt: string | Date | null;
}

const CURRENT_USER_KEY = 'currentUser';
const POLLING_MS = 4000;

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function toDate(value: unknown): Date {
  const date = value instanceof Date ? value : new Date(String(value ?? ''));
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function formatTime(value: unknown): string {
  const date = toDate(value);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function normalizeUser(raw: any): ChatUser | null {
  if (!raw || typeof raw !== 'object' || !raw.id) return null;
  return {
    id: String(raw.id),
    name: String(raw.name || 'Usuario'),
    role: String(raw.role || ''),
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : null,
  };
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialContactId = searchParams.get('contactId');
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUnreadTotalRef = useRef(0);

  const loadUsers = useCallback(async () => {
    const result = await getChatUsers();
    if (!result.success || !result.data) return;
    setAllUsers(result.data.map(normalizeUser).filter((u): u is ChatUser => !!u));
  }, []);

  const loadMessages = useCallback(
    async (userId: string, showNewMessageToast: boolean) => {
      const result = await getChatMessagesForUser(userId);
      if (!result.success || !result.data) return;

      const normalizedMessages: ChatMessage[] = result.data.map((message: any) => ({
        id: String(message.id),
        senderId: String(message.senderId),
        receiverId: String(message.receiverId),
        content: String(message.content || ''),
        createdAt: message.createdAt,
        readAt: message.readAt,
      }));

      if (showNewMessageToast) {
        const currentUnread = normalizedMessages.filter(
          (m) => m.receiverId === userId && !m.readAt
        ).length;
        if (currentUnread > lastUnreadTotalRef.current) {
          toast({
            title: 'Nova mensagem',
            description: 'Voce recebeu uma nova mensagem no chat.',
          });
        }
        lastUnreadTotalRef.current = currentUnread;
      } else {
        lastUnreadTotalRef.current = normalizedMessages.filter(
          (m) => m.receiverId === userId && !m.readAt
        ).length;
      }

      setAllMessages(normalizedMessages);
    },
    [toast]
  );

  useEffect(() => {
    const rawCurrentUser = safeParseJson<any>(localStorage.getItem(CURRENT_USER_KEY), null);
    const normalizedCurrent = normalizeUser(rawCurrentUser);
    setCurrentUser(normalizedCurrent);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    let mounted = true;

    const bootstrap = async () => {
      setIsLoading(true);
      await Promise.all([loadUsers(), loadMessages(currentUser.id, false)]);
      if (mounted) setIsLoading(false);
    };

    bootstrap();

    interval = setInterval(() => {
      loadUsers();
      loadMessages(currentUser.id, true);
    }, POLLING_MS);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [currentUser?.id, loadMessages, loadUsers]);

  const contacts = useMemo(() => {
    if (!currentUser) return [];
    const list = allUsers.filter((u) => u.id !== currentUser.id);

    if (currentUser.role === 'admin') return list;
    if (currentUser.role === 'student') {
      return list.filter((u) => u.role === 'teacher' || u.role === 'admin');
    }
    if (currentUser.role === 'teacher') {
      return list.filter((u) => u.role === 'student' || u.role === 'admin');
    }
    return [];
  }, [allUsers, currentUser]);

  useEffect(() => {
    if (!contacts.length) return;
    if (initialContactId && contacts.some((c) => c.id === initialContactId)) {
      setActiveContactId(initialContactId);
      return;
    }
    if (!activeContactId) {
      setActiveContactId(contacts[0].id);
    }
  }, [activeContactId, contacts, initialContactId]);

  const activeContact = useMemo(
    () => contacts.find((c) => c.id === activeContactId) || null,
    [contacts, activeContactId]
  );

  const unreadCountByContact = useMemo(() => {
    if (!currentUser?.id) return {} as Record<string, number>;
    return allMessages.reduce((acc, message) => {
      if (message.receiverId === currentUser.id && !message.readAt) {
        acc[message.senderId] = (acc[message.senderId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [allMessages, currentUser?.id]);

  const conversation = useMemo(() => {
    if (!currentUser?.id || !activeContact?.id) return [];
    return allMessages
      .filter(
        (m) =>
          (m.senderId === currentUser.id && m.receiverId === activeContact.id) ||
          (m.senderId === activeContact.id && m.receiverId === currentUser.id)
      )
      .sort((a, b) => toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime());
  }, [allMessages, activeContact?.id, currentUser?.id]);

  const markAsRead = useCallback(async () => {
    if (!currentUser?.id || !activeContact?.id) return;
    const result = await markConversationAsRead(currentUser.id, activeContact.id);
    if (!result.success) return;
    await loadMessages(currentUser.id, false);
  }, [activeContact?.id, currentUser?.id, loadMessages]);

  useEffect(() => {
    markAsRead();
  }, [markAsRead, conversation.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, activeContactId]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = inputValue.trim();
    if (!content || !currentUser?.id || !activeContact?.id || isSending) return;

    setIsSending(true);
    const result = await sendChatMessage({
      senderId: currentUser.id,
      receiverId: activeContact.id,
      content,
    });

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: result.error || 'Nao foi possivel enviar a mensagem.',
      });
      setIsSending(false);
      return;
    }

    setInputValue('');
    await loadMessages(currentUser.id, false);
    setIsSending(false);
  };

  return (
    <div className="grid h-[calc(100vh-10rem)] w-full grid-cols-1 gap-4 overflow-hidden md:grid-cols-[340px_1fr]">
      <section
        className={`${activeContact ? 'hidden md:flex' : 'flex'} h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm`}
      >
        <div className="border-b border-border/70 bg-muted/20 px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Conversas</h1>
        </div>
        <ScrollArea className="h-[calc(100vh-10rem)] flex-1">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando contatos...</p>
          ) : contacts.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum contato disponivel.</p>
          ) : (
            contacts.map((contact) => {
              const isActive = contact.id === activeContactId;
              const name = contact.name || 'Usuario';
              return (
                <Button
                  key={contact.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveContactId(contact.id)}
                  className={`mx-2 my-1 h-auto w-[calc(100%-1rem)] justify-start gap-3 rounded-xl border-l-4 px-3 py-3 text-left ${
                    isActive
                      ? 'border-primary bg-muted/50 text-foreground hover:bg-muted/60'
                      : 'border-transparent hover:bg-muted/40'
                  }`}
                >
                  <Avatar className="h-10 w-10 border border-border/60">
                    <AvatarImage src={contact.avatarUrl || undefined} alt={name} />
                    <AvatarFallback className="bg-muted text-foreground">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground/90">{contact.role || 'contato'}</p>
                  </div>
                  {(unreadCountByContact[contact.id] || 0) > 0 && (
                    <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-white">
                      {unreadCountByContact[contact.id]}
                    </span>
                  )}
                </Button>
              );
            })
          )}
        </ScrollArea>
      </section>

      <section
        className={`${!activeContact ? 'hidden md:flex' : 'flex'} h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm`}
      >
        {!currentUser ? (
          <div className="flex h-[calc(100vh-10rem)] items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Usuario atual nao encontrado. Faca login novamente.
          </div>
        ) : !activeContact ? (
          <div className="flex h-[calc(100vh-10rem)] items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Selecione um contato para iniciar a conversa.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border/70 bg-muted/20 px-4 py-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setActiveContactId(null)}
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10 border border-border/60">
                <AvatarImage src={activeContact.avatarUrl || undefined} alt={activeContact.name || 'Usuario'} />
                <AvatarFallback className="bg-muted text-foreground">
                  {(activeContact.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{activeContact.name || 'Usuario'}</p>
                <p className="text-xs text-muted-foreground">{activeContact.role || 'contato'}</p>
              </div>
            </div>

            <ScrollArea className="max-h-[calc(100vh-16rem)] flex-1 bg-background">
              <div className="space-y-2 p-4">
                {conversation.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
                ) : (
                  conversation.map((message) => {
                    const isMine = message.senderId === currentUser.id;
                    return (
                      <div
                        key={message.id}
                        className={`mb-2 flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[82%] px-3 py-2.5 text-sm shadow-sm ${
                            isMine
                              ? 'rounded-2xl rounded-br-sm bg-primary text-primary-foreground'
                              : 'rounded-2xl rounded-bl-sm bg-muted text-foreground'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content || ''}</p>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
                              isMine ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }`}
                          >
                            <span>{formatTime(message.createdAt)}</span>
                            {isMine &&
                              (message.readAt ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground" />
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form onSubmit={handleSend} className="border-t border-border/70 bg-card p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="h-11 flex-1 rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isSending}
                  className="h-11 w-11 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="h-5 w-5" strokeWidth={2.4} />
                </Button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse">Carregando mensagens...</div>}>
      <ChatContent />
    </Suspense>
  );
}
