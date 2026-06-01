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
import type { Appointment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { NotificationSettings } from "@/components/notification-settings";
import { scheduleAppointmentReminder } from "@/lib/notifications";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  MapPin,
  User,
  Clock,
  Check,
  Trash2,
  Stethoscope,
  TestTube,
  HeartPulse,
  MoreHorizontal,
} from "lucide-react";
import { format, isPast, isFuture, isToday, addDays } from "date-fns";

const TYPE_ICONS: Record<Appointment["type"], typeof Stethoscope> = {
  cardiology: HeartPulse,
  lab_work: TestTube,
  primary_care: Stethoscope,
  other: Calendar,
};

const TYPE_LABELS: Record<Appointment["type"], string> = {
  cardiology: "Cardiology",
  lab_work: "Lab Work",
  primary_care: "Primary Care",
  other: "Other",
};

export default function AppointmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "cardiology" as Appointment["type"],
    date: "",
    time: "",
    location: "",
    provider: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAppointments = useCallback(async () => {
    if (!user || !db) return;
    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid)
    );
    const snap = await getDocs(q);
    const appts = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      dateTime: d.data().dateTime?.toDate?.() || new Date(d.data().dateTime),
    } as Appointment));
    // Sort client-side to avoid composite index
    appts.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    setAppointments(appts);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, loadAppointments]);

  const handleSave = async () => {
    setError("");
    if (!form.title || !form.date || !form.time) {
      setError("Please fill title, date and time.");
      return;
    }
    if (!user || !db) return;
    setSaving(true);

    const dateTime = new Date(`${form.date}T${form.time}`);

    try {
      if (editing) {
        await updateDoc(doc(db, "appointments", editing.id), {
          title: form.title,
          type: form.type,
          dateTime,
          location: form.location,
          provider: form.provider,
          notes: form.notes,
        });
      } else {
        await addDoc(collection(db, "appointments"), {
          userId: user.uid,
          title: form.title,
          type: form.type,
          dateTime,
          location: form.location,
          provider: form.provider,
          notes: form.notes,
          reminderSent: false,
          completed: false,
          createdAt: serverTimestamp(),
        });
        // Schedule push notification reminder (24h before)
        scheduleAppointmentReminder(form.provider || form.title, dateTime);
        toast.success("Appointment scheduled!");
      }
      await loadAppointments();
      closeModal();
    } catch {
      setError("Error saving. Please try again.");
    }
    setSaving(false);
  };

  const handleComplete = async (appt: Appointment) => {
    if (!db) return;
    await updateDoc(doc(db, "appointments", appt.id), { completed: true });
    await loadAppointments();
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (!confirm("Delete this appointment?")) return;
    await deleteDoc(doc(db, "appointments", id));
    await loadAppointments();
  };

  const openEdit = (appt: Appointment) => {
    setEditing(appt);
    setForm({
      title: appt.title,
      type: appt.type,
      date: format(appt.dateTime, "yyyy-MM-dd"),
      time: format(appt.dateTime, "HH:mm"),
      location: appt.location || "",
      provider: appt.provider || "",
      notes: appt.notes || "",
    });
    setAddModalOpen(true);
  };

  const closeModal = () => {
    setAddModalOpen(false);
    setEditing(null);
    setForm({
      title: "",
      type: "cardiology",
      date: "",
      time: "",
      location: "",
      provider: "",
      notes: "",
    });
    setError("");
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

  const upcoming = appointments.filter(
    (a) => !a.completed && (isFuture(a.dateTime) || isToday(a.dateTime))
  );
  const past = appointments.filter((a) => a.completed || isPast(a.dateTime));

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Header */}
      <header className="bg-primary px-5 pt-4 pb-6">
        <h1 className="font-serif text-2xl text-primary-foreground">Appointments</h1>
        <p className="text-sm text-primary-foreground/70">
          Keep track of your medical visits
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Add Button */}
          <Button onClick={() => setAddModalOpen(true)} className="w-full">
            <Plus className="size-4" />
            Schedule Appointment
          </Button>

          {/* Notification Settings */}
          <NotificationSettings />

          {/* Upcoming */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="mx-auto size-12 text-muted-foreground/30" />
                  <p className="mt-4 text-muted-foreground">
                    No upcoming appointments. Schedule one to stay on track!
                  </p>
                </CardContent>
              </Card>
            ) : (
              upcoming.map((appt) => {
                const Icon = TYPE_ICONS[appt.type];
                const isNear = appt.dateTime <= addDays(new Date(), 3);
                return (
                  <Card
                    key={appt.id}
                    className={isNear ? "border-warning bg-warning/5" : ""}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                              isNear ? "bg-warning/20" : "bg-primary/10"
                            }`}
                          >
                            <Icon
                              className={`size-5 ${
                                isNear ? "text-warning" : "text-primary"
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold">{appt.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {TYPE_LABELS[appt.type]}
                            </p>
                            <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {format(appt.dateTime, "EEE, MMM d 'at' h:mm a")}
                              </span>
                              {appt.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3" />
                                  {appt.location}
                                </span>
                              )}
                              {appt.provider && (
                                <span className="flex items-center gap-1">
                                  <User className="size-3" />
                                  {appt.provider}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleComplete(appt)}
                            className="rounded p-2 text-success hover:bg-success/10"
                            title="Mark as complete"
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            onClick={() => openEdit(appt)}
                            className="rounded p-2 text-muted-foreground hover:bg-muted"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                      </div>
                      {appt.notes && (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          {appt.notes}
                        </p>
                      )}
                      {isNear && (
                        <div className="mt-2 rounded bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                          Coming up soon!
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Past / Completed ({past.length})
              </h2>
              {past.slice(0, 5).map((appt) => {
                const Icon = TYPE_ICONS[appt.type];
                return (
                  <Card key={appt.id} className="opacity-60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                            <Icon className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold line-through">{appt.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {format(appt.dateTime, "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="rounded p-2 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Add/Edit Modal */}
      <Dialog open={addModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Appointment" : "Schedule Appointment"}
            </DialogTitle>
            <DialogDescription>
              {editing ? "Update the appointment details" : "Add a new appointment"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Cardiology Follow-up"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as Appointment["type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="lab_work">Lab Work</SelectItem>
                  <SelectItem value="primary_care">Primary Care</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., City Hospital, Room 302"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="provider">Provider (optional)</Label>
              <Input
                id="provider"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                placeholder="e.g., Dr. Smith"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Questions to ask, things to bring..."
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : editing ? "Update" : "Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
