"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Send,
  Paperclip,
  X,
  Search,
  ChevronUp,
  ChevronDown,
  FileText,
  Mic,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  getChatMessagesForUser,
  getChatUsers,
  markConversationAsRead,
  sendChatMessage,
} from "@/app/actions/chat";
import { ChatAttachmentPreview } from "@/components/chat-attachment-preview";
import { HighlightText } from "@/components/highlight-text";
import { AudioRecorder } from "@/components/audio-recorder";
import { ScheduledMessagesDialog } from "@/components/scheduled-messages-dialog";

type UserRole = "admin" | "student" | "teacher" | string;

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
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
}

const CURRENT_USER_KEY = "currentUser";
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
  const date = value instanceof Date ? value : new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function formatTime(value: unknown): string {
  const date = toDate(value);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSeparator(value: unknown): string {
  const date = toDate(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDay.getTime() === today.getTime()) return 'Hoje';
  if (msgDay.getTime() === yesterday.getTime()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

const roleTranslations: Record<string, string> = {
  student: "Aluno",
  teacher: "Professor",
  admin: "Administrador",
};

function normalizeUser(raw: any): ChatUser | null {
  if (!raw || typeof raw !== "object" || !raw.id) return null;
  return {
    id: String(raw.id),
    name: String(raw.name || "Usuario"),
    role: String(raw.role || ""),
    avatarUrl: typeof raw.avatarUrl === "string" ? raw.avatarUrl : null,
  };
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialContactId = searchParams.get("contactId");
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isContactTyping, setIsContactTyping] = useState(false);
  const [typingContactIds, setTypingContactIds] = useState<Set<string>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResultIndices, setSearchResultIndices] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUnreadTotalRef = useRef(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const loadUsers = useCallback(async () => {
    if (!currentUser?.role || !currentUser?.id) return;
    const result = await getChatUsers(currentUser.role, currentUser.id);
    if (!result.success || !result.data) return;
    setAllUsers(
      result.data.map(normalizeUser).filter((u): u is ChatUser => !!u),
    );
  }, [currentUser]);

  const loadMessages = useCallback(
    async (userId: string, showNewMessageToast: boolean) => {
      const result = await getChatMessagesForUser(userId);
      if (!result.success || !result.data) return;

      const normalizedMessages: ChatMessage[] = result.data.map(
        (message: any) => ({
          id: String(message.id),
          senderId: String(message.senderId),
          receiverId: String(message.receiverId),
          content: String(message.content || ""),
          createdAt: message.createdAt,
          readAt: message.readAt,
          attachmentUrl: message.attachmentUrl || null,
          attachmentName: message.attachmentName || null,
          attachmentType: message.attachmentType || null,
        }),
      );

      if (showNewMessageToast) {
        const currentUnread = normalizedMessages.filter(
          (m) => m.receiverId === userId && !m.readAt,
        ).length;
        if (currentUnread > lastUnreadTotalRef.current) {
          toast({
            title: "Nova mensagem",
            description: "Voce recebeu uma nova mensagem no chat.",
          });
        }
        lastUnreadTotalRef.current = currentUnread;
      } else {
        lastUnreadTotalRef.current = normalizedMessages.filter(
          (m) => m.receiverId === userId && !m.readAt,
        ).length;
      }

      setAllMessages(normalizedMessages);
    },
    [toast],
  );

  useEffect(() => {
    const rawCurrentUser = safeParseJson<any>(
      localStorage.getItem(CURRENT_USER_KEY),
      null,
    );
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

    let filtered = list;
    if (currentUser.role === "admin") filtered = list;
    else if (currentUser.role === "student") {
      filtered = list.filter((u) => u.role === "teacher" || u.role === "admin");
    } else if (currentUser.role === "teacher") {
      filtered = list.filter((u) => u.role === "student" || u.role === "admin");
    }

    return filtered.sort((a, b) => {
      const lastMsgA = allMessages
        .filter((m) => (m.senderId === a.id && m.receiverId === currentUser.id) || (m.senderId === currentUser.id && m.receiverId === a.id))
        .sort((m1, m2) => toDate(m2.createdAt).getTime() - toDate(m1.createdAt).getTime())[0];
      const lastMsgB = allMessages
        .filter((m) => (m.senderId === b.id && m.receiverId === currentUser.id) || (m.senderId === currentUser.id && m.receiverId === b.id))
        .sort((m1, m2) => toDate(m2.createdAt).getTime() - toDate(m1.createdAt).getTime())[0];
      const timeA = lastMsgA ? toDate(lastMsgA.createdAt).getTime() : 0;
      const timeB = lastMsgB ? toDate(lastMsgB.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [allUsers, currentUser, allMessages]);

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
    [contacts, activeContactId],
  );

  const unreadCountByContact = useMemo(() => {
    if (!currentUser?.id) return {} as Record<string, number>;
    return allMessages.reduce(
      (acc, message) => {
        if (message.receiverId === currentUser.id && !message.readAt) {
          acc[message.senderId] = (acc[message.senderId] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [allMessages, currentUser?.id]);

  const conversation = useMemo(() => {
    if (!currentUser?.id || !activeContact?.id) return [];
    return allMessages
      .filter(
        (m) =>
          (m.senderId === currentUser.id &&
            m.receiverId === activeContact.id) ||
          (m.senderId === activeContact.id && m.receiverId === currentUser.id),
      )
      .sort(
        (a, b) => toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime(),
      );
  }, [allMessages, activeContact?.id, currentUser?.id]);

  const markAsRead = useCallback(async () => {
    if (!currentUser?.id || !activeContact?.id) return;
    const result = await markConversationAsRead(
      currentUser.id,
      activeContact.id,
    );
    if (!result.success) return;
    await loadMessages(currentUser.id, false);
  }, [activeContact?.id, currentUser?.id, loadMessages]);

  useEffect(() => {
    markAsRead();
  }, [markAsRead, conversation.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length, activeContactId]);

  // Typing indicator - check if contact is typing
  useEffect(() => {
    if (!currentUser?.id || !activeContact?.id) return;

    let interval: ReturnType<typeof setInterval>;
    let mounted = true;

    const checkTyping = async () => {
      try {
        const res = await fetch(
          `/api/typing?userId=${currentUser.id}&contactId=${activeContact.id}`,
        );
        const data = await res.json();
        if (mounted && data.success) {
          setIsContactTyping(data.isTyping);
        }
      } catch {
        // silently fail
      }
    };

    interval = setInterval(checkTyping, 1500);
    checkTyping();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.id, activeContact?.id]);

  // Reset typing state when switching contacts
  useEffect(() => {
    setIsContactTyping(false);
  }, [activeContactId]);

  // Typing indicator - all contacts typing to current user (for contacts list)
  useEffect(() => {
    if (!currentUser?.id) return;

    let interval: ReturnType<typeof setInterval>;
    let mounted = true;

    const checkAllTyping = async () => {
      try {
        const res = await fetch(`/api/typing?userId=${currentUser.id}`);
        const data = await res.json();
        if (mounted && data.success && Array.isArray(data.typingContacts)) {
          setTypingContactIds(new Set(data.typingContacts));
        }
      } catch {
        // silently fail
      }
    };

    interval = setInterval(checkAllTyping, 1500);
    checkAllTyping();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  // Search results
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResultIndices([]);
      setCurrentSearchIndex(0);
      return;
    }
    const term = searchTerm.toLowerCase();
    const indices: number[] = [];
    conversation.forEach((msg, index) => {
      if (msg.content.toLowerCase().includes(term)) {
        indices.push(index);
      }
    });
    setSearchResultIndices(indices);
    setCurrentSearchIndex(indices.length > 0 ? indices.length - 1 : 0);
  }, [searchTerm, conversation]);

  // Scroll to search result
  useEffect(() => {
    if (searchResultIndices.length === 0) return;
    const targetIndex = searchResultIndices[currentSearchIndex];
    const el = messageRefs.current.get(targetIndex);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentSearchIndex, searchResultIndices]);

  const navigateSearch = useCallback(
    (direction: "up" | "down") => {
      if (searchResultIndices.length === 0) return;
      setCurrentSearchIndex((prev) => {
        if (direction === "up") {
          return prev > 0 ? prev - 1 : searchResultIndices.length - 1;
        }
        return prev < searchResultIndices.length - 1 ? prev + 1 : 0;
      });
    },
    [searchResultIndices.length],
  );

  const sendTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!currentUser?.id || !activeContact?.id) return;
      try {
        await fetch("/api/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            contactId: activeContact.id,
            isTyping,
          }),
        });
      } catch {
        // silently fail
      }
    },
    [currentUser?.id, activeContact?.id],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(true);
      typingTimeoutRef.current = setTimeout(() => sendTypingStatus(false), 2000);
    },
    [sendTypingStatus],
  );

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setPendingFile(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  const handleAudioSend = useCallback(
    async (blob: Blob, duration: number) => {
      if (!currentUser?.id || !activeContact?.id || isSending) return;
      setIsSending(true);

      try {
        const file = new File(
          [blob],
          `audio-${Date.now()}.webm`,
          { type: blob.type || "audio/webm" },
        );

        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();

        if (!uploadData.success) {
          toast({
            variant: "destructive",
            title: "Erro no upload",
            description: uploadData.error || "Falha ao enviar áudio.",
          });
          setIsSending(false);
          setIsRecording(false);
          return;
        }

        const result = await sendChatMessage({
          senderId: currentUser.id,
          receiverId: activeContact.id,
          content: "",
          attachmentUrl: uploadData.data.url,
          attachmentName: uploadData.data.name,
          attachmentType: uploadData.data.type,
        });

        if (!result.success) {
          toast({
            variant: "destructive",
            title: "Erro ao enviar",
            description: result.error || "Não foi possível enviar o áudio.",
          });
        }

        await loadMessages(currentUser.id, false);
      } catch {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao processar o áudio.",
        });
      }

      setIsSending(false);
      setIsRecording(false);
    },
    [currentUser?.id, activeContact?.id, isSending, toast, loadMessages],
  );

  const handleAudioCancel = useCallback(() => {
    setIsRecording(false);
  }, []);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = inputValue.trim();
    if ((!content && !pendingFile) || !currentUser?.id || !activeContact?.id || isSending) return;

    setIsSending(true);
    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    let attachmentType: string | null = null;

    if (pendingFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", pendingFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          toast({
            variant: "destructive",
            title: "Erro no upload",
            description: uploadData.error || "Falha ao enviar arquivo.",
          });
          setIsSending(false);
          setIsUploading(false);
          return;
        }
        attachmentUrl = uploadData.data.url;
        attachmentName = uploadData.data.name;
        attachmentType = uploadData.data.type;
      } catch {
        toast({
          variant: "destructive",
          title: "Erro no upload",
          description: "Falha ao enviar arquivo.",
        });
        setIsSending(false);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const result = await sendChatMessage({
      senderId: currentUser.id,
      receiverId: activeContact.id,
      content: content || (pendingFile ? pendingFile.name : ""),
      attachmentUrl,
      attachmentName,
      attachmentType,
    });

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: result.error || "Não foi possivel enviar a mensagem.",
      });
      setIsSending(false);
      return;
    }

    setInputValue("");
    setPendingFile(null);
    sendTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    await loadMessages(currentUser.id, false);
    setIsSending(false);
  };

  return (
    <div className="grid h-[90vh] w-full grid-cols-1 gap-4 overflow-hidden md:grid-cols-[300px_1fr]">
      <section
        className={`${activeContact ? "hidden md:flex" : "flex"} h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-md`}
      >
        <div className="border-b border-border/70 bg-muted/20 px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Conversas</h1>
        </div>
        <ScrollArea className="h-[90vh] flex-1">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">
              Carregando contatos...
            </p>
          ) : contacts.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Nenhum contato disponivel.
            </p>
          ) : (
            contacts.map((contact) => {
              const isActive = contact.id === activeContactId;
              const name = contact.name || "Usuario";
              return (
                <Button
                  key={contact.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveContactId(contact.id)}
                  className={`mx-2 my-1 h-auto w-[calc(100%-1rem)] justify-start gap-3 rounded-xl border-l-4 px-3 py-3 text-left ${
                    isActive
                      ? "border-primary bg-muted/50 text-foreground hover:bg-muted/60"
                      : "border-transparent hover:bg-muted/40"
                  }`}
                >
                  <Avatar className="h-10 w-10 border border-border/60">
                    <AvatarImage
                      src={contact.avatarUrl || undefined}
                      alt={name}
                    />
                    <AvatarFallback className="bg-muted text-foreground">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground/90">
                      {typingContactIds.has(contact.id) ? (
                        <span className="text-primary font-medium">
                          digitando
                          <span className="inline-flex ml-0.5">
                            <span className="animate-typing-dot" style={{ animationDelay: '0ms' }}>.</span>
                            <span className="animate-typing-dot" style={{ animationDelay: '0.2s' }}>.</span>
                            <span className="animate-typing-dot" style={{ animationDelay: '0.4s' }}>.</span>
                          </span>
                        </span>
                      ) : (
                        roleTranslations[contact.role] || contact.role || "contato"
                      )}
                    </p>
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
        className={`${!activeContact ? "hidden md:flex" : "flex"} h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-md`}
      >
        {!currentUser ? (
          <div className="flex h-[90vh] items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Usuario atual não encontrado. Faca login novamente.
          </div>
        ) : !activeContact ? (
          <div className="flex h-[90vh] items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Selecione um contato para iniciar a conversa.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border/70 bg-muted/20 px-4 py-3">
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
                <AvatarImage
                  src={activeContact.avatarUrl || undefined}
                  alt={activeContact.name || "Usuario"}
                />
                <AvatarFallback className="bg-muted text-foreground">
                  {(activeContact.name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {activeContact.name || "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isContactTyping ? (
                    <span className="text-primary font-medium">
                      digitando
                      <span className="inline-flex ml-0.5">
                        <span className="animate-typing-dot" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="animate-typing-dot" style={{ animationDelay: '0.2s' }}>.</span>
                        <span className="animate-typing-dot" style={{ animationDelay: '0.4s' }}>.</span>
                      </span>
                    </span>
                  ) : (
                    roleTranslations[activeContact.role] || activeContact.role || "contato"
                  )}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  setIsSearchOpen((prev) => {
                    if (!prev) {
                      setTimeout(() => searchInputRef.current?.focus(), 100);
                    } else {
                      setSearchTerm("");
                    }
                    return !prev;
                  });
                }}
                aria-label="Buscar"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {isSearchOpen && (
              <div className="flex items-center gap-2 border-b border-border/70 bg-muted/10 px-4 py-2">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar mensagens..."
                  className="h-8 flex-1 border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      navigateSearch("up");
                    }
                  }}
                />
                {searchTerm && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {searchResultIndices.length > 0
                      ? `${currentSearchIndex + 1}/${searchResultIndices.length}`
                      : "0/0"}
                  </span>
                )}
                {searchResultIndices.length > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => navigateSearch("up")}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => navigateSearch("down")}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <ScrollArea className="max-h-[90vh] flex-1 bg-background">
              <div className="space-y-2 p-4">
                {conversation.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma mensagem ainda.
                  </p>
                ) : (
                  conversation.map((message, msgIndex) => {
                    const prevDate = msgIndex > 0 ? toDate(conversation[msgIndex - 1].createdAt).toDateString() : null;
                    const currDate = toDate(message.createdAt).toDateString();
                    const showDateSeparator = prevDate !== currDate;
                    const isMine = message.senderId === currentUser.id;
                    const isHighlighted =
                      searchTerm.trim() &&
                      searchResultIndices.includes(msgIndex);
                    const isAudioOnly = message.attachmentType?.startsWith("audio/") && !message.content;
                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-muted/70 text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                              {formatDateSeparator(message.createdAt)}
                            </div>
                          </div>
                        )}
                      <div
                        ref={(el) => {
                          if (el) messageRefs.current.set(msgIndex, el);
                          else messageRefs.current.delete(msgIndex);
                        }}
                        className={`mb-2 flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] px-3 ${isAudioOnly ? "py-0" : "py-2"} text-sm shadow-md ${
                            isMine
                              ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground"
                              : "rounded-2xl rounded-bl-sm bg-[#0f172a] text-white"
                          } ${isHighlighted ? "ring-2 ring-yellow-400 ring-offset-1" : ""}`}
                        >
                          {message.attachmentUrl && (
                            <div className={`${message.content ? "mb-2" : ""} ${isAudioOnly ? "pt-2.5" : ""}`}>
                              <ChatAttachmentPreview
                                url={message.attachmentUrl}
                                name={message.attachmentName || "Arquivo"}
                                type={message.attachmentType || ""}
                                isMine={isMine}
                              />
                            </div>
                          )}
                          {message.content && (
                            <p className="whitespace-pre-wrap break-words">
                              {searchTerm ? (
                                <HighlightText
                                  text={message.content}
                                  searchTerm={searchTerm}
                                />
                              ) : (
                                message.content
                              )}
                            </p>
                          )}
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
                              isMine
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
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
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form
              onSubmit={handleSend}
              className="border-t border-border/70 bg-card"
            >
              {pendingFile && (
                <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-3 py-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {pendingFile.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(pendingFile.size / 1024).toFixed(0)}KB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setPendingFile(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {isRecording ? (
                <div className="flex items-center gap-2 p-3">
                  <AudioRecorder onSend={handleAudioSend} onCancel={handleAudioCancel} />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,.doc,.docx,.xlsx,text/plain,audio/mpeg,audio/ogg,audio/webm,audio/mp4"
                    onChange={handleFileChange}
                  />
                  <Input
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="h-11 flex-1 rounded-[13px] border-[#f5b000] bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-[13px]"
                    onClick={handleFileSelect}
                    disabled={isSending || isUploading}
                    aria-label="Anexar arquivo"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-[13px]"
                    onClick={() => setIsScheduleOpen(true)}
                    disabled={isSending || isUploading || !activeContact}
                    aria-label="Mensagens agendadas"
                  >
                    <Clock className="h-5 w-5" />
                  </Button>
                  {inputValue.trim() || pendingFile ? (
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isSending || isUploading}
                      className="h-11 w-11 rounded-[13px] bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Send className="h-5 w-5" strokeWidth={2.4} />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      disabled={isSending || isUploading}
                      onClick={() => setIsRecording(true)}
                      className="h-11 w-11 rounded-[13px] bg-primary text-primary-foreground hover:bg-primary/90"
                      aria-label="Gravar áudio"
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              )}
            </form>
          </>
        )}
      </section>

      {currentUser && activeContact && (
        <ScheduledMessagesDialog
          open={isScheduleOpen}
          onOpenChange={setIsScheduleOpen}
          senderId={currentUser.id}
          receiverId={activeContact.id}
          receiverName={activeContact.name || "Usuario"}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse">
          Carregando mensagens...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
