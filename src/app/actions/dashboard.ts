'use server'

import prisma from '@/lib/prisma'

export async function getDashboardStats() {
  try {
    const now = new Date();

    // Executa todas as consultas ao banco de dados em paralelo usando Promise.all
    const [
      totalStudents,
      totalTeachers,
      scheduledLessons,
      completedLessons,
      cancelledLessons,
      upcomingLessons,
      revenue,
      pendingPayments,
      pendingPaymentsAmount,
      pendingTransactionsList
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'student', status: 'active' } }),
      prisma.user.count({ where: { role: 'teacher', status: 'active' } }),
      prisma.lesson.count({
        where: { 
          status: { in: ['PENDING', 'CONFIRMED', 'scheduled'] },
          date: { gte: now }
        }
      }),
      prisma.lesson.count({ where: { status: 'COMPLETED' } }),
      prisma.lesson.count({ where: { status: { in: ['CANCELLED', 'cancelled'] } } }),
      prisma.lesson.findMany({
        where: { 
          status: { in: ['PENDING', 'CONFIRMED', 'scheduled'] },
          OR: [
            { endDate: { gt: new Date() } },
            { date: { gte: new Date(Date.now() - 90 * 60 * 1000) } }
          ]
        },
        orderBy: { date: 'asc' },
        take: 5,
        include: {
          student: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true, videoUrl: true } }
        }
      }),
      prisma.lesson.aggregate({
        _sum: { price: true },
        where: { status: { in: ['CONFIRMED', 'completed'] } }
      }),
      prisma.transaction.count({ where: { status: 'PENDENTE' } }),
      prisma.transaction.aggregate({
        _sum: { amountPaid: true },
        where: { status: 'PENDENTE' }
      }),
      prisma.transaction.findMany({
        where: { status: 'PENDENTE' },
        orderBy: { createdAt: 'asc' },
        take: 10,
        include: {
          student: { select: { id: true, name: true, avatarUrl: true } }
        }
      })
    ]);
    
    console.log('[Dashboard] Transações PENDENTE encontradas:', pendingTransactionsList.length);
    console.log('[Dashboard] IDs das transações:', pendingTransactionsList.map(t => t.id));

    return {
      success: true,
      data: {
        students: totalStudents,
        teachers: totalTeachers,
        scheduled: scheduledLessons,
        completed: completedLessons,
        cancelled: cancelledLessons,
        revenue: revenue._sum.price || 0,
        upcomingLessons,
        pendingPayments,
        pendingPaymentsAmount: pendingPaymentsAmount._sum.amountPaid || 0,
        pendingTransactions: pendingTransactionsList
      }
    };
  } catch (error) {
    console.error("Erro ao buscar dados do Dashboard:", error);
    return { success: false, error: "Falha ao carregar o painel." };
  }
}
