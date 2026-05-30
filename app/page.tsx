"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Shield, TrendingDown, Pill } from "lucide-react";

export default function AuthPage() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerAge, setRegisterAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, loading: authLoading, isConfigured } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  if (!authLoading && user) {
    router.push("/dashboard");
    return null;
  }

  // Show configuration message if Firebase is not set up
  if (!authLoading && !isConfigured) {
    return (
      <div className="flex min-h-screen flex-col bg-primary">
        <div className="flex flex-col items-center pt-12 pb-8 px-6">
          <div className="font-serif text-4xl text-primary-foreground">
            Lipid<span className="text-warning">Life</span>
          </div>
        </div>
        <div className="flex-1 rounded-t-3xl bg-background px-6 pt-6 pb-8">
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Configuration Required</CardTitle>
              <CardDescription className="text-center">
                Firebase is not configured. Please add the following environment variables to your Vercel project:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 text-sm text-muted-foreground flex flex-col gap-1">
                <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
                <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
                <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
                <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
                <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
                <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                Get these values from your Firebase Console under Project Settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      router.push("/dashboard");
    } catch {
      setError("Incorrect email or password.");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!registerName || !registerEmail || !registerPassword || !registerAge) {
      setError("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      await signUp(registerEmail, registerPassword, registerName, parseInt(registerAge));
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed.";
      if (errorMessage.includes("email-already")) {
        setError("Email already registered.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="text-center">
          <div className="font-serif text-3xl text-primary-foreground">
            Lipid<span className="text-warning">Life</span>
          </div>
          <p className="mt-2 text-sm text-primary-foreground/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-primary">
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-8 px-6">
        <div className="font-serif text-4xl text-primary-foreground">
          Lipid<span className="text-warning">Life</span>
        </div>
        <p className="mt-2 text-sm text-primary-foreground/70 text-center">
          Your personalised cholesterol coach
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 px-6 pb-8 max-w-md mx-auto w-full">
        <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 p-3">
          <Heart className="size-5 text-warning" />
          <span className="text-xs text-primary-foreground/80">Track Labs</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 p-3">
          <Pill className="size-5 text-teal" />
          <span className="text-xs text-primary-foreground/80">Medications</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 p-3">
          <TrendingDown className="size-5 text-success" />
          <span className="text-xs text-primary-foreground/80">Lower LDL</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 p-3">
          <Shield className="size-5 text-destructive" />
          <span className="text-xs text-primary-foreground/80">Reduce Risk</span>
        </div>
      </div>

      {/* Auth Card */}
      <div className="flex-1 rounded-t-3xl bg-background px-6 pt-6 pb-8">
        <Card className="mx-auto max-w-md border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to continue your health journey
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-4">
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="mt-4">
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Smith"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="register-age">Age</Label>
                    <Input
                      id="register-age"
                      type="number"
                      placeholder="Your age"
                      value={registerAge}
                      onChange={(e) => setRegisterAge(e.target.value)}
                      required
                      min={18}
                      max={120}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Doctor login link */}
        <div className="mt-6 text-center">
          <a
            href="/doctor"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cardiologist? Access the dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
