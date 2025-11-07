'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

// Type definitions for potential native interfaces
declare global {
  interface Window {
    AndroidInterface?: {
      startMiracast: (videoUrl: string) => void;
      startMirror: () => void;
      stopSession: () => void;
    };
    electronAPI?: {
      startCast: (videoUrl: string) => void;
      startMirror: () => void;
      stopSession: () => void;
    };
    cast?: any;
    chrome?: any;
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
  }
  interface HTMLMediaElement {
    remote?: {
      prompt: () => Promise<void>;
    }
  }
}

type CastStatus = 'disconnected' | 'connecting' | 'connected';
type CastMode = 'none' | 'miracast' | 'mirror' | 'chromecast';
type Environment = 'browser' | 'android' | 'electron' | 'android-tv';

export function useCastManager() {
  const { toast } = useToast();
  const [status, setStatus] = useState<CastStatus>('disconnected');
  const [mode, setMode] = useState<CastMode>('none');
  const [environment, setEnvironment] = useState<Environment>('browser');
  const [wakeLock, setWakeLock] = useState<any | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [deviceName, setDeviceName] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);


  useEffect(() => {
    const ua = navigator.userAgent;
    if (window.AndroidInterface) setEnvironment('android');
    else if (window.electronAPI) setEnvironment('electron');
    else if (ua.includes('CrKey')) setEnvironment('android-tv');
    else setEnvironment('browser');
  }, []);

  const acquireWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLock(lock);
        lock.addEventListener('release', () => setWakeLock(null));
      } catch (err) {
        console.warn('Gagal mengaktifkan Wake Lock:', err);
      }
    }
  };

  const releaseWakeLock = useCallback(() => {
    wakeLock?.release();
    setWakeLock(null);
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [wakeLock, stream]);

  const stopSession = useCallback((showAlert = true) => {
    if (environment === 'android') window.AndroidInterface?.stopSession();
    if (environment === 'electron') window.electronAPI?.stopSession();

    const castSession = window.cast?.framework?.CastContext.getInstance().getCurrentSession();
    if (castSession) {
      castSession.endSession(true);
    }
    
    releaseWakeLock();
    setStatus('disconnected');
    setMode('none');
    setDeviceName('');

    if (showAlert) {
        toast({ title: '🛑 Sesi Cast/Mirror Dihentikan' });
    }
  }, [environment, releaseWakeLock, toast]);
  
  const handleRemotePlayback = async (videoElement: HTMLVideoElement): Promise<boolean> => {
    if (!('remote' in videoElement)) {
        toast({
            variant: 'destructive',
            title: 'Fitur Tidak Didukung',
            description: 'Browser ini belum mendukung standar Miracast (Remote Playback API).'
        });
        return false;
    }
    try {
        await videoElement.remote.prompt();
        toast({
            title: "Memulai Cast",
            description: "Pilih perangkat dari daftar untuk memulai."
        });
        setStatus('connected');
        setMode('miracast');
        setDeviceName('Perangkat Remote');
        await acquireWakeLock();
        return true;
    } catch (error: any) {
        if (error.name === 'NotSupportedError') {
             toast({
                variant: 'destructive',
                title: 'Fitur Tidak Didukung',
                description: 'Tidak ditemukan perangkat yang kompatibel untuk Miracast.'
            });
            return false;
        }
        console.warn("Gagal memulai Remote Playback, kemungkinan dibatalkan pengguna:", error);
        return false;
    }
  };

  const handleDisplayMedia = async () => {
    if (!('getDisplayMedia' in navigator.mediaDevices)) {
        toast({
            variant: 'destructive',
            title: 'Fitur Tidak Didukung',
            description: 'Mirroring layar tidak didukung di browser ini.'
        });
        return false;
    }
    
    try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        const dummyVideo = document.createElement('video');
        dummyVideo.srcObject = displayStream;
        dummyVideo.muted = true;
        await dummyVideo.play().catch(()=>{}); 
        videoRef.current = dummyVideo;

        const casted = await handleRemotePlayback(dummyVideo);
        if (casted) {
            setStream(displayStream);
            return true;
        }

        // Fallback to mirroring if miracast is not used or fails
        setStream(displayStream);
        displayStream.getVideoTracks()[0].addEventListener('ended', () => stopSession(false));

        setDeviceName('Layar yang Dibagikan');
        await acquireWakeLock();
        return true;
    } catch (err) {
        console.error("Gagal memulai sesi getDisplayMedia:", err);
        toast({
            variant: "destructive",
            title: "Gagal Memulai Sesi",
            description: "Anda membatalkan pilihan atau terjadi error."
        });
        stopSession(false);
        return false;
    }
  };


  const startAutoCast = useCallback(async () => {
    if (status === 'connected') {
       toast({
            variant: 'destructive',
            title: 'Sesi Aktif',
            description: 'Matikan sesi Mirror atau Cast yang sedang berjalan terlebih dahulu.',
        });
        return false;
    }

    if (!window.isSecureContext) {
        toast({
            variant: 'destructive',
            title: 'Koneksi Tidak Aman',
            description: 'Fitur cast dan mirror memerlukan koneksi HTTPS.'
        });
        return false;
    }

    setStatus('connecting');

    switch (environment) {
      case 'android':
        window.AndroidInterface?.startMirror();
        setDeviceName('Layar Android');
        setStatus('connected');
        setMode('mirror');
        return true;
      case 'electron':
        window.electronAPI?.startMirror();
        setDeviceName('Layar Windows');
        setStatus('connected');
        setMode('mirror');
        return true;
      default:
        const success = await handleDisplayMedia();
        if (success) {
            if (mode !== 'miracast') { // if miracast already set the mode, don't override
                setStatus('connected');
                setMode('mirror');
                toast({ title: '✅ Mirror Mode Aktif', description: 'Tampilan layar Anda sekarang sedang dibagikan.' });
            }
        } else {
            setStatus('disconnected');
        }
        return success;
    }
  }, [environment, status, toast, mode]);


  useEffect(() => {
    const handleCastStateChange = (event: any) => {
      const state = event.sessionState;
      const session = window.cast?.framework?.CastContext.getInstance().getCurrentSession();

      if (state === 'SESSION_STARTED' || state === 'SESSION_RESUMED') {
        setStatus('connected');
        setMode('chromecast');
        setDeviceName(session?.getCastDevice()?.friendlyName || 'Perangkat Chromecast');
        acquireWakeLock();
      } else if (state === 'SESSION_ENDED') {
        stopSession(false);
      }
    };
    
    if (window.cast && window.cast.framework) {
        const castContext = window.cast.framework.CastContext.getInstance();
        castContext.setOptions({
            receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        castContext.addEventListener(
            window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
            handleCastStateChange
        );
    } else {
        window['__onGCastApiAvailable'] = (isAvailable) => {
            if(isAvailable) {
                const castContext = window.cast.framework.CastContext.getInstance();
                castContext.setOptions({
                    receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
                    autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
                });
                castContext.addEventListener(
                  window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
                  handleCastStateChange
                );
            }
        };
    }


    return () => {
        const castContext = window.cast?.framework?.CastContext.getInstance();
        if (castContext) {
            castContext.removeEventListener(
                window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
                handleCastStateChange
            );
        }
    }

  }, [stopSession]);

  return { status, mode, deviceName, startAutoCast, stopSession };
}
