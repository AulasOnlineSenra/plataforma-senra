
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
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

const allData = Array.from({ length: 365 * 2 }).map((_, i) => {
  const date = new Date(2023, 0, 1);
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
        const interval = { start: startOfDay(now), end: endOfDay(now) };
        const dayData = allData.filter(d => d.date >= interval.start && d.date <= interval.end);
        const total = dayData.reduce((acc, curr) => ({
            Alunos: acc.Alunos + curr.Alunos,
            Professores: acc.Professores + curr.Professores,
        }), { Alunos: 0, Professores: 0 });
        return [{ name: format(now, 'dd/MM'), ...total }];
      }
      case 'week': {
        const interval = { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
        const weekData = eachDayOfInterval(interval);
        return weekData.map(day => {
          const dayUsers = allData
            .filter(d => d.date.toDateString() === day.toDateString())
            .reduce((acc, curr) => ({
              Alunos: acc.Alunos + curr.Alunos,
              Professores: acc.Professores + curr.Professores,
            }), { Alunos: 0, Professores: 0 });
          return { name: format(day, 'EEE', { locale: ptBR }), ...dayUsers };
        });
      }
      case 'month': {
        const interval = { start: startOfMonth(now), end: endOfMonth(now) };
        const monthData = eachDayOfInterval(interval);
         return monthData.map(day => {
            const dayUsers = allData
              .filter(d => d.date.toDateString() === day.toDateString())
              .reduce((acc, curr) => ({
                Alunos: acc.Alunos + curr.Alunos,
                Professores: acc.Professores + curr.Professores,
              }), { Alunos: 0, Professores: 0 });
            return { name: format(day, 'd'), ...dayUsers };
        });
      }
      case 'year': {
        const interval = { start: startOfYear(now), end: endOfYear(now) };
        const yearData = eachMonthOfInterval(interval);
        return yearData.map(month => {
          const monthUsers = allData
            .filter(d => d.date.getMonth() === month.getMonth() && d.date.getFullYear() === month.getFullYear())
            .reduce((acc, curr) => ({
              Alunos: acc.Alunos + curr.Alunos,
              Professores: acc.Professores + curr.Professores,
            }), { Alunos: 0, Professores: 0 });
          return { name: format(month, 'MMM', { locale: ptBR }), ...monthUsers };
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
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
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
