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
  isManualDispatch: boolean = false
) {
  try {
    const config = await getEnemConfig();
    if (!config.success || !config.data)
      return { success: false, error: 'Configuração não encontrada.' };

    const cfg = config.data;
    if (!cfg.enemSimuladoEnabled)
      return { success: false, error: 'Envio automático desativado.' };

    const templateId =
      (dayType === 'DIA1' ? cfg.enemDia1TemplateId : cfg.enemDia2TemplateId) || 'dynamic';
    const isDynamic = templateId === 'dynamic';
    let template: any = null;

    if (!isDynamic) {
      template = await (prisma as any).simuladoTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template)
        return { success: false, error: 'Template não encontrado no banco.' };
    }

    // Buscar alunos
    let students: { id: string; name: string; tags: string | null }[];
    if (cfg.enemOnlyTaggedStudents) {
      const all = await prisma.user.findMany({
        where: { role: 'student', status: 'active' },
        select: { id: true, name: true, tags: true },
      });
      students = all.filter((s) => parseTags(s.tags).includes(ENEM_TAG));
    } else {
      students = await prisma.user.findMany({
        where: { role: 'student', status: 'active' },
        select: { id: true, name: true, tags: true },
      });
    }

    if (students.length === 0)
      return { success: true, dispatched: 0, message: 'Nenhum aluno elegível.' };

    const dayLabel = dayType === 'DIA1' ? 'Dia 1 (Sábado)' : 'Dia 2 (Domingo)';
    let dispatched = 0;

    for (const student of students) {
      // Evita duplicatas: se for automático, verifica se já foi gerado algum simulado HOJE.
      // Isso permite que disparos manuais em dias anteriores não bloqueiem o envio automático no fim de semana.
      if (!isManualDispatch) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const existing = await prisma.simulado.findFirst({
          where: {
            studentId: student.id,
            subject: `ENEM_${dayType}`,
            createdAt: { gte: todayStart },
          },
        });
        if (existing) continue;
      }

      let questionsToUse: any[] = [];
      let timeLimit = 300;
      let title = '';
      let description = '';

      if (isDynamic) {
        // 1. Descobrir questões respondidas pelo aluno para manter o ineditismo
        const completed = await prisma.simulado.findMany({
          where: { studentId: student.id, status: 'Concluido' },
          select: { questions: true, attempts: true },
        });

        const answeredIds = new Set<string>();
        completed.forEach((s) => {
          if (Array.isArray(s.questions)) {
            s.questions.forEach((q: any) => {
              if (q && q.id) answeredIds.add(String(q.id));
            });
          }
        });

        // 2. Buscar questões do banco local (aceitando formatos curtos e longos de disciplina)
        const dbDisciplines =
          dayType === 'DIA1'
            ? [
                'Linguagens, Códigos e suas Tecnologias',
                'Ciências Humanas e suas Tecnologias',
                'linguagens',
                'humanas',
              ]
            : [
                'Matemática e suas Tecnologias',
                'Ciências da Natureza e suas Tecnologias',
                'matematica',
                'natureza',
              ];

        const dbQuestions = await prisma.question.findMany({
          where: {
            discipline: { in: dbDisciplines },
          },
        });

        // Mapear banco local normalizando as disciplinas
        const localQuestionsPool = dbQuestions.map((q) => {
          const rawAlts =
            typeof q.alternatives === 'string'
              ? JSON.parse(q.alternatives)
              : q.alternatives;
          const alts = Array.isArray(rawAlts) ? rawAlts : [];
          const options = alts.map((alt: any, idx: number) => ({
            id: alt.letter || String.fromCharCode(65 + idx),
            text: alt.text || '',
            isCorrect:
              (alt.letter || String.fromCharCode(65 + idx)) ===
              q.correctAlternative,
          }));

          let finalDiscipline = q.discipline;
          const lowerDiscipline = q.discipline.toLowerCase();
          if (lowerDiscipline.includes('linguagens')) {
            finalDiscipline = 'Linguagens, Códigos e suas Tecnologias';
          } else if (lowerDiscipline.includes('humanas')) {
            finalDiscipline = 'Ciências Humanas e suas Tecnologias';
          } else if (lowerDiscipline.includes('matematica')) {
            finalDiscipline = 'Matemática e suas Tecnologias';
          } else if (lowerDiscipline.includes('natureza')) {
            finalDiscipline = 'Ciências da Natureza e suas Tecnologias';
          }

          return {
            id: q.id,
            title: q.context || q.title || '',
            options,
            discipline: finalDiscipline,
            subject: q.subject || 'Geral',
            isLocal: true,
            localTitle: q.title || '',
          };
        });

        // 3. Buscar questões oficiais da API do ENEM (anos de 2009 a 2023, priorizando anos mais recentes via janela deslizante)
        const apiQuestionsPool: any[] = [];
        const VALID_YEARS_DESC = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009];
        
        // Janela deslizante: a cada 2 simulados ENEM concluídos pelo aluno, avançamos a janela de busca em 1 ano para trás
        const completedCount = completed.length;
        const yearOffset = Math.floor(completedCount / 2);
        const startIndex = Math.min(yearOffset, VALID_YEARS_DESC.length - 4);
        const selectedYears = VALID_YEARS_DESC.slice(startIndex, startIndex + 4);

        try {
          const apiPromises: Promise<any>[][] = [];
          
          selectedYears.forEach((year) => {
            const offsets = [0, 45, 90, 135];
            const promisesForYear = offsets.map((offset) =>
              fetch(`https://api.enem.dev/v1/exams/${year}/questions?limit=45&offset=${offset}`, {
                next: { revalidate: 86400 }, // Cache de 24 horas para excelente performance na VPS
              })
                .then(async (res) => {
                  if (res.ok) {
                    const data = await res.json();
                    return {
                      year,
                      questions: Array.isArray(data) ? data : (data.questions || []),
                    };
                  }
                  return { year, questions: [] };
                })
                .catch(() => ({ year, questions: [] }))
            );
            apiPromises.push(...promisesForYear);
          });

          const apiResults = await Promise.all(apiPromises);

          apiResults.forEach((resObj: any) => {
            const { year, questions } = resObj;
            if (!Array.isArray(questions)) return;

            questions.forEach((q: any) => {
              let finalDiscipline = 'Linguagens, Códigos e suas Tecnologias';
              const lowerDiscipline = (q.discipline || '').toLowerCase();

              if (lowerDiscipline.includes('matematica')) {
                finalDiscipline = 'Matemática e suas Tecnologias';
              } else if (lowerDiscipline.includes('natureza')) {
                finalDiscipline = 'Ciências da Natureza e suas Tecnologias';
              } else if (lowerDiscipline.includes('humanas')) {
                finalDiscipline = 'Ciências Humanas e suas Tecnologias';
              } else {
                finalDiscipline = 'Linguagens, Códigos e suas Tecnologias';
              }

              // Mapear alternativas da API oficial
              const alts = Array.isArray(q.alternatives) ? q.alternatives : [];
              const options = alts.map((alt: any, idx: number) => ({
                id: alt.letter || String.fromCharCode(65 + idx),
                text: alt.text || '',
                isCorrect: (alt.letter || String.fromCharCode(65 + idx)) === q.correctAlternative,
              }));

              apiQuestionsPool.push({
                id: `enem-api-${year}-${q.index || q.id || Math.random()}`,
                title: q.context || q.title || `Questão ${q.index} - ENEM ${year}`,
                options,
                discipline: finalDiscipline,
                subject: q.subject || 'Geral',
                isEnemApi: true,
                enemYear: year,
                enemIndex: q.index,
              });
            });
          });
        } catch (apiError) {
          console.error('Erro ao consultar API do ENEM dev no gerador dinâmico:', apiError);
        }

        // 4. Juntar questões de templates estáticos como fallback adicional
        const allTemplates = await (prisma as any).simuladoTemplate.findMany({
          where: { dayType },
        });

        const templateQuestionsPool: any[] = [];
        allTemplates.forEach((t: any) => {
          if (Array.isArray(t.questions)) {
            t.questions.forEach((q: any) => {
              let finalDiscipline = q.discipline || (dayType === 'DIA1'
                ? 'Linguagens, Códigos e suas Tecnologias'
                : 'Matemática e suas Tecnologias');

              const lower = finalDiscipline.toLowerCase();
              if (lower.includes('linguagens')) {
                finalDiscipline = 'Linguagens, Códigos e suas Tecnologias';
              } else if (lower.includes('humanas')) {
                finalDiscipline = 'Ciências Humanas e suas Tecnologias';
              } else if (lower.includes('matematica')) {
                finalDiscipline = 'Matemática e suas Tecnologias';
              } else if (lower.includes('natureza')) {
                finalDiscipline = 'Ciências da Natureza e suas Tecnologias';
              }

              templateQuestionsPool.push({
                id: q.id || `tpl-q-${Math.random()}`,
                title: q.title || q.context || '',
                options: q.options || [],
                discipline: finalDiscipline,
                subject: q.subject || 'Geral',
              });
            });
          }
        });

        // 5. Mesclar todos os pools e filtrar pelas matérias do respectivo Dia do ENEM
        const targetDisciplines =
          dayType === 'DIA1'
            ? [
                'Linguagens, Códigos e suas Tecnologias',
                'Ciências Humanas e suas Tecnologias',
              ]
            : [
                'Matemática e suas Tecnologias',
                'Ciências da Natureza e suas Tecnologias',
              ];

        const combinedPool = [
          ...localQuestionsPool,
          ...apiQuestionsPool,
          ...templateQuestionsPool,
        ].filter((q) => targetDisciplines.includes(q.discipline));

        // 6. Filtrar repetições por ID ou por semelhança de enunciado
        const uniquePool: any[] = [];
        const seenTexts = new Set<string>();

        combinedPool.forEach((q) => {
          const normText = (q.title || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
          if (!answeredIds.has(q.id) && !seenTexts.has(normText)) {
            seenTexts.add(normText);
            uniquePool.push(q);
          }
        });

        // Separar as duas disciplinas correspondentes ao dia
        const disciplineA = targetDisciplines[0];
        const disciplineB = targetDisciplines[1];

        // Filtrar pool inédito por disciplina
        let poolA = uniquePool.filter((q) => q.discipline === disciplineA);
        let poolB = uniquePool.filter((q) => q.discipline === disciplineB);

        // Se faltarem questões inéditas na disciplina A, complementamos com as já respondidas da disciplina A
        if (poolA.length < 45) {
          const seenInA = new Set(poolA.map((q) => (q.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')));
          combinedPool
            .filter((q) => q.discipline === disciplineA)
            .forEach((q) => {
              const normText = (q.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              if (!seenInA.has(normText)) {
                seenInA.add(normText);
                poolA.push(q);
              }
            });
        }

        // Se faltarem questões inéditas na disciplina B, complementamos com as já respondidas da disciplina B
        if (poolB.length < 45) {
          const seenInB = new Set(poolB.map((q) => (q.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')));
          combinedPool
            .filter((q) => q.discipline === disciplineB)
            .forEach((q) => {
              const normText = (q.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              if (!seenInB.has(normText)) {
                seenInB.add(normText);
                poolB.push(q);
              }
            });
        }

        // 7. Embaralhar individualmente e selecionar exatamente 45 questões de cada disciplina
        const selectedA = poolA.sort(() => 0.5 - Math.random()).slice(0, 45);
        const selectedB = poolB.sort(() => 0.5 - Math.random()).slice(0, 45);

        // Mesclar as duas disciplinas para formar as 90 questões finais
        questionsToUse = [...selectedA, ...selectedB].sort(() => 0.5 - Math.random());

        // Fallback de contingência caso todos os pools falhem por ausência de conexão
        if (questionsToUse.length === 0) {
          questionsToUse = [
            {
              id: 'fallback-1',
              title:
                'A preparação para o ENEM envolve constância e resiliência. Qual das alternativas representa a melhor prática de estudos?',
              options: [
                {
                  id: 'A',
                  text: 'Fazer simulados frequentes e analisar os erros cometidos.',
                  isCorrect: true,
                },
                {
                  id: 'B',
                  text: 'Estudar somente na véspera da prova.',
                  isCorrect: false,
                },
                {
                  id: 'C',
                  text: 'Evitar fazer revisões de matérias antigas.',
                  isCorrect: false,
                },
                {
                  id: 'D',
                  text: 'Decorar fórmulas sem entender a aplicação prática.',
                  isCorrect: false,
                },
              ],
              discipline:
                dayType === 'DIA1'
                  ? 'Linguagens, Códigos e suas Tecnologias'
                  : 'Matemática e suas Tecnologias',
              subject: 'Orientação de Estudos',
            },
          ];
        }

        // Obter a quantidade total de simulados ENEM já criados deste dia para este aluno para fins de numeração sequencial
        const totalEnemDayCount = await prisma.simulado.count({
          where: {
            studentId: student.id,
            subject: `ENEM_${dayType}`,
          },
        });
        const simuladoNumber = totalEnemDayCount + 1;

        timeLimit = dayType === 'DIA1' ? 330 : 300;
        title = `Simulado ENEM nº ${simuladoNumber} — ${dayLabel}`;
        description = `Prova personalizada com questões selecionadas para evitar repetição.`;
      } else {
        const rawQuestions = Array.isArray(template.questions)
          ? template.questions
          : [];
        questionsToUse = rawQuestions.map((q: any) => ({
          id: q.id || `q-${Math.random()}`,
          title: q.title || q.context || '',
          options: q.options || [],
          discipline:
            q.discipline ||
            (dayType === 'DIA1'
              ? 'Linguagens, Códigos e suas Tecnologias'
              : 'Matemática e suas Tecnologias'),
          subject: q.subject || 'Geral',
        }));

        timeLimit =
          template.timeLimitMinutes || (dayType === 'DIA1' ? 330 : 300);
        title = `${template.title} — ${dayLabel}`;
        description = template.description || '';
      }

      await prisma.simulado.create({
        data: {
          title,
          description,
          subject: `ENEM_${dayType}`,
          creatorId: adminId,
          studentId: student.id,
          status: 'Pendente',
          maxAttempts: 1,
          timeLimitMinutes: timeLimit,
          questions: questionsToUse,
          attempts: [],
        },
      });

      await prisma.notification.create({
        data: {
          userId: student.id,
          title: `🎯 Simulado ENEM ${dayLabel} disponível!`,
          message: `Seu simulado "${title}" está no seu painel. Você tem ${timeLimit} minutos. Boa sorte!`,
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
