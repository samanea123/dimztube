'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { createSession, onSessionUpdate, updateSession, addIceCandidate, onIceCandidate, servers, type WebRTCSession } from '@/lib/webrtc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Tv2, ScanLine, CheckCircle, WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';


type Status = 'generating' | 'waiting' | 'connecting' | 'connected' | 'failed' | 'disconnected';

export default function ReceiverPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('generating');
  const [senderUrl, setSenderUrl] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const lastCommandTimestamp = useRef(0);
  
  const firestore = useFirestore();

  const resetState = () => {
    console.log("Receiver: Connection closed or failed. Resetting state.");
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setStatus('disconnected'); 
    console.log("Receiver: Waiting for new offer...");
  };

  // 1. Initialize Session on mount
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

  // 2. WebRTC Logic Effect
  useEffect(() => {
    if (!sessionId || !firestore) return;
    
    if(pcRef.current) {
        pcRef.current.close();
    }

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
        console.log("Receiver: Stream received and connected.");
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

    const unsubscribeSession = onSessionUpdate(sessionId, async (session: WebRTCSession | null) => {
      if (!session) {
        resetState();
        return;
      }
      
      // Handle explicit disconnect from sender
      if (session.status === 'disconnected') {
        if (status !== 'disconnected' && status !== 'waiting') {
           resetState();
        }
        return;
      }
      
      // Handle offer from sender
      if (session.offer && pc.signalingState === 'stable') {
        try {
            console.log("Receiver: Offer received. Creating answer...");
            setStatus('connecting');
            await pc.setRemoteDescription(new RTCSessionDescription(session.offer));
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await updateSession(sessionId, { answer, status: 'connecting' });
            console.log("Receiver: Answer sent.");
        } catch (error) {
            console.error("Gagal membuat answer atau set description:", error);
            setStatus('failed');
        }
      }

      // Handle playback commands from sender
      if (session.command && videoRef.current && session.command.ts > lastCommandTimestamp.current) {
          lastCommandTimestamp.current = session.command.ts;
          const { type, payload } = session.command;
          
          switch(type) {
              case 'play':
                  videoRef.current.play();
                  break;
              case 'pause':
                  videoRef.current.pause();
                  break;
              case 'seek':
                  if (typeof payload === 'number') {
                      videoRef.current.currentTime = payload;
                  }
                  break;
              case 'volume':
                  if (typeof payload === 'number') {
                      videoRef.current.volume = payload;
                  }
                  break;
          }
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeIce();
      unsubscribeSession();
      if (pcRef.current) {
        pcRef.current.close();
      }
       if (sessionId) {
            updateSession(sessionId, { status: 'disconnected' });
       }
    };

  }, [sessionId, firestore]);

  const renderStatus = () => {
      const statusMap: Record<Status, { icon: React.ReactNode, text: string, color: string }> = {
          generating: { icon: <Loader2 className="animate-spin h-6 w-6"/>, text: "Membuat Sesi...", color: "text-white" },
          waiting: { icon: <ScanLine className="h-6 w-6"/>, text: "Pindai untuk memulai Cast", color: "text-white" },
          connecting: { icon: <Loader2 className="animate-spin h-6 w-6"/>, text: "🔌 Menghubungkan...", color: "text-amber-400" },
          connected: { icon: <CheckCircle className="h-6 w-6"/>, text: "📡 Terhubung ke perangkat", color: "text-green-400" },
          failed: { icon: <WifiOff className="h-6 w-6"/>, text: "⚠️ Gagal terhubung", color: "text-destructive" },
          disconnected: { icon: <Wifi className="h-6 w-6"/>, text: "🔌 Menunggu perangkat untuk cast...", color: "text-muted-foreground" },
      };
      const current = statusMap[status];
      return <div className={cn("flex items-center gap-3 text-lg font-medium p-3 rounded-lg bg-black/50", current.color)}>{current.icon}{current.text}</div>;
  }

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col items-center justify-center p-8 overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className={cn(
            "absolute top-0 left-0 w-full h-full object-contain transition-opacity duration-500",
            status === 'connected' ? 'opacity-100' : 'opacity-0'
        )} />

        {/* Status Overlay */}
        <div className={cn(
             "absolute top-5 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-300",
             status === 'connected' && status !== 'connecting' ? "opacity-100" : "opacity-0"
        )}>
           {renderStatus()}
        </div>

        {/* QR Code and Initial Instructions Card */}
        <div className={cn(
            "z-10 transition-all duration-500 flex flex-col items-center justify-center",
             status === 'connected' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}>
            <Card className="bg-neutral-900/90 border-neutral-700 text-white max-w-md w-full backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Tv2 className="w-12 h-12 text-primary"/>
                    </div>
                    <CardTitle>DimzTube TV Mode</CardTitle>
                    <CardDescription className="text-neutral-400">Gunakan aplikasi DimzTube di perangkat lain untuk memindai QR code ini dan memulai cast.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="bg-white p-4 rounded-lg">
                        {senderUrl ? <QRCode value={senderUrl} size={192} fgColor="#000000" bgColor="#FFFFFF" /> : <div className="w-48 h-48 bg-neutral-700 animate-pulse rounded-md" />}
                    </div>
                     <div className="text-lg font-medium p-2">{status === 'generating' ? 'Membuat sesi...' : 'Pindai kode di atas'}</div>
                     <p className="text-xs text-neutral-500 text-center">ID Sesi: {sessionId || 'memuat...'}</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
