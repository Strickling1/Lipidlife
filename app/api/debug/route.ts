import { NextResponse } from "next/server";

export async function GET() {
  // Check which env vars are set (don't expose values, just check presence)
  const envStatus = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "SET" : "MISSING",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "SET" : "MISSING",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "MISSING",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "SET" : "MISSING",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "SET" : "MISSING",
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "SET" : "MISSING",
    // Show partial value for debugging (first 10 chars only)
    API_KEY_PREVIEW: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) || "none",
    PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "none",
  };

  return NextResponse.json(envStatus);
}
