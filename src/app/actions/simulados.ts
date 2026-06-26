'use server';

import prisma from '@/lib/prisma';
import crypto from 'crypto';

type SimuladoQuestionOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type SimuladoQuestion = {
  id: string;
  title: string;
  type: 'multiple-choice' | 'short-answer' | 'paragraph';
  options: SimuladoQuestionOption[];
  isRequired: boolean;
};

type SimuladoAttempt = {
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  score: number;
  userAnswers: Record<string, string>;
};

type UpsertSimuladoInput = {
  id?: string;
  title: string;
  description: string;
  subject: string;
  creatorId: string;
  studentId: string;
  maxAttempts: number;
  timeLimitMinutes?: number;
  questions: SimuladoQuestion[];
};

function asQuestions(value: unknown): SimuladoQuestion[] {
  return Array.isArray(value) ? (value as SimuladoQuestion[]) : [];
}

function asAttempts(value: unknown): SimuladoAttempt[] {
  return Array.isArray(value) ? (value as SimuladoAttempt[]) : [];
}

export async function listSimuladosForUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return { success: false, error: 'Usuario não encontrado.' };
    }

    const where =
      user.role === 'admin'
        ? {}
        : user.role === 'teacher'
          ? { creatorId: user.id }
          : { studentId: user.id };

    const simulados = await prisma.simulado.findMany({
      where,
      include: {
        User_Simulado_creatorIdToUser: { select: { id: true, name: true } },
        User_Simulado_studentIdToUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const normalized = simulados.map((s) => ({
      ...s,
      creator: (s as any).User_Simulado_creatorIdToUser,
      student: (s as any).User_Simulado_studentIdToUser,
      questions: asQuestions(s.questions),
      attempts: asAttempts(s.attempts),
    }));

    return { success: true, data: normalized };
  } catch (error) {
    console.error('Erro ao listar simulados:', error);
    return { success: false, error: 'Falha ao listar simulados.' };
  }
}

export async function getSimuladoById(simuladoId: string) {
  try {
    const simulado = await prisma.simulado.findUnique({
      where: { id: simuladoId },
      include: {
        User_Simulado_creatorIdToUser: { select: { id: true, name: true } },
        User_Simulado_studentIdToUser: { select: { id: true, name: true } },
      },
    });

    if (!simulado) {
      return { success: false, error: 'Simulado não encontrado.' };
    }

    return {
      success: true,
      data: {
        ...simulado,
        creator: (simulado as any).User_Simulado_creatorIdToUser,
        student: (simulado as any).User_Simulado_studentIdToUser,
        questions: asQuestions(simulado.questions),
        attempts: asAttempts(simulado.attempts),
      },
    };
  } catch (error) {
    console.error('Erro ao buscar simulado:', error);
    return { success: false, error: 'Falha ao buscar simulado.' };
  }
}

export async function upsertSimulado(input: UpsertSimuladoInput) {
  try {
    if (!input.title.trim() || !input.subject.trim()) {
      return { success: false, error: 'Titulo e disciplina sao obrigatorios.' };
    }

    if (!input.questions.length) {
      return { success: false, error: 'Adicione ao menos uma questao.' };
    }

    const payload = {
      title: input.title.trim(),
      description: input.description.trim(),
      subject: input.subject.trim(),
      creatorId: input.creatorId,
      studentId: input.studentId,
      maxAttempts: Math.max(1, input.maxAttempts || 1),
      timeLimitMinutes: input.timeLimitMinutes ?? null,
      questions: input.questions,
    };

    if (input.id) {
      const existing = await prisma.simulado.findUnique({ where: { id: input.id } });
      if (!existing) {
        return { success: false, error: 'Simulado não encontrado para edicao.' };
      }

      const updated = await prisma.simulado.update({
        where: { id: input.id },
        data: payload,
      });
      return { success: true, data: updated };
    }

    const created = await prisma.simulado.create({
      data: {
        id: crypto.randomUUID(),
        ...payload,
        status: 'Pendente',
        attempts: [],
      },
    });

    return { success: true, data: created };
  } catch (error) {
    console.error('Erro ao salvar simulado:', error);
    return { success: false, error: 'Falha ao salvar simulado.' };
  }
}

export async function deleteSimulado(simuladoId: string) {
  try {
    await prisma.simulado.delete({ where: { id: simuladoId } });
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar simulado:', error);
    return { success: false, error: 'Falha ao deletar simulado.' };
  }
}

export async function startSimuladoAttempt(simuladoId: string) {
  try {
    const simulado = await prisma.simulado.findUnique({
      where: { id: simuladoId },
    });

    if (!simulado) {
      return { success: false, error: 'Simulado não encontrado.' };
    }

    const existingAttempts = asAttempts(simulado.attempts);
    
    // Verificar se já existe uma tentativa ativa (com completedAt vazio/nulo)
    const activeAttempt = existingAttempts.find((a) => !a.completedAt);
    if (activeAttempt) {
      return { success: true, startedAt: activeAttempt.startedAt };
    }

    // Verificar limite de tentativas concluídas
    const completedAttempts = existingAttempts.filter((a) => a.completedAt);
    if (completedAttempts.length >= simulado.maxAttempts) {
      return { success: false, error: 'Limite de tentativas atingido.' };
    }

    const startedAt = new Date().toISOString();
    const newAttempt = {
      startedAt,
      completedAt: '', // indica ativa
      durationSeconds: 0,
      score: 0,
      userAnswers: {},
    };

    await prisma.simulado.update({
      where: { id: simuladoId },
      data: {
        status: 'EmAndamento',
        attempts: [...existingAttempts, newAttempt],
      },
    });

    return { success: true, startedAt };
  } catch (error) {
    console.error('Erro ao iniciar tentativa de simulado:', error);
    return { success: false, error: 'Falha ao iniciar tentativa.' };
  }
}

export async function submitSimuladoAttempt(params: {
  simuladoId: string;
  startedAt: string;
  completedAt: string;
  userAnswers: Record<string, string>;
}) {
  try {
    const simulado = await prisma.simulado.findUnique({
      where: { id: params.simuladoId },
    });

    if (!simulado) {
      return { success: false, error: 'Simulado não encontrado.' };
    }

    const questions = asQuestions(simulado.questions);
    const existingAttempts = asAttempts(simulado.attempts);

    const completedAttempts = existingAttempts.filter((a) => a.completedAt);
    if (completedAttempts.length >= simulado.maxAttempts) {
      return { success: false, error: 'Limite de tentativas atingido.' };
    }

    const startedAt = new Date(params.startedAt);
    const completedAt = new Date(params.completedAt);
    const durationSeconds = Math.max(
      0,
      Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)
    );

    let correct = 0;
    questions.forEach((question) => {
      const correctOption = question.options.find((option) => option.isCorrect);
      if (correctOption && params.userAnswers[question.id] === correctOption.id) {
        correct += 1;
      }
    });

    const score = questions.length > 0 ? (correct / questions.length) * 100 : 0;

    const newAttempt: SimuladoAttempt = {
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationSeconds,
      score,
      userAnswers: params.userAnswers,
    };

    // Remove qualquer tentativa ativa pendente e adiciona a nova concluída
    const filteredAttempts = existingAttempts.filter((a) => a.completedAt);

    const updated = await prisma.simulado.update({
      where: { id: params.simuladoId },
      data: {
        status: 'Concluido',
        attempts: [...filteredAttempts, newAttempt],
      },
    });

    return { success: true, data: { simulado: updated, score, durationSeconds } };
  } catch (error) {
    console.error('Erro ao enviar tentativa do simulado:', error);
    return { success: false, error: 'Falha ao enviar tentativa.' };
  }
}

export type DatabaseQuestionInput = {
  title?: string;
  discipline: string;
  subject: string;
  difficulty: string;
  context: string;
  files?: string[];
  correctAlternative: string;
  alternatives: { letter: string; text: string; file?: string }[];
  creatorId: string;
};

export async function createQuestion(input: DatabaseQuestionInput) {
  try {
    if (!input.discipline || !input.subject || !input.context || !input.correctAlternative) {
      return { success: false, error: 'Campos obrigatórios ausentes.' };
    }

    const question = await prisma.question.create({
      data: {
        title: input.title || null,
        discipline: input.discipline,
        subject: input.subject,
        difficulty: input.difficulty || 'Médio',
        context: input.context,
        files: JSON.stringify(input.files || []),
        correctAlternative: input.correctAlternative,
        alternatives: input.alternatives,
        creatorId: input.creatorId,
      },
    });

    return { success: true, data: question };
  } catch (error) {
    console.error('Erro ao criar questão:', error);
    return { success: false, error: 'Falha ao criar questão.' };
  }
}

export async function getLocalQuestionsCount() {
  try {
    const count = await prisma.question.count();
    return { success: true, count };
  } catch (error) {
    console.error('Erro ao contar questões locais:', error);
    return { success: false, count: 0 };
  }
}

export async function listDatabaseQuestions(filters: {
  discipline?: string;
  subject?: string;
  difficulty?: string;
}) {
  try {
    const where: any = {};
    if (filters.discipline && filters.discipline !== 'all') {
      where.discipline = filters.discipline;
    }
    if (filters.subject) {
      where.subject = { contains: filters.subject, mode: 'insensitive' };
    }
    if (filters.difficulty && filters.difficulty !== 'all') {
      where.difficulty = filters.difficulty;
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = questions.map((q) => ({
      ...q,
      files: (() => {
        try {
          return JSON.parse(q.files);
        } catch {
          return [];
        }
      })(),
    }));

    return { success: true, data: parsed };
  } catch (error) {
    console.error('Erro ao buscar questões:', error);
    return { success: false, error: 'Falha ao buscar questões.' };
  }
}

export async function deleteQuestion(questionId: string) {
  try {
    await prisma.question.delete({ where: { id: questionId } });
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar questão:', error);
    return { success: false, error: 'Falha ao deletar questão.' };
  }
}

export async function fetchEnemQuestions(year: number, limit = 15, offset = 0) {
  try {
    const res = await fetch(`https://api.enem.dev/v1/exams/${year}/questions?limit=${limit}&offset=${offset}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      throw new Error(`Status da resposta inválido: ${res.status}`);
    }
    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    console.error('Erro ao buscar questões do ENEM:', error);
    return { success: false, error: error.message || 'Falha ao buscar questões do ENEM.' };
  }
}

export async function checkEnemGabaritoRelease(simuladoId: string) {
  try {
    const simulado = await prisma.simulado.findUnique({
      where: { id: simuladoId },
    });

    if (!simulado) {
      return { success: false, error: 'Simulado não encontrado.' };
    }

    const isEnem = simulado.subject.startsWith('ENEM_');
    if (!isEnem) {
      // Simulados normais são liberados imediatamente
      return { success: true, released: true };
    }

    const studentId = simulado.studentId;
    const createdAt = new Date(simulado.createdAt);
    const month = createdAt.getMonth();
    const year = createdAt.getFullYear();

    // Buscar o simulado do Dia 2 do mesmo aluno criado no mesmo mês e ano
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const dia2Simulado = await prisma.simulado.findFirst({
      where: {
        studentId,
        subject: 'ENEM_DIA2',
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    if (!dia2Simulado || dia2Simulado.status !== 'Concluido') {
      return {
        success: true,
        released: false,
        reason: 'O gabarito estará disponível 60 minutos após a conclusão do simulado do Dia 2.',
      };
    }

    // O Dia 2 está concluído. Pegar o horário de conclusão do Dia 2
    const attempts = asAttempts(dia2Simulado.attempts);
    const lastAttempt = attempts[attempts.length - 1];
    if (!lastAttempt) {
      return {
        success: true,
        released: false,
        reason: 'O simulado do Dia 2 foi marcado como concluído mas não possui tentativas.',
      };
    }

    const completedAt = new Date(lastAttempt.completedAt);
    const now = new Date();
    const releaseTime = new Date(completedAt.getTime() + 60 * 60 * 1000); // 60 minutos depois

    if (now < releaseTime) {
      return {
        success: true,
        released: false,
        releaseTime: releaseTime.toISOString(),
        reason: `O gabarito estará disponível em ${completedAt.toLocaleDateString('pt-BR')} às ${releaseTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (60 minutos após a finalização do segundo dia de prova).`,
      };
    }

    // Liberado! Vamos calcular estatísticas de desempenho por área e matéria
    const qList = asQuestions(simulado.questions);
    const sAttempts = asAttempts(simulado.attempts);
    const sLastAttempt = sAttempts[sAttempts.length - 1];

    let totalQuestions = qList.length;
    let totalCorrect = 0;
    let totalWrong = 0;

    const areaStats: Record<string, { correct: number; wrong: number; total: number }> = {};
    const subjectStats: Record<string, { correct: number; wrong: number; total: number }> = {};

    if (sLastAttempt) {
      qList.forEach((q) => {
        const discipline = q.discipline || (simulado.subject === 'ENEM_DIA1' ? 'Linguagens, Códigos e suas Tecnologias' : 'Matemática e suas Tecnologias');
        const subject = q.subject || 'Geral';

        const correctOpt = q.options.find((opt) => opt.isCorrect);
        const userAns = sLastAttempt.userAnswers[q.id];
        const isCorrect = correctOpt && userAns === correctOpt.id;

        if (!areaStats[discipline]) areaStats[discipline] = { correct: 0, wrong: 0, total: 0 };
        if (!subjectStats[subject]) subjectStats[subject] = { correct: 0, wrong: 0, total: 0 };

        areaStats[discipline].total++;
        subjectStats[subject].total++;

        if (isCorrect) {
          totalCorrect++;
          areaStats[discipline].correct++;
          subjectStats[subject].correct++;
        } else {
          totalWrong++;
          areaStats[discipline].wrong++;
          subjectStats[subject].wrong++;
        }
      });
    }

    return {
      success: true,
      released: true,
      stats: {
        totalQuestions,
        totalCorrect,
        totalWrong,
        score: sLastAttempt ? sLastAttempt.score : 0,
        areaStats,
        subjectStats,
      },
    };
  } catch (error) {
    console.error('Erro ao verificar liberação do gabarito:', error);
    return { success: false, error: 'Falha ao processar liberação do gabarito.' };
  }
}

