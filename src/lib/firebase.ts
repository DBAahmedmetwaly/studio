import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// A function to check if all required environment variables are present.
const isFirebaseConfigComplete = () => {
    return (
        firebaseConfig.apiKey &&
        firebaseConfig.authDomain &&
        firebaseConfig.databaseURL &&
        firebaseConfig.projectId &&
        firebaseConfig.storageBucket &&
        firebaseConfig.messagingSenderId &&
        firebaseConfig.appId
    );
};


// Initialize Firebase
// We check if the config is complete to avoid errors during build time on servers like Netlify
// where env vars might not be available during the build process.
const app = isFirebaseConfigComplete() && !getApps().length ? initializeApp(firebaseConfig) : (getApps().length > 0 ? getApp() : null);

// Conditionally get database and auth to prevent errors when app is null
const database = app ? getDatabase(app) : null;
const auth = app ? getAuth(app) : null;

// Throw an error if Firebase is not initialized in a client-side context where it's expected.
if (typeof window !== 'undefined' && !app) {
    console.error("Firebase config is incomplete. Please check your .env.local file or environment variables.");
}


export { app, database, auth };
