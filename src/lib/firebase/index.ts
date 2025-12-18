import { initializeApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Function to check if the config values are valid
const isConfigValid = (config: typeof firebaseConfig): boolean => {
  return Object.values(config).every(value => value && !value.includes('your-'));
};

let db: Firestore | null = null;
let auth: Auth | null = null;

if (isConfigValid(firebaseConfig)) {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    // If the app is already initialized, get the existing instance
    const app = getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
  }
} else {
  console.warn(`
    -----------------------------------------------------------------
    Firebase is not configured correctly.
    Please make sure all environment variables in '.env.local'
    are set with your actual Firebase project credentials.
    Database functionality will be disabled.
    -----------------------------------------------------------------
  `);
}

export { db, auth };
