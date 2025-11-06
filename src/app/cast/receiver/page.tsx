'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { createSession, onSessionUpdate, updateSession, addIceCandidate, onIceCandidate, servers } from '@/lib/webrtc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Tv2, ScanLine, CheckCircle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFirestore } from 'firebase/firestore';


type Status = 'generating' | 'waiting' | 'connecting' | 'connected' | 'failed';

// Komponen ini harus dibungkus dalam FirebaseProvider di layout
export default function ReceiverPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('generating');
  const [senderUrl, setSenderUrl] = useState<string>('');
  const [firestoreInitialized, setFirestoreInitialized] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // Inisialisasi Firestore di client-side
  useEffect(() => {
    try {
      getFirestore();
      setFirestoreInitialized(true);
    } catch (e) {
      console.error("Firebase belum siap, halaman ini tidak dapat berfungsi.", e);
      setStatus('failed');
    }
  }, []);

  // Membuat sesi WebRTC baru
  useEffect(() => {
    if (!firestoreInitialized) return;

    async function initializeSession() {
        try {
            const newSessionId = await createSession();
            setSessionId(newSessionId);
            setStatus('waiting');
            const url = `${window.location.origin}/cast/sender/${newSessionId}`;
            setSenderUrl(url);
        } catch (error) {
            console.error("Gagal membuat sesi cast:", error);
            setStatus('failed');
        }
    }
    initializeSession();
  }, [firestoreInitialized]);

  // Logika WebRTC untuk Receiver
  useEffect(() => {
    if (!sessionId || !firestoreInitialized) return;
    
    const pc = new RTCPeerConnection(servers);
    pcRef.current = pc;
    
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            addIceCandidate(sessionId, 'receiver', event.candidate.toJSON());
        }
    };

    pc.ontrack = (event) => {
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
        setStatus('connected');
      }
    };
    
    const unsubscribeIce = onIceCandidate(sessionId, 'sender', (candidate) => {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    const unsubscribeSession = onSessionUpdate(sessionId, async (session) => {
      // Hanya proses offer jika belum ada remote description
      if (session?.offer && !pc.currentRemoteDescription) {
        try {
            setStatus('connecting');
            await pc.setRemoteDescription(new RTCSessionDescription(session.offer));
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await updateSession(sessionId, { answer });
        } catch (error) {
            console.error("Gagal membuat answer atau set description:", error);
            setStatus('failed');
        }
      } else if(session?.status === 'disconnected') {
        pc.close();
        setStatus('failed');
      }
    });

    return () => {
      unsubscribeIce();
      unsubscribeSession();
      pc.close();
    };

  }, [sessionId, firestoreInitialized]);

  const renderStatus = () => {
      switch(status) {
          case 'generating':
              return <div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin h-6 w-6"/><span>Membuat Sesi...</span></div>;
          case 'waiting':
              return <div className="flex flex-col items-center gap-2"><ScanLine className="h-6 w-6"/><span>Pindai untuk memulai Cast</span></div>;
          case 'connecting':
              return <div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin h-6 w-6"/><span>Menghubungkan...</span></div>;
          case 'connected':
              return <div className="flex flex-col items-center gap-2"><CheckCircle className="h-6 w-6 text-green-500"/><span>Terhubung</span></div>;
          case 'failed':
              return <div className="flex flex-col items-center gap-2 text-destructive"><WifiOff className="h-6 w-6"/><span>Koneksi Gagal/Terputus</span></div>;
      }
  }

  if (!firestoreInitialized) {
      return (
        <div className="w-screen h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-8">
            <Card className="bg-neutral-800 border-neutral-700 text-white max-w-md w-full">
                <CardHeader className="text-center">
                    <CardTitle>Error</CardTitle>
                    <CardDescription className="text-destructive">Gagal terhubung ke layanan Firebase. Pastikan aplikasi telah dikonfigurasi dengan benar.</CardDescription>
                </CardHeader>
            </Card>
        </div>
      )
  }

  return (
    <div className="w-screen h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-8">
        <video ref={videoRef} autoPlay playsInline className={cn(
            "absolute top-0 left-0 w-full h-full object-contain transition-opacity duration-500",
            status === 'connected' ? 'opacity-100' : 'opacity-0'
        )} />

        <div className={cn(
            "z-10 transition-opacity duration-500",
            status === 'connected' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}>
            <Card className="bg-neutral-800 border-neutral-700 text-white max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Tv2 className="w-12 h-12 text-primary"/>
                    </div>
                    <CardTitle>DimzTube WebRTC Cast</CardTitle>
                    <CardDescription className="text-neutral-400">Pindai QR code di bawah ini menggunakan ponsel Anda untuk mulai mentransmisikan layar.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="bg-white p-4 rounded-lg">
                        {senderUrl ? <QRCode value={senderUrl} size={192} /> : <div className="w-48 h-48 bg-neutral-700 animate-pulse rounded-md" />}
                    </div>
                    <div className="text-lg font-medium">{renderStatus()}</div>
                     <p className="text-xs text-neutral-500 text-center">ID Sesi: {sessionId || 'memuat...'}</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}