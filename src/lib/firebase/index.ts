import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, signInAnonymously, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigValid = (config: typeof firebaseConfig): boolean => {
  return Object.values(config).every(value => value && !value.includes('your-'));
};

let db: Firestore | null = null;
let auth: Auth | null = null;

const initializeFirebase = async () => {
  if (isConfigValid(firebaseConfig)) {
    let app: FirebaseApp;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    auth = getAuth(app);
    try {
      await signInAnonymously(auth);
      console.log("Signed in anonymously");
      db = getFirestore(app);
    } catch (error) {
      console.error("Anonymous sign-in failed:", error);
      console.warn(`
        -----------------------------------------------------------------
        Firebase Anonymous sign-in failed.
        Database functionality will be disabled.
        -----------------------------------------------------------------
      `);
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
};

// Initialize Firebase immediately, but the export relies on the async function
const firebaseInitPromise = initializeFirebase();

export { db, auth, firebaseInitPromise };
