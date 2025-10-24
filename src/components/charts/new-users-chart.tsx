
'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

const allData = Array.from({ length: 365 * 5 }).map((_, i) => {
  const date = new Date(2022, 0, 1);
  date.setDate(date.getDate() + i);
  return {
    date: date,
    Alunos: Math.floor(Math.random() * 5),
    Professores: Math.floor(Math.random() * 2),
  };
});

type FilterType = 'day' | 'week' | 'month' | 'year';

interface NewUsersChartProps {
  filter: FilterType;
}

const chartConfig = {
  Alunos: {
    label: 'Alunos',
    color: 'hsl(var(--chart-1))',
  },
  Professores: {
    label: 'Professores',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;


export function NewUsersChart({ filter }: NewUsersChartProps) {
    const chartData = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'day': {
        const interval = { start: new Date(2025, 0, 1), end: now };
        const days = eachDayOfInterval(interval);
        return days.map(day => {
          const dayUsers = allData
            .filter(d => d.date.toDateString() === day.toDateString())
            .reduce((acc, curr) => ({
              Alunos: acc.Alunos + curr.Alunos,
              Professores: acc.Professores + curr.Professores,
            }), { Alunos: 0, Professores: 0 });
          return { name: format(day, 'dd/MM'), ...dayUsers };
        });
      }
      case 'week': {
        const start = startOfYear(now);
        const end = endOfYear(now);
        const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        return weeks.map(weekStart => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekUsers = allData
            .filter(d => d.date >= weekStart && d.date <= weekEnd)
            .reduce((acc, curr) => ({
              Alunos: acc.Alunos + curr.Alunos,
              Professores: acc.Professores + curr.Professores,
            }), { Alunos: 0, Professores: 0 });
          return {
            name: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`,
            ...weekUsers
          };
        });
      }
      case 'month': {
        const interval = { start: startOfYear(now), end: endOfYear(now) };
        const months = eachMonthOfInterval(interval);
        return months.map(month => {
          const monthUsers = allData
            .filter(d => d.date.getMonth() === month.getMonth() && d.date.getFullYear() === month.getFullYear())
            .reduce((acc, curr) => ({
              Alunos: acc.Alunos + curr.Alunos,
              Professores: acc.Professores + curr.Professores,
            }), { Alunos: 0, Professores: 0 });
          return { name: format(month, 'MMM', { locale: ptBR }), ...monthUsers };
        });
      }
      case 'year': {
        const years = eachYearOfInterval({
          start: new Date(2022, 0, 1),
          end: now,
        });
        return years.map(year => {
          const yearUsers = allData
            .filter(d => d.date.getFullYear() === year.getFullYear())
            .reduce((acc, curr) => ({
              Alunos: acc.Alunos + curr.Alunos,
              Professores: acc.Professores + curr.Professores,
            }), { Alunos: 0, Professores: 0 });
          return { name: format(year, 'yyyy'), ...yearUsers };
        });
      }
      default:
        return [];
    }
  }, [filter]);


  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 20,
          right: 20,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="auto"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          allowDecimals={false}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Line
          dataKey="Alunos"
          type="natural"
          stroke="var(--color-Alunos)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="Professores"
          type="natural"
          stroke="var(--color-Professores)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
