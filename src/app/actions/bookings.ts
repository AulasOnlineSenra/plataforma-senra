"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendNewBookingNotificationEmail } from "@/lib/mailer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import crypto from "crypto";

type BookingInput = {
  subjectId: string;
  teacherId: string;
  start: Date;
  end: Date;
  isExperimental: boolean;
};

export async function createBookings(
  studentId: string,
  bookings: BookingInput[],
  skipCreditCheck: boolean = false,
  tx?: any
) {
  try {
    if (!bookings.length) {
      return { success: false, error: "Nenhuma aula informada." };
    }

    const client = tx || prisma;

    const student = await client.user.findUnique({ where: { id: studentId } });
    if (!student) return { success: false, error: "Aluno não encontrado." };

    const teacherIds = Array.from(
      new Set(bookings.map((booking) => booking.teacherId)),
    );
    const teachers = await client.user.findMany({
      where: { id: { in: teacherIds }, role: "teacher" },
      select: { id: true, name: true, email: true },
    });

    // Se skipCreditCheck for true, não precisamos verificar se todos os professores existem
    if (!skipCreditCheck && teachers.length !== teacherIds.length) {
      return {
        success: false,
        error: "Um ou mais professores não foram encontrados.",
      };
    }

    // Se teachers está vazio (skipCreditCheck pode ter pulado a verificação), buscar os professores
    const teachersById = teachers.length > 0 
      ? new Map(teachers.map((teacher) => [teacher.id, teacher]))
      : new Map();
    const nonExperimentalCount = bookings.filter(
      (booking) => !booking.isExperimental,
    ).length;

    if (!skipCreditCheck && student.credits < nonExperimentalCount) {
      return {
        success: false,
        error: "Voce não tem créditos suficientes para este agendamento.",
      };
    }

    const executeWork = async (transactionClient: any) => {
      if (nonExperimentalCount > 0) {
        await transactionClient.user.update({
          where: { id: studentId },
          data: { credits: { decrement: nonExperimentalCount } },
        });
      }

      for (const booking of bookings) {
        await transactionClient.lesson.create({
          data: {
            id: crypto.randomUUID(),
            studentId,
            teacherId: booking.teacherId,
            subject: booking.subjectId,
            date: booking.start,
            endDate: booking.end,
            isExperimental: booking.isExperimental,
            status: "CONFIRMED",
            updatedAt: new Date(),
          },
        });
      }
    };

    if (tx) {
      // Já estamos em uma transação, apenas execute o trabalho
      await executeWork(tx);
    } else {
      // Inicie uma nova transação
      await prisma.$transaction(async (newTx) => {
        await executeWork(newTx);
      });
    }

    // Se teachersById está vazio (skipCreditCheck pulou a busca), buscar professores para notificação
    if (teachersById.size === 0) {
      const teacherIdsForNotify = Array.from(
        new Set(bookings.map((booking) => booking.teacherId)),
      );
      const teachersForNotify = await client.user.findMany({
        where: { id: { in: teacherIdsForNotify }, role: "teacher" },
        select: { id: true, name: true },
      });
      teachersForNotify.forEach(t => teachersById.set(t.id, t as any));
    }

    const firstBookingByTeacher = new Map<string, BookingInput>();
    bookings.forEach((booking) => {
      if (!firstBookingByTeacher.has(booking.teacherId)) {
        firstBookingByTeacher.set(booking.teacherId, booking);
      }
    });

    // Notificação de novo Agendamento para o professor
    if (teachersById.size > 0) {
      await Promise.allSettled(
        Array.from(firstBookingByTeacher.entries()).map(
          async ([teacherId, booking]) => {
            const teacher = teachersById.get(teacherId);
            if (!teacher) return;

            const startDate = booking.start;
            const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
            const formattedDate = format(startDate, "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) + ' - ' + format(endDate, "HH:mm");

            await client.notification.create({
              data: {
                id: crypto.randomUUID(),
                userId: teacherId,
                type: "class_scheduled",
                title: "Nova Aula Agendada!",
                message: `O aluno ${student.name} agendou uma aula de ${booking.subjectId} para o dia ${formattedDate}.`,
                read: false,
              },
            });
          },
        ),
      );
    }

    // Notificação confimando o agendamento para o aluno
    const studentFormattedDate = format(bookings[0].start, "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) + ' - ' + format(new Date(bookings[0].start.getTime() + 90 * 60 * 1000), "HH:mm");
    await client.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: studentId,
        type: "class_scheduled",
        title: "Aula Agendada com Sucesso!",
        message: `Sua aula de ${bookings[0].subjectId} foi agendada para o dia ${studentFormattedDate}.`,
        read: false,
      },
    });

    // Notificacao de nova marcacao para o professor via Chat (substituindo e-mail com erro SMTP)
    await Promise.allSettled(
      Array.from(firstBookingByTeacher.entries()).map(
        async ([teacherId, booking]) => {
          const teacher = teachersById.get(teacherId);
          if (!teacher) return;

          await prisma.chatMessage.create({
            data: {
              id: crypto.randomUUID(),
              senderId: studentId,
              receiverId: teacherId,
              content: `Olá Professor ${teacher.name}! Acabei de agendar uma aula de ${booking.subjectId} para o dia ${format(booking.start, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
            }
          });

          /* O e-mail está sendo desativado temporariamente devido a erro de autenticação SMTP relatado.
          await sendNewBookingNotificationEmail({
            teacherEmail: teacher.email,
            teacherName: teacher.name,
            studentName: student.name,
            subject: booking.subjectId,
            startAt: booking.start,
          });
          */
        },
      ),
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/minhas-aulas");
    revalidatePath("/dashboard/historico");

    return { success: true };
  } catch (error) {
    console.error("Erro ao processar agendamentos:", error);
    return {
      success: false,
      error: "Erro interno do servidor ao agendar. Tente novamente.",
    };
  }
}

export async function createBooking(studentId: string, booking: BookingInput) {
  return createBookings(studentId, [booking]);
}

export async function confirmLesson(
  lessonId: string,
  teacherId: string,
  meetingLink: string,
) {
  try {
    const cleanedLink = meetingLink.trim();
    if (!cleanedLink) {
      return {
        success: false,
        error: "Informe um link do Google Meet valido.",
      };
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, teacherId },
    });

    if (!lesson) {
      return {
        success: false,
        error: "Aula não encontrada para este professor.",
      };
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: { status: "CONFIRMED", meetingLink: cleanedLink },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/minhas-aulas");
    revalidatePath("/dashboard/historico");

    return { success: true, data: updatedLesson };
  } catch (error) {
    console.error("Erro ao confirmar aula:", error);
    return { success: false, error: "Não foi possivel confirmar a aula." };
  }
}

export async function getLessons() {
  try {
    const lessons = await prisma.lesson.findMany({
      orderBy: { date: "asc" },
    });

    return { success: true, data: lessons };
  } catch (error) {
    console.error("Erro ao buscar aulas:", error);
    return { success: false, error: "Erro ao buscar aulas." };
  }
}

export async function getLessonsForUser(userId: string, role: string) {
  try {
    const where =
      role === "admin"
        ? {}
        : role === "teacher"
          ? { teacherId: userId }
          : { studentId: userId };

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        student: { select: { id: true, name: true, email: true, avatarUrl: true } },
        teacher: { select: { id: true, name: true, email: true, avatarUrl: true, videoUrl: true } },
      },
    });

    return { success: true, data: lessons };
  } catch (error) {
    console.error("Erro ao buscar aulas do usuario:", error);
    return { success: false, error: "Erro ao buscar aulas do usuario." };
  }
}

export type LessonUpdateData = {
  subject?: string;
  date?: Date;
  endDate?: Date;
  teacherId?: string;
  studentId?: string;
  meetingLink?: string;
};

export async function updateLesson(lessonId: string, data: LessonUpdateData) {
  try {
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!existingLesson) {
      return { success: false, error: "Aula não encontrada." };
    }

    if (existingLesson.status === "COMPLETED" || existingLesson.status === "CANCELLED") {
      return { success: false, error: "Não é possível editar aulas já concluídas ou canceladas." };
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(data.subject && { subject: data.subject }),
        ...(data.date && { date: data.date }),
        ...(data.endDate && { endDate: data.endDate }),
        ...(data.teacherId && { teacherId: data.teacherId }),
        ...(data.studentId && { studentId: data.studentId }),
        ...(data.meetingLink !== undefined && { meetingLink: data.meetingLink }),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/minhas-aulas");
    revalidatePath("/dashboard/historico");

    return { success: true, data: updatedLesson };
  } catch (error) {
    console.error("Erro ao atualizar aula:", error);
    return { success: false, error: "Não foi possível atualizar a aula." };
  }
}

export async function cancelLesson(lessonId: string) {
  try {
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        student: { select: { name: true, email: true } },
        teacher: { select: { name: true, email: true } },
      },
    });

    if (!existingLesson) {
      return { success: false, error: "Aula não encontrada." };
    }

    if (existingLesson.status === "COMPLETED" || existingLesson.status === "CANCELLED") {
      return { success: false, error: "Aula já foi concluída ou cancelada anteriormente." };
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: { status: "CANCELLED" },
    });

    const cancelledStartDate = existingLesson.date;
    const cancelledEndDate = new Date(cancelledStartDate.getTime() + 90 * 60 * 1000);
    const cancelledFormattedDate = format(cancelledStartDate, "EEEE dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) + ' - ' + format(cancelledEndDate, "HH:mm");

    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: existingLesson.studentId,
        type: "class_cancelled",
        title: "Aula Cancelada",
        message: `A aula de ${existingLesson.subject} marcada para ${cancelledFormattedDate} foi cancelada.`,
        read: false,
      },
    });

    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: existingLesson.teacherId,
        type: "class_cancelled",
        title: "Aula Cancelada",
        message: `A aula de ${existingLesson.subject} com ${existingLesson.student.name} marcada para ${cancelledFormattedDate} foi cancelada.`,
        read: false,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/minhas-aulas");
    revalidatePath("/dashboard/historico");

    return { success: true, data: updatedLesson };
  } catch (error) {
    console.error("Erro ao cancelar aula:", error);
    return { success: false, error: "Não foi possível cancelar a aula." };
  }
}

export async function deleteLesson(lessonId: string) {
  try {
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!existingLesson) {
      return { success: false, error: "Aula não encontrada." };
    }

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/minhas-aulas");
    revalidatePath("/dashboard/historico");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir aula do histórico:", error);
    return { success: false, error: "Não foi possível excluir o histórico da aula." };
  }
}
