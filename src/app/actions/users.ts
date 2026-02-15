'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 1. Buscar todos os alunos
export async function getStudents() {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: students };
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return { success: false, error: 'Falha ao buscar alunos no banco de dados.' };
  }
}

// 2. Adicionar Créditos (Aulas) para um aluno
export async function addCreditsToStudent(studentId: string, creditsToAdd: number) {
  try {
    // Busca o aluno primeiro para ver quantos créditos ele já tem
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return { success: false, error: 'Aluno não encontrado.' };
    }

    // Soma os créditos antigos com os novos
    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: {
        credits: student.credits + creditsToAdd,
        status: 'active' // Se o cara comprou, garantimos que a conta tá ativa
      }
    });

    // Atualiza a tela do CRM
    revalidatePath('/dashboard/students');

    return { success: true, newTotal: updatedStudent.credits };
  } catch (error) {
    console.error('Erro ao adicionar créditos:', error);
    return { success: false, error: 'Não foi possível adicionar os créditos ao aluno.' };
  }
}

// 3. Aprovar / Bloquear acesso do Aluno
export async function toggleStudentStatus(studentId: string, newStatus: 'active' | 'inactive') {
  try {
    await prisma.user.update({
      where: { id: studentId },
      data: { status: newStatus }
    });

    revalidatePath('/dashboard/students');
    return { success: true };
  } catch (error) {
    console.error('Erro ao alterar status do aluno:', error);
    return { success: false, error: 'Falha ao alterar o status do aluno.' };
  }
}