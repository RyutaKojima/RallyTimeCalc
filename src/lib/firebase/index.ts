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

let app: FirebaseApp;
let auth: Auth;
let db: Firestore | null = null;
let firebaseInitPromise: Promise<{ auth: Auth; db: Firestore } | null>;

if (isConfigValid(firebaseConfig)) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);

  firebaseInitPromise = new Promise((resolve) => {
    signInAnonymously(auth)
      .then(() => {
        if (db) {
          resolve({ auth, db });
        } else {
          // This case should not happen if setup is correct
          resolve(null);
        }
      })
      .catch((error) => {
        console.error("Firebase anonymous sign-in failed:", error);
        resolve(null);
      });
  });

} else {
  console.warn(`
    -----------------------------------------------------------------
    Firebase is not configured correctly.
    Database functionality will be disabled.
    -----------------------------------------------------------------
  `);
  firebaseInitPromise = Promise.resolve(null);
}

export { db, auth, firebaseInitPromise };
