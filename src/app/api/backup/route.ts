import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      users,
      lessons,
      crmLeads,
      crmColumns,
      crmComments,
      marketingCosts,
      appSettings,
      ratings,
      transactions,
      userProgress,
      quizQuestions
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.lesson.findMany(),
      prisma.crmLead.findMany(),
      prisma.crmColumn.findMany(),
      prisma.crmComment.findMany(),
      prisma.marketingCost.findMany(),
      prisma.appSetting.findMany(),
      prisma.rating.findMany(),
      prisma.transaction.findMany(),
      prisma.userProgress.findMany(),
      prisma.quizQuestion.findMany()
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        users,
        lessons,
        crmLeads,
        crmColumns,
        crmComments,
        marketingCosts,
        appSettings,
        ratings,
        transactions,
        userProgress,
        quizQuestions
      }
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-senra-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error('[Backup API] Error:', error);
    return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 });
  }
}
