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
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Medication, MedicationLog } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNav } from "@/components/bottom-nav";
import { AdherenceChart } from "@/components/charts/adherence-chart";
import { NotificationSettings } from "@/components/notification-settings";
import { scheduleMedicationReminder } from "@/lib/notifications";
import { toast } from "sonner";
import {
  Plus,
  Check,
  Pill,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  X,
} from "lucide-react";
import { format, isToday, startOfDay } from "date-fns";

export default function MedicationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "daily" as Medication["frequency"],
    timeOfDay: "morning" as Medication["timeOfDay"],
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [adherenceData, setAdherenceData] = useState<{ date: string; adherence: number }[]>([]);

  const loadMedications = useCallback(async () => {
    if (!user) return;
    const q = query(
      collection(db, "medications"),
      where("userId", "==", user.uid),
      where("active", "==", true),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    setMedications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Medication)));
  }, [user]);

  const loadTodayLogs = useCallback(async () => {
    if (!user) return;
    const today = startOfDay(new Date());
    const q = query(
      collection(db, "medicationLogs"),
      where("userId", "==", user.uid),
      where("takenAt", ">=", today)
    );
    const snap = await getDocs(q);
    setTodayLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MedicationLog)));
  }, [user]);

  const loadAdherenceHistory = useCallback(async () => {
    if (!user || medications.length === 0) return;
    // Calculate adherence for last 7 days
    const data: { date: string; adherence: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const q = query(
        collection(db, "medicationLogs"),
        where("userId", "==", user.uid),
        where("takenAt", ">=", dayStart),
        where("takenAt", "<", dayEnd)
      );
      const snap = await getDocs(q);
      const takenCount = snap.docs.filter((d) => !d.data().skipped).length;
      const adherence = medications.length > 0 ? Math.round((takenCount / medications.length) * 100) : 0;
      data.push({ date: dateStr, adherence });
    }
    setAdherenceData(data);
  }, [user, medications]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadMedications();
      loadTodayLogs();
    }
  }, [user, loadMedications, loadTodayLogs]);

  useEffect(() => {
    if (medications.length > 0) {
      loadAdherenceHistory();
    }
  }, [medications, loadAdherenceHistory]);

  const handleSave = async () => {
    setError("");
    if (!form.name || !form.dosage) {
      setError("Please fill name and dosage.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      if (editingMed) {
        await updateDoc(doc(db, "medications", editingMed.id), {
          name: form.name,
          dosage: form.dosage,
          frequency: form.frequency,
          timeOfDay: form.timeOfDay,
          notes: form.notes,
        });
      } else {
        await addDoc(collection(db, "medications"), {
          userId: user.uid,
          name: form.name,
          dosage: form.dosage,
          frequency: form.frequency,
          timeOfDay: form.timeOfDay,
          notes: form.notes,
          startDate: new Date().toISOString().split("T")[0],
          active: true,
          createdAt: serverTimestamp(),
        });
        // Schedule reminder if notifications enabled
        const timeMap: Record<string, string> = {
          morning: "08:00",
          afternoon: "13:00",
          evening: "18:00",
          bedtime: "21:00",
        };
        scheduleMedicationReminder(form.name, timeMap[form.timeOfDay]);
        toast.success(`${form.name} added successfully`);
      }
      await loadMedications();
      closeModal();
    } catch {
      setError("Error saving. Please try again.");
    }
    setSaving(false);
  };

  const handleDelete = async (medId: string) => {
    if (!confirm("Delete this medication?")) return;
    await deleteDoc(doc(db, "medications", medId));
    await loadMedications();
    setMenuOpenId(null);
  };

  const handleTakeMedication = async (med: Medication) => {
    if (!user) return;
    const alreadyTaken = todayLogs.find((l) => l.medicationId === med.id && !l.skipped);
    if (alreadyTaken) return;
    await addDoc(collection(db, "medicationLogs"), {
      medicationId: med.id,
      userId: user.uid,
      takenAt: serverTimestamp(),
      skipped: false,
    });
    await loadTodayLogs();
  };

  const closeModal = () => {
    setAddModalOpen(false);
    setEditingMed(null);
    setForm({ name: "", dosage: "", frequency: "daily", timeOfDay: "morning", notes: "" });
    setError("");
  };

  const openEditModal = (med: Medication) => {
    setEditingMed(med);
    setForm({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      timeOfDay: med.timeOfDay,
      notes: med.notes || "",
    });
    setAddModalOpen(true);
    setMenuOpenId(null);
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

  const takenCount = medications.filter((m) =>
    todayLogs.some((l) => l.medicationId === m.id && !l.skipped)
  ).length;
  const adherencePercent = medications.length > 0 ? (takenCount / medications.length) * 100 : 0;

  const timeLabels: Record<Medication["timeOfDay"], string> = {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    bedtime: "Bedtime",
  };

  const freqLabels: Record<Medication["frequency"], string> = {
    daily: "Daily",
    twice_daily: "Twice Daily",
    weekly: "Weekly",
    as_needed: "As Needed",
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Header */}
      <header className="bg-primary px-5 pt-4 pb-6">
        <h1 className="font-serif text-2xl text-primary-foreground">Medications</h1>
        <p className="text-sm text-primary-foreground/70">
          Track your daily medication adherence
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Adherence Card */}
          <Card className="bg-teal/10 border-teal/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Today&apos;s Adherence
                  </p>
                  <p className="font-serif text-3xl text-teal">
                    {Math.round(adherencePercent)}%
                  </p>
                </div>
                <div className="flex size-16 items-center justify-center rounded-full bg-teal/20">
                  <Pill className="size-8 text-teal" />
                </div>
              </div>
              <Progress
                value={adherencePercent}
                className="mt-3 h-2"
                indicatorClassName="bg-teal"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {takenCount} of {medications.length} medications taken today
              </p>
            </CardContent>
</Card>

          {/* Adherence Chart */}
          {adherenceData.length > 0 && (
            <AdherenceChart data={adherenceData} />
          )}

          {/* Notification Settings */}
          <NotificationSettings />

          {/* Add Button */}
          <Button onClick={() => setAddModalOpen(true)} className="w-full">
            <Plus className="size-4" />
            Add Medication
          </Button>

          {/* Medications List */}
          <div className="flex flex-col gap-3">
            {medications.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Pill className="mx-auto size-12 text-muted-foreground/30" />
                  <p className="mt-4 text-muted-foreground">
                    No medications added yet. Add your first medication to start tracking.
                  </p>
                </CardContent>
              </Card>
            ) : (
              medications.map((med) => {
                const isTaken = todayLogs.some((l) => l.medicationId === med.id && !l.skipped);
                return (
                  <Card key={med.id} className={isTaken ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleTakeMedication(med)}
                            disabled={isTaken}
                            className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              isTaken
                                ? "border-success bg-success text-success-foreground"
                                : "border-muted-foreground hover:border-teal"
                            }`}
                          >
                            {isTaken && <Check className="size-4" />}
                          </button>
                          <div>
                            <h3
                              className={`font-semibold ${
                                isTaken ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {med.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{med.dosage}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                                <Clock className="size-3" />
                                {timeLabels[med.timeOfDay]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {freqLabels[med.frequency]}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setMenuOpenId(menuOpenId === med.id ? null : med.id)
                            }
                            className="rounded p-1 hover:bg-muted"
                          >
                            <MoreVertical className="size-5 text-muted-foreground" />
                          </button>
                          {menuOpenId === med.id && (
                            <div className="absolute right-0 top-8 z-10 min-w-[120px] rounded-lg border bg-card p-1 shadow-lg">
                              <button
                                onClick={() => openEditModal(med)}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                              >
                                <Edit className="size-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(med.id)}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {med.notes && (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          {med.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Add/Edit Modal */}
      <Dialog open={addModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMed ? "Edit Medication" : "Add Medication"}</DialogTitle>
            <DialogDescription>
              {editingMed
                ? "Update your medication details"
                : "Enter your medication information"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Medication Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Atorvastatin"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                placeholder="e.g., 20mg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Frequency</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => setForm({ ...form, frequency: v as Medication["frequency"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="twice_daily">Twice Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="as_needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Time of Day</Label>
                <Select
                  value={form.timeOfDay}
                  onValueChange={(v) => setForm({ ...form, timeOfDay: v as Medication["timeOfDay"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="bedtime">Bedtime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any special instructions..."
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : editingMed ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
