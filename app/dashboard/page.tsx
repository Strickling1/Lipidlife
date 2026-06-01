"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LabResult, TaskLog } from "@/lib/types";
import { DAILY_HABITS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BottomNav } from "@/components/bottom-nav";
import { RiskRing } from "@/components/risk-ring";
import { LDLTrendChart } from "@/components/charts/ldl-trend-chart";
import {
  Flame,
  Plus,
  Check,
  LogOut,
  Activity,
  Droplets,
  Heart,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [taskLog, setTaskLog] = useState<TaskLog[]>([]);
  const [streak, setStreak] = useState(0);
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [labForm, setLabForm] = useState({
    ldl: "",
    hdl: "",
    tc: "",
    tg: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [labError, setLabError] = useState("");
  const [labSaving, setLabSaving] = useState(false);

  const loadLabResults = useCallback(async () => {
    if (!user || !db) return;
    const q = query(
      collection(db, "labResults"),
      where("userId", "==", user.uid),
      orderBy("testDate", "desc")
    );
    const snap = await getDocs(q);
    setLabResults(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LabResult)));
  }, [user]);

  const loadTaskLog = useCallback(async () => {
    if (!user || !db) return;
    const today = new Date().toISOString().split("T")[0];
    const q = query(
      collection(db, "taskLog"),
      where("userId", "==", user.uid),
      where("date", "==", today)
    );
    const snap = await getDocs(q);
    setTaskLog(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskLog)));
  }, [user]);

  const loadStreak = useCallback(async () => {
    if (!user || !db) return;
    const q = query(
      collection(db, "taskLog"),
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    const dates = [...new Set(snap.docs.map((d) => d.data().date))].sort().reverse();
    let streakCount = 0;
    let check = new Date().toISOString().split("T")[0];
    for (const d of dates) {
      if (d === check) {
        streakCount++;
        const dt = new Date(check);
        dt.setDate(dt.getDate() - 1);
        check = dt.toISOString().split("T")[0];
      } else break;
    }
    setStreak(streakCount);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadLabResults();
      loadTaskLog();
      loadStreak();
    }
  }, [user, loadLabResults, loadTaskLog, loadStreak]);

  const handleCompleteTask = async (taskId: string, taskName: string, points: number) => {
    if (!user || !db || taskLog.find((t) => t.taskId === taskId)) return;
    const today = new Date().toISOString().split("T")[0];
    await addDoc(collection(db, "taskLog"), {
      userId: user.uid,
      taskId,
      taskName,
      date: today,
      completed: true,
      pointsEarned: points,
      createdAt: serverTimestamp(),
    });
    setTaskLog((prev) => [
      ...prev,
      { id: "", userId: user.uid, taskId, taskName, date: today, completed: true, pointsEarned: points, createdAt: new Date() },
    ]);
    loadStreak();
  };

  const handleSaveLab = async () => {
    setLabError("");
    if (!labForm.ldl || !labForm.hdl || !labForm.tc || !labForm.tg || !labForm.date) {
      setLabError("Please fill all required fields.");
      return;
    }
    console.log("[v0] handleSaveLab - user:", user?.uid, "db:", db ? "OK" : "NULL");
    if (!user || !db) {
      setLabError("Not connected to database. Please refresh the page.");
      return;
    }
    setLabSaving(true);
    try {
      console.log("[v0] Attempting to save lab result to Firestore...");
      await addDoc(collection(db, "labResults"), {
        userId: user.uid,
        ldl: parseFloat(labForm.ldl),
        hdl: parseFloat(labForm.hdl),
        totalCholesterol: parseFloat(labForm.tc),
        triglycerides: parseFloat(labForm.tg),
        testDate: labForm.date,
        notes: labForm.notes,
        ldlStatus: parseFloat(labForm.ldl) > (profile?.targetLDL || 100) ? "Above Target" : "On Target",
        createdAt: serverTimestamp(),
      });
      console.log("[v0] Lab result saved successfully!");
      await loadLabResults();
      setLabModalOpen(false);
      setLabForm({ ldl: "", hdl: "", tc: "", tg: "", date: new Date().toISOString().split("T")[0], notes: "" });
    } catch (error) {
      console.error("[v0] Error saving lab result:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setLabError(`Error: ${errorMsg}`);
    }
    setLabSaving(false);
  };

  if (loading || !user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-2xl">Loading...</div>
        </div>
      </div>
    );
  }

  const latestLab = labResults[0];
  const completedTasks = taskLog.map((t) => t.taskId);
  const taskProgress = (completedTasks.length / DAILY_HABITS.length) * 100;
  const firstName = profile.name?.split(" ")[0] || "there";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Header */}
      <header className="bg-primary px-5 pt-4 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-foreground/70">{getGreeting()},</p>
            <h1 className="font-serif text-2xl text-primary-foreground">
              {firstName}{" "}
              <span className="text-warning">
                {profile.name?.split(" ").slice(1).join(" ")}
              </span>
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="border-primary-foreground/20 bg-transparent text-primary-foreground/70 hover:bg-primary-foreground/10"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      {/* Risk Ring */}
      <div className="bg-primary px-5 pb-6">
        <RiskRing
          riskCategory={profile.riskCategory}
          targetLDL={profile.targetLDL}
          currentLDL={latestLab?.ldl}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Streak */}
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-warning/20">
                <Flame className="size-6 text-warning" />
              </div>
              <div>
                <div className="font-serif text-3xl text-warning">{streak}</div>
                <p className="text-sm text-muted-foreground">
                  day streak - keep it going!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Latest Results */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Latest Blood Results
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Droplets className="size-3" />
                    LDL Cholesterol
                  </div>
                  <div className="mt-1 font-serif text-3xl">
                    {latestLab?.ldl || "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">mg/dL</div>
                  {latestLab && (
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        latestLab.ldl <= profile.targetLDL
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {latestLab.ldl <= profile.targetLDL ? "On target" : "Above target"}
                    </span>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Heart className="size-3" />
                    HDL Cholesterol
                  </div>
                  <div className="mt-1 font-serif text-3xl">
                    {latestLab?.hdl || "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">mg/dL</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="size-3" />
                    Triglycerides
                  </div>
                  <div className="mt-1 font-serif text-3xl">
                    {latestLab?.triglycerides || "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">mg/dL</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Activity className="size-3" />
                    Total Cholesterol
                  </div>
                  <div className="mt-1 font-serif text-3xl">
                    {latestLab?.totalCholesterol || "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">mg/dL</div>
                </CardContent>
              </Card>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {latestLab ? `Latest: ${latestLab.testDate}` : "No results yet"}
            </div>
            <Button onClick={() => setLabModalOpen(true)} className="w-full">
              <Plus className="size-4" />
              Add New Lab Result
            </Button>
          </div>

          {/* LDL Trend Chart */}
          {labResults.length >= 2 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                LDL Trend
              </h2>
              <LDLTrendChart
                labResults={labResults}
                targetLDL={profile.targetLDL}
              />
            </div>
          )}

          {/* Today's Habits */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Today&apos;s Habits
            </h2>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Daily Checklist</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {completedTasks.length} of {DAILY_HABITS.length} done
                  </span>
                </div>
                <Progress value={taskProgress} className="h-1" indicatorClassName="bg-success" />
              </CardHeader>
              <CardContent className="p-0">
                {DAILY_HABITS.map((task) => {
                  const isCompleted = completedTasks.includes(task.id);
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleCompleteTask(task.id, task.name, task.points)}
                      disabled={isCompleted}
                      className={`flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left transition-opacity ${
                        isCompleted ? "opacity-60" : "hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          isCompleted
                            ? "border-success bg-success text-success-foreground"
                            : "border-muted-foreground"
                        }`}
                      >
                        {isCompleted && <Check className="size-4" />}
                      </div>
                      <span
                        className={`flex-1 text-sm ${
                          isCompleted ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.name}
                      </span>
                      <span className="text-xs font-semibold text-warning">
                        +{task.points} pts
                      </span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Lab Result Modal */}
      <Dialog open={labModalOpen} onOpenChange={setLabModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Lab Result</DialogTitle>
            <DialogDescription>
              Enter your latest cholesterol panel values
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ldl">LDL (mg/dL) *</Label>
                <Input
                  id="ldl"
                  type="number"
                  value={labForm.ldl}
                  onChange={(e) => setLabForm({ ...labForm, ldl: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="hdl">HDL (mg/dL) *</Label>
                <Input
                  id="hdl"
                  type="number"
                  value={labForm.hdl}
                  onChange={(e) => setLabForm({ ...labForm, hdl: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tc">Total Chol. (mg/dL) *</Label>
                <Input
                  id="tc"
                  type="number"
                  value={labForm.tc}
                  onChange={(e) => setLabForm({ ...labForm, tc: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tg">Triglycerides (mg/dL) *</Label>
                <Input
                  id="tg"
                  type="number"
                  value={labForm.tg}
                  onChange={(e) => setLabForm({ ...labForm, tg: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Test Date *</Label>
              <Input
                id="date"
                type="date"
                value={labForm.date}
                onChange={(e) => setLabForm({ ...labForm, date: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={labForm.notes}
                onChange={(e) => setLabForm({ ...labForm, notes: e.target.value })}
                placeholder="Any notes about this test..."
              />
            </div>
            {labError && <p className="text-sm text-destructive">{labError}</p>}
            <Button onClick={handleSaveLab} disabled={labSaving}>
              {labSaving ? "Saving..." : "Save Result"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
