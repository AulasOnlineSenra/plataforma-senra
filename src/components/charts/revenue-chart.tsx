
'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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
  eachWeekOfInterval,
  eachMonthOfInterval,
  getYear,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const allData = Array.from({ length: 365 * 2 }).map((_, i) => {
  const date = new Date(2023, 0, 1);
  date.setDate(date.getDate() + i);
  return {
    date: date,
    revenue: Math.random() * 1000 + 500,
  };
});

type FilterType = 'day' | 'week' | 'month' | 'year';

interface RevenueChartProps {
  filter: FilterType;
}

export function RevenueChart({ filter }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'day': {
        const interval = { start: startOfDay(now), end: endOfDay(now) };
        const dayData = allData.filter(d => d.date >= interval.start && d.date <= interval.end);
        return dayData.map(d => ({ name: format(d.date, 'HH:mm'), revenue: d.revenue }));
      }
      case 'week': {
        const interval = { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
        const weekData = eachDayOfInterval(interval);
        return weekData.map(day => {
          const dayRevenue = allData
            .filter(d => d.date.toDateString() === day.toDateString())
            .reduce((acc, curr) => acc + curr.revenue, 0);
          return { name: format(day, 'EEE', { locale: ptBR }), revenue: dayRevenue };
        });
      }
      case 'month': {
        const interval = { start: startOfMonth(now), end: endOfMonth(now) };
        const monthData = eachDayOfInterval(interval);
        return monthData.map(day => {
            const dayRevenue = allData
              .filter(d => d.date.toDateString() === day.toDateString())
              .reduce((acc, curr) => acc + curr.revenue, 0);
            return { name: format(day, 'd'), revenue: dayRevenue };
        });
      }
      case 'year': {
        const interval = { start: startOfYear(now), end: endOfYear(now) };
        const yearData = eachMonthOfInterval(interval);
        return yearData.map(month => {
          const monthRevenue = allData
            .filter(d => d.date.getMonth() === month.getMonth() && d.date.getFullYear() === month.getFullYear())
            .reduce((acc, curr) => acc + curr.revenue, 0);
          return { name: format(month, 'MMM', { locale: ptBR }), revenue: monthRevenue };
        });
      }
      default:
        return [];
    }
  }, [filter]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${value / 1000}k`}
        />
        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(value)
          }
          cursor={{ fill: 'hsl(var(--accent) / 0.3)' }}
        />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
