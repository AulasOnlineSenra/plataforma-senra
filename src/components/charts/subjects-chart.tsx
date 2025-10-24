
'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Sector } from 'recharts';
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

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + (outerRadius * 0.1)} // Increase size by 10%
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={fill}
        strokeWidth={2}
      />
    </g>
  );
};


export function SubjectsChart() {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

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
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={80}
          strokeWidth={5}
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
        >
           {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
         <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4"
        />
      </PieChart>
    </ChartContainer>
  );
}
