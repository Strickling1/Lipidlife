"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Check } from "lucide-react";
import {
  requestNotificationPermission,
  registerServiceWorker,
  scheduleDailyHabitReminder,
} from "@/lib/notifications";
import { toast } from "sonner";

interface NotificationSettingsProps {
  onMedicationRemindersChange?: (enabled: boolean) => void;
  onAppointmentRemindersChange?: (enabled: boolean) => void;
}

export function NotificationSettings({
  onMedicationRemindersChange,
  onAppointmentRemindersChange,
}: NotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [medicationReminders, setMedicationReminders] = useState(false);
  const [appointmentReminders, setAppointmentReminders] = useState(false);
  const [dailyHabitReminders, setDailyHabitReminders] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Load saved preferences
    const savedMed = localStorage.getItem("medication-reminders");
    const savedAppt = localStorage.getItem("appointment-reminders");
    const savedHabit = localStorage.getItem("daily-habit-reminders");

    if (savedMed) setMedicationReminders(savedMed === "true");
    if (savedAppt) setAppointmentReminders(savedAppt === "true");
    if (savedHabit) setDailyHabitReminders(savedHabit === "true");
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    const result = await requestNotificationPermission();
    setPermission(result);

    if (result === "granted") {
      await registerServiceWorker();
      toast.success("Notifications enabled!");
    } else {
      toast.error("Notification permission denied");
    }
    setLoading(false);
  };

  const handleMedicationToggle = (checked: boolean) => {
    setMedicationReminders(checked);
    localStorage.setItem("medication-reminders", String(checked));
    onMedicationRemindersChange?.(checked);
    toast.success(checked ? "Medication reminders enabled" : "Medication reminders disabled");
  };

  const handleAppointmentToggle = (checked: boolean) => {
    setAppointmentReminders(checked);
    localStorage.setItem("appointment-reminders", String(checked));
    onAppointmentRemindersChange?.(checked);
    toast.success(checked ? "Appointment reminders enabled" : "Appointment reminders disabled");
  };

  const handleDailyHabitToggle = (checked: boolean) => {
    setDailyHabitReminders(checked);
    localStorage.setItem("daily-habit-reminders", String(checked));
    if (checked) {
      scheduleDailyHabitReminder();
    }
    toast.success(checked ? "Daily habit reminders enabled" : "Daily habit reminders disabled");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="size-4" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Get reminders for medications, appointments, and daily habits
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {permission !== "granted" ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <BellOff className="size-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Notifications are disabled</p>
                <p className="text-xs text-muted-foreground">
                  Enable to receive reminders
                </p>
              </div>
            </div>
            <Button onClick={handleEnableNotifications} disabled={loading}>
              {loading ? "Enabling..." : "Enable Notifications"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-success/10 p-2 text-sm text-success">
              <Check className="size-4" />
              Notifications enabled
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="med-reminders"
                className="flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="text-sm font-medium">Medication Reminders</span>
                <span className="text-xs text-muted-foreground">
                  Get notified when it&apos;s time to take your meds
                </span>
              </Label>
              <Switch
                id="med-reminders"
                checked={medicationReminders}
                onCheckedChange={handleMedicationToggle}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="appt-reminders"
                className="flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="text-sm font-medium">Appointment Reminders</span>
                <span className="text-xs text-muted-foreground">
                  24-hour advance notice for appointments
                </span>
              </Label>
              <Switch
                id="appt-reminders"
                checked={appointmentReminders}
                onCheckedChange={handleAppointmentToggle}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="habit-reminders"
                className="flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="text-sm font-medium">Daily Habit Reminders</span>
                <span className="text-xs text-muted-foreground">
                  Morning reminder to complete habits
                </span>
              </Label>
              <Switch
                id="habit-reminders"
                checked={dailyHabitReminders}
                onCheckedChange={handleDailyHabitToggle}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
