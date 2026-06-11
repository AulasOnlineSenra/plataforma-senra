import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, statSync } from 'fs';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const backupDir = path.join(process.cwd(), 'backups');
    if (!existsSync(backupDir)) {
      return NextResponse.json({ backups: [] });
    }

    const files = await fs.readdir(backupDir);
    const backups = files.map(file => {
      const stats = statSync(path.join(backupDir, file));
      return {
        filename: file,
        size: stats.size, // bytes
        date: stats.mtime,
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({ backups });

  } catch (error: any) {
    console.error('[Backup List API] Error:', error);
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const filename = searchParams.get('file');

    if (!userId || !filename) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const filepath = path.join(process.cwd(), 'backups', filename);
    if (existsSync(filepath)) {
      await fs.unlink(filepath);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Backup Delete API] Error:', error);
    return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 });
  }
}
