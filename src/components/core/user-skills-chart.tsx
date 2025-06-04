
'use client';

import type { Booking } from '@/types';
import { PREDEFINED_SKILLS, SKILL_RATING_VALUES, MAX_SKILL_RATING_VALUE, TARGET_SKILL_RATING_VALUE } from '@/constants';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp } from 'lucide-react';

interface UserSkillsChartProps {
  completedBookingsWithFeedback: Booking[];
}

interface ChartDataItem {
  skill: string;
  averageRating: number;
  fill: string; // For bar color
}

const barColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function UserSkillsChart({ completedBookingsWithFeedback }: UserSkillsChartProps) {
  const chartData = useMemo(() => {
    const skillAverages: ChartDataItem[] = [];

    if (!completedBookingsWithFeedback || completedBookingsWithFeedback.length === 0) {
      // Populate with 0 if no feedback, so chart still renders with skills
      PREDEFINED_SKILLS.forEach((skill, index) => {
        skillAverages.push({
          skill: skill.length > 15 ? skill.substring(0,13) + '...' : skill, // Truncate long skill names for XAxis
          averageRating: 0,
          fill: barColors[index % barColors.length],
        });
      });
      return skillAverages;
    }

    PREDEFINED_SKILLS.forEach((skill, index) => {
      let totalRating = 0;
      let count = 0;

      completedBookingsWithFeedback.forEach(booking => {
        if (booking.detailedFeedback) {
          const skillFeedback = booking.detailedFeedback.find(fb => fb.skill === skill);
          if (skillFeedback && skillFeedback.rating && SKILL_RATING_VALUES[skillFeedback.rating]) {
            totalRating += SKILL_RATING_VALUES[skillFeedback.rating];
            count++;
          }
        }
      });
      const average = count > 0 ? parseFloat((totalRating / count).toFixed(1)) : 0;
      skillAverages.push({
        skill: skill.length > 15 ? skill.substring(0,13) + '...' : skill, // Truncate for display
        averageRating: average,
        fill: barColors[index % barColors.length],
      });
    });
    return skillAverages;
  }, [completedBookingsWithFeedback]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    chartData.forEach(item => {
      config[item.skill] = {
        label: item.skill, // Full skill name for tooltip
        color: item.fill,
      };
    });
    return config;
  }, [chartData]);


  if (chartData.every(d => d.averageRating === 0) && completedBookingsWithFeedback.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
             <TrendingUp className="mr-2 h-5 w-5" /> My Skills Overview
          </CardTitle>
          <CardDescription>Your average skill ratings based on mentor feedback will appear here once you complete sessions.</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">No feedback data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary flex items-center">
           <TrendingUp className="mr-2 h-5 w-5" /> My Skills Overview
        </CardTitle>
        <CardDescription>
          Average ratings across all completed sessions. Max rating: {MAX_SKILL_RATING_VALUE}. Target (Good): {TARGET_SKILL_RATING_VALUE}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 5,
              right: 5,
              left: -20, // Adjust for YAxis labels
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="skill"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              angle={-30} // Angle labels if they overlap
              textAnchor="end"
              height={60} // Increase height for angled labels
              interval={0} // Show all labels
            />
            <YAxis
              dataKey="averageRating"
              type="number"
              domain={[0, MAX_SKILL_RATING_VALUE]}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={5}
              ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ReferenceLine
              y={TARGET_SKILL_RATING_VALUE}
              label={{ value: "Target (Good)", position: "insideTopRight", fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
            />
            <Bar dataKey="averageRating" radius={4}>
              {chartData.map((entry) => (
                <div key={entry.skill} style={{ backgroundColor: entry.fill }} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
