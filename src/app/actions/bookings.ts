'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

type BookingInput = {
  subjectId: string;
  teacherId: string;
  start: Date;
  end: Date;
  isExperimental: boolean;
};

export async function createBookings(studentId: string, bookings: BookingInput[]) {
  try {
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) return { success: false, error: 'Aluno não encontrado.' };

    const nonExperimentalCount = bookings.filter(b => !b.isExperimental).length;

    // 1. Barrar quem não tem crédito!
    if (student.credits < nonExperimentalCount) {
      return { success: false, error: 'Você não tem créditos suficientes para este agendamento.' };
    }

    // Ou faz os dois juntos, ou cancela tudo.
    // Isso evita o bug de descontar crédito e a aula dar erro, ou criar aula sem descontar.
    await prisma.$transaction(async (tx) => {
      
      // Debita os créditos do aluno (se não for aula experimental)
      if (nonExperimentalCount > 0) {
        await tx.user.update({
          where: { id: studentId },
          data: { credits: { decrement: nonExperimentalCount } }
        });
      }

      // Cria todas as aulas na agenda
      for (const booking of bookings) {
        await tx.lesson.create({
          data: {
            studentId,
            teacherId: booking.teacherId,
            subject: booking.subjectId,
            date: booking.start,
            endDate: booking.end,
            isExperimental: booking.isExperimental,
            status: 'scheduled'
          }
        });
      }
    });

    // Atualiza as telas para mostrarem os dados novos na mesma hora
    revalidatePath('/dashboard/schedule');
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao processar agendamentos:', error);
    return { success: false, error: 'Erro interno do servidor ao agendar. Tente novamente.' };
  }
}

export async function getLessons() {
  try {
    const lessons = await prisma.lesson.findMany({
      orderBy: { date: 'asc' },
    });

    return { success: true, data: lessons };
  } catch (error) {
    console.error('Erro ao buscar aulas:', error);
    return { success: false, error: 'Erro ao buscar aulas.' };
  }
}

export async function getLessonsForUser(userId: string, role: string) {
  try {
    const where =
      role === 'admin'
        ? {}
        : role === 'teacher'
          ? { teacherId: userId }
          : { studentId: userId };

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        student: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    return { success: true, data: lessons };
  } catch (error) {
    console.error('Erro ao buscar aulas do usuario:', error);
    return { success: false, error: 'Erro ao buscar aulas do usuario.' };
  }
}
