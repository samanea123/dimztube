'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { createSession, onSessionUpdate, updateSession, addIceCandidate, onIceCandidate, servers } from '@/lib/webrtc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Tv2, ScanLine, CheckCircle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';


type Status = 'generating' | 'waiting' | 'connecting' | 'connected' | 'failed' | 'disconnected';

export default function ReceiverPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('generating');
  const [senderUrl, setSenderUrl] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  
  const firestore = useFirestore();

  const resetState = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // Don't reset session ID, allow for reconnection attempts on the same URL
    setStatus('disconnected');
    // We could create a new session here if we wanted to force a new QR code
    // For now, we'll allow re-use of the sender URL.
  };

  useEffect(() => {
    if (!firestore) return;

    async function initializeSession() {
        setStatus('generating');
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
  }, [firestore]);

  useEffect(() => {
    if (!sessionId || !firestore) return;
    
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

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        resetState();
      }
    };
    
    const unsubscribeIce = onIceCandidate(sessionId, 'sender', (candidate) => {
       if (pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding ICE candidate:", e));
       }
    });

    const unsubscribeSession = onSessionUpdate(sessionId, async (session) => {
      if (session?.status === 'disconnected' && status !== 'disconnected') {
        resetState();
        return;
      }
      
      if (session?.offer && pc.signalingState === 'stable') {
        try {
            setStatus('connecting');
            await pc.setRemoteDescription(new RTCSessionDescription(session.offer));
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await updateSession(sessionId, { answer, status: 'connecting' });
        } catch (error) {
            console.error("Gagal membuat answer atau set description:", error);
            setStatus('failed');
        }
      }
    });

    return () => {
      unsubscribeIce();
      unsubscribeSession();
      if (pcRef.current) {
        pcRef.current.close();
      }
       if (sessionId) {
            // Clean up session on component unmount
            updateSession(sessionId, { status: 'disconnected' });
       }
    };

  }, [sessionId, firestore, status]); // Added status to dependencies to handle re-connects

  const renderStatus = () => {
      switch(status) {
          case 'generating':
              return <div className="flex items-center gap-2"><Loader2 className="animate-spin h-6 w-6"/><span>Membuat Sesi...</span></div>;
          case 'waiting':
              return <div className="flex items-center gap-2"><ScanLine className="h-6 w-6"/><span>Pindai untuk memulai Cast</span></div>;
          case 'connecting':
              return <div className="flex items-center gap-2"><Loader2 className="animate-spin h-6 w-6"/><span>🔌 Menghubungkan...</span></div>;
          case 'connected':
              return <div className="flex items-center gap-2 text-green-400"><CheckCircle className="h-6 w-6"/><span>📡 Terhubung ke perangkat</span></div>;
          case 'failed':
              return <div className="flex items-center gap-2 text-destructive"><WifiOff className="h-6 w-6"/><span>⚠️ Gagal terhubung</span></div>;
          case 'disconnected':
               return <div className="flex items-center gap-2 text-muted-foreground"><WifiOff className="h-6 w-6"/><span>⚠️ Koneksi terputus</span></div>;
      }
  }

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <video ref={videoRef} autoPlay playsInline className={cn(
            "absolute top-0 left-0 w-full h-full object-contain transition-opacity duration-500",
            status === 'connected' ? 'opacity-100' : 'opacity-0'
        )} />

        <div className={cn(
            "z-10 transition-all duration-500",
             status === 'connected' ? 'opacity-0 hover:opacity-90' : 'opacity-100'
        )}>
            <Card className="bg-neutral-900/80 border-neutral-700 text-white max-w-md w-full backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Tv2 className="w-12 h-12 text-primary"/>
                    </div>
                    <CardTitle>DimzTube WebRTC Receiver</CardTitle>
                    <CardDescription className="text-neutral-400">Gunakan aplikasi DimzTube di perangkat lain untuk memindai QR code ini dan memulai cast.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="bg-white p-4 rounded-lg">
                        {senderUrl ? <QRCode value={senderUrl} size={192} fgColor="#000000" bgColor="#FFFFFF" /> : <div className="w-48 h-48 bg-neutral-700 animate-pulse rounded-md" />}
                    </div>
                    <div className="text-lg font-medium p-2 bg-black/30 rounded-md">{renderStatus()}</div>
                     <p className="text-xs text-neutral-500 text-center">ID Sesi: {sessionId || 'memuat...'}</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
