
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';

const data = [
  { name: 'Matemática', value: 40, color: 'hsl(var(--chart-1))' },
  { name: 'Português', value: 25, color: 'hsl(var(--chart-2))' },
  { name: 'Física', value: 18, color: 'hsl(var(--chart-3))' },
  { name: 'Redação', value: 12, color: 'hsl(var(--chart-4))' },
  { name: 'Outros', value: 5, color: 'hsl(var(--chart-5))' },
];

const chartConfig = {
  value: {
    label: 'Aulas',
  },
  ...data.reduce((acc, cur) => {
    acc[cur.name] = {
      label: cur.name,
      color: cur.color,
    };
    return acc;
  }, {} as ChartConfig),
} satisfies ChartConfig;

export function SubjectsChart() {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-full"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
           {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
         <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
