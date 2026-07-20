import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { url, userId, device, timeSpent, source } = data;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    await prisma.pageVisit.create({
      data: {
        url,
        userId: userId || null,
        device: device || 'Desktop',
        timeSpent: timeSpent || 0,
        source: source || 'Direto/Orgânico',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
