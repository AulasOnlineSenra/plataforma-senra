import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const totalStudents = await prisma.user.count({
      where: { role: 'student', status: 'active' },
    });

    const totalTeachers = await prisma.user.count({
      where: { role: 'teacher', status: 'active' },
    });

    const scheduledLessons = await prisma.lesson.count({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'scheduled'] } },
    });

    const completedLessons = await prisma.lesson.count({
      where: { status: { in: ['CONFIRMED', 'completed'] } },
    });

    const cancelledLessons = await prisma.lesson.count({
      where: { status: { in: ['CANCELLED', 'cancelled'] } },
    });

    const upcomingLessons = await prisma.lesson.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED', 'scheduled'] },
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
      take: 5,
      include: {
        student: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    const revenue = await prisma.lesson.aggregate({
      _sum: { price: true },
      where: { status: { in: ['CONFIRMED', 'completed'] } },
    });

    return NextResponse.json({
      success: true,
      data: {
        students: totalStudents,
        teachers: totalTeachers,
        scheduled: scheduledLessons,
        completed: completedLessons,
        cancelled: cancelledLessons,
        revenue: revenue._sum.price || 0,
        upcomingLessons,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados do Dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao carregar o painel.' },
      { status: 500 }
    );
  }
}
