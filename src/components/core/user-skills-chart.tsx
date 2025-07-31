
'use client';

import type { Booking } from '@/types';
import { PREDEFINED_SKILLS, SKILL_RATING_VALUES, MAX_SKILL_RATING_VALUE, TARGET_SKILL_RATING_VALUE } from '@/constants';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Legend } from 'recharts';
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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp } from 'lucide-react';

interface UserSkillsChartProps {
  completedBookingsWithFeedback: Booking[];
}

interface ChartDataItem {
  skill: string; // Shortened skill name for XAxis
  fullSkillName: string; // Full skill name for tooltip
  averageRating: number;
  firstRating: number;
}

const chartConfig = {
  averageRating: {
    label: "Average Rating",
    color: "hsl(var(--chart-1))",
  },
  firstRating: {
    label: "First Session Rating",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function UserSkillsChart({ completedBookingsWithFeedback }: UserSkillsChartProps) {
  const chartData = useMemo(() => {
    const skillDataItems: ChartDataItem[] = [];

    if (!completedBookingsWithFeedback || completedBookingsWithFeedback.length === 0) {
      PREDEFINED_SKILLS.forEach((skill) => {
        skillDataItems.push({
          skill: skill.length > 15 ? skill.substring(0, 13) + '...' : skill,
          fullSkillName: skill,
          averageRating: 0,
          firstRating: 0,
        });
      });
      return skillDataItems;
    }

    const sortedBookingsWithFeedback = [...completedBookingsWithFeedback].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstBookingWithAnyFeedback = sortedBookingsWithFeedback[0];

    PREDEFINED_SKILLS.forEach((skill) => {
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

      let firstRatingValue = 0;
      if (firstBookingWithAnyFeedback && firstBookingWithAnyFeedback.detailedFeedback) {
        const skillFeedbackInFirst = firstBookingWithAnyFeedback.detailedFeedback.find(fb => fb.skill === skill);
        if (skillFeedbackInFirst && skillFeedbackInFirst.rating && SKILL_RATING_VALUES[skillFeedbackInFirst.rating]) {
          firstRatingValue = SKILL_RATING_VALUES[skillFeedbackInFirst.rating];
        }
      }

      skillDataItems.push({
        skill: skill.length > 15 ? skill.substring(0, 13) + '...' : skill,
        fullSkillName: skill,
        averageRating: average,
        firstRating: firstRatingValue,
      });
    });
    return skillDataItems;
  }, [completedBookingsWithFeedback]);

  const noDataAvailable = chartData.every(d => d.averageRating === 0 && d.firstRating === 0) && completedBookingsWithFeedback.length === 0;

  if (noDataAvailable) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
             <TrendingUp className="mr-2 h-5 w-5" /> My Skills Overview
          </CardTitle>
          <CardDescription>Your skill ratings based on mentor feedback will appear here once you complete sessions.</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">No feedback data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare a config that maps full skill names to their display names for the tooltip
  const tooltipChartConfig: ChartConfig = Object.fromEntries(
    Object.entries(chartConfig).concat(
      chartData.map(item => [item.fullSkillName, { label: item.fullSkillName }]) // this part might not be strictly needed if tooltip auto-uses dataKey name
    )
  );


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary flex items-center">
           <TrendingUp className="mr-2 h-5 w-5" /> My Skills Overview
        </CardTitle>
        <CardDescription>
          Comparison of first session ratings vs. average ratings. Max: {MAX_SKILL_RATING_VALUE}. Target (Good): {TARGET_SKILL_RATING_VALUE}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={tooltipChartConfig} className="h-[400px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20, // Increased top margin for legend
              right: 5,
              left: -20,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="skill"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              angle={-30}
              textAnchor="end"
              height={70} // Increased height for angled labels
              interval={0}
            />
            <YAxis
              dataKey="averageRating" // This sets the scale, firstRating will use the same scale
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
            <ChartLegend content={<ChartLegendContent />} />
            <ReferenceLine
              y={TARGET_SKILL_RATING_VALUE}
              label={{ value: "Target (Good)", position: "insideTopRight", fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
            />
            <Bar dataKey="firstRating" fill="var(--color-firstRating)" radius={[4, 4, 0, 0]} name="First Session Rating" />
            <Bar dataKey="averageRating" fill="var(--color-averageRating)" radius={[4, 4, 0, 0]} name="Average Rating" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
