import { NextResponse } from 'next/server';
import { fixCompletedLessonsCredits } from '@/app/actions/bookings';

export async function POST() {
  try {
    const result = await fixCompletedLessonsCredits();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao executar correção de créditos:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
