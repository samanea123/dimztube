'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

interface FirebaseContextType {
  app: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  firestore: null,
  auth: null,
});

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error("useFirebase must be used within a FirebaseProvider");
    }
    return context;
}

export const useFirebaseApp = () => {
    const { app } = useFirebase();
    if (!app) throw new Error("Firebase App not available.");
    return app;
}

export const useFirestore = () => {
    const { firestore } = useFirebase();
    if (!firestore) throw new Error("Firestore not available.");
    return firestore;
}

export const useAuth = () => {
    const { auth } = useFirebase();
    if (!auth) throw new Error("Firebase Auth not available.");
    return auth;
}

interface FirebaseProviderProps {
  children: ReactNode;
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export function FirebaseProvider({ children, app, firestore, auth }: FirebaseProviderProps) {
  return (
    <FirebaseContext.Provider value={{ app, firestore, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
}
