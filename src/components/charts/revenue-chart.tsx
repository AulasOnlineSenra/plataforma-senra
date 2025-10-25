
'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
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
    color: 'hsl(var(--sidebar-primary))',
  },
} satisfies ChartConfig;

export function RevenueChart({ filter }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'day': {
        const interval = { start: new Date(2025, 0, 1), end: now };
         const days = eachDayOfInterval(interval);
        return days.map(day => {
          const dayRevenue = allData
            .filter(d => d.date.toDateString() === day.toDateString())
            .reduce((acc, curr) => acc + curr.revenue, 0);
          return { name: format(day, 'dd/MM'), revenue: dayRevenue };
        });
      }
      case 'week': {
        const start = startOfYear(now);
        const end = endOfYear(now);
        const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        return weeks.map(weekStart => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekRevenue = allData
            .filter(d => d.date >= weekStart && d.date <= weekEnd)
            .reduce((acc, curr) => acc + curr.revenue, 0);
          return {
            name: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`,
            revenue: weekRevenue,
          };
        });
      }
      case 'month': {
        const interval = { start: startOfYear(now), end: endOfYear(now) };
        const months = eachMonthOfInterval(interval);
        return months.map(month => {
          const monthRevenue = allData
            .filter(d => d.date.getMonth() === month.getMonth() && d.date.getFullYear() === month.getFullYear())
            .reduce((acc, curr) => acc + curr.revenue, 0);
          return { name: format(month, 'MMM', { locale: ptBR }), revenue: monthRevenue };
        });
      }
      case 'year': {
         const years = eachYearOfInterval({
          start: new Date(2022, 0, 1),
          end: now,
        });
        return years.map(year => {
          const yearRevenue = allData
            .filter(d => d.date.getFullYear() === year.getFullYear())
            .reduce((acc, curr) => acc + curr.revenue, 0);
          return { name: format(year, 'yyyy'), revenue: yearRevenue };
        });
      }
      default:
        return [];
    }
  }, [filter]);

  const barChartWidth = chartData.length * 40;

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <div className="w-full overflow-x-auto">
        <ResponsiveContainer width={Math.max(barChartWidth, 300)} height={350}>
            <BarChart
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
                tickMargin={10}
                axisLine={false}
                interval="auto"
            />
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
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
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
