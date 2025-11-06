'use client';

import { ReactNode, useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

interface FirebaseClientProviderProps {
    children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
    const { app, firestore, auth } = useMemo(() => initializeFirebase(), []);

    return (
        <FirebaseProvider app={app} firestore={firestore} auth={auth}>
            {children}
        </FirebaseProvider>
    );
}
