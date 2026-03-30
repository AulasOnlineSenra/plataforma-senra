"use server";

import prisma from "@/lib/prisma";

export async function submitRating(
  studentId: string,
  teacherId: string,
  score: number,
  givenBy: "student" | "teacher",
  lessonId?: string,
  comment?: string,
) {
  try {
    if (score < 1 || score > 5) {
      return { success: false, error: "A nota deve ser entre 1 e 5." };
    }

    const existing = await prisma.rating.findUnique({
      where: { studentId_teacherId_givenBy: { studentId, teacherId, givenBy } },
    });

    if (existing) {
      const updated = await prisma.rating.update({
        where: { id: existing.id },
        data: { score, comment: comment?.trim() || null, lessonId: lessonId || existing.lessonId },
      });
      return { success: true, data: updated };
    }

    const rating = await prisma.rating.create({
      data: { studentId, teacherId, score, givenBy, lessonId: lessonId || null, comment: comment?.trim() || null },
    });
    return { success: true, data: rating };
  } catch (error) {
    console.error("Erro ao enviar avaliacao:", error);
    return { success: false, error: "Falha ao enviar avaliacao." };
  }
}

export async function getTeacherRatings(teacherId: string) {
  try {
    const ratings = await prisma.rating.findMany({
      where: { teacherId },
      include: { student: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: ratings };
  } catch (error) {
    console.error("Erro ao buscar avaliacoes:", error);
    return { success: false, error: "Falha ao buscar avaliacoes.", data: [] as any[] };
  }
}

export async function getTeacherAverageRating(teacherId: string) {
  try {
    const ratings = await prisma.rating.findMany({
      where: { teacherId, givenBy: "student" },
      select: { score: true },
    });

    if (ratings.length === 0) {
      return { success: true, data: { average: 5.0, count: 0 } };
    }

    const sum = ratings.reduce((acc, r) => acc + r.score, 0);
    const average = Math.round((sum / ratings.length) * 10) / 10;
    return { success: true, data: { average, count: ratings.length } };
  } catch (error) {
    console.error("Erro ao calcular media:", error);
    return { success: false, error: "Falha ao calcular media.", data: { average: 5.0, count: 0 } };
  }
}

export async function getUserAverageReceivedRating(userId: string, role: string) {
  try {
    const where = role === "teacher"
      ? { teacherId: userId, givenBy: "student" as const }
      : { studentId: userId, givenBy: "teacher" as const };

    const ratings = await prisma.rating.findMany({ where, select: { score: true } });

    if (ratings.length === 0) {
      return { success: true, data: { average: 5.0, count: 0 } };
    }

    const sum = ratings.reduce((acc, r) => acc + r.score, 0);
    const average = Math.round((sum / ratings.length) * 10) / 10;
    return { success: true, data: { average, count: ratings.length } };
  } catch (error) {
    console.error("Erro ao calcular media recebida:", error);
    return { success: false, error: "Falha ao calcular media.", data: { average: 5.0, count: 0 } };
  }
}

export async function hasRated(
  raterId: string,
  targetId: string,
  givenBy: "student" | "teacher",
) {
  try {
    const rating = await prisma.rating.findUnique({
      where: {
        studentId_teacherId_givenBy: givenBy === "student"
          ? { studentId: raterId, teacherId: targetId, givenBy }
          : { studentId: targetId, teacherId: raterId, givenBy },
      },
    });
    return { success: true, data: rating };
  } catch (error) {
    console.error("Erro ao verificar avaliacao:", error);
    return { success: false, error: "Falha ao verificar avaliacao." };
  }
}

export async function getUnratedTeachersForStudent(studentId: string) {
  try {
    const completedLessons = await prisma.lesson.findMany({
      where: {
        studentId,
        date: { lt: new Date() },
        status: { not: "CANCELLED" },
      },
      include: {
        teacher: { select: { id: true, name: true, avatarUrl: true } },
      },
      distinct: ["teacherId"],
      orderBy: { date: "desc" },
    });

    const ratedTeachers = await prisma.rating.findMany({
      where: { studentId, givenBy: "student" },
      select: { teacherId: true },
    });
    const ratedIds = new Set(ratedTeachers.map((r) => r.teacherId));

    const unrated = completedLessons
      .filter((l) => !ratedIds.has(l.teacherId))
      .map((l) => l.teacher);

    return { success: true, data: unrated };
  } catch (error) {
    console.error("Erro ao buscar professores nao avaliados:", error);
    return { success: false, error: "Falha ao buscar professores.", data: [] as any[] };
  }
}

export async function getUnratedStudentsForTeacher(teacherId: string) {
  try {
    const completedLessons = await prisma.lesson.findMany({
      where: {
        teacherId,
        date: { lt: new Date() },
        status: { not: "CANCELLED" },
      },
      include: {
        student: { select: { id: true, name: true, avatarUrl: true } },
      },
      distinct: ["studentId"],
      orderBy: { date: "desc" },
    });

    const ratedStudents = await prisma.rating.findMany({
      where: { teacherId, givenBy: "teacher" },
      select: { studentId: true },
    });
    const ratedIds = new Set(ratedStudents.map((r) => r.studentId));

    const unrated = completedLessons
      .filter((l) => !ratedIds.has(l.studentId))
      .map((l) => l.student);

    return { success: true, data: unrated };
  } catch (error) {
    console.error("Erro ao buscar alunos nao avaliados:", error);
    return { success: false, error: "Falha ao buscar alunos.", data: [] as any[] };
  }
}

export async function getUnratedPeopleForUser(userId: string, role: string) {
  if (role === "student") {
    return getUnratedTeachersForStudent(userId);
  }
  if (role === "teacher") {
    return getUnratedStudentsForTeacher(userId);
  }
  return { success: true, data: [] as any[] };
}
