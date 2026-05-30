"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LabResult } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";

interface LDLTrendChartProps {
  labResults: LabResult[];
  targetLDL: number;
}

export function LDLTrendChart({ labResults, targetLDL }: LDLTrendChartProps) {
  const sortedData = [...labResults]
    .sort((a, b) => (a.testDate > b.testDate ? 1 : -1))
    .slice(-6)
    .map((r) => ({
      date: r.testDate,
      ldl: r.ldl,
      label: format(new Date(r.testDate), "MMM"),
    }));

  const firstLDL = sortedData[0]?.ldl || 0;
  const lastLDL = sortedData[sortedData.length - 1]?.ldl || 0;
  const diff = firstLDL - lastLDL;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">LDL Progress</CardTitle>
          <span
            className={`text-sm font-semibold ${
              diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {diff > 0 ? `Down ${diff}` : diff < 0 ? `Up ${Math.abs(diff)}` : "Stable"} mg/dL
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sortedData}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                domain={["dataMin - 20", "dataMax + 20"]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <ReferenceLine
                y={targetLDL}
                stroke="hsl(var(--success))"
                strokeDasharray="5 5"
                label={{
                  value: `Target: ${targetLDL}`,
                  position: "right",
                  fontSize: 10,
                  fill: "hsl(var(--success))",
                }}
              />
              <Line
                type="monotone"
                dataKey="ldl"
                stroke="hsl(var(--teal))"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--teal))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
