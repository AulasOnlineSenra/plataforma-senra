import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import prisma from '@/lib/prisma';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Authenticaton
    const authHeader = request.headers.get('authorization');
    const isCron = authHeader === `Bearer senra-cron-secret`; // Use this secret for internal cron calls

    if (!isCron) {
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isCron) {
      const settings = await prisma.appSetting.findUnique({ where: { id: 'global' } });
      if (!settings || !settings.backupAuto) {
        return NextResponse.json({ success: false, message: 'Auto backup disabled' });
      }
      
      const freq = settings.backupFrequency; // 'daily', 'weekly', 'monthly'
      const today = new Date();
      if (freq === 'weekly' && today.getDay() !== 0) { // Sunday only
         return NextResponse.json({ success: false, message: 'Not scheduled for today (weekly)' });
      }
      if (freq === 'monthly' && today.getDate() !== 1) { // 1st of month only
         return NextResponse.json({ success: false, message: 'Not scheduled for today (monthly)' });
      }
    }

    const backupDir = path.join(process.cwd(), 'backups');
    if (!existsSync(backupDir)) {
      await fs.mkdir(backupDir, { recursive: true });
    }

    // Format YYYY-MM-DD_HH-mm
    const date = new Date();
    const ts = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
    
    const type = isCron ? 'auto' : 'manual';
    const filename = `backup_${type}_${ts}.sql.gz`;
    const filepath = path.join(backupDir, filename);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL not found");

    // Execute pg_dump
    const cmd = `pg_dump "${dbUrl}" --clean --if-exists | gzip > "${filepath}"`;
    await execAsync(cmd);

    // Retention cleanup (only for auto backups)
    if (isCron) {
       const settings = await prisma.appSetting.findUnique({ where: { id: 'global' } });
       const maxBackups = settings?.backupRetention || 5;
       
       const files = await fs.readdir(backupDir);
       const autoBackups = files.filter(f => f.startsWith('backup_auto_')).sort();
       
       if (autoBackups.length > maxBackups) {
          const toDelete = autoBackups.slice(0, autoBackups.length - maxBackups);
          for (const file of toDelete) {
             await fs.unlink(path.join(backupDir, file));
          }
       }
    }

    return NextResponse.json({ success: true, filename });

  } catch (error: any) {
    console.error('[Backup Generate API] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate backup' }, { status: 500 });
  }
}
