"use server";

import prisma from "@/lib/prisma";

type SendMessageInput = {
  senderId: string;
  receiverId: string;
  content: string;
};

export async function getChatUsers(
  currentUserRole: string,
  currentUserId: string,
) {
  try {
    const where =
      currentUserRole === "student"
        ? { role: "teacher" as const, status: "active" }
        : { status: "active" };

    const users = await prisma.user.findMany({
      where: {
        ...where,
        NOT: { id: currentUserId },
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Erro ao buscar usuarios do chat:", error);
    return { success: false, error: "Falha ao buscar usuarios do chat." };
  }
}

export async function getChatMessagesForUser(userId: string) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 1000,
    });

    return { success: true, data: messages };
  } catch (error) {
    console.error("Erro ao buscar mensagens do chat:", error);
    return { success: false, error: "Falha ao buscar mensagens do chat." };
  }
}

export async function sendChatMessage(input: SendMessageInput) {
  try {
    const content = input.content.trim();
    if (!content) {
      return { success: false, error: "Mensagem vazia." };
    }

    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: input.senderId } }),
      prisma.user.findUnique({ where: { id: input.receiverId } }),
    ]);

    if (!sender || !receiver) {
      return {
        success: false,
        error: "Usuario remetente ou destinatario invalido.",
      };
    }

    const message = await prisma.chatMessage.create({
      data: {
        senderId: input.senderId,
        receiverId: input.receiverId,
        content,
      },
    });

    return { success: true, data: message };
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return { success: false, error: "Falha ao enviar mensagem." };
  }
}

export async function markConversationAsRead(
  currentUserId: string,
  contactId: string,
) {
  try {
    const result = await prisma.chatMessage.updateMany({
      where: {
        senderId: contactId,
        receiverId: currentUserId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { success: true, data: { updatedCount: result.count } };
  } catch (error) {
    console.error("Erro ao marcar mensagens como lidas:", error);
    return { success: false, error: "Falha ao confirmar leitura." };
  }
}
