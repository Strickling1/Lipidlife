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
  Area,
  ComposedChart,
} from "recharts";
import { format } from "date-fns";

interface PatientLDLChartProps {
  labResults: LabResult[];
  targetLDL: number;
}

export function PatientLDLChart({ labResults, targetLDL }: PatientLDLChartProps) {
  const sortedData = [...labResults]
    .sort((a, b) => (a.testDate > b.testDate ? 1 : -1))
    .map((r) => ({
      date: r.testDate,
      ldl: r.ldl,
      hdl: r.hdl,
      tc: r.totalCholesterol,
      tg: r.triglycerides,
      label: format(new Date(r.testDate), "MMM yy"),
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Lipid Panel History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={sortedData}>
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
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    ldl: "LDL",
                    hdl: "HDL",
                    tc: "Total Chol.",
                    tg: "Triglycerides",
                  };
                  return [`${value} mg/dL`, labels[name] || name];
                }}
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
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--destructive))" }}
                activeDot={{ r: 6 }}
                name="ldl"
              />
              <Line
                type="monotone"
                dataKey="hdl"
                stroke="hsl(var(--teal))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--teal))" }}
                name="hdl"
              />
              <Line
                type="monotone"
                dataKey="tc"
                stroke="hsl(var(--warning))"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={{ r: 2 }}
                name="tc"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex justify-center gap-4">
          <div className="flex items-center gap-1">
            <div className="size-2 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">LDL</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-2 rounded-full bg-teal" />
            <span className="text-xs text-muted-foreground">HDL</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-2 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
