'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { onSessionUpdate, updateSession, servers, addIceCandidate, onIceCandidate } from '@/lib/webrtc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Monitor, Phone, Wifi, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


type Status = 'waiting' | 'requesting' | 'streaming' | 'failed' | 'disconnected';

export default function SenderPage() {
  const { toast } = useToast();
  const params = useParams();
  const { firestore } = useFirebase();
  const sessionId = params.sessionId as string;
  
  const [status, setStatus] = useState<Status>('waiting');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const startCasting = async () => {
    if (!firestore || !sessionId) return;
    setStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = event => {
        if (event.candidate) {
          addIceCandidate(sessionId, 'sender', event.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
          if(pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
              setStatus('disconnected');
          }
          if(pc.connectionState === 'connected') {
              setStatus('streaming');
          }
      }
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await updateSession(sessionId, { offer, status: 'connecting' });
      
      // Listen for answer
      const unsubSession = onSessionUpdate(sessionId, async (session) => {
        if (session?.answer && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(session.answer));
          unsubSession(); // Stop listening after getting the answer
        }
      });
      
      // Listen for receiver's ICE candidates
      onIceCandidate(sessionId, 'receiver', (candidate) => {
        if (pc.remoteDescription) { // Only add if remote description is set
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });
      
    } catch (err) {
      console.error('Gagal memulai sesi cast:', err);
      toast({
        variant: 'destructive',
        title: 'Gagal Memulai Cast',
        description: 'Anda mungkin telah membatalkan permintaan atau browser tidak mendukung fitur ini.',
      });
      setStatus('failed');
      updateSession(sessionId, { status: 'disconnected' });
    }
  };
  
  const stopCasting = () => {
    pcRef.current?.close();
    if(localVideoRef.current?.srcObject){
        (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    updateSession(sessionId, { status: 'disconnected' });
    setStatus('disconnected');
    setTimeout(() => window.close(), 1000);
  }

  const renderStatus = () => {
      switch(status) {
          case 'waiting':
              return 'Siap untuk memulai cast layar Anda.';
          case 'requesting':
              return 'Pilih layar atau jendela untuk di-cast...';
          case 'streaming':
              return 'Layar Anda sedang di-cast ke TV.';
          case 'failed':
              return 'Gagal memulai sesi casting.';
           case 'disconnected':
              return 'Koneksi terputus. Anda bisa menutup halaman ini.';
          default:
              return '';
      }
  }
  
  const renderIcon = () => {
      switch(status) {
          case 'waiting': return <Wifi className="h-10 w-10 text-primary" />;
          case 'requesting': return <Loader2 className="h-10 w-10 animate-spin text-primary" />;
          case 'streaming': return <CheckCircle className="h-10 w-10 text-green-500" />;
          case 'failed': return <XCircle className="h-10 w-10 text-destructive" />;
          case 'disconnected': return <XCircle className="h-10 w-10 text-muted-foreground" />;
      }
  }

  return (
    <div className="w-screen h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                 <Phone className="h-6 w-6" /> Sender
             </div>
             <div className="flex-1 border-t border-dashed"></div>
             <div className="flex items-center gap-2">
                 <Monitor className="h-6 w-6" /> Receiver
             </div>
          </CardTitle>
          <CardDescription>
            Anda akan memulai sesi casting layar dari perangkat ini ke perangkat TV Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <div className="flex justify-center items-center h-24">
                {renderIcon()}
            </div>
            <p className="text-lg font-medium mb-6">{renderStatus()}</p>

            {status === 'waiting' && (
                <Button size="lg" onClick={startCasting}>Mulai Cast</Button>
            )}
            
            {(status === 'streaming' || status === 'requesting') && (
                <Button size="lg" variant="destructive" onClick={stopCasting}>Hentikan Cast</Button>
            )}
            
             {(status === 'failed' || status === 'disconnected') && (
                <Button size="lg" onClick={() => window.location.reload()}>Coba Lagi</Button>
            )}

            <video ref={localVideoRef} autoPlay muted playsInline className="mt-6 w-full rounded-lg border bg-black" />
            <p className="text-xs text-muted-foreground mt-2">ID Sesi: {sessionId}</p>
        </CardContent>
      </Card>
    </div>
  );
}
