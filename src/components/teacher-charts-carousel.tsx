'use client';

import { useMemo } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Award, Users, BookOpen, Calendar, Activity, Crown, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

type TeacherData = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  status: string;
  subjects?: string | null;
  subject?: string | null;
  education?: string | null;
  createdAt?: string | Date;
  ratings?: { average: number; count: number };
};

const SLIDE_COLORS = [
  'hsl(45, 93%, 47%)',
  'hsl(142, 71%, 45%)',
  'hsl(217, 91%, 60%)',
  'hsl(280, 65%, 55%)',
  'hsl(0, 84%, 60%)',
  'hsl(173, 58%, 39%)',
  'hsl(30, 80%, 55%)',
  'hsl(262, 83%, 58%)',
  'hsl(192, 100%, 50%)',
];

const AREAS = {
  Exatas: ['Matemática', 'Física', 'Química'],
  Humanas: ['História', 'Geografia', 'Filosofia', 'Sociologia'],
  Linguagens: ['Português', 'Redação', 'Inglês', 'Espanhol'],
  Natureza: ['Biologia'],
};

const AREA_COLORS: Record<string, string> = {
  Exatas: '#f59e0b',
  Humanas: '#8b5cf6',
  Linguagens: '#3b82f6',
  Natureza: '#10b981',
};

function getArea(subject: string): string {
  for (const [area, subjects] of Object.entries(AREAS)) {
    if (subjects.includes(subject)) return area;
  }
  return 'Outros';
}

function parseEducation(education: string | null | undefined): { university: string; conclusionYear: string }[] {
  if (!education) return [];
  let list: { university: string; conclusionYear: string }[] = [];
  if (typeof education === 'string') {
    try { list = JSON.parse(education); } catch { return []; }
  } else if (Array.isArray(education)) {
    list = education;
  }
  return list.filter((e) => e.university);
}

function getTeacherSubjects(teacher: TeacherData): string[] {
  let subs: string[] = [];
  if (teacher.subjects) {
    if (Array.isArray(teacher.subjects)) subs = teacher.subjects;
    else {
      try { subs = JSON.parse(teacher.subjects); } catch { subs = []; }
    }
  }
  if (teacher.subject && !subs.includes(teacher.subject)) {
    subs.push(teacher.subject);
  }
  return subs;
}

function getSubjectName(subjectId: string): string {
  const map: Record<string, string> = {
    'subj-1': 'Matemática', 'subj-2': 'Português', 'subj-3': 'Física',
    'subj-4': 'Redação', 'subj-5': 'História', 'subj-6': 'Química',
    'subj-7': 'Espanhol', 'subj-8': 'Filosofia', 'subj-9': 'Geografia',
    'subj-10': 'Inglês', 'subj-11': 'Sociologia', 'subj-12': 'Biologia',
  };
  if (map[subjectId]) return map[subjectId];
  if (subjectId && !subjectId.startsWith('subj-')) return subjectId;
  return subjectId;
}

interface SlideProps {
  index: number;
  total: number;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Slide({ index, total, title, subtitle, icon, children }: SlideProps) {
  return (
    <CarouselItem>
      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-brand-yellow/10 p-2.5 text-brand-yellow">
                {icon}
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                  {title}
                  {subtitle && (
                    <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {subtitle}
                    </span>
                  )}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-yellow bg-brand-yellow/10 px-3 py-1 rounded-full">
                {index + 1} / {total}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </CarouselItem>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="font-extrabold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function TreemapSVG({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) return <div className="text-center text-slate-400 py-12">Sem dados disponíveis</div>;

  const width = 600;
  const height = 300;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  
  const rects: React.ReactNode[] = [];
  let x = 0;
  let y = 0;
  let currentHeight = height;

  const colWidth = Math.ceil(Math.sqrt(sorted.length));
  const itemWidth = width / colWidth;

  sorted.forEach((d, i) => {
    const rectHeight = (d.value / total) * height;
    const ratio = rectHeight / itemWidth;
    const fillColor = d.color || SLIDE_COLORS[i % SLIDE_COLORS.length];
    
    rects.push(
      <g key={d.name}>
        <rect
          x={x + 2}
          y={y + 2}
          width={itemWidth - 4}
          height={Math.max(rectHeight - 4, 30)}
          fill={fillColor}
          rx={12}
          className="transition-all duration-200 hover:opacity-80"
          stroke={fillColor}
          strokeWidth={2}
        />
        <text
          x={x + itemWidth / 2}
          y={y + rectHeight / 2 - 6}
          textAnchor="middle"
          className="fill-white font-extrabold text-sm"
          style={{ fontSize: Math.max(rectHeight * 0.2, 10), fill: 'white' }}
        >
          {d.value}
        </text>
        <text
          x={x + itemWidth / 2}
          y={y + rectHeight / 2 + 10}
          textAnchor="middle"
          style={{ fontSize: Math.max(rectHeight * 0.15, 8), fill: 'rgba(255,255,255,0.85)' }}
        >
          {d.name.length > 12 ? d.name.substring(0, 12) + '…' : d.name}
        </text>
      </g>
    );

    x += itemWidth;
    if (x >= width) {
      x = 0;
      y += rectHeight;
    }
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {rects}
    </svg>
  );
}

function HeatmapSVG({ data }: { data: { subject: string; intensity: number; count: number }[] }) {
  const width = 600;
  const height = 300;
  const cols = 4;
  const rows = Math.ceil(data.length / cols);
  const cellW = width / cols;
  const cellH = height / rows;
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cellW;
        const y = row * cellH;
        const intensity = d.count / maxCount;
        const bgColor = `rgba(245, 176, 0, ${0.1 + intensity * 0.8})`;
        const textColor = intensity > 0.5 ? 'white' : '#475569';

        return (
          <g key={d.subject}>
            <rect
              x={x + 3}
              y={y + 3}
              width={cellW - 6}
              height={cellH - 6}
              fill={bgColor}
              rx={10}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
            />
            <text
              x={x + cellW / 2}
              y={y + cellH / 2 - 8}
              textAnchor="middle"
              style={{ fontSize: Math.min(cellW * 0.12, 12), fontWeight: 700, fill: textColor }}
            >
              {d.count}
            </text>
            <text
              x={x + cellW / 2}
              y={y + cellH / 2 + 8}
              textAnchor="middle"
              style={{ fontSize: Math.min(cellW * 0.1, 9), fill: textColor, opacity: 0.8 }}
            >
              {d.subject.length > 10 ? d.subject.substring(0, 10) : d.subject}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface TeacherChartsCarouselProps {
  teachers: TeacherData[];
  ratings?: Record<string, { average: number; count: number }>;
}

export function TeacherChartsCarousel({ teachers, ratings = {} }: TeacherChartsCarouselProps) {

  const chart1Data = useMemo(() => {
    const counts: Record<string, number> = {};
    teachers.forEach((t) => {
      const subs = getTeacherSubjects(t);
      subs.forEach((s) => {
        const name = getSubjectName(s);
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [teachers]);

  const chart2Data = useMemo(() => {
    const univs: Record<string, number> = {};
    teachers.forEach((t) => {
      const edus = parseEducation(t.education);
      edus.forEach((e) => {
        const uni = e.university.trim();
        if (uni) univs[uni] = (univs[uni] || 0) + 1;
      });
    });
    return Object.entries(univs)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [teachers]);

  const chart3Data = useMemo(() => {
    const counts: Record<string, number> = {};
    teachers.forEach((t) => {
      const subs = getTeacherSubjects(t);
      subs.forEach((s) => {
        const name = getSubjectName(s);
        const area = getArea(name);
        counts[area] = (counts[area] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: AREA_COLORS[name] || SLIDE_COLORS[i],
    }));
  }, [teachers]);

  const chart4Data = useMemo(() => {
    return teachers
      .map((t) => ({
        name: t.name.split(' ')[0],
        fullName: t.name,
        subjects: getTeacherSubjects(t).map(getSubjectName).length,
      }))
      .sort((a, b) => b.subjects - a.subjects)
      .slice(0, 8);
  }, [teachers]);

  const chart5Data = useMemo(() => {
    const active = teachers.filter((t) => t.status !== 'pending').length;
    const pending = teachers.filter((t) => t.status === 'pending').length;
    const inactive = teachers.filter((t) => t.status === 'inactive').length;
    return [
      { name: 'Ativos', value: active, color: '#10b981' },
      { name: 'Pendentes', value: pending, color: '#f59e0b' },
      { name: 'Inativos', value: inactive, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [teachers]);

  const chart6Data = useMemo(() => {
    const byMonth: Record<string, number> = {};
    teachers.forEach((t) => {
      if (!t.createdAt) return;
      const d = new Date(t.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    const sorted = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);
    let cumulative = 0;
    return sorted.map(([name, value]) => {
      cumulative += value;
      return {
        name: name.substring(5) + '/' + name.substring(2, 4),
        professores: value,
        total: cumulative,
      };
    });
  }, [teachers]);

  const chart7Data = useMemo(() => {
    const counts: Record<string, number> = {};
    teachers.forEach((t) => {
      const subs = getTeacherSubjects(t);
      subs.forEach((s) => {
        const name = getSubjectName(s);
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([subject, count]) => ({ subject, count, intensity: count / teachers.length }));
  }, [teachers]);

  const chart8Data = useMemo(() => {
    return teachers
      .map((t) => {
        const r = ratings[t.id];
        return {
          id: t.id,
          name: t.name,
          avatarUrl: t.avatarUrl,
          subjects: getTeacherSubjects(t).map(getSubjectName).length,
          avgRating: r?.average ?? 0,
          ratings: r?.count ?? 0,
        };
      })
      .sort((a, b) => b.avgRating - a.avgRating || b.ratings - a.ratings)
      .slice(0, 10);
  }, [teachers, ratings]);

  const chart9Data = useMemo(() => {
    const years: Record<string, number> = {};
    teachers.forEach((t) => {
      const edus = parseEducation(t.education);
      edus.forEach((e) => {
        const yr = e.conclusionYear;
        if (yr && /^\d{4}$/.test(yr)) {
          const bucket = yr;
          years[bucket] = (years[bucket] || 0) + 1;
        }
      });
    });
    return Object.entries(years)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));
  }, [teachers]);

  const TOTAL_SLIDES = 9;

  return (
    <div className="relative">
      <Carousel
        opts={{ align: 'start', loop: false }}
        className="w-full"
      >
        <div className="relative">
          <CarouselPrevious className="absolute -left-14 top-1/2 -translate-y-1/2 z-10 rounded-full bg-brand-yellow text-slate-900 hover:bg-amber-400 border-0 shadow-md h-10 w-10" />
          <CarouselContent className="pb-4">
            
            {/* SLIDE 1: Barras Horizontal — Professores por Disciplina */}
            <Slide
              index={0}
              total={TOTAL_SLIDES}
              title="Professores por Disciplina"
              subtitle="Bar chart horizontal"
              icon={<BookOpen className="h-5 w-5" />}
            >
              {chart1Data.length === 0 ? (
                <div className="text-center text-slate-400 py-16">Sem dados disponíveis</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart1Data} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={90}
                        tick={{ fontSize: 12, fill: '#475569' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#f5b000" radius={[0, 6, 6, 0]} barSize={22}>
                        {chart1Data.map((_, i) => (
                          <Cell key={i} fill={SLIDE_COLORS[i % SLIDE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Slide>

            {/* SLIDE 2: Donut — Universidades */}
            <Slide
              index={1}
              total={TOTAL_SLIDES}
              title="Formação Universitária"
              subtitle="Donut chart"
              icon={<GraduationCap className="h-5 w-5" />}
            >
              {chart2Data.length === 0 ? (
                <div className="text-center text-slate-400 py-16">Nenhuma universidade encontrada</div>
              ) : (
                <div className="h-72 flex items-center">
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie
                        data={chart2Data}
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chart2Data.map((_, i) => (
                          <Cell key={i} fill={SLIDE_COLORS[i % SLIDE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-40 space-y-2">
                    {chart2Data.slice(0, 6).map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: SLIDE_COLORS[i % SLIDE_COLORS.length] }}
                        />
                        <span className="text-xs text-slate-600 truncate font-medium">{d.name}</span>
                        <span className="text-xs font-bold text-slate-900 ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Slide>

            {/* SLIDE 3: Treemap — Por Área */}
            <Slide
              index={2}
              total={TOTAL_SLIDES}
              title="Professores por Área"
              subtitle="Treemap"
              icon={<TrendingUp className="h-5 w-5" />}
            >
              {chart3Data.length === 0 ? (
                <div className="text-center text-slate-400 py-16">Sem dados disponíveis</div>
              ) : (
                <div className="h-72">
                  <TreemapSVG data={chart3Data} />
                  <div className="flex justify-center gap-6 mt-4">
                    {chart3Data.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-slate-600 font-medium">{d.name}</span>
                        <span className="text-xs font-bold text-slate-900">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Slide>

            {/* SLIDE 4: Barras — Disciplinas por Professor */}
            <Slide
              index={3}
              total={TOTAL_SLIDES}
              title="Disciplinas por Professor"
              subtitle="Versatilidade"
              icon={<Activity className="h-5 w-5" />}
            >
              {chart4Data.length === 0 ? (
                <div className="text-center text-slate-400 py-16">Sem dados disponíveis</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart4Data} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="subjects" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={30}>
                        {chart4Data.map((_, i) => (
                          <Cell key={i} fill={SLIDE_COLORS[(i + 1) % SLIDE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Slide>

            {/* SLIDE 5: Donut — Ativos vs Inativos */}
            <Slide
              index={4}
              total={TOTAL_SLIDES}
              title="Status dos Professores"
              subtitle="Ativos vs Inativos"
              icon={<Users className="h-5 w-5" />}
            >
              {chart5Data.length === 0 ? (
                <div className="text-center text-slate-400 py-16">Sem dados disponíveis</div>
              ) : (
                <div className="h-72 flex items-center">
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie
                        data={chart5Data}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="85%"
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chart5Data.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-4">
                    {chart5Data.map((d) => (
                      <div key={d.name} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-sm font-semibold text-slate-700">{d.name}</span>
                        </div>
                        <span className="text-xl font-extrabold" style={{ color: d.color }}>
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Slide>

            {/* SLIDE 6: Line Chart — Timeline de Cadastros */}
            <Slide
              index={5}
              total={TOTAL_SLIDES}
              title="Crescimento da Equipe"
              subtitle="Novos professores por período"
              icon={<Calendar className="h-5 w-5" />}
            >
              {chart6Data.length === 0 ? (
                <div className="text-center text-slate-400 py-16">Sem dados de cadastro</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart6Data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#f5b000"
                        strokeWidth={3}
                        dot={{ fill: '#f5b000', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Total acumulado"
                      />
                      <Line
                        type="monotone"
                        dataKey="professores"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        name="Novos professores"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Slide>

            {/* SLIDE 7: Heatmap — Disciplinas */}
            <Slide
              index={6}
              total={TOTAL_SLIDES}
              title="Mapa de Disciplinas"
              subtitle="Intensidade por matéria"
              icon={<Activity className="h-5 w-5" />}
            >
              {chart7Data.length === 0 ? (
                <div className="text-center text-slate-400 py-16">Sem dados de disciplinas</div>
              ) : (
                <div className="space-y-4">
                  <div className="h-64">
                    <HeatmapSVG data={chart7Data} />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <span>Menos professores</span>
                    <div className="flex gap-1">
                      {[0.1, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
                        <div
                          key={i}
                          className="w-6 h-3 rounded-sm"
                          style={{ backgroundColor: `rgba(245, 176, 0, ${v})` }}
                        />
                      ))}
                    </div>
                    <span>Mais professores</span>
                  </div>
                </div>
              )}
            </Slide>

            {/* SLIDE 8: Ranking de Professores */}
            <Slide
              index={7}
              total={TOTAL_SLIDES}
              title="Ranking de Professores"
              subtitle="Por avaliação"
              icon={<Crown className="h-5 w-5" />}
            >
              {chart8Data.length === 0 ? (
                <div className="text-center text-slate-400 py-16">Nenhum professor rankeado</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead className="text-center">Disciplinas</TableHead>
                        <TableHead className="text-center">Avaliação</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chart8Data.map((t, i) => (
                        <TableRow
                          key={t.id}
                          className={cn(
                            'transition-colors hover:bg-slate-50',
                            i === 0 && 'bg-amber-50/50'
                          )}
                        >
                          <TableCell className="text-center font-bold">
                            {i === 0 ? (
                              <Crown className="h-5 w-5 text-amber-500 mx-auto" />
                            ) : (
                              <span className="text-slate-400">{i + 1}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-slate-200">
                                <AvatarImage src={t.avatarUrl || undefined} />
                                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold">
                                  {t.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-slate-800 text-sm">{t.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-semibold">
                              {t.subjects}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                              <span className="font-bold text-slate-800">{t.avgRating.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-slate-500 text-xs">{t.ratings} avaliações</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Slide>

            {/* SLIDE 9: Histogram — Ano de Formação */}
            <Slide
              index={8}
              total={TOTAL_SLIDES}
              title="Ano de Formação"
              subtitle="Distribuição da experiência"
              icon={<Award className="h-5 w-5" />}
            >
              {chart9Data.length === 0 ? (
                <div className="text-center text-slate-400 py-16">Nenhum dado de formação</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart9Data} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} barSize={35}>
                        {chart9Data.map((_, i) => (
                          <Cell key={i} fill={SLIDE_COLORS[(i + 2) % SLIDE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Slide>

          </CarouselContent>
          <CarouselNext className="absolute -right-14 top-1/2 -translate-y-1/2 z-10 rounded-full bg-brand-yellow text-slate-900 hover:bg-amber-400 border-0 shadow-md h-10 w-10" />
        </div>
      </Carousel>

      <div className="flex justify-center gap-2 mt-4">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <span className="text-brand-yellow font-bold">★</span> Navegue entre os slides com as setas
        </span>
      </div>
    </div>
  );
}
