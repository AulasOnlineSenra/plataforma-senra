'use server'

import prisma from '@/lib/prisma'

export async function getDashboardStats() {
  try {
    const now = new Date();

    // Busca os totais de Usuários
    const totalStudents = await prisma.user.count({
      where: { role: 'student', status: 'active' }
    });

    const totalTeachers = await prisma.user.count({
      where: { role: 'teacher', status: 'active' }
    });

    // Busca os totais de Aulas
    const scheduledLessons = await prisma.lesson.count({
      where: { 
        status: { in: ['PENDING', 'CONFIRMED', 'scheduled'] },
        date: { gte: now }
      }
    });

    const completedLessons = await prisma.lesson.count({
      where: { 
        OR: [
          { status: 'completed' },
          { 
            status: { in: ['CONFIRMED', 'scheduled'] },
            date: { lt: now }
          }
        ]
      }
    });

    const cancelledLessons = await prisma.lesson.count({
      where: { status: { in: ['CANCELLED', 'cancelled'] } }
    });

    // Busca as próximas 5 aulas agendadas (trazendo o nome do aluno e do professor junto)
    const upcomingLessons = await prisma.lesson.findMany({
      where: { 
        status: { in: ['PENDING', 'CONFIRMED', 'scheduled'] },
        date: { gte: new Date() } // Apenas aulas de hoje para frente
      },
      orderBy: { date: 'asc' },
      take: 5,
      include: {
        student: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, videoUrl: true } }
      }
    });

    // Calcula a Receita Total (Soma do preço de todas as aulas completadas)
    const revenue = await prisma.lesson.aggregate({
      _sum: { price: true },
      where: { status: { in: ['CONFIRMED', 'completed'] } }
    });

    // Calcula pagamentos pendentes
    const pendingPayments = await prisma.transaction.count({
      where: { status: 'PENDENTE' }
    });

    const pendingPaymentsAmount = await prisma.transaction.aggregate({
      _sum: { amountPaid: true },
      where: { status: 'PENDENTE' }
    });

    // Busca transações pendentes - versão simplificada
    const pendingTransactionsList = await prisma.transaction.findMany({
      where: { status: 'PENDENTE' },
      orderBy: { createdAt: 'asc' },
      take: 10,
      include: {
        student: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
    
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
