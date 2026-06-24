'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { ENEM_TAG, ENEM_DIA1_MINUTES, ENEM_DIA2_MINUTES, getLastWeekendOfMonth } from '@/lib/enem-utils';

function parseTags(tagsJson: string | null | undefined): string[] {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── TAGS DE ALUNO ───────────────────────────────────────────────────────────

/** Adiciona ou remove a tag "Foco ENEM" de um aluno */
export async function toggleStudentEnemTag(studentId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, tags: true },
    });
    if (!user) return { success: false, error: 'Aluno não encontrado.' };

    const currentTags = parseTags(user.tags);
    const hasTag = currentTags.includes(ENEM_TAG);
    const newTags = hasTag
      ? currentTags.filter((t) => t !== ENEM_TAG)
      : [...currentTags, ENEM_TAG];

    await prisma.user.update({
      where: { id: studentId },
      data: { tags: JSON.stringify(newTags) },
    });

    revalidatePath('/dashboard/admin/students');
    return { success: true, hasTag: !hasTag };
  } catch (error) {
    console.error('Erro ao alterar tag ENEM:', error);
    return { success: false, error: 'Falha ao alterar tag do aluno.' };
  }
}

/** Retorna todos os alunos com tag "Foco ENEM" */
export async function getEnemTaggedStudents() {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student', status: { not: 'deleted' } },
      select: { id: true, name: true, email: true, tags: true, avatarUrl: true },
      orderBy: { name: 'asc' },
    });

    const tagged = students.filter((s) => parseTags(s.tags).includes(ENEM_TAG));
    return { success: true, data: tagged };
  } catch (error) {
    console.error('Erro ao buscar alunos ENEM:', error);
    return { success: false, error: 'Falha ao buscar alunos.' };
  }
}

/** Retorna todos os alunos com campo tags para o admin de alunos */
export async function getStudentsWithTags() {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student', status: { not: 'deleted' } },
      select: {
        id: true,
        name: true,
        email: true,
        tags: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: students };
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return { success: false, error: 'Falha ao buscar alunos.' };
  }
}

// ─── TEMPLATES DE SIMULADO ───────────────────────────────────────────────────

export async function listSimuladoTemplates() {
  try {
    const templates = await (prisma as any).simuladoTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: templates };
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    return { success: false, error: 'Falha ao listar templates.' };
  }
}

export async function getSimuladoTemplateById(id: string) {
  try {
    const template = await (prisma as any).simuladoTemplate.findUnique({
      where: { id },
    });
    if (!template) return { success: false, error: 'Template não encontrado.' };
    return { success: true, data: template };
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    return { success: false, error: 'Falha ao buscar template.' };
  }
}

export async function upsertSimuladoTemplate(data: {
  id?: string;
  title: string;
  description?: string;
  dayType: 'DIA1' | 'DIA2' | 'CUSTOM';
  timeLimitMinutes?: number;
  questions: unknown[];
}) {
  try {
    const timeLimitMinutes =
      data.timeLimitMinutes ??
      (data.dayType === 'DIA1'
        ? ENEM_DIA1_MINUTES
        : data.dayType === 'DIA2'
          ? ENEM_DIA2_MINUTES
          : null);

    const payload = {
      title: data.title.trim(),
      description: (data.description ?? '').trim(),
      subject: 'ENEM',
      dayType: data.dayType,
      timeLimitMinutes,
      questions: data.questions,
    };

    if (data.id) {
      const updated = await (prisma as any).simuladoTemplate.update({
        where: { id: data.id },
        data: payload,
      });
      revalidatePath('/dashboard/admin/enem');
      return { success: true, data: updated };
    }

    const created = await (prisma as any).simuladoTemplate.create({
      data: payload,
    });
    revalidatePath('/dashboard/admin/enem');
    return { success: true, data: created };
  } catch (error) {
    console.error('Erro ao salvar template:', error);
    return { success: false, error: 'Falha ao salvar template.' };
  }
}

export async function deleteSimuladoTemplate(id: string) {
  try {
    await (prisma as any).simuladoTemplate.delete({ where: { id } });
    revalidatePath('/dashboard/admin/enem');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    return { success: false, error: 'Falha ao deletar template.' };
  }
}

// ─── CONFIGURAÇÕES ENEM NO AppSetting ────────────────────────────────────────

export async function getEnemConfig() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { id: 'global' },
    });
    return {
      success: true,
      data: setting
        ? {
            enemSimuladoEnabled: (setting as any).enemSimuladoEnabled ?? false,
            enemDia1TemplateId: (setting as any).enemDia1TemplateId ?? null,
            enemDia2TemplateId: (setting as any).enemDia2TemplateId ?? null,
            enemReleaseHour: (setting as any).enemReleaseHour ?? 13,
            enemReleaseMinute: (setting as any).enemReleaseMinute ?? 0,
            enemOnlyTaggedStudents:
              (setting as any).enemOnlyTaggedStudents ?? true,
          }
        : {
            enemSimuladoEnabled: false,
            enemDia1TemplateId: null,
            enemDia2TemplateId: null,
            enemReleaseHour: 13,
            enemReleaseMinute: 0,
            enemOnlyTaggedStudents: true,
          },
    };
  } catch (error) {
    console.error('Erro ao buscar config ENEM:', error);
    return { success: false, error: 'Falha ao buscar configuração.' };
  }
}

export async function updateEnemConfig(data: {
  enemSimuladoEnabled?: boolean;
  enemDia1TemplateId?: string | null;
  enemDia2TemplateId?: string | null;
  enemReleaseHour?: number;
  enemReleaseMinute?: number;
  enemOnlyTaggedStudents?: boolean;
}) {
  try {
    const existing = await prisma.appSetting.findUnique({
      where: { id: 'global' },
    });

    if (!existing) {
      await prisma.appSetting.create({
        data: {
          id: 'global',
          updatedAt: new Date(),
          ...(data as any),
        },
      });
    } else {
      await prisma.appSetting.update({
        where: { id: 'global' },
        data: { ...(data as any), updatedAt: new Date() },
      });
    }

    revalidatePath('/dashboard/admin/enem');
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar config ENEM:', error);
    return { success: false, error: 'Falha ao salvar configuração.' };
  }
}

// ─── DISPATCH AUTOMÁTICO (chamado pelo cron) ──────────────────────────────────

/**
 * Envia simulado para os alunos tagueados.
 * dayType: 'DIA1' = sábado | 'DIA2' = domingo
 */
export async function dispatchEnemSimulado(
  dayType: 'DIA1' | 'DIA2',
  adminId: string,
) {
  try {
    const config = await getEnemConfig();
    if (!config.success || !config.data)
      return { success: false, error: 'Configuração não encontrada.' };

    const cfg = config.data;
    if (!cfg.enemSimuladoEnabled)
      return { success: false, error: 'Envio automático desativado.' };

    const templateId =
      dayType === 'DIA1' ? cfg.enemDia1TemplateId : cfg.enemDia2TemplateId;
    if (!templateId)
      return { success: false, error: `Template do ${dayType} não configurado.` };

    const template = await (prisma as any).simuladoTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template)
      return { success: false, error: 'Template não encontrado no banco.' };

    // Buscar alunos
    let students: { id: string; name: string }[];
    if (cfg.enemOnlyTaggedStudents) {
      const all = await prisma.user.findMany({
        where: { role: 'student', status: 'active' },
        select: { id: true, name: true, tags: true },
      });
      students = all.filter((s) => parseTags(s.tags).includes(ENEM_TAG));
    } else {
      students = await prisma.user.findMany({
        where: { role: 'student', status: 'active' },
        select: { id: true, name: true },
      });
    }

    if (students.length === 0)
      return { success: true, dispatched: 0, message: 'Nenhum aluno elegível.' };

    // Criar simulados e notificações para cada aluno
    const dayLabel = dayType === 'DIA1' ? 'Dia 1 (Sábado)' : 'Dia 2 (Domingo)';
    let dispatched = 0;

    for (const student of students) {
      // Verifica se já foi enviado este mês para evitar duplicatas
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const existing = await prisma.simulado.findFirst({
        where: {
          studentId: student.id,
          subject: `ENEM_${dayType}`,
          createdAt: { gte: monthStart },
        },
      });
      if (existing) continue;

      await prisma.simulado.create({
        data: {
          title: `${template.title} — ${dayLabel}`,
          description: template.description || '',
          subject: `ENEM_${dayType}`,
          creatorId: adminId,
          studentId: student.id,
          status: 'Pendente',
          maxAttempts: 1,
          timeLimitMinutes: template.timeLimitMinutes,
          questions: template.questions,
          attempts: [],
        },
      });

      await prisma.notification.create({
        data: {
          userId: student.id,
          title: `🎯 Simulado ENEM ${dayLabel} disponível!`,
          message: `Seu simulado "${template.title}" está no seu painel. Você tem ${template.timeLimitMinutes} minutos. Boa sorte!`,
          type: 'ENEM_SIMULADO',
          read: false,
        },
      });

      dispatched++;
    }

    return { success: true, dispatched, total: students.length };
  } catch (error) {
    console.error('Erro ao disparar simulado ENEM:', error);
    return { success: false, error: 'Falha no despacho do simulado.' };
  }
}
