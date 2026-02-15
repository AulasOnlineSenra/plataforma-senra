'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Buscar todos os alunos
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

// Adicionar Créditos (Aulas) para um aluno
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

// Aprovar / Bloquear acesso do Aluno
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

// Buscar apenas Professores Ativos
export async function getTeachers() {
  try {
    const teachers = await prisma.user.findMany({
      where: { 
        role: 'teacher',
        status: 'active'
      },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: teachers };
  } catch (error) {
    console.error('Erro ao buscar professores:', error);
    return { success: false, error: 'Falha ao buscar professores do banco de dados.' };
  }
}
// Criar um novo Professor
// 5. Criar um novo Professor
export async function createTeacher(data: { name: string; email: string; password: string; subject: string }) {
  try {
    const newTeacher = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password, 
        role: 'teacher',
        status: 'active',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}&backgroundColor=FFC107&textColor=000000`, 
        credits: 0,
        subject: data.subject // Salvando a matéria no banco!
      }
    });
    revalidatePath('/dashboard/teachers');
    return { success: true, data: newTeacher };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Erro ao criar. O email já pode estar em uso.' };
  }
}

// 6. Editar Professor
export async function updateTeacher(id: string, data: { name: string; email: string; subject: string }) {
  try {
    await prisma.user.update({
      where: { id },
      data: { name: data.name, email: data.email, subject: data.subject } // Atualizando a matéria no banco!
    });
    revalidatePath('/dashboard/teachers');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Erro ao atualizar os dados do professor.' };
  }
}

// Deletar Professor
export async function deleteTeacher(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/dashboard/teachers');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Não foi possível deletar. Podem haver aulas atreladas a ele.' };
  }
}