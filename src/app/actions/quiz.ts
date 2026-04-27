'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export type QuizQuestionType = 'text' | 'select' | 'multiselect' | 'radio';

export interface QuizQuestionData {
  id?: string;
  question: string;
  questionPt?: string;
  type: QuizQuestionType;
  options?: string[];
  placeholder?: string;
  isRequired?: boolean;
  order?: number;
  isActive?: boolean;
}

export async function getQuizQuestions() {
  try {
    const questions = await prisma.quizQuestion.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const formattedQuestions = questions.map((q) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : [],
    }));

    return { success: true, data: formattedQuestions };
  } catch (error) {
    console.error('Erro ao buscar perguntas do questionário:', error);
    return { success: false, error: 'Falha ao buscar perguntas.' };
  }
}

export async function getAllQuizQuestions() {
  try {
    const questions = await prisma.quizQuestion.findMany({
      orderBy: { order: 'asc' },
    });

    const formattedQuestions = questions.map((q) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : [],
    }));

    return { success: true, data: formattedQuestions };
  } catch (error) {
    console.error('Erro ao buscar perguntas do questionário:', error);
    return { success: false, error: 'Falha ao buscar perguntas.' };
  }
}

export async function createQuizQuestion(data: QuizQuestionData) {
  try {
    const lastQuestion = await prisma.quizQuestion.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

    const question = await prisma.quizQuestion.create({
      data: {
        id: crypto.randomUUID(),
        question: data.question,
        questionPt: data.questionPt || data.question,
        type: data.type,
        options: data.options ? JSON.stringify(data.options) : '[]',
        placeholder: data.placeholder || '',
        isRequired: data.isRequired || false,
        order: data.order ?? nextOrder,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath('/dashboard/admin/settings');
    return { success: true, data: question };
  } catch (error) {
    console.error('Erro ao criar pergunta:', error);
    return { success: false, error: 'Falha ao criar pergunta.' };
  }
}

export async function updateQuizQuestion(id: string, data: Partial<QuizQuestionData>) {
  try {
    const updateData: any = {};

    if (data.question !== undefined) updateData.question = data.question;
    if (data.questionPt !== undefined) updateData.questionPt = data.questionPt;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.options !== undefined) updateData.options = JSON.stringify(data.options);
    if (data.placeholder !== undefined) updateData.placeholder = data.placeholder;
    if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const question = await prisma.quizQuestion.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/dashboard/admin/settings');
    return { success: true, data: question };
  } catch (error) {
    console.error('Erro ao atualizar pergunta:', error);
    return { success: false, error: 'Falha ao atualizar pergunta.' };
  }
}

export async function deleteQuizQuestion(id: string) {
  try {
    await prisma.quizQuestion.delete({
      where: { id },
    });

    revalidatePath('/dashboard/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir pergunta:', error);
    return { success: false, error: 'Falha ao excluir pergunta.' };
  }
}

export async function reorderQuizQuestions(questions: { id: string; order: number }[]) {
  try {
    await prisma.$transaction(
      questions.map((q) =>
        prisma.quizQuestion.update({
          where: { id: q.id },
          data: { order: q.order },
        })
      )
    );

    revalidatePath('/dashboard/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Erro ao reordenar perguntas:', error);
    return { success: false, error: 'Falha ao reordenar perguntas.' };
  }
}