import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getMessaging, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let messaging: Messaging | null = null;

function initializeFirebase() {
  if (!isFirebaseConfigured) {
    console.warn(
      "Firebase is not configured. Please add the following environment variables:\n" +
      "- NEXT_PUBLIC_FIREBASE_API_KEY\n" +
      "- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n" +
      "- NEXT_PUBLIC_FIREBASE_PROJECT_ID\n" +
      "- NEXT_PUBLIC_FIREBASE_APP_ID"
    );
    return;
  }

  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);

    // Messaging requires browser environment
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        messaging = getMessaging(app);
      } catch (error) {
        console.warn("Firebase Messaging not supported:", error);
      }
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

// Only initialize on client side to avoid SSR issues
if (typeof window !== "undefined") {
  initializeFirebase();
}

export { app, auth, db, messaging, isFirebaseConfigured };
