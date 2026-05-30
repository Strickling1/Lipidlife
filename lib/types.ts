// User profile
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  diabetes: boolean;
  smoker: boolean;
  familyHistory: boolean;
  hypertension: boolean;
  targetLDL: number;
  riskCategory: "Low" | "Moderate" | "High" | "Very High";
  cardiologist?: string;
  programStartDate: string;
  createdAt: Date;
}

// Lab results
export interface LabResult {
  id: string;
  userId: string;
  ldl: number;
  hdl: number;
  totalCholesterol: number;
  triglycerides: number;
  testDate: string;
  notes?: string;
  ldlStatus: "On Target" | "Above Target";
  createdAt: Date;
}

// Daily task log
export interface TaskLog {
  id: string;
  userId: string;
  taskId: string;
  taskName: string;
  date: string;
  completed: boolean;
  pointsEarned: number;
  createdAt: Date;
}

// Medication
export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: "daily" | "twice_daily" | "weekly" | "as_needed";
  timeOfDay: "morning" | "afternoon" | "evening" | "bedtime";
  startDate: string;
  endDate?: string;
  notes?: string;
  active: boolean;
  createdAt: Date;
}

// Medication log
export interface MedicationLog {
  id: string;
  medicationId: string;
  userId: string;
  takenAt: Date;
  skipped: boolean;
  notes?: string;
}

// Food entry
export interface FoodEntry {
  id: string;
  userId: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foods: string[];
  saturatedFat: "low" | "medium" | "high";
  fiber: "low" | "medium" | "high";
  omega3: boolean;
  cholesterolImpact: "positive" | "neutral" | "negative";
  notes?: string;
  createdAt: Date;
}

// Appointment
export interface Appointment {
  id: string;
  userId: string;
  title: string;
  type: "cardiology" | "lab_work" | "primary_care" | "other";
  dateTime: Date;
  location?: string;
  provider?: string;
  notes?: string;
  reminderSent: boolean;
  completed: boolean;
  createdAt: Date;
}

// Notification preferences
export interface NotificationPreferences {
  userId: string;
  dailyHabitReminder: boolean;
  dailyHabitTime: string; // HH:mm format
  medicationReminders: boolean;
  appointmentReminders: boolean;
  labResultAlerts: boolean;
  fcmToken?: string;
}

// Daily habit tasks
export const DAILY_HABITS = [
  { id: "TSK001", name: "Take omega-3 supplement", points: 10 },
  { id: "TSK002", name: "Avoid saturated fat at breakfast", points: 15 },
  { id: "TSK003", name: "30 min brisk walk or exercise", points: 20 },
  { id: "TSK004", name: "Eat a handful of nuts today", points: 10 },
  { id: "TSK005", name: "Eat oats or barley at breakfast", points: 15 },
  { id: "TSK006", name: "No sugary drinks today", points: 15 },
] as const;

// Risk calculation helper
export function calculateRisk(
  age: number,
  ldl: number,
  bp: number,
  hdl: number,
  diabetes: boolean,
  smoker: boolean,
  familyHistory: boolean
): number {
  let score =
    (age - 40) * 0.18 +
    (ldl - 100) * 0.04 +
    (bp - 120) * 0.08 -
    (hdl - 40) * 0.06;
  if (diabetes) score += 2.5;
  if (smoker) score += 3;
  if (familyHistory) score += 1.5;
  return Math.max(1, Math.min(40, Math.round(score)));
}

export function getRiskCategory(score: number): UserProfile["riskCategory"] {
  if (score < 5) return "Low";
  if (score < 10) return "Moderate";
  if (score < 20) return "High";
  return "Very High";
}

export function getTargetLDL(category: UserProfile["riskCategory"]): number {
  switch (category) {
    case "Low":
      return 116;
    case "Moderate":
      return 100;
    case "High":
      return 70;
    case "Very High":
      return 55;
  }
}
