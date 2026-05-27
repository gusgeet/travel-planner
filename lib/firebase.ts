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

let app
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
} catch (error) {
  console.warn("[firebase] Could not initialize app:", error)
}

let authInstance: any = null
let dbInstance: any = null

export function getAuthInstance() {
  if (!authInstance && app) {
    try {
      authInstance = getAuth(app)
    } catch (error) {
      console.warn("[firebase] Could not initialize auth:", error)
    }
  }
  return authInstance
}

export function getDbInstance() {
  if (!dbInstance && app) {
    try {
      dbInstance = getFirestore(app)
    } catch (error) {
      console.warn("[firebase] Could not initialize firestore:", error)
    }
  }
  return dbInstance
}

// For backwards compatibility - these will be null if Firebase fails
export const auth = (() => {
  try {
    return getAuthInstance()
  } catch (error) {
    return null
  }
})()

export const db = (() => {
  try {
    return getDbInstance()
  } catch (error) {
    return null
  }
})()
