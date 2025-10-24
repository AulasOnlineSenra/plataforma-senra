
'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
    revenue: Math.random() * 1000 + 500,
  };
});

type FilterType = 'day' | 'week' | 'month' | 'year';

interface RevenueChartProps {
  filter: FilterType;
}

const chartConfig = {
  revenue: {
    label: 'Receita',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function RevenueChart({ filter }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'day': {
        const interval = { start: startOfDay(now), end: endOfDay(now) };
        const dayData = allData.filter(d => d.date >= interval.start && d.date <= interval.end);
        // This is not hourly, so we just show one point for simplicity.
        const totalRevenue = dayData.reduce((acc, curr) => acc + curr.revenue, 0);
        return [{ name: format(now, 'dd/MM'), revenue: totalRevenue }];
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
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${Number(value) / 1000}k`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))}
            indicator="dot"
          />}
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
