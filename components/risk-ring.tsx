"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { UserProfile } from "@/lib/types";

interface RiskRingProps {
  riskCategory: UserProfile["riskCategory"];
  targetLDL: number;
  currentLDL?: number;
}

const riskScores: Record<UserProfile["riskCategory"], number> = {
  Low: 5,
  Moderate: 12,
  High: 18,
  "Very High": 28,
};

export function RiskRing({ riskCategory, targetLDL, currentLDL }: RiskRingProps) {
  const riskPct = riskScores[riskCategory] || 12;
  const circumference = 226;
  const offset = circumference - (circumference * (riskPct / 40));

  return (
    <Card className="border-primary-foreground/10 bg-primary/50">
      <CardContent className="flex items-center gap-4 p-4">
        {/* Ring */}
        <div className="relative size-24 shrink-0">
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            className="-rotate-90"
          >
            <circle
              cx="48"
              cy="48"
              r="36"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <circle
              cx="48"
              cy="48"
              r="36"
              fill="none"
              stroke="#F5A623"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-2xl font-semibold text-primary-foreground">
              {riskPct}%
            </span>
            <span className="text-[10px] uppercase tracking-wider text-primary-foreground/60">
              10-yr risk
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-primary-foreground/60">
            Cardiac Risk Category
          </span>
          <span className="font-serif text-xl text-primary-foreground">
            {riskCategory}
          </span>
          <span className="mt-1 inline-block w-fit rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning">
            {riskCategory}
          </span>
          <span className="text-xs text-primary-foreground/70">
            LDL target: &lt;{targetLDL} mg/dL
            {currentLDL && (
              <span
                className={
                  currentLDL <= targetLDL ? "text-success" : "text-destructive"
                }
              >
                {" "}
                (current: {currentLDL})
              </span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
