"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import type { UserProfile, LabResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientLDLChart } from "@/components/charts/patient-ldl-chart";
import {
  Users,
  Search,
  LogOut,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

// Hardcoded doctor emails for demo purposes
const DOCTOR_EMAILS = [
  "doctor@lipidlife.com",
  "dr.smith@lipidlife.com",
  "cardiologist@lipidlife.com",
];

export default function DoctorDashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<(UserProfile & { latestLab?: LabResult })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<(UserProfile & { latestLab?: LabResult; labs: LabResult[] }) | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!DOCTOR_EMAILS.includes(email.toLowerCase())) {
      setError("Access denied. This portal is for registered cardiologists only.");
      return;
    }
    
    if (!auth) {
      setError("Firebase is not configured.");
      return;
    }
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await loadPatients();
      setIsLoggedIn(true);
    } catch {
      setError("Invalid credentials. Please try again.");
    }
    setLoading(false);
  };

  const loadPatients = async () => {
    if (!db) return;
    const usersSnap = await getDocs(collection(db, "users"));
    const patientList: (UserProfile & { latestLab?: LabResult })[] = [];
    
    for (const userDoc of usersSnap.docs) {
      const userData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
      
      // Get latest lab for each patient
      const labsQ = query(collection(db, "labResults"));
      const labsSnap = await getDocs(labsQ);
      const userLabs = labsSnap.docs
        .filter((d) => d.data().userId === userDoc.id)
        .map((d) => ({ id: d.id, ...d.data() } as LabResult))
        .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
      
      patientList.push({
        ...userData,
        latestLab: userLabs[0],
      });
    }
    
    setPatients(patientList);
  };

  const selectPatient = async (patient: UserProfile & { latestLab?: LabResult }) => {
    if (!db) return;
    // Load all labs for this patient
    const labsQ = query(collection(db, "labResults"));
    const labsSnap = await getDocs(labsQ);
    const labs = labsSnap.docs
      .filter((d) => d.data().userId === patient.id)
      .map((d) => ({ id: d.id, ...d.data() } as LabResult))
      .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
    
    setSelectedPatient({ ...patient, labs });
  };

  const handleLogout = async () => {
    if (auth) await firebaseSignOut(auth);
    setIsLoggedIn(false);
    setPatients([]);
    setSelectedPatient(null);
    router.push("/");
  };

  const filteredPatients = patients.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-primary">
        <div className="flex flex-col items-center pt-12 pb-8 px-6">
          <div className="font-serif text-4xl text-primary-foreground">
            Lipid<span className="text-warning">Life</span>
          </div>
          <p className="mt-2 text-sm text-primary-foreground/70">
            Cardiologist Portal
          </p>
        </div>

        <div className="flex-1 rounded-t-3xl bg-background px-6 pt-6 pb-8">
          <Card className="mx-auto max-w-md border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-center">Doctor Sign In</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@lipidlife.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Access Portal"}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
                  Back to Patient Login
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Patient Detail View
  if (selectedPatient) {
    const trend =
      selectedPatient.labs.length >= 2
        ? selectedPatient.labs[1].ldl - selectedPatient.labs[0].ldl
        : 0;
    
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="bg-primary px-5 pt-4 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-sm text-primary-foreground/70 hover:text-primary-foreground"
              >
                &larr; Back to Patients
              </button>
              <h1 className="mt-1 font-serif text-2xl text-primary-foreground">
                {selectedPatient.name}
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-primary-foreground/20 bg-transparent text-primary-foreground/70"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Patient Info */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <span className="ml-2 font-semibold">{selectedPatient.age}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk:</span>
                    <span className={`ml-2 font-semibold ${
                      selectedPatient.riskCategory === "Low" ? "text-success" :
                      selectedPatient.riskCategory === "Moderate" ? "text-warning" :
                      "text-destructive"
                    }`}>
                      {selectedPatient.riskCategory}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target LDL:</span>
                    <span className="ml-2 font-semibold">&lt;{selectedPatient.targetLDL} mg/dL</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current LDL:</span>
                    <span className={`ml-2 font-semibold ${
                      selectedPatient.latestLab && selectedPatient.latestLab.ldl <= selectedPatient.targetLDL
                        ? "text-success"
                        : "text-destructive"
                    }`}>
                      {selectedPatient.latestLab?.ldl || "N/A"} mg/dL
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedPatient.diabetes && (
                    <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs text-destructive">
                      Diabetes
                    </span>
                  )}
                  {selectedPatient.smoker && (
                    <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs text-destructive">
                      Smoker
                    </span>
                  )}
                  {selectedPatient.familyHistory && (
                    <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">
                      Family History
                    </span>
                  )}
                  {selectedPatient.hypertension && (
                    <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">
                      Hypertension
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* LDL Trend */}
            {selectedPatient.labs.length >= 2 && (
              <Card className={trend > 0 ? "bg-success/5 border-success/20" : trend < 0 ? "bg-destructive/5 border-destructive/20" : ""}>
                <CardContent className="flex items-center gap-3 p-4">
                  {trend > 0 ? (
                    <TrendingDown className="size-8 text-success" />
                  ) : trend < 0 ? (
                    <TrendingUp className="size-8 text-destructive" />
                  ) : null}
                  <div>
                    <div className="font-serif text-2xl">
                      {Math.abs(trend)} mg/dL
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {trend > 0 ? "LDL decreased since last test" : "LDL increased since last test"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chart */}
            {selectedPatient.labs.length >= 2 && (
              <PatientLDLChart
                labResults={selectedPatient.labs}
                targetLDL={selectedPatient.targetLDL}
              />
            )}

            {/* Lab History */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Lab History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {selectedPatient.labs.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">
                    No lab results on file
                  </p>
                ) : (
                  selectedPatient.labs.map((lab, i) => (
                    <div key={lab.id} className="flex items-center justify-between border-t border-border px-4 py-3">
                      <div>
                        <div className="font-medium">{lab.testDate}</div>
                        <div className="text-xs text-muted-foreground">
                          LDL: {lab.ldl} | HDL: {lab.hdl} | TC: {lab.totalCholesterol} | TG: {lab.triglycerides}
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        lab.ldl <= selectedPatient.targetLDL
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      }`}>
                        {lab.ldl <= selectedPatient.targetLDL ? "On Target" : "Above"}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Patient List View
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-primary px-5 pt-4 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-foreground/70">Doctor Portal</p>
            <h1 className="font-serif text-2xl text-primary-foreground">
              My Patients
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-primary-foreground/20 bg-transparent text-primary-foreground/70"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Users className="mx-auto size-5 text-primary" />
                <div className="mt-1 font-serif text-2xl">{patients.length}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <AlertTriangle className="mx-auto size-5 text-destructive" />
                <div className="mt-1 font-serif text-2xl">
                  {patients.filter((p) => p.latestLab && p.latestLab.ldl > p.targetLDL).length}
                </div>
                <div className="text-[10px] text-muted-foreground">Above Target</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <CheckCircle className="mx-auto size-5 text-success" />
                <div className="mt-1 font-serif text-2xl">
                  {patients.filter((p) => p.latestLab && p.latestLab.ldl <= p.targetLDL).length}
                </div>
                <div className="text-[10px] text-muted-foreground">On Target</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Patient List */}
          <div className="flex flex-col gap-2">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => selectPatient(patient)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold">{patient.name}</h3>
                    <p className="text-xs text-muted-foreground">{patient.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        patient.riskCategory === "Low" ? "bg-success/20 text-success" :
                        patient.riskCategory === "Moderate" ? "bg-warning/20 text-warning" :
                        "bg-destructive/20 text-destructive"
                      }`}>
                        {patient.riskCategory}
                      </span>
                      {patient.latestLab && (
                        <span className={`text-xs ${
                          patient.latestLab.ldl <= patient.targetLDL
                            ? "text-success"
                            : "text-destructive"
                        }`}>
                          LDL: {patient.latestLab.ldl}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
            {filteredPatients.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="mx-auto size-12 text-muted-foreground/30" />
                  <p className="mt-4 text-muted-foreground">
                    {searchQuery ? "No patients match your search" : "No patients found"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
