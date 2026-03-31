"use server";

import prisma from "@/lib/prisma";

type SendMessageInput = {
  senderId: string;
  receiverId: string;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
};

export async function getChatUsers(
  currentUserRole: string,
  currentUserId: string,
) {
  try {
    let where: any = { status: "active" };

    if (currentUserRole === "student") {
      where = { role: { in: ["teacher", "admin"] }, status: "active" };
    } else if (currentUserRole === "teacher") {
      where = { role: { in: ["student", "admin"] }, status: "active" };
    }

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
      orderBy: [{ role: "asc" }, { name: "asc" }],
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
    const hasAttachment = !!input.attachmentUrl;
    if (!content && !hasAttachment) {
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
        content: content || "",
        attachmentUrl: input.attachmentUrl || null,
        attachmentName: input.attachmentName || null,
        attachmentType: input.attachmentType || null,
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

export async function markAllMessagesAsRead(userId: string) {
  try {
    await prisma.chatMessage.updateMany({
      where: {
        receiverId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar todas as mensagens como lidas:", error);
    return { success: false, error: "Falha ao marcar mensagens como lidas." };
  }
}

// --- Scheduled Messages ---

type CreateScheduledInput = {
  senderId: string;
  receiverId: string;
  content: string;
  scheduledAt: Date;
};

export async function createScheduledMessage(input: CreateScheduledInput) {
  try {
    const content = input.content.trim();
    if (!content) {
      return { success: false, error: "Mensagem vazia." };
    }

    if (input.scheduledAt <= new Date()) {
      return {
        success: false,
        error: "A data/hora deve ser no futuro.",
      };
    }

    const message = await prisma.scheduledMessage.create({
      data: {
        senderId: input.senderId,
        receiverId: input.receiverId,
        content,
        scheduledAt: input.scheduledAt,
      },
    });

    return { success: true, data: message };
  } catch (error) {
    console.error("Erro ao agendar mensagem:", error);
    return { success: false, error: "Falha ao agendar mensagem." };
  }
}

export async function getScheduledMessages(
  senderId: string,
  receiverId: string,
) {
  try {
    const messages = await prisma.scheduledMessage.findMany({
      where: {
        senderId,
        receiverId,
        status: "pending",
      },
      orderBy: { scheduledAt: "asc" },
    });

    return { success: true, data: messages };
  } catch (error) {
    console.error("Erro ao buscar mensagens agendadas:", error);
    return {
      success: false,
      error: "Falha ao buscar mensagens agendadas.",
    };
  }
}

export async function cancelScheduledMessage(id: string) {
  try {
    await prisma.scheduledMessage.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao cancelar mensagem agendada:", error);
    return {
      success: false,
      error: "Falha ao cancelar mensagem agendada.",
    };
  }
}

export async function getDueScheduledMessages() {
  try {
    const messages = await prisma.scheduledMessage.findMany({
      where: {
        status: "pending",
        scheduledAt: { lte: new Date() },
      },
    });

    return { success: true, data: messages };
  } catch (error) {
    console.error("Erro ao buscar mensagens pendentes:", error);
    return { success: false, error: "Falha ao buscar mensagens pendentes." };
  }
}

export async function markScheduledAsSent(id: string) {
  try {
    await prisma.scheduledMessage.update({
      where: { id },
      data: { status: "sent", sentAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar mensagem como enviada:", error);
    return { success: false, error: "Falha ao atualizar status." };
  }
}

export async function updateScheduledMessage(
  id: string,
  data: { content: string; scheduledAt: Date },
) {
  try {
    const content = data.content.trim();
    if (!content) {
      return { success: false, error: "Mensagem vazia." };
    }

    if (data.scheduledAt <= new Date()) {
      return { success: false, error: "A data/hora deve ser no futuro." };
    }

    await prisma.scheduledMessage.update({
      where: { id },
      data: { content, scheduledAt: data.scheduledAt },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar mensagem agendada:", error);
    return { success: false, error: "Falha ao atualizar mensagem agendada." };
  }
}
