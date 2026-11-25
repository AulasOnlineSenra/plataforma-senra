"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Tipos ────────────────────────────────────────────────

export type FlowNodeOption = {
  label: string;
  next: string; // id do próximo nó
};

export type FlowNode = {
  id: string;
  type: "message" | "question";
  content: string;
  next?: string; // para type=message
  options?: FlowNodeOption[]; // para type=question
};

// ─── Template padrão de boas-vindas ──────────────────────

const DEFAULT_ONBOARDING_FLOW: FlowNode[] = [
  {
    id: "1",
    type: "message",
    content:
      "Olá, {nome}! 👋 Seja muito bem-vindo(a) à Aulas Online Senra! Sou seu assistente de boas-vindas e estou aqui para te ajudar a dar o primeiro passo.",
    next: "2",
  },
  {
    id: "2",
    type: "message",
    content:
      "Aqui você encontrará professores incríveis prontos para te ajudar a conquistar seus objetivos! 🎯 Cada aula é pensada para o seu sucesso.",
    next: "3",
  },
  {
    id: "3",
    type: "question",
    content:
      "Para começar, me conta: qual é o seu objetivo principal aqui na plataforma?",
    options: [
      { label: "Passar no ENEM ou Vestibular", next: "4" },
      { label: "Melhorar em uma matéria específica", next: "5" },
      { label: "Preparação para concurso público", next: "6" },
      { label: "Aprendizado geral / curiosidade", next: "7" },
    ],
  },
  {
    id: "4",
    type: "message",
    content:
      "Excelente escolha! 🚀 Temos especialistas em ENEM e vestibulares que já ajudaram centenas de alunos a conquistar a vaga dos sonhos. Vou te apresentar as melhores opções disponíveis agora. Boa sorte na sua jornada!",
    next: "end",
  },
  {
    id: "5",
    type: "message",
    content:
      "Perfeito! Me diz qual matéria está te dando mais trabalho e já conecto você com o professor certo. Com as aulas certas, essa dificuldade vai virar seu ponto forte! 💪",
    next: "end",
  },
  {
    id: "6",
    type: "message",
    content:
      "Ótimo objetivo! 🏛️ Temos professores com vasta experiência em concursos públicos. Vamos encontrar o perfil ideal para a sua prova e garantir a melhor preparação possível.",
    next: "end",
  },
  {
    id: "7",
    type: "message",
    content:
      "Que legal! 📚 A curiosidade é o melhor ponto de partida. Explore à vontade os professores e disciplinas disponíveis. Qualquer dúvida, estou por aqui!",
    next: "end",
  },
];

export async function getDefaultOnboardingFlow(): Promise<FlowNode[]> {
  return DEFAULT_ONBOARDING_FLOW;
}

// ─── CRUD ────────────────────────────────────────────────

export async function getOnboardingAutomations() {
  try {
    const automations = await prisma.onboardingAutomation.findMany({
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { id: true, name: true } } },
    });
    return { success: true, data: automations };
  } catch (error) {
    console.error("[Onboarding] getOnboardingAutomations:", error);
    return { success: false, error: "Erro ao listar automações de onboarding." };
  }
}

export async function createOnboardingAutomation(data: {
  name: string;
  description?: string;
  triggerType?: string;
  agentId?: string;
}) {
  try {
    const automation = await prisma.onboardingAutomation.create({
      data: {
        name: data.name,
        description: data.description ?? "",
        triggerType: data.triggerType ?? "NEW_USER",
        agentId: data.agentId ?? null,
        isActive: false,
        flowJson: JSON.stringify(DEFAULT_ONBOARDING_FLOW),
      },
    });
    revalidatePath("/dashboard/admin/ia");
    return { success: true, data: automation };
  } catch (error) {
    console.error("[Onboarding] createOnboardingAutomation:", error);
    return { success: false, error: "Erro ao criar automação de onboarding." };
  }
}

export async function updateOnboardingAutomation(
  id: string,
  data: {
    name?: string;
    description?: string;
    triggerType?: string;
    agentId?: string | null;
    isActive?: boolean;
    flowJson?: string;
  }
) {
  try {
    const automation = await prisma.onboardingAutomation.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.triggerType !== undefined && { triggerType: data.triggerType }),
        ...(data.agentId !== undefined && { agentId: data.agentId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.flowJson !== undefined && { flowJson: data.flowJson }),
      },
    });
    revalidatePath("/dashboard/admin/ia");
    return { success: true, data: automation };
  } catch (error) {
    console.error("[Onboarding] updateOnboardingAutomation:", error);
    return { success: false, error: "Erro ao atualizar automação." };
  }
}

export async function deleteOnboardingAutomation(id: string) {
  try {
    await prisma.onboardingAutomation.delete({ where: { id } });
    revalidatePath("/dashboard/admin/ia");
    return { success: true };
  } catch (error) {
    console.error("[Onboarding] deleteOnboardingAutomation:", error);
    return { success: false, error: "Erro ao excluir automação." };
  }
}

// ─── Trigger: chamado no registro de novo usuário ─────────

export async function triggerOnboardingForUser(
  userId: string,
  userRole: "student" | "teacher" = "student"
) {
  try {
    const triggerType = userRole === "teacher" ? "NEW_TEACHER" : "NEW_USER";

    const automation = await prisma.onboardingAutomation.findFirst({
      where: { isActive: true, triggerType },
      include: { agent: true },
    });

    if (!automation || !automation.agent) {
      console.log(
        `[Onboarding] Nenhuma automação ativa para triggerType=${triggerType}`
      );
      return { success: false, skipped: true };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) return { success: false, error: "Usuário não encontrado." };

    const flow: FlowNode[] = JSON.parse(automation.flowJson || "[]");
    const firstNode = flow.find((n) => n.id === "1");
    const greeting = firstNode
      ? firstNode.content.replace("{nome}", user.name.split(" ")[0])
      : `Olá, ${user.name.split(" ")[0]}! Bem-vindo(a)!`;

    // Registra notificação de boas-vindas personalizada para o usuário
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        title: "🎉 Boas-vindas à Aulas Online Senra!",
        message: greeting,
        type: "ONBOARDING",
        read: false,
      },
    });

    console.log(
      `[Onboarding] Fluxo disparado para user=${user.id} via agente=${automation.agent.name}`
    );
    return { success: true, automationId: automation.id };
  } catch (error) {
    // Não bloqueia o registro; apenas loga
    console.error("[Onboarding] triggerOnboardingForUser:", error);
    return { success: false, error: String(error) };
  }
}
