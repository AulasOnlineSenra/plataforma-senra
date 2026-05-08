"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Boards ---

export async function getCrmBoards() {
  try {
    const boards = await prisma.crmBoard.findMany({
      include: {
        _count: {
          select: {
            columns: true,
          },
        },
        columns: {
          include: {
            _count: {
              select: {
                leads: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular leadCount total por board
    const boardsWithCounts = boards.map((board) => {
      const totalLeads = board.columns.reduce(
        (acc, col) => acc + col._count.leads,
        0
      );
      return {
        ...board,
        leadCount: totalLeads,
        members: 1, // Placeholder por enquanto
      };
    });

    return { success: true, data: boardsWithCounts };
  } catch (error) {
    console.error("Erro ao buscar quadros CRM:", error);
    return { success: false, error: "Falha ao carregar quadros." };
  }
}

export async function getCrmBoardDetails(boardId: string) {
  try {
    const board = await prisma.crmBoard.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { order: "asc" },
          include: {
            leads: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!board) return { success: false, error: "Quadro não encontrado." };
    return { success: true, data: board };
  } catch (error) {
    console.error("Erro ao buscar detalhes do quadro:", error);
    return { success: false, error: "Falha ao carregar detalhes do quadro." };
  }
}

export async function createCrmBoard(data: { name: string; coverColor?: string }) {
  try {
    const board = await prisma.crmBoard.create({
      data: {
        name: data.name,
        coverColor: data.coverColor || "bg-gradient-to-r from-blue-500 to-cyan-500",
      },
    });

    // Criar colunas padrão
    const defaultColumns = [
      "Novo Lead",
      "Primeiro Contato",
      "Qualificação",
      "Proposta Enviada",
      "Negociação",
      "Fechado",
      "Perdido",
    ];

    await Promise.all(
      defaultColumns.map((name, index) =>
        prisma.crmColumn.create({
          data: {
            name,
            order: index,
            boardId: board.id,
            color: name === "Fechado" ? "bg-green-400" : name === "Perdido" ? "bg-red-400" : undefined,
          },
        })
      )
    );

    revalidatePath("/dashboard/crm");
    return { success: true, data: board };
  } catch (error) {
    console.error("Erro ao criar quadro:", error);
    return { success: false, error: "Falha ao criar quadro." };
  }
}

export async function updateCrmBoard(id: string, data: { name?: string; coverColor?: string; isFavorite?: boolean }) {
  try {
    await prisma.crmBoard.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar quadro:", error);
    return { success: false, error: "Falha ao atualizar quadro." };
  }
}

export async function deleteCrmBoard(id: string) {
  try {
    await prisma.crmBoard.delete({ where: { id } });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar quadro:", error);
    return { success: false, error: "Falha ao deletar quadro." };
  }
}

// --- Columns ---

export async function createCrmColumn(data: { name: string; boardId: string; order: number; color?: string }) {
  try {
    const column = await prisma.crmColumn.create({
      data,
    });
    revalidatePath("/dashboard/crm");
    return { success: true, data: column };
  } catch (error) {
    console.error("Erro ao criar coluna:", error);
    return { success: false, error: "Falha ao criar coluna." };
  }
}

export async function updateCrmColumn(id: string, data: { name?: string; color?: string; order?: number }) {
  try {
    await prisma.crmColumn.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar coluna:", error);
    return { success: false, error: "Falha ao atualizar coluna." };
  }
}

export async function deleteCrmColumn(id: string) {
  try {
    await prisma.crmColumn.delete({ where: { id } });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar coluna:", error);
    return { success: false, error: "Falha ao deletar coluna." };
  }
}

// --- Leads ---

import { triggerAiAutomation } from "@/lib/ai/automation-engine";

export async function createCrmLead(data: {
  name: string;
  columnId: string;
  phone?: string;
  email?: string;
  source?: string;
  series?: string;
  tags?: string;
  temperature?: string;
  order: number;
}) {
  try {
    const lead = await prisma.crmLead.create({
      data,
    });
    
    // Disparar automação de IA de forma assíncrona
    triggerAiAutomation('LEAD_CREATED', lead).catch(err => 
      console.error("Erro ao disparar automação de lead:", err)
    );

    revalidatePath("/dashboard/crm");
    return { success: true, data: lead };
  } catch (error) {
    console.error("Erro ao criar lead:", error);
    return { success: false, error: "Falha ao criar lead." };
  }
}

export async function updateCrmLead(id: string, data: any) {
  try {
    await prisma.crmLead.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    return { success: false, error: "Falha ao atualizar lead." };
  }
}

export async function moveCrmLead(leadId: string, columnId: string, order: number) {
  try {
    await prisma.crmLead.update({
      where: { id: leadId },
      data: {
        columnId,
        order,
      },
    });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao mover lead:", error);
    return { success: false, error: "Falha ao mover lead." };
  }
}

export async function deleteCrmLead(id: string) {
  try {
    await prisma.crmLead.delete({ where: { id } });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar lead:", error);
    return { success: false, error: "Falha ao deletar lead." };
  }
}
