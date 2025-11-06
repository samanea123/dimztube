'use client';

import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirestore } from '@/firebase';

const db = getFirestore();

// Firestore collections
const sessionsCollection = collection(db, 'webrtc_sessions');

export interface WebRTCSession {
    id?: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    status: 'waiting' | 'connecting' | 'connected' | 'disconnected';
    createdAt: number;
}

/**
 * Create a new WebRTC session in Firestore.
 */
export async function createSession(): Promise<string> {
    const docRef = await addDoc(sessionsCollection, {
        status: 'waiting',
        createdAt: Date.now(),
    });
    return docRef.id;
}

/**
 * Get a specific session document from Firestore.
 */
export async function getSession(sessionId: string): Promise<WebRTCSession | null> {
    const docRef = doc(db, 'webrtc_sessions', sessionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as WebRTCSession;
    }
    return null;
}

/**
 * Update a session with an offer or answer.
 */
export async function updateSession(sessionId: string, data: Partial<WebRTCSession>) {
    const docRef = doc(db, 'webrtc_sessions', sessionId);
    await updateDoc(docRef, data);
}

/**
 * Listen for changes to a session document.
 */
export function onSessionUpdate(sessionId: string, callback: (session: WebRTCSession | null) => void): Unsubscribe {
    const docRef = doc(db, 'webrtc_sessions', sessionId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as WebRTCSession);
        } else {
            callback(null);
        }
    });
}

/**
 * Add an ICE candidate to a subcollection.
 */
export async function addIceCandidate(sessionId: string, side: 'sender' | 'receiver', candidate: RTCIceCandidateInit) {
    const candidatesCollection = collection(db, 'webrtc_sessions', sessionId, `${side}Candidates`);
    await addDoc(candidatesCollection, candidate);
}

/**
 * Listen for new ICE candidates in a subcollection.
 */
export function onIceCandidate(sessionId: string, side: 'sender' | 'receiver', callback: (candidate: RTCIceCandidateInit) => void): Unsubscribe {
    const candidatesCollection = collection(db, 'webrtc_sessions', sessionId, `${side}Candidates`);
    return onSnapshot(candidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                callback(change.doc.data() as RTCIceCandidateInit);
            }
        });
    });
}

export const servers: RTCConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
    iceCandidatePoolSize: 10,
};
