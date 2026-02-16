'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Buscar todos os alunos
export async function getStudents() {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: students };
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return { success: false, error: 'Falha ao buscar alunos no banco de dados.' };
  }
}

export async function getActiveUsers() {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: users };
  } catch (error) {
    console.error('Erro ao buscar usuarios ativos:', error);
    return { success: false, error: 'Falha ao buscar usuarios ativos.' };
  }
}

// Adicionar creditos (aulas) para um aluno
export async function addCreditsToStudent(studentId: string, creditsToAdd: number) {
  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return { success: false, error: 'Aluno nao encontrado.' };
    }

    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: {
        credits: student.credits + creditsToAdd,
        status: 'active',
      },
    });

    revalidatePath('/dashboard/students');

    return { success: true, newTotal: updatedStudent.credits };
  } catch (error) {
    console.error('Erro ao adicionar creditos:', error);
    return { success: false, error: 'Nao foi possivel adicionar os creditos ao aluno.' };
  }
}

// Aprovar / Bloquear acesso do aluno
export async function toggleStudentStatus(studentId: string, newStatus: 'active' | 'inactive') {
  try {
    await prisma.user.update({
      where: { id: studentId },
      data: { status: newStatus },
    });

    revalidatePath('/dashboard/students');
    return { success: true };
  } catch (error) {
    console.error('Erro ao alterar status do aluno:', error);
    return { success: false, error: 'Falha ao alterar o status do aluno.' };
  }
}

// Buscar apenas professores ativos
export async function getTeachers() {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: 'teacher',
        status: 'active',
      },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: teachers };
  } catch (error) {
    console.error('Erro ao buscar professores:', error);
    return { success: false, error: 'Falha ao buscar professores do banco de dados.' };
  }
}

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
        subject: data.subject,
      },
    });
    revalidatePath('/dashboard/teachers');
    return { success: true, data: newTeacher };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Erro ao criar. O email ja pode estar em uso.' };
  }
}

export async function updateTeacher(id: string, data: { name: string; email: string; subject: string }) {
  try {
    await prisma.user.update({
      where: { id },
      data: { name: data.name, email: data.email, subject: data.subject },
    });
    revalidatePath('/dashboard/teachers');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Erro ao atualizar os dados do professor.' };
  }
}

export async function deleteTeacher(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/dashboard/teachers');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Nao foi possivel deletar. Podem haver aulas atreladas a ele.' };
  }
}

export async function createStudent(data: { name: string; email: string; password: string }) {
  try {
    const newStudent = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'student',
        status: 'active',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}&backgroundColor=03A9F4&textColor=000000`,
        credits: 0,
      },
    });
    revalidatePath('/dashboard/students');
    return { success: true, data: newStudent };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Erro ao criar aluno. O email ja pode estar em uso.' };
  }
}

export async function getUserById(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return { success: false, error: 'Usuario nao encontrado.' };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Erro ao buscar usuario.' };
  }
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string; email?: string; avatarUrl?: string; subject?: string; status?: string }
) {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard');

    return { success: true, data: updated };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return { success: false, error: 'Falha ao atualizar perfil.' };
  }
}

export async function updateUserPassword(userId: string, currentPassword: string, newPassword: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: 'Usuario nao encontrado.' };
    }

    if (user.password !== currentPassword) {
      return { success: false, error: 'Senha atual incorreta.' };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return { success: false, error: 'Falha ao atualizar senha.' };
  }
}
