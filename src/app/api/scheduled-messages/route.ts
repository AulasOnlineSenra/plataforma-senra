// TODO: Para produção, migrar para node-cron ou Cloud Scheduler para envio automático.
// O polling via client funciona apenas para instância única com usuários ativos.
import { NextResponse } from "next/server";
import {
  getDueScheduledMessages,
  markScheduledAsSent,
  sendChatMessage,
} from "@/app/actions/chat";

export async function GET() {
  try {
    const result = await getDueScheduledMessages();

    if (!result.success || !result.data) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    const sent: string[] = [];

    for (const msg of result.data) {
      const sendResult = await sendChatMessage({
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content,
        attachmentUrl: msg.attachmentUrl,
        attachmentName: msg.attachmentName,
        attachmentType: msg.attachmentType,
      });

      if (sendResult.success) {
        await markScheduledAsSent(msg.id);
        sent.push(msg.id);
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("Erro ao processar mensagens agendadas:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao processar mensagens agendadas." },
      { status: 500 },
    );
  }
}
