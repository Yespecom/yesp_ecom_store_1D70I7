"use client"

import { initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"

type FirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  messagingSenderId?: string
  [key: string]: any
}

// Keep a registry of initialized apps keyed by projectId for reuse
const appsByProjectId = new Map<string, FirebaseApp>()

export function ensureFirebaseApp(config: FirebaseConfig): { app: FirebaseApp; auth: Auth } {
  if (!config?.projectId || !config?.apiKey || !config?.appId) {
    throw new Error("Invalid Firebase config. Missing apiKey/appId/projectId.")
  }

  let app = appsByProjectId.get(config.projectId)

  if (!app) {
    const name = config.projectId // stable name per store/project
    // If no apps yet, or name unused, initialize
    app = initializeApp(config, name)
    appsByProjectId.set(config.projectId, app)
  }

  const auth = getAuth(app)
  return { app, auth }
}
