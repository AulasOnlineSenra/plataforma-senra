import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { runAiSupervisor } from "@/app/actions/automation";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const workflow = await prisma.automationWorkflow.findFirst({
      where: { entity: "BLOG" }
    });

    if (!workflow) {
      return NextResponse.json({ success: false, message: "Nenhum workflow configurado." });
    }

    if (!workflow.isActive) {
      return NextResponse.json({ success: false, message: "Workflow inativo (Kill-Switch ligado)." });
    }

    // Mapear frequências para minutos
    const freqMinutesMap: Record<string, number> = {
      "15m": 15,
      "30m": 30,
      "hourly": 60,
      "6h": 360,
      "daily": 1440
    };

    const targetIntervalMinutes = freqMinutesMap[workflow.frequency] || 60;
    const now = new Date();
    const lastRun = workflow.updatedAt ? new Date(workflow.updatedAt) : new Date(0);
    const minutesDiff = (now.getTime() - lastRun.getTime()) / (1000 * 60);

    // Se ainda não deu o tempo da frequência escolhida, não executa
    if (minutesDiff < targetIntervalMinutes) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: `Aguardando intervalo de ${targetIntervalMinutes}m (se passaram ${Math.floor(minutesDiff)}m desde a última execução).`
      });
    }

    // Executa a automação
    console.log(`[CRON MAESTRO] Disparando ciclo de automação (Intervalo: ${targetIntervalMinutes}m)...`);
    const result = await runAiSupervisor();

    // Atualiza a data da última execução
    await prisma.automationWorkflow.update({
      where: { id: workflow.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("[CRON MAESTRO] Erro crítico:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
