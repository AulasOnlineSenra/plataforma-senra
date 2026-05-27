import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { url, userId, device, timeSpent } = data;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    await prisma.pageVisit.create({
      data: {
        url,
        userId: userId || null,
        device: device || 'Desktop',
        timeSpent: timeSpent || 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
