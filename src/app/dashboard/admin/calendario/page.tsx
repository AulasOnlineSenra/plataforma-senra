import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { CalendarioList } from './CalendarioList';

export const metadata: Metadata = {
  title: 'Scraper de Calendário | Plataforma Senra',
  description: 'Gerencie as instituições e veja a saúde do robô de extração.',
};

export const dynamic = 'force-dynamic';

export default async function AdminCalendarioPage() {
  const [vestibulares, appSettings] = await Promise.all([
    prisma.vestibular.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { events: true }
        },
        events: {
          orderBy: { dateStart: 'asc' },
          select: { id: true, type: true, dateStart: true, description: true, status: true }
        }
      }
    }),
    prisma.appSetting.findUnique({
      where: { id: 'global' },
      select: {
        scraperRequiresApproval: true,
        scraperFrequency: true
      }
    })
  ]);

  const scraperConfig = {
    scraperRequiresApproval: appSettings?.scraperRequiresApproval ?? true,
    scraperFrequency: appSettings?.scraperFrequency ?? 'weekly',
  };

  // Serialize Date objects → ISO strings so Next.js can pass them safely to the Client Component
  const serializedVestibulares = vestibulares.map(v => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    lastScrapeDate: v.lastScrapeDate ? v.lastScrapeDate.toISOString() : null,
    events: v.events.map((e: any) => ({
      id: e.id,
      type: e.type,
      dateStart: e.dateStart.toISOString(),
      description: e.description ?? null,
      status: e.status,
    })),
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 pb-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Calendário de Vestibulares
          </h1>
          <p className="text-slate-500">
            Gerencie as configurações do robô de extração e veja o status da última varredura.
          </p>
        </div>
      </div>

      <CalendarioList initialData={serializedVestibulares} scraperConfig={scraperConfig} />
    </div>
  );
}
