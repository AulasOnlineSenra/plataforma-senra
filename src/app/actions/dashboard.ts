'use server'

import prisma from '@/lib/prisma'

export async function getDashboardStats() {
  try {
    // Busca os totais de Usuários
    const totalStudents = await prisma.user.count({
      where: { role: 'student', status: 'active' }
    });

    const totalTeachers = await prisma.user.count({
      where: { role: 'teacher', status: 'active' }
    });

    // Busca os totais de Aulas
    const scheduledLessons = await prisma.lesson.count({
      where: { status: 'scheduled' }
    });

    const completedLessons = await prisma.lesson.count({
      where: { status: 'completed' }
    });

    const cancelledLessons = await prisma.lesson.count({
      where: { status: 'cancelled' }
    });

    // Busca as próximas 5 aulas agendadas (trazendo o nome do aluno e do professor junto)
    const upcomingLessons = await prisma.lesson.findMany({
      where: { 
        status: 'scheduled',
        date: { gte: new Date() } // Apenas aulas de hoje para frente
      },
      orderBy: { date: 'asc' },
      take: 5,
      include: {
        student: { select: { name: true } },
        teacher: { select: { name: true } }
      }
    });

    // Calcula a Receita Total (Soma do preço de todas as aulas completadas)
    const revenue = await prisma.lesson.aggregate({
      _sum: { price: true },
      where: { status: 'completed' }
    });

    return {
      success: true,
      data: {
        students: totalStudents,
        teachers: totalTeachers,
        scheduled: scheduledLessons,
        completed: completedLessons,
        cancelled: cancelledLessons,
        revenue: revenue._sum.price || 0,
        upcomingLessons
      }
    };
  } catch (error) {
    console.error("Erro ao buscar dados do Dashboard:", error);
    return { success: false, error: "Falha ao carregar o painel." };
  }
}