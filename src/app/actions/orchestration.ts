"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Busca os logs de orquestração com paginação e filtros
 */
export async function getAgentLoopLogs(options?: {
  entityId?: string;
  limit?: number;
}) {
  try {
    const logs = await (prisma as any).agentLoopLog.findMany({
      where: options?.entityId ? { entityId: options.entityId } : undefined,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
    });
    return { success: true, data: logs };
  } catch (error: any) {
    console.error("Erro ao buscar logs de orquestração:", error);
    return { success: false, error: "Falha ao carregar histórico de auditoria." };
  }
}

/**
 * Busca entidades que estão ativas no fluxo de orquestração
 */
export async function getOrchestratedEntities() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        OR: [
          { status: "DRAFT" },
          { status: "REVIEW" },
          { orchestrationStatus: { in: ["AWAITING_ADMIN", "PAUSED"] } }
        ]
      },
      select: {
        id: true,
        title: true,
        status: true,
        loopIteration: true,
        qualityScore: true,
        lastReviewFeedback: true,
        orchestrationStatus: true,
        adminDirective: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20
    });
    return { success: true, data: posts };
  } catch (error: any) {
    console.error("Erro ao buscar entidades orquestradas:", error);
    return { success: false, error: "Falha ao buscar itens da orquestração." };
  }
}

/**
 * Intervenção do Administrador (Human-in-the-Loop)
 * Permite aprovar manualmente, pausar, retomar ou injetar direcionamento direto.
 */
export async function adminInterveneLoop(data: {
  entityId: string;
  action: "APPROVE" | "PAUSE" | "RESUME" | "DIRECT";
  instruction?: string;
}) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: data.entityId }
    });

    if (!post) {
      return { success: false, error: "Item não encontrado." };
    }

    let newStatus = post.status;
    let newOrchestrationStatus = post.orchestrationStatus;
    let logAction = "HUMAN_INTERVENTION";
    let logFeedback = "";

    switch (data.action) {
      case "APPROVE":
        // Força aprovação para a próxima etapa (IMAGES)
        newStatus = "IMAGES";
        newOrchestrationStatus = "AUTO_APPROVED";
        logAction = "HUMAN_APPROVED";
        logFeedback = `Administrador aprovou manualmente o artigo e avançou para a etapa de Imagens.`;
        break;

      case "PAUSE":
        newOrchestrationStatus = "PAUSED";
        logAction = "HUMAN_PAUSED";
        logFeedback = `Administrador pausou o ciclo automático de agentes.`;
        break;

      case "RESUME":
        newOrchestrationStatus = "NORMAL";
        logAction = "HUMAN_RESUMED";
        logFeedback = `Administrador retomou o ciclo de agentes.`;
        break;

      case "DIRECT":
        if (!data.instruction || data.instruction.trim().length === 0) {
          return { success: false, error: "Por favor, digite o direcionamento." };
        }
        newOrchestrationStatus = "NORMAL";
        logAction = "HUMAN_DIRECTED";
        logFeedback = `Direcionamento do Administrador: "${data.instruction}"`;
        break;
    }

    // Atualiza o post
    await prisma.blogPost.update({
      where: { id: data.entityId },
      data: {
        status: newStatus,
        orchestrationStatus: newOrchestrationStatus,
        adminDirective: data.action === "DIRECT" ? data.instruction : (data.action === "APPROVE" ? null : post.adminDirective),
        isProcessingAi: false,
      }
    });

    // Registra no Log de Auditoria
    await (prisma as any).agentLoopLog.create({
      data: {
        entityType: "BLOG_POST",
        entityId: post.id,
        entityTitle: post.title,
        iteration: post.loopIteration || 1,
        agentName: "Administrador (Humano)",
        action: logAction,
        status: data.action === "APPROVE" ? "APPROVED" : (data.action === "PAUSE" ? "PAUSED" : "IN_PROGRESS"),
        score: post.qualityScore || null,
        feedback: logFeedback,
        adminNote: data.instruction || null,
      }
    });

    revalidatePath("/dashboard/admin/ia");
    revalidatePath("/dashboard/blog");

    return { 
      success: true, 
      message: `Ação '${data.action}' aplicada com sucesso!`,
      data: { status: newStatus, orchestrationStatus: newOrchestrationStatus }
    };
  } catch (error: any) {
    console.error("Erro na intervenção do administrador:", error);
    return { success: false, error: "Falha ao aplicar intervenção: " + error.message };
  }
}
