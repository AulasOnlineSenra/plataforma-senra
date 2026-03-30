// TODO: Para produção multi-instância, migrar armazenamento de typing status para Redis.
// O armazenamento em memória funciona apenas para instância única.
import { NextRequest, NextResponse } from "next/server";

type TypingEntry = {
  userId: string;
  contactId: string;
  timestamp: number;
};

const typingMap = new Map<string, TypingEntry>();
const EXPIRY_MS = 4000;

function getEntryKey(userId: string, contactId: string) {
  return `${userId}:${contactId}`;
}

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of typingMap) {
    if (now - entry.timestamp > EXPIRY_MS) {
      typingMap.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contactId, isTyping } = body;

    if (!userId || !contactId) {
      return NextResponse.json(
        { success: false, error: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    const key = getEntryKey(userId, contactId);

    if (isTyping) {
      typingMap.set(key, { userId, contactId, timestamp: Date.now() });
    } else {
      typingMap.delete(key);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar typing status:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao processar." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const contactId = searchParams.get("contactId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    cleanupExpired();

    // Mode: single contact check
    if (contactId) {
      const key = getEntryKey(contactId, userId);
      const entry = typingMap.get(key);
      const isTyping = !!entry && Date.now() - entry.timestamp < EXPIRY_MS;
      return NextResponse.json({ success: true, isTyping });
    }

    // Mode: all contacts typing to this user
    const typingContacts: string[] = [];
    for (const [, entry] of typingMap) {
      if (entry.contactId === userId) {
        typingContacts.push(entry.userId);
      }
    }

    return NextResponse.json({ success: true, typingContacts });
  } catch (error) {
    console.error("Erro ao verificar typing status:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao verificar." },
      { status: 500 },
    );
  }
}
