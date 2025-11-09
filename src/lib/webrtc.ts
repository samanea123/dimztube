'use client';

import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  updateDoc,
  Unsubscribe,
  getFirestore,
  deleteField,
  FieldValue,
} from 'firebase/firestore';

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

export interface PlaybackCommand {
    type: 'play' | 'pause' | 'seek' | 'volume';
    payload?: any;
    ts: number;
}
export interface WebRTCSession {
    id?: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    status?: 'waiting' | 'connecting' | 'connected' | 'disconnected' | 'failed';
    command?: PlaybackCommand | null;
    createdAt?: number;
}

export async function createSession(): Promise<string> {
    const docRef = await addDoc(collection(getDb(), 'webrtc_sessions'), {
        status: 'waiting',
        createdAt: Date.now(),
    });
    return docRef.id;
}


export async function updateSession(sessionId: string, data: Partial<Omit<WebRTCSession, 'command'>> & { command?: PlaybackCommand | FieldValue | null }) {
    const docRef = doc(getDb(), 'webrtc_sessions', sessionId);
    const finalData: any = { ...data };
    if (data.status === 'disconnected') {
      finalData.offer = deleteField();
      finalData.answer = deleteField();
      finalData.command = deleteField();
    }
    await updateDoc(docRef, finalData);
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
