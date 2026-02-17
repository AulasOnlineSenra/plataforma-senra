'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendNewBookingNotificationEmail } from '@/lib/mailer';

type BookingInput = {
  subjectId: string;
  teacherId: string;
  start: Date;
  end: Date;
  isExperimental: boolean;
};

export async function createBookings(studentId: string, bookings: BookingInput[]) {
  try {
    if (!bookings.length) {
      return { success: false, error: 'Nenhuma aula informada.' };
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) return { success: false, error: 'Aluno nao encontrado.' };

    const teacherIds = Array.from(new Set(bookings.map((booking) => booking.teacherId)));
    const teachers = await prisma.user.findMany({
      where: { id: { in: teacherIds }, role: 'teacher' },
      select: { id: true, name: true, email: true },
    });

    if (teachers.length !== teacherIds.length) {
      return { success: false, error: 'Um ou mais professores nao foram encontrados.' };
    }

    const teachersById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
    const nonExperimentalCount = bookings.filter((booking) => !booking.isExperimental).length;

    if (student.credits < nonExperimentalCount) {
      return { success: false, error: 'Voce nao tem creditos suficientes para este agendamento.' };
    }

    await prisma.$transaction(async (tx) => {
      if (nonExperimentalCount > 0) {
        await tx.user.update({
          where: { id: studentId },
          data: { credits: { decrement: nonExperimentalCount } },
        });
      }

      for (const booking of bookings) {
        await tx.lesson.create({
          data: {
            studentId,
            teacherId: booking.teacherId,
            subject: booking.subjectId,
            date: booking.start,
            endDate: booking.end,
            isExperimental: booking.isExperimental,
            status: 'PENDING',
          },
        });
      }
    });

    const firstBookingByTeacher = new Map<string, BookingInput>();
    bookings.forEach((booking) => {
      if (!firstBookingByTeacher.has(booking.teacherId)) {
        firstBookingByTeacher.set(booking.teacherId, booking);
      }
    });

    // Notificacao de nova marcacao para o professor (email real via nodemailer, se SMTP estiver configurado).
    await Promise.allSettled(
      Array.from(firstBookingByTeacher.entries()).map(async ([teacherId, booking]) => {
        const teacher = teachersById.get(teacherId);
        if (!teacher) return;

        await sendNewBookingNotificationEmail({
          teacherEmail: teacher.email,
          teacherName: teacher.name,
          studentName: student.name,
          subject: booking.subjectId,
          startAt: booking.start,
        });
      })
    );

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/schedule');
    revalidatePath('/dashboard/minhas-aulas');
    revalidatePath('/dashboard/historico');

    return { success: true };
  } catch (error) {
    console.error('Erro ao processar agendamentos:', error);
    return { success: false, error: 'Erro interno do servidor ao agendar. Tente novamente.' };
  }
}

export async function createBooking(studentId: string, booking: BookingInput) {
  return createBookings(studentId, [booking]);
}

export async function confirmLesson(lessonId: string, teacherId: string, meetingLink: string) {
  try {
    const cleanedLink = meetingLink.trim();
    if (!cleanedLink) {
      return { success: false, error: 'Informe um link do Google Meet valido.' };
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, teacherId },
    });

    if (!lesson) {
      return { success: false, error: 'Aula nao encontrada para este professor.' };
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: { status: 'CONFIRMED', meetingLink: cleanedLink },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/schedule');
    revalidatePath('/dashboard/minhas-aulas');
    revalidatePath('/dashboard/historico');

    return { success: true, data: updatedLesson };
  } catch (error) {
    console.error('Erro ao confirmar aula:', error);
    return { success: false, error: 'Nao foi possivel confirmar a aula.' };
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
      role === 'admin' ? {} : role === 'teacher' ? { teacherId: userId } : { studentId: userId };

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        student: { select: { id: true, name: true, email: true } },
        teacher: { select: { id: true, name: true, email: true } },
      },
    });

    return { success: true, data: lessons };
  } catch (error) {
    console.error('Erro ao buscar aulas do usuario:', error);
    return { success: false, error: 'Erro ao buscar aulas do usuario.' };
  }
}
