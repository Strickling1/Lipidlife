"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface HabitsRadarChartProps {
  data: {
    habit: string;
    score: number;
  }[];
}

export function HabitsRadarChart({ data }: HabitsRadarChartProps) {
  const defaultData = [
    { habit: "Exercise", score: 0 },
    { habit: "Diet", score: 0 },
    { habit: "Sleep", score: 0 },
    { habit: "Stress", score: 0 },
    { habit: "Hydration", score: 0 },
    { habit: "Medication", score: 0 },
  ];

  const chartData = data.length > 0 ? data : defaultData;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Health Habits Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="habit"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="hsl(var(--teal))"
                fill="hsl(var(--teal))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
