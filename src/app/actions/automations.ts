"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface AutomationCondition {
  type: 'column_equals' | 'temp_equals' | 'has_tag' | 'source_equals' | 'has_due_date' | 'due_date_passed';
  value: string;
}

interface AutomationAction {
  type: 'set_temperature' | 'add_tag' | 'move_to_column' | 'send_notification';
  params: Record<string, any>;
}

export async function getAutomationRules(boardId?: string) {
  try {
    const rules = await prisma.crmAutomationRule.findMany({
      where: boardId ? { boardId } : {},
      orderBy: { createdAt: "desc" },
    });

    return { 
      success: true, 
      data: rules.map(r => ({
        ...r,
        conditions: JSON.parse(r.conditions),
        actions: JSON.parse(r.actions),
      })) 
    };
  } catch (error) {
    console.error("Erro ao buscar regras:", error);
    return { success: false, error: "Falha ao carregar regras" };
  }
}

export async function createAutomationRule(data: {
  name: string;
  description?: string;
  trigger: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive?: boolean;
  boardId?: string;
}) {
  try {
    const rule = await prisma.crmAutomationRule.create({
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        conditions: JSON.stringify(data.conditions),
        actions: JSON.stringify(data.actions),
        isActive: data.isActive ?? true,
        boardId: data.boardId,
      },
    });

    revalidatePath("/dashboard/crm");
    return { success: true, data: rule };
  } catch (error) {
    console.error("Erro ao criar regra:", error);
    return { success: false, error: "Falha ao criar regra" };
  }
}

export async function updateAutomationRule(id: string, data: {
  name?: string;
  description?: string;
  trigger?: string;
  conditions?: AutomationCondition[];
  actions?: AutomationAction[];
  isActive?: boolean;
  boardId?: string;
}) {
  try {
    const updateData: any = { ...data };
    if (data.conditions) updateData.conditions = JSON.stringify(data.conditions);
    if (data.actions) updateData.actions = JSON.stringify(data.actions);

    const rule = await prisma.crmAutomationRule.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard/crm");
    return { success: true, data: rule };
  } catch (error) {
    console.error("Erro ao atualizar regra:", error);
    return { success: false, error: "Falha ao atualizar regra" };
  }
}

export async function deleteAutomationRule(id: string) {
  try {
    await prisma.crmAutomationRule.delete({ where: { id } });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar regra:", error);
    return { success: false, error: "Falha ao deletar regra" };
  }
}

export async function toggleAutomationRule(id: string) {
  try {
    const rule = await prisma.crmAutomationRule.findUnique({ where: { id } });
    if (!rule) return { success: false, error: "Regra não encontrada" };

    await prisma.crmAutomationRule.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });

    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alternar regra:", error);
    return { success: false, error: "Falha ao atualizar regra" };
  }
}

export async function executeAutomations(
  trigger: string, 
  lead: { id: string; name: string; columnId: string; temperature: string; tags: string; source: string; dueDate: Date | null; column: { name: string; boardId: string } }, 
  boardId?: string
) {
  try {
    const rules = await prisma.crmAutomationRule.findMany({
      where: {
        trigger,
        isActive: true,
        OR: [
          { boardId: null },
          { boardId: boardId || undefined },
        ],
      },
    });

    const leadData = {
      id: lead.id,
      name: lead.name,
      columnId: lead.columnId,
      columnName: lead.column?.name || '',
      temperature: lead.temperature,
      tags: lead.tags ? JSON.parse(lead.tags) : [],
      source: lead.source || '',
      dueDate: lead.dueDate,
      boardId: lead.column?.boardId,
    };

    for (const rule of rules) {
      const conditions = JSON.parse(rule.conditions) as AutomationCondition[];
      const actions = JSON.parse(rule.actions) as AutomationAction[];

      const shouldExecute = conditions.every(condition => {
        switch (condition.type) {
          case 'column_equals':
            return leadData.columnName === condition.value;
          case 'temp_equals':
            return leadData.temperature === condition.value;
          case 'has_tag':
            return leadData.tags.includes(condition.value);
          case 'source_equals':
            return leadData.source === condition.value;
          case 'has_due_date':
            return leadData.dueDate !== null;
          case 'due_date_passed':
            return leadData.dueDate !== null && new Date(leadData.dueDate) < new Date();
          default:
            return true;
        }
      });

      if (shouldExecute) {
        for (const action of actions) {
          switch (action.type) {
            case 'set_temperature':
              await prisma.crmLead.update({
                where: { id: lead.id },
                data: { temperature: action.params.value },
              });
              break;
            case 'add_tag':
              const currentTags = leadData.tags;
              if (!currentTags.includes(action.params.tag)) {
                currentTags.push(action.params.tag);
                await prisma.crmLead.update({
                  where: { id: lead.id },
                  data: { tags: JSON.stringify(currentTags) },
                });
              }
              break;
            case 'move_to_column':
              await prisma.crmLead.update({
                where: { id: lead.id },
                data: { columnId: action.params.columnId },
              });
              break;
            case 'send_notification':
              await prisma.notification.create({
                data: {
                  userId: 'admin-1',
                  title: 'Automação executada',
                  message: action.params.message?.replace('{name}', leadData.name) || 'Automação disparada',
                  type: 'class_scheduled',
                },
              });
              break;
          }
        }

        await prisma.crmAutomationRule.update({
          where: { id: rule.id },
          data: {
            executionCount: { increment: 1 },
            lastExecutedAt: new Date(),
          },
        });
      }
    }

    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao executar automações:", error);
    return { success: false, error: "Falha ao executar automações" };
  }
}