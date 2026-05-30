"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";

interface AdherenceChartProps {
  data: { date: string; adherence: number }[];
}

export function AdherenceChart({ data }: AdherenceChartProps) {
  // Generate last 7 days if no data
  const chartData = data.length > 0 
    ? data.slice(-7) 
    : Array.from({ length: 7 }, (_, i) => ({
        date: format(subDays(new Date(), 6 - i), "yyyy-MM-dd"),
        adherence: 0,
      }));

  const formattedData = chartData.map((d) => ({
    ...d,
    label: format(new Date(d.date), "EEE"),
  }));

  const avgAdherence = chartData.length > 0
    ? Math.round(chartData.reduce((acc, d) => acc + d.adherence, 0) / chartData.length)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Medication Adherence</CardTitle>
          <span className={`text-lg font-serif ${
            avgAdherence >= 80 ? "text-success" : avgAdherence >= 50 ? "text-warning" : "text-destructive"
          }`}>
            {avgAdherence}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground">7-day average</p>
      </CardHeader>
      <CardContent>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--teal))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--teal))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={25}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}%`, "Adherence"]}
              />
              <Area
                type="monotone"
                dataKey="adherence"
                stroke="hsl(var(--teal))"
                strokeWidth={2}
                fill="url(#adherenceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
