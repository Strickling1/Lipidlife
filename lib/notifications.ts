// Notification utilities for push notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("Service workers are not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

export function scheduleLocalNotification(
  title: string,
  body: string,
  delayMs: number = 0
): void {
  if (Notification.permission !== "granted") return;

  setTimeout(() => {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    });
  }, delayMs);
}

// Schedule medication reminders
export function scheduleMedicationReminder(
  medicationName: string,
  time: string
): void {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If the time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delayMs = scheduledTime.getTime() - now.getTime();

  scheduleLocalNotification(
    "Medication Reminder",
    `Time to take your ${medicationName}`,
    delayMs
  );
}

// Schedule appointment reminders (24h before)
export function scheduleAppointmentReminder(
  doctorName: string,
  appointmentDate: Date
): void {
  const reminderTime = new Date(appointmentDate);
  reminderTime.setHours(reminderTime.getHours() - 24);

  const now = new Date();
  if (reminderTime <= now) return;

  const delayMs = reminderTime.getTime() - now.getTime();

  scheduleLocalNotification(
    "Upcoming Appointment",
    `You have an appointment with ${doctorName} tomorrow`,
    delayMs
  );
}

// Daily habit reminder
export function scheduleDailyHabitReminder(): void {
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(9, 0, 0, 0); // 9 AM

  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const delayMs = reminderTime.getTime() - now.getTime();

  scheduleLocalNotification(
    "Daily Habits",
    "Don't forget to complete your daily health habits!",
    delayMs
  );
}
