
'use client';

import type { Booking } from '@/types';
import { PREDEFINED_SKILLS, SKILL_RATING_VALUES, MAX_SKILL_RATING_VALUE, TARGET_SKILL_RATING_VALUE, KEY_SKILLS_FOR_CHART } from '@/constants';
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
  latestRating: number;
}

const chartConfig = {
  averageRating: {
    label: "Average Rating",
    color: "hsl(var(--chart-2))",
  },
  latestRating: {
    label: "Latest Rating",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function UserSkillsChart({ completedBookingsWithFeedback }: UserSkillsChartProps) {
  const chartData = useMemo(() => {
    const skillDataItems: ChartDataItem[] = [];
    
    const relevantSkills = KEY_SKILLS_FOR_CHART;

    if (!completedBookingsWithFeedback || completedBookingsWithFeedback.length === 0) {
      relevantSkills.forEach((skill) => {
        skillDataItems.push({
          skill: skill.length > 15 ? skill.substring(0, 13) + '...' : skill,
          fullSkillName: skill,
          averageRating: 0,
          latestRating: 0,
        });
      });
      return skillDataItems;
    }

    const sortedBookingsWithFeedback = [...completedBookingsWithFeedback].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const latestBookingWithFeedback = sortedBookingsWithFeedback[sortedBookingsWithFeedback.length - 1];

    relevantSkills.forEach((skill) => {
      let totalRating = 0;
      let count = 0;

      sortedBookingsWithFeedback.forEach(booking => {
        if (booking.detailedFeedback) {
          const skillFeedback = booking.detailedFeedback.find(fb => fb.skill === skill);
          if (skillFeedback && skillFeedback.rating && SKILL_RATING_VALUES[skillFeedback.rating]) {
            totalRating += SKILL_RATING_VALUES[skillFeedback.rating];
            count++;
          }
        }
      });
      const average = count > 0 ? parseFloat((totalRating / count).toFixed(1)) : 0;

      let latestRatingValue = 0;
      if (latestBookingWithFeedback && latestBookingWithFeedback.detailedFeedback) {
        const skillFeedbackInLatest = latestBookingWithFeedback.detailedFeedback.find(fb => fb.skill === skill);
        if (skillFeedbackInLatest && skillFeedbackInLatest.rating && SKILL_RATING_VALUES[skillFeedbackInLatest.rating]) {
          latestRatingValue = SKILL_RATING_VALUES[skillFeedbackInLatest.rating];
        }
      }

      skillDataItems.push({
        skill: skill.length > 15 ? skill.substring(0, 13) + '...' : skill,
        fullSkillName: skill,
        averageRating: average,
        latestRating: latestRatingValue,
      });
    });
    return skillDataItems;
  }, [completedBookingsWithFeedback]);

  const noDataAvailable = chartData.every(d => d.averageRating === 0 && d.latestRating === 0) && completedBookingsWithFeedback.length === 0;

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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary flex items-center">
           <TrendingUp className="mr-2 h-5 w-5" /> My Skills Overview
        </CardTitle>
        <CardDescription>
          Comparison of your latest session ratings vs. your historical average. Max: {MAX_SKILL_RATING_VALUE}. Target: {TARGET_SKILL_RATING_VALUE}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20, 
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
              height={70} 
              interval={0}
            />
            <YAxis
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
            <Bar dataKey="averageRating" fill="var(--color-averageRating)" radius={[4, 4, 0, 0]} name="Average Rating" />
            <Bar dataKey="latestRating" fill="var(--color-latestRating)" radius={[4, 4, 0, 0]} name="Latest Rating" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

    