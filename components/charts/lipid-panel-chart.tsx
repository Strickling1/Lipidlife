"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LabResult } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface LipidPanelChartProps {
  labResult: LabResult | null;
  targetLDL: number;
}

export function LipidPanelChart({ labResult, targetLDL }: LipidPanelChartProps) {
  if (!labResult) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">No lab results available</p>
        </CardContent>
      </Card>
    );
  }

  const data = [
    {
      name: "LDL",
      value: labResult.ldl,
      target: targetLDL,
      fill: labResult.ldl <= targetLDL ? "hsl(var(--success))" : "hsl(var(--destructive))",
    },
    {
      name: "HDL",
      value: labResult.hdl,
      target: 60,
      fill: labResult.hdl >= 60 ? "hsl(var(--success))" : "hsl(var(--warning))",
    },
    {
      name: "TG",
      value: labResult.triglycerides,
      target: 150,
      fill: labResult.triglycerides <= 150 ? "hsl(var(--success))" : "hsl(var(--warning))",
    },
    {
      name: "TC",
      value: labResult.totalCholesterol,
      target: 200,
      fill: labResult.totalCholesterol <= 200 ? "hsl(var(--success))" : "hsl(var(--warning))",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Lipid Panel Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 500 }}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string, props: { payload: { target: number } }) => [
                  `${value} mg/dL (Target: ${props.payload.target})`,
                  name,
                ]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="size-2 rounded-full bg-success" />
            <span className="text-muted-foreground">On Target</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">Borderline</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">High</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
