'use client';

import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  updateDoc,
  Unsubscribe,
  getFirestore,
} from 'firebase/firestore';

// Inisialisasi Firestore di sini karena file ini 'use client'
// dan mungkin diimpor di tempat yang belum tentu punya akses ke provider.
let db: any;
const getDb = () => {
    if (!db) {
        try {
            db = getFirestore();
        } catch (e) {
             console.error("Gagal mendapatkan instance Firestore. Pastikan FirebaseProvider ada di root.", e)
        }
    }
    return db;
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

export interface WebRTCSession {
    id?: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    status?: 'waiting' | 'connecting' | 'connected' | 'disconnected';
    createdAt?: number;
}

export async function createSession(): Promise<string> {
    const docRef = await addDoc(collection(getDb(), 'webrtc_sessions'), {
        status: 'waiting',
        createdAt: Date.now(),
    });
    return docRef.id;
}


export async function updateSession(sessionId: string, data: Partial<WebRTCSession>) {
    const docRef = doc(getDb(), 'webrtc_sessions', sessionId);
    await updateDoc(docRef, data);
}

export function onSessionUpdate(sessionId: string, callback: (session: WebRTCSession | null) => void): Unsubscribe {
    const docRef = doc(getDb(), 'webrtc_sessions', sessionId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as WebRTCSession);
        } else {
            callback(null);
        }
    });
}

export async function addIceCandidate(sessionId: string, side: 'sender' | 'receiver', candidate: RTCIceCandidateInit) {
    const candidatesCollection = collection(getDb(), 'webrtc_sessions', sessionId, `${side}Candidates`);
    await addDoc(candidatesCollection, candidate);
}

export function onIceCandidate(sessionId: string, side: 'sender' | 'receiver', callback: (candidate: RTCIceCandidateInit) => void): Unsubscribe {
    const candidatesCollection = collection(getDb(), 'webrtc_sessions', sessionId, `${side}Candidates`);
    return onSnapshot(candidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                callback(change.doc.data() as RTCIceCandidateInit);
            }
        });
    });
}
