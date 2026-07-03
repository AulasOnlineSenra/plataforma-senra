import { NextRequest, NextResponse } from 'next/server';
import { dispatchEnemSimulado } from '@/app/actions/enem';
import { getLastWeekendOfMonth } from '@/lib/enem-utils';
import prisma from '@/lib/prisma';

/**
 * GET /api/cron/enem-simulado
 *
 * Endpoint chamado pelo cron job (ex: cron-job.org, Vercel Cron, etc.)
 * Verifica se hoje é o último sábado ou último domingo do mês
 * e envia o simulado ENEM correspondente para os alunos elegíveis.
 *
 * Proteja com um secret via header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  // Verificação de segurança: só aceita se tiver o secret correto
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Se houver CRON_SECRET configurado, valida
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const { lastSaturday, lastSunday } = getLastWeekendOfMonth(year, month);

  const todayStr = now.toDateString();
  const isSaturday = todayStr === lastSaturday.toDateString();
  const isSunday = todayStr === lastSunday.toDateString();

  if (!isSaturday && !isSunday) {
    return NextResponse.json({
      message: 'Hoje não é o último fim de semana do mês. Nenhuma ação realizada.',
      today: now.toISOString(),
      lastSaturday: lastSaturday.toISOString(),
      lastSunday: lastSunday.toISOString(),
    });
  }

  // Buscar admin para ser o "criador" dos simulados
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true },
  });

  if (!admin) {
    return NextResponse.json({ error: 'Admin não encontrado.' }, { status: 500 });
  }

  const dayType = isSaturday ? 'DIA1' : 'DIA2';
  const result = await dispatchEnemSimulado(dayType, admin.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    dayType,
    dispatched: result.dispatched,
    total: result.total,
    timestamp: now.toISOString(),
  });
}

/**
 * POST /api/cron/enem-simulado
 * Permite disparo manual pelo admin (botão "Enviar Agora" na tela de config).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dayType, adminId } = body as { dayType: 'DIA1' | 'DIA2'; adminId: string };

    if (!dayType || !adminId) {
      return NextResponse.json({ error: 'dayType e adminId são obrigatórios.' }, { status: 400 });
    }

    const result = await dispatchEnemSimulado(dayType, adminId, true);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      dayType,
      dispatched: result.dispatched,
      total: result.total,
    });
  } catch (error) {
    console.error('Erro no dispatch manual:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
