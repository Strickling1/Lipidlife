"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { calculateRisk, getRiskCategory, getTargetLDL } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BottomNav } from "@/components/bottom-nav";
import { Activity, AlertTriangle, CheckCircle, Target } from "lucide-react";

export default function RiskPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [age, setAge] = useState(52);
  const [ldl, setLdl] = useState(148);
  const [bp, setBp] = useState(138);
  const [hdl, setHdl] = useState(44);
  const [diabetes, setDiabetes] = useState(false);
  const [smoker, setSmoker] = useState(false);
  const [familyHistory, setFamilyHistory] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setAge(profile.age || 52);
      setDiabetes(profile.diabetes || false);
      setSmoker(profile.smoker || false);
      setFamilyHistory(profile.familyHistory || false);
    }
  }, [profile]);

  const riskScore = calculateRisk(age, ldl, bp, hdl, diabetes, smoker, familyHistory);
  const riskCategory = getRiskCategory(riskScore);
  const targetLDL = getTargetLDL(riskCategory);

  const riskColors = {
    Low: "text-success",
    Moderate: "text-warning",
    High: "text-destructive",
    "Very High": "text-destructive",
  };

  const tierColors = ["bg-success", "bg-warning", "bg-orange-500", "bg-destructive"];

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-2xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Header */}
      <header className="bg-primary px-5 pt-4 pb-6">
        <h1 className="font-serif text-2xl text-primary-foreground">
          10-Year Risk Calculator
        </h1>
        <p className="text-sm text-primary-foreground/70">
          Estimate your cardiovascular risk
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Sliders Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Your Numbers</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Age */}
              <div>
                <div className="flex justify-between text-sm">
                  <Label>Age</Label>
                  <span className="font-semibold">{age} years</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="80"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value))}
                  className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                />
              </div>
              {/* LDL */}
              <div>
                <div className="flex justify-between text-sm">
                  <Label>LDL Cholesterol</Label>
                  <span className="font-semibold">{ldl} mg/dL</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="250"
                  value={ldl}
                  onChange={(e) => setLdl(parseInt(e.target.value))}
                  className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                />
              </div>
              {/* Blood Pressure */}
              <div>
                <div className="flex justify-between text-sm">
                  <Label>Systolic Blood Pressure</Label>
                  <span className="font-semibold">{bp} mmHg</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="200"
                  value={bp}
                  onChange={(e) => setBp(parseInt(e.target.value))}
                  className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                />
              </div>
              {/* HDL */}
              <div>
                <div className="flex justify-between text-sm">
                  <Label>HDL Cholesterol</Label>
                  <span className="font-semibold">{hdl} mg/dL</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={hdl}
                  onChange={(e) => setHdl(parseInt(e.target.value))}
                  className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Toggles Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Risk Factors</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="diabetes">Diabetes</Label>
                <Switch
                  id="diabetes"
                  checked={diabetes}
                  onCheckedChange={setDiabetes}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="smoker">Current Smoker</Label>
                <Switch
                  id="smoker"
                  checked={smoker}
                  onCheckedChange={setSmoker}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="family">Family History of Heart Disease</Label>
                <Switch
                  id="family"
                  checked={familyHistory}
                  onCheckedChange={setFamilyHistory}
                />
              </div>
            </CardContent>
          </Card>

          {/* Result Card */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-primary-foreground/70">
                10-Year Cardiovascular Risk
              </p>
              <p className="mt-2 font-serif text-6xl">{riskScore}%</p>
              <div className="mt-4 flex justify-center gap-2">
                {tierColors.map((color, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i <
                      (riskScore < 5
                        ? 1
                        : riskScore < 10
                        ? 2
                        : riskScore < 20
                        ? 3
                        : 4)
                        ? color
                        : "bg-primary-foreground/20"
                    }`}
                  />
                ))}
              </div>
              <div
                className={`mt-4 inline-block rounded-full px-4 py-1 text-sm font-semibold ${
                  riskCategory === "Low"
                    ? "bg-success/20 text-success"
                    : riskCategory === "Moderate"
                    ? "bg-warning/20 text-warning"
                    : "bg-destructive/20 text-destructive"
                }`}
              >
                {riskCategory} Risk
              </div>
              <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed">
                {riskScore < 5 && (
                  <>
                    Low risk. Lifestyle alone can keep you here. LDL target:{" "}
                    <strong className="text-warning">&lt;116 mg/dL</strong>.
                  </>
                )}
                {riskScore >= 5 && riskScore < 10 && (
                  <>
                    Moderate risk. Lifestyle change can reduce this by{" "}
                    <strong className="text-warning">30-40%</strong>. LDL target:{" "}
                    <strong className="text-warning">&lt;100 mg/dL</strong>.
                  </>
                )}
                {riskScore >= 10 && riskScore < 20 && (
                  <>
                    High risk. Medication alongside lifestyle likely needed. LDL
                    target: <strong className="text-warning">&lt;70 mg/dL</strong>.
                  </>
                )}
                {riskScore >= 20 && (
                  <>
                    Very high risk. Aggressive treatment required. LDL target:{" "}
                    <strong className="text-warning">&lt;55 mg/dL</strong>. Consult
                    your cardiologist.
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* LDL Targets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="size-4" />
                LDL Targets by Risk Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {[
                  { risk: "Low", target: 116, color: "text-success" },
                  { risk: "Moderate", target: 100, color: "text-warning" },
                  { risk: "High", target: 70, color: "text-orange-500" },
                  { risk: "Very High", target: 55, color: "text-destructive" },
                ].map((item) => (
                  <div
                    key={item.risk}
                    className={`flex items-center justify-between border-b border-border py-3 last:border-0 ${
                      riskCategory === item.risk ? "font-semibold" : ""
                    }`}
                  >
                    <span className={item.color}>{item.risk}</span>
                    <span>&lt;{item.target} mg/dL</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
