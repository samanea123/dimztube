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
    isSecureContext: boolean;
    presentation?: any;
  }
  interface HTMLMediaElement {
    remote?: {
      prompt: () => Promise<void>;
      watchAvailability: (callback: (available: boolean) => void) => Promise<number>;
      cancelWatchAvailability: (id: number) => void;
    }
  }
}

type CastStatus = 'disconnected' | 'connecting' | 'connected';
type CastMode = 'none' | 'miracast' | 'mirror' | 'chromecast';
type Environment = 'browser' | 'android' | 'electron' | 'android-tv';

const LAST_DEVICE_KEY = 'lastCastDevice';

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
        lock.addEventListener('release', () => {
            console.log('Wake Lock was released');
            setWakeLock(null)
        });
        console.log('Wake Lock acquired');
      } catch (err: any) {
        console.warn(`Failed to acquire Wake Lock: ${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = useCallback(() => {
    if (wakeLock) {
        wakeLock.release();
        setWakeLock(null);
    }
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
    localStorage.removeItem(LAST_DEVICE_KEY);

    if (showAlert) {
        toast({ title: '🛑 Sesi Cast/Mirror Dihentikan' });
    }
  }, [environment, releaseWakeLock, toast]);
  
  const handleRemotePlayback = async (videoElement: HTMLVideoElement): Promise<boolean> => {
    let availabilityId: number | undefined;
    return new Promise((resolve) => {
        if (!('remote' in videoElement)) {
            resolve(false);
            return;
        }

        const handleAvailabilityChange = (available: boolean) => {
            if (availabilityId) {
                videoElement.remote?.cancelWatchAvailability(availabilityId);
            }
            if (available) {
                videoElement.remote.prompt()
                    .then(() => {
                        toast({ title: "Memulai Cast", description: "Pilih perangkat dari daftar untuk memulai." });
                        setStatus('connected');
                        setMode('miracast');
                        // Device name for miracast is not available through the API, so we use a generic name
                        const genericDeviceName = 'Perangkat Miracast';
                        setDeviceName(genericDeviceName);
                        localStorage.setItem(LAST_DEVICE_KEY, genericDeviceName);
                        acquireWakeLock();
                        resolve(true);
                    })
                    .catch((error) => {
                        if (error.name !== 'AbortError') {
                            console.warn("Gagal memulai Remote Playback:", error);
                        }
                        resolve(false);
                    });
            } else {
                 toast({ variant: 'destructive', title: 'Perangkat Tidak Ditemukan', description: 'Tidak ada perangkat cast yang ditemukan di jaringan Anda.' });
                 resolve(false);
            }
        };

        videoElement.remote.watchAvailability(handleAvailabilityChange)
            .then(id => { availabilityId = id; })
            .catch(() => { resolve(false); });
        
         // Timeout if no device is found after a while
        setTimeout(() => {
            if (availabilityId) {
                videoElement.remote?.cancelWatchAvailability(availabilityId);
            }
            resolve(false);
        }, 8000); // 8 seconds timeout
    });
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
        dummyVideo.playsInline = true;
        await dummyVideo.play().catch(()=>{}); 
        videoRef.current = dummyVideo;

        // Try Remote Playback (Miracast) first
        const casted = await handleRemotePlayback(dummyVideo);
        if (casted) {
            setStream(displayStream);
            return true;
        }

        // Fallback to full screen mirroring
        setStream(displayStream);
        displayStream.getVideoTracks()[0].addEventListener('ended', () => stopSession(false));
        
        setStatus('connected');
        setMode('mirror');
        const mirrorDeviceName = 'Layar yang Dibagikan';
        setDeviceName(mirrorDeviceName);
        localStorage.setItem(LAST_DEVICE_KEY, mirrorDeviceName);
        await acquireWakeLock();
        toast({ title: '✅ Mirror Mode Aktif', description: 'Tampilan layar Anda sekarang sedang dibagikan.' });

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
        acquireWakeLock();
        return true;
      case 'electron':
        window.electronAPI?.startMirror();
        setDeviceName('Layar Windows');
        setStatus('connected');
        setMode('mirror');
        acquireWakeLock();
        return true;
      default:
        const success = await handleDisplayMedia();
        if (!success) {
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
        const friendlyName = session?.getCastDevice()?.friendlyName || 'Perangkat Chromecast';
        setStatus('connected');
        setMode('chromecast');
        setDeviceName(friendlyName);
        localStorage.setItem(LAST_DEVICE_KEY, friendlyName);
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
