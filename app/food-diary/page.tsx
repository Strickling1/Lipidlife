"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FoodEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNav } from "@/components/bottom-nav";
import { Plus, Utensils, Leaf, Fish, AlertTriangle, Trash2 } from "lucide-react";
import { format, subDays } from "date-fns";

const MEAL_ICONS: Record<FoodEntry["mealType"], string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

const HEART_HEALTHY_FOODS = [
  "Oatmeal", "Salmon", "Almonds", "Walnuts", "Avocado", "Olive oil",
  "Berries", "Beans", "Spinach", "Broccoli", "Sweet potato", "Quinoa",
  "Sardines", "Mackerel", "Flaxseed", "Chia seeds", "Dark chocolate",
  "Green tea", "Garlic", "Tomatoes"
];

export default function FoodDiaryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({
    mealType: "breakfast" as FoodEntry["mealType"],
    foods: "",
    saturatedFat: "low" as FoodEntry["saturatedFat"],
    fiber: "medium" as FoodEntry["fiber"],
    omega3: false,
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user || !db) return;
    const weekAgo = subDays(new Date(), 7).toISOString().split("T")[0];
    const snap = await getDocs(collection(db, "foodEntries"));
    const foods = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as FoodEntry))
      .filter((f) => f.userId === user.uid && f.date >= weekAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEntries(foods);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user, loadEntries]);

  const handleSave = async () => {
    setError("");
    if (!form.foods.trim()) {
      setError("Please enter at least one food item.");
      return;
    }
    if (!user || !db) return;
    setSaving(true);

    const foodsList = form.foods.split(",").map((f) => f.trim()).filter(Boolean);
    const impact = calculateImpact(form.saturatedFat, form.fiber, form.omega3);

    try {
      await addDoc(collection(db, "foodEntries"), {
        userId: user.uid,
        date: selectedDate,
        mealType: form.mealType,
        foods: foodsList,
        saturatedFat: form.saturatedFat,
        fiber: form.fiber,
        omega3: form.omega3,
        cholesterolImpact: impact,
        notes: form.notes,
        createdAt: serverTimestamp(),
      });
      await loadEntries();
      closeModal();
    } catch {
      setError("Error saving. Please try again.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (!confirm("Delete this entry?")) return;
    await deleteDoc(doc(db, "foodEntries", id));
    await loadEntries();
  };

  const closeModal = () => {
    setAddModalOpen(false);
    setForm({
      mealType: "breakfast",
      foods: "",
      saturatedFat: "low",
      fiber: "medium",
      omega3: false,
      notes: "",
    });
    setError("");
  };

  const calculateImpact = (
    satFat: FoodEntry["saturatedFat"],
    fiber: FoodEntry["fiber"],
    omega3: boolean
  ): FoodEntry["cholesterolImpact"] => {
    let score = 0;
    if (satFat === "low") score += 2;
    else if (satFat === "medium") score += 0;
    else score -= 2;

    if (fiber === "high") score += 2;
    else if (fiber === "medium") score += 1;

    if (omega3) score += 1;

    if (score >= 3) return "positive";
    if (score >= 0) return "neutral";
    return "negative";
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-2xl">Loading...</div>
        </div>
      </div>
    );
  }

  const todayEntries = entries.filter((e) => e.date === selectedDate);
  const todayStats = {
    meals: todayEntries.length,
    fiber: todayEntries.filter((e) => e.fiber === "high").length,
    omega3: todayEntries.filter((e) => e.omega3).length,
    lowSatFat: todayEntries.filter((e) => e.saturatedFat === "low").length,
  };

  const impactColors: Record<FoodEntry["cholesterolImpact"], string> = {
    positive: "bg-success/20 text-success",
    neutral: "bg-secondary text-muted-foreground",
    negative: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Header */}
      <header className="bg-primary px-5 pt-4 pb-6">
        <h1 className="font-serif text-2xl text-primary-foreground">Food Diary</h1>
        <p className="text-sm text-primary-foreground/70">
          Track your diet for heart health
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Date Selector */}
          <div className="flex items-center justify-between">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <Button onClick={() => setAddModalOpen(true)} size="sm">
              <Plus className="size-4" />
              Log Meal
            </Button>
          </div>

          {/* Today's Stats */}
          <div className="grid grid-cols-4 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <Utensils className="mx-auto size-5 text-muted-foreground" />
                <div className="mt-1 font-serif text-xl">{todayStats.meals}</div>
                <div className="text-[10px] text-muted-foreground">Meals</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Leaf className="mx-auto size-5 text-success" />
                <div className="mt-1 font-serif text-xl">{todayStats.fiber}</div>
                <div className="text-[10px] text-muted-foreground">High Fiber</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Fish className="mx-auto size-5 text-teal" />
                <div className="mt-1 font-serif text-xl">{todayStats.omega3}</div>
                <div className="text-[10px] text-muted-foreground">Omega-3</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <AlertTriangle className="mx-auto size-5 text-warning" />
                <div className="mt-1 font-serif text-xl">{todayStats.lowSatFat}</div>
                <div className="text-[10px] text-muted-foreground">Low Sat. Fat</div>
              </CardContent>
            </Card>
          </div>

          {/* Entries */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {format(new Date(selectedDate), "EEEE, MMMM d")}
            </h2>
            {todayEntries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Utensils className="mx-auto size-12 text-muted-foreground/30" />
                  <p className="mt-4 text-muted-foreground">
                    No meals logged for this day. Start tracking your food intake!
                  </p>
                </CardContent>
              </Card>
            ) : (
              todayEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{MEAL_ICONS[entry.mealType]}</span>
                        <div>
                          <h3 className="font-semibold capitalize">{entry.mealType}</h3>
                          <p className="text-sm text-muted-foreground">
                            {entry.foods.join(", ")}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${impactColors[entry.cholesterolImpact]}`}>
                              {entry.cholesterolImpact === "positive" && "Heart Healthy"}
                              {entry.cholesterolImpact === "neutral" && "Neutral"}
                              {entry.cholesterolImpact === "negative" && "Watch This"}
                            </span>
                            {entry.omega3 && (
                              <span className="inline-flex items-center gap-1 text-xs text-teal">
                                <Fish className="size-3" /> Omega-3
                              </span>
                            )}
                            {entry.fiber === "high" && (
                              <span className="inline-flex items-center gap-1 text-xs text-success">
                                <Leaf className="size-3" /> High Fiber
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Heart-Healthy Foods */}
          <Card className="bg-success/5 border-success/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Heart-Healthy Foods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {HEART_HEALTHY_FOODS.slice(0, 10).map((food) => (
                  <span
                    key={food}
                    className="rounded-full bg-success/20 px-2 py-1 text-xs text-success"
                  >
                    {food}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Meal</DialogTitle>
            <DialogDescription>
              Track what you ate and its cholesterol impact
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Meal Type</Label>
              <Select
                value={form.mealType}
                onValueChange={(v) => setForm({ ...form, mealType: v as FoodEntry["mealType"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="foods">Foods (comma separated) *</Label>
              <Textarea
                id="foods"
                value={form.foods}
                onChange={(e) => setForm({ ...form, foods: e.target.value })}
                placeholder="e.g., Oatmeal, Blueberries, Almonds"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Saturated Fat</Label>
                <Select
                  value={form.saturatedFat}
                  onValueChange={(v) => setForm({ ...form, saturatedFat: v as FoodEntry["saturatedFat"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Fiber Content</Label>
                <Select
                  value={form.fiber}
                  onValueChange={(v) => setForm({ ...form, fiber: v as FoodEntry["fiber"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="omega3"
                checked={form.omega3}
                onChange={(e) => setForm({ ...form, omega3: e.target.checked })}
                className="size-4 rounded border-input"
              />
              <Label htmlFor="omega3" className="font-normal">
                Contains Omega-3 (fish, flaxseed, walnuts, etc.)
              </Label>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes..."
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Log Meal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
