import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function GET(req: Request) {
  try {
    // 1. Calcular a data de 45 dias atrás
    const cutoffDate = subDays(new Date(), 45);

    // 2. Apagar mensagens de ChatMessage com mais de 45 dias
    const deletedChatMessages = await prisma.chatMessage.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // 3. Apagar mensagens de ScheduledMessage com mais de 45 dias (se aplicável para limpeza também)
    const deletedScheduledMessages = await prisma.scheduledMessage.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Limpeza de mensagens concluída com sucesso.',
      details: {
        chatMessagesDeleted: deletedChatMessages.count,
        scheduledMessagesDeleted: deletedScheduledMessages.count,
        cutoffDate: cutoffDate.toISOString(),
      }
    });

  } catch (error: any) {
    console.error('Erro na limpeza de chats:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao executar limpeza de chats.' },
      { status: 500 }
    );
  }
}
