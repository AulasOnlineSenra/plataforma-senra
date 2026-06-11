import { NextResponse } from 'next/server';
import path from 'path';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const filename = searchParams.get('file');

    if (!userId || !filename) return new NextResponse('Invalid request', { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') return new NextResponse('Unauthorized', { status: 401 });

    const filepath = path.join(process.cwd(), 'backups', filename);
    if (!existsSync(filepath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await readFile(filepath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error: any) {
    console.error('[Backup Download API] Error:', error);
    return new NextResponse('Failed to download backup', { status: 500 });
  }
}
