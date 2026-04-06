const GLOBAL_KEY = "__scheduledMessagesIntervalStarted";

export async function register() {
  if ((globalThis as any)[GLOBAL_KEY]) return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  (globalThis as any)[GLOBAL_KEY] = true;

  setInterval(async () => {
    try {
      const { getDueScheduledMessages, markScheduledAsSent, sendChatMessage } =
        await import("@/app/actions/chat");

      const result = await getDueScheduledMessages();
      if (!result.success || !result.data || result.data.length === 0) return;

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
        }
      }
    } catch (error) {
      console.error("[scheduled-messages] Erro:", error);
    }
  }, 30000);

  console.log("[scheduled-messages] Worker iniciado (a cada 30s)");
}
