'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { onSessionUpdate, updateSession, servers, addIceCandidate, onIceCandidate, type PlaybackCommand } from '@/lib/webrtc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Monitor, Phone, Wifi, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';


type Status = 'waiting' | 'requesting' | 'streaming' | 'failed' | 'disconnected';

export default function SenderPage() {
  const { toast } = useToast();
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [status, setStatus] = useState<Status>('waiting');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const firestore = useFirestore();

  const sendCommand = useCallback((command: Omit<PlaybackCommand, 'ts'>) => {
      if (status === 'streaming' && sessionId) {
          updateSession(sessionId, {
              command: { ...command, ts: Date.now() }
          });
      }
  }, [status, sessionId]);

  const stopCasting = async (notify = true) => {
    console.log("Sender: Stop casting pressed.");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setStatus('disconnected');
    
    if (sessionId) {
      await updateSession(sessionId, { status: 'disconnected', command: null });
    }

    if (notify) {
      toast({ title: '✅ Sesi Cast Dihentikan' });
      setTimeout(() => window.close(), 1500);
    }
  };

  useEffect(() => {
    if (!firestore || !sessionId) return;
  
    const startCasting = async () => {
      if (status === 'requesting' || status === 'streaming') return;
      
      setStatus('requesting');
      let localStream: MediaStream;

      try {
        localStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: true });
        streamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.error('Gagal memulai getDisplayMedia:', err);
        toast({
          variant: 'destructive',
          title: 'Gagal Memulai Cast',
          description: 'Anda mungkin telah membatalkan permintaan atau browser tidak mendukung fitur ini.',
        });
        setStatus('failed');
        await updateSession(sessionId, { status: 'failed' });
        return;
      }
      
      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;
      
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      pc.onicecandidate = event => {
        if (event.candidate) {
          addIceCandidate(sessionId, 'sender', event.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
              if (status !== 'disconnected') {
                stopCasting(true);
              }
          }
          if (pc.connectionState === 'connected') {
              setStatus('streaming');
              toast({ title: "✅ Terhubung", description: "Layar Anda berhasil di-cast."});
          }
      };

      localStream.getVideoTracks()[0].addEventListener('ended', () => stopCasting(true));
      
      const unsubscribeIce = onIceCandidate(sessionId, 'receiver', (candidate) => {
        if (pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding ICE candidate:", e));
        }
      });
      
      const unsubscribeSession = onSessionUpdate(sessionId, async (session) => {
        if (session?.answer && pc.signalingState !== 'stable') {
           try {
            await pc.setRemoteDescription(new RTCSessionDescription(session.answer));
          } catch (e) {
            console.error("Error setting remote description", e);
            setStatus('failed');
          }
        }
      });
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await updateSession(sessionId, { offer, status: 'connecting' });
      } catch (error) {
         console.error("Failed to create offer:", error);
         setStatus('failed');
      }

      // Add event listeners for playback control
      const videoEl = localVideoRef.current;
      const onPlay = () => sendCommand({ type: 'play' });
      const onPause = () => sendCommand({ type: 'pause' });
      const onSeeked = () => sendCommand({ type: 'seek', payload: videoEl?.currentTime });
      const onVolumeChange = () => sendCommand({ type: 'volume', payload: videoEl?.volume });

      videoEl?.addEventListener('play', onPlay);
      videoEl?.addEventListener('pause', onPause);
      videoEl?.addEventListener('seeked', onSeeked);
      videoEl?.addEventListener('volumechange', onVolumeChange);

      return () => {
        unsubscribeIce();
        unsubscribeSession();
        videoEl?.removeEventListener('play', onPlay);
        videoEl?.removeEventListener('pause', onPause);
        videoEl?.removeEventListener('seeked', onSeeked);
        videoEl?.removeEventListener('volumechange', onVolumeChange);
        if (pcRef.current) {
          stopCasting(false);
        }
      }
    };
    
    const cleanupPromise = startCasting();
    
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    }
  }, [firestore, sessionId, sendCommand]);


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
            Hubungkan perangkat ini ke TV dengan memilih layar atau jendela yang ingin Anda bagikan. Kontrol pemutaran video akan disinkronkan.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <div className="flex justify-center items-center h-24">
                {renderIcon()}
            </div>
            <p className="text-lg font-medium mb-6">{renderStatus()}</p>

            {status === 'streaming' || status === 'requesting' ? (
                <Button size="lg" variant="destructive" onClick={() => stopCasting(true)}>Hentikan Cast</Button>
            ) : status === 'waiting' ? (
                 <Button size="lg" disabled> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menunggu...</Button>
            ) : (
                <Button size="lg" onClick={() => window.location.reload()}>Coba Lagi</Button>
            )}
            
            <video ref={localVideoRef} autoPlay muted playsInline controls className="mt-6 w-full rounded-lg border bg-black aspect-video" />
            <p className="text-xs text-muted-foreground mt-2">ID Sesi: {sessionId}</p>
        </CardContent>
      </Card>
    </div>
  );
}
