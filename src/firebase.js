import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const normalizeHost = (value) => {
  const raw = String(value || "").trim();
  return raw.replace(/^https?:\/\//i, "").replace(/\/$/, "");
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: normalizeHost(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: normalizeHost(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (import.meta.env.DEV) {
  const required = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
  ];
  const missing = required.filter((k) => !import.meta.env[k]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn("Missing Firebase env vars:", missing.join(", "));
  }
}

const app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);

if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_DISABLE_APP_VERIFICATION === "true") {
  firebaseAuth.settings.appVerificationDisabledForTesting = true;
}
