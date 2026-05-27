import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "test",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "test",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "test",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "test",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "test",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "test",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

let authInstance: ReturnType<typeof getAuth> | null = null
let dbInstance: ReturnType<typeof getFirestore> | null = null

export function getAuthInstance() {
  if (!authInstance) {
    try {
      authInstance = getAuth(app)
    } catch (error) {
      console.error("[firebase] Error initializing auth:", error)
    }
  }
  return authInstance
}

export function getDbInstance() {
  if (!dbInstance) {
    try {
      dbInstance = getFirestore(app)
    } catch (error) {
      console.error("[firebase] Error initializing firestore:", error)
    }
  }
  return dbInstance
}

// For backwards compatibility
export const auth = getAuthInstance()
export const db = getDbInstance()
