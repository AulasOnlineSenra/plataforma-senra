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

export async function getSubjects() {
  try {
    let subjectsTable: { id: string; name: string }[] = [];
    try {
      subjectsTable = await prisma.subject.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.warn('Tabela Subject indisponivel. Usando fallback por professores.', error);
    }

    const teacherSubjects = await prisma.user.findMany({
      where: {
        role: 'teacher',
        status: 'active',
        subject: { not: null },
      },
      select: { subject: true },
    });

    const normalized = new Map<string, { id: string; name: string }>();

    for (const subject of subjectsTable) {
      const name = subject.name.trim();
      if (!name) continue;
      normalized.set(name.toLocaleLowerCase('pt-BR'), { id: subject.id, name });
    }

    for (const teacher of teacherSubjects) {
      const name = (teacher.subject || '').trim();
      if (!name) continue;
      const key = name.toLocaleLowerCase('pt-BR');
      if (!normalized.has(key)) {
        normalized.set(key, {
          id: `teacher-subject-${key.replace(/\s+/g, '-')}`,
          name,
        });
      }
    }

    const subjects = Array.from(normalized.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR')
    );

    return { success: true, data: subjects };
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    return { success: false, error: 'Falha ao buscar disciplinas do banco de dados.' };
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

// Atualizar Perfil 
export async function updateUserProfile(userId: string, data: { name: string; email: string }) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}&backgroundColor=FFC107&textColor=000000`
      }
    });
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ocorreu um erro ao atualizar o perfil. O e-mail já pode estar em uso.' };
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

export async function applyReferralOnSignup(newUserId: string, referralCode?: string) {
  try {
    const cleanedCode = referralCode?.trim();
    if (!cleanedCode) return { success: true, applied: false };

    const newUser = await prisma.user.findUnique({ where: { id: newUserId } });
    if (!newUser) return { success: false, error: 'Novo usuario nao encontrado.' };

    const owner = await prisma.user.findUnique({
      where: { referralCode: cleanedCode },
      select: { id: true },
    });

    if (!owner || owner.id === newUserId) {
      return { success: true, applied: false };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: newUserId },
        data: { referredById: owner.id },
      }),
      prisma.user.update({
        where: { id: owner.id },
        data: { credits: { increment: 1 } },
      }),
    ]);

    revalidatePath('/dashboard/indicacoes');
    revalidatePath('/dashboard/marketing');
    revalidatePath('/dashboard/financeiro');
    return { success: true, applied: true };
  } catch (error) {
    console.error('Erro ao aplicar indicacao:', error);
    return { success: false, error: 'Falha ao aplicar codigo de indicacao.' };
  }
}

export async function getReferralSummary(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        referralCode: true,
        referrals: {
          select: { id: true, name: true, email: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) return { success: false, error: 'Usuario nao encontrado.' };
    return { success: true, data: user };
  } catch (error) {
    console.error('Erro ao buscar resumo de indicacoes:', error);
    return { success: false, error: 'Falha ao buscar indicacoes.' };
  }
}

export async function getReferralRanking() {
  try {
    const ranking = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        credits: true,
        createdAt: true,
        _count: { select: { referrals: true } },
      },
      orderBy: [{ referrals: { _count: 'desc' } }, { createdAt: 'asc' }],
      take: 50,
    });

    return { success: true, data: ranking };
  } catch (error) {
    console.error('Erro ao buscar ranking de indicacoes:', error);
    return { success: false, error: 'Falha ao buscar ranking.' };
  }
}

export async function getCrmUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('Erro ao buscar usuarios do CRM:', error);
    return { success: false, error: 'Falha ao carregar usuarios.' };
  }
}

export async function getStudentFinancialSummary(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        credits: true,
      },
    });
    if (!user) return { success: false, error: 'Usuario nao encontrado.' };

    const lessons = await prisma.lesson.findMany({
      where: { studentId: userId, isExperimental: false },
      select: {
        id: true,
        subject: true,
        status: true,
        date: true,
        teacher: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    return { success: true, data: { user, lessons } };
  } catch (error) {
    console.error('Erro ao buscar financeiro do aluno:', error);
    return { success: false, error: 'Falha ao carregar financeiro do aluno.' };
  }
}

// Ação para promover um Aluno a Professor
export async function promoteToTeacherAction(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'teacher' }
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao promover usuário:", error);
    return { success: false, error: 'Falha ao atualizar o cargo do usuário.' };
  }
}
