import { initializeApp, getApps } from "firebase/app"
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import type { Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth: Auth = getAuth(app)

// Create reCAPTCHA verifier
export const createRecaptchaVerifier = (containerId: string) => {
  if (typeof window !== "undefined") {
    return new RecaptchaVerifier(auth, containerId, {
      size: "normal",
      callback: () => {
        console.log("reCAPTCHA solved")
      },
      "expired-callback": () => {
        console.log("reCAPTCHA expired")
      },
    })
  }
  throw new Error("RecaptchaVerifier can only be used in browser environment")
}

export { auth, signInWithPhoneNumber }
export default app
