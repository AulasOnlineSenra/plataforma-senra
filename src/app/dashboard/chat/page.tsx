'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCheck, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

type UserRole = 'admin' | 'student' | 'teacher' | string;

interface ChatUser {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string | number | Date;
  read?: boolean;
}

const USER_LIST_KEY = 'userList';
const TEACHER_LIST_KEY = 'teacherList';
const CHAT_MESSAGES_KEY = 'chatMessages';
const CURRENT_USER_KEY = 'currentUser';

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toDate(value: unknown): Date {
  const date = value instanceof Date ? value : new Date(String(value ?? ''));
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function normalizeUser(raw: any): ChatUser | null {
  if (!raw || typeof raw !== 'object' || !raw.id) return null;
  return {
    id: String(raw.id),
    name: String(raw.name || 'Usuario'),
    role: String(raw.role || ''),
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : undefined,
  };
}

function normalizeMessage(raw: any): ChatMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.senderId || !raw.receiverId) return null;
  return {
    id: String(raw.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    senderId: String(raw.senderId),
    receiverId: String(raw.receiverId),
    content: String(raw.content || ''),
    timestamp: raw.timestamp ?? new Date().toISOString(),
    read: typeof raw.read === 'boolean' ? raw.read : false,
  };
}

function formatTime(value: unknown): string {
  const date = toDate(value);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    const rawUsers = safeParseJson<unknown>(localStorage.getItem(USER_LIST_KEY), []);
    const rawTeachers = safeParseJson<unknown>(localStorage.getItem(TEACHER_LIST_KEY), []);
    const users = [...asArray<any>(rawUsers), ...asArray<any>(rawTeachers)]
      .map(normalizeUser)
      .filter((u): u is ChatUser => !!u);

    const rawMessages = safeParseJson<unknown>(localStorage.getItem(CHAT_MESSAGES_KEY), []);
    const messages = asArray<any>(rawMessages)
      .map(normalizeMessage)
      .filter((m): m is ChatMessage => !!m);

    const rawCurrentUser = safeParseJson<any>(localStorage.getItem(CURRENT_USER_KEY), null);
    const normalizedCurrent = normalizeUser(rawCurrentUser);

    const fallbackUserId = localStorage.getItem('userId');
    const fallbackRole = localStorage.getItem('userRole');
    const fallbackCurrent =
      users.find((u) => u.id === fallbackUserId) ||
      (fallbackUserId
        ? {
            id: fallbackUserId,
            name: 'Usuario',
            role: String(fallbackRole || ''),
          }
        : null);

    setAllUsers(users || []);
    setAllMessages(messages || []);
    setCurrentUser(normalizedCurrent || fallbackCurrent || null);
  };

  useEffect(() => {
    loadData();
    const onStorage = () => loadData();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const contacts = useMemo(() => {
    if (!currentUser) return [];
    const list = (allUsers || []).filter((u) => u.id !== currentUser.id);

    if (currentUser.role === 'admin') return list;
    if (currentUser.role === 'student') {
      return list.filter((u) => u.role === 'teacher' || u.role === 'admin');
    }
    if (currentUser.role === 'teacher') {
      return list.filter((u) => u.role === 'student' || u.role === 'admin');
    }
    return [];
  }, [allUsers, currentUser]);

  const activeContact = useMemo(
    () => (contacts || []).find((c) => c.id === activeContactId) || null,
    [contacts, activeContactId]
  );

  const unreadCountByContact = useMemo(() => {
    if (!currentUser?.id) return {} as Record<string, number>;
    return (allMessages || []).reduce((acc, message) => {
      if (
        message?.receiverId === currentUser.id &&
        message?.senderId &&
        !message?.read
      ) {
        acc[message.senderId] = (acc[message.senderId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [allMessages, currentUser?.id]);

  useEffect(() => {
    if (activeContactId && !activeContact) {
      setActiveContactId(null);
    }
  }, [activeContactId, activeContact]);

  useEffect(() => {
    if (!currentUser?.id || !activeContactId) return;

    const hasUnreadFromActive = (allMessages || []).some(
      (message) =>
        message?.receiverId === currentUser.id &&
        message?.senderId === activeContactId &&
        !message?.read
    );

    if (!hasUnreadFromActive) return;

    const updatedMessages = (allMessages || []).map((message) => {
      if (
        message?.receiverId === currentUser.id &&
        message?.senderId === activeContactId &&
        !message?.read
      ) {
        return { ...message, read: true };
      }
      return message;
    });

    setAllMessages(updatedMessages);
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(updatedMessages));
    window.dispatchEvent(new Event('storage'));
  }, [activeContactId, allMessages, currentUser?.id]);

  const conversation = useMemo(() => {
    if (!currentUser || !activeContact) return [];
    return (allMessages || [])
      .filter(
        (m) =>
          (m.senderId === currentUser.id && m.receiverId === activeContact.id) ||
          (m.senderId === activeContact.id && m.receiverId === currentUser.id)
      )
      .sort((a, b) => toDate(a.timestamp).getTime() - toDate(b.timestamp).getTime());
  }, [allMessages, activeContact, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, activeContactId]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const content = (inputValue || '').trim();
    if (!content || !currentUser || !activeContact) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderId: currentUser.id,
      receiverId: activeContact.id,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const updated = [...(allMessages || []), newMessage];
    setAllMessages(updated);
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(updated));
    setInputValue('');
  };

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[340px_1fr]">
      <section
        className={`${activeContact ? 'hidden md:flex' : 'flex'} flex-col overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm`}
      >
        <div className="border-b border-border/70 bg-muted/20 px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Conversas</h1>
        </div>
        <ScrollArea className="h-[calc(100vh-10rem)] flex-1">
          {(contacts || []).length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum contato disponivel.</p>
          ) : (
            (contacts || []).map((contact) => {
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
                    <AvatarImage src={contact.avatarUrl} alt={name} />
                    <AvatarFallback className="bg-muted text-foreground">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground/90">{contact.role || 'contato'}</p>
                  </div>
                  {(unreadCountByContact?.[contact.id] || 0) > 0 && (
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
        className={`${!activeContact ? 'hidden md:flex' : 'flex'} flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm`}
      >
        {!currentUser ? (
          <div className="flex h-[calc(100vh-10rem)] items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Usuario atual nao encontrado. Verifique os dados salvos no localStorage.
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
                <AvatarImage src={activeContact.avatarUrl} alt={activeContact.name || 'Usuario'} />
                <AvatarFallback className="bg-muted text-foreground">
                  {(activeContact.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{activeContact.name || 'Usuario'}</p>
                <p className="text-xs text-muted-foreground">{activeContact.role || 'contato'}</p>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-16rem)] flex-1 bg-background">
              <div className="space-y-2 p-4">
                {(conversation || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
                ) : (
                  (conversation || []).map((message) => {
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
                            <span>{formatTime(message.timestamp)}</span>
                            {isMine && (
                              message.read ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground" />
                              )
                            )}
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
