
'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

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

export function NewUsersChart({ filter }: NewUsersChartProps) {
    const chartData = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'day': {
        const interval = { start: startOfDay(now), end: endOfDay(now) };
        const dayData = allData.filter(d => d.date >= interval.start && d.date <= interval.end);
        // This view is not very useful for new users, but we can aggregate per hour if needed.
        // For simplicity, we'll show a single point.
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
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{
            stroke: 'hsl(var(--border))',
            strokeWidth: 2,
            strokeDasharray: '3 3',
          }}
          content={<ChartTooltipContent
              formatter={(value, name) => [`${value} ${name === 'Alunos' ? 'novos alunos' : 'novos professores'}`, '']}
              labelClassName="font-bold"
            />}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="Alunos"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          activeDot={{ r: 8, fill: 'hsl(var(--chart-1))' }}
          dot={{r: 4, fill: 'hsl(var(--chart-1))'}}
        />
        <Line 
          type="monotone" 
          dataKey="Professores" 
          stroke="hsl(var(--chart-2))" 
          strokeWidth={2}
          activeDot={{ r: 8, fill: 'hsl(var(--chart-2))' }}
          dot={{r: 4, fill: 'hsl(var(--chart-2))'}}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
