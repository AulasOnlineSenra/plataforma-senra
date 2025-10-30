
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
  isWithinInterval,
  parse,
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

interface NewUsersChartProps {
  selectedMonth: string;
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


export function NewUsersChart({ selectedMonth }: NewUsersChartProps) {
    const chartData = useMemo(() => {
    const monthDate = parse(selectedMonth, 'yyyy-MM', new Date());
    const interval = {
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate),
    };
    const days = eachDayOfInterval(interval);

    return days.map(day => {
      const dayUsers = allData
        .filter(d => format(d.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
        .reduce((acc, curr) => ({
          Alunos: acc.Alunos + curr.Alunos,
          Professores: acc.Professores + curr.Professores,
        }), { Alunos: 0, Professores: 0 });
      return { name: format(day, 'dd/MM'), ...dayUsers };
    });
  }, [selectedMonth]);


  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
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
