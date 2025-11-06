'use client';

import { useState, useEffect, useCallback } from 'react';
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
  }, [wakeLock, stream]);

  const stopSession = useCallback((showAlert = true) => {
    if (environment === 'android') window.AndroidInterface?.stopSession();
    if (environment === 'electron') window.electronAPI?.stopSession();

    // Stop Chromecast session
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

  const startMiracast = useCallback(async () => {
    if (status === 'connected') {
        toast({
            variant: 'destructive',
            title: 'Sesi Aktif',
            description: 'Matikan sesi Mirror atau Cast yang sedang berjalan terlebih dahulu.',
        });
        return;
    }

    setStatus('connecting');

    switch (environment) {
      case 'android':
        window.AndroidInterface?.startMiracast('');
        setDeviceName('Perangkat Android');
        setStatus('connected');
        setMode('miracast');
        break;
      case 'electron':
        window.electronAPI?.startCast('');
        setDeviceName('Perangkat Windows');
        setStatus('connected');
        setMode('miracast');
        break;
      default:
        const success = await handleDisplayMedia();
        if (success) {
            setStatus('connected');
            setMode('miracast');
            toast({ title: '✅ Cast Video berhasil dimulai.' });
        } else {
            setStatus('disconnected');
        }
        break;
    }
  }, [environment, status, toast]);

  const startMirror = useCallback(async () => {
    if (status === 'connected') {
       toast({
            variant: 'destructive',
            title: 'Sesi Aktif',
            description: 'Matikan sesi Mirror atau Cast yang sedang berjalan terlebih dahulu.',
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
            setStatus('connected');
            setMode('mirror');
            toast({ title: '✅ Mirror Mode Aktif', description: 'Tampilan layar Anda sekarang sedang dibagikan.' });
        } else {
            setStatus('disconnected');
        }
        return success;
    }
  }, [environment, status, toast]);

  const startAutoCast = async () => {
    const { id: toastId, update } = toast({
      title: "🔍 Mendeteksi TV terdekat...",
    });
  
    try {
      // Simulate device discovery
      const fakeDiscovery = await new Promise((resolve) => {
        setTimeout(() => resolve("Android TV Living Room"), 2000);
      });
  
      update({
        id: toastId,
        title: `📺 ${fakeDiscovery} ditemukan!`,
        description: "Mencoba menghubungkan...",
      });
  
      // Proceed with mirroring
      const success = await startMirror();
  
      // If startMirror fails (e.g., user cancels), the toast inside startMirror will handle it.
      // If it succeeds, the CastStatusIndicator will show the final status.
      if (success) {
         setTimeout(() => update({ id: toastId, open: false }), 1000); // Hide discovery toast
      }
      
    } catch (err) {
      console.error("❌ Gagal auto-cast:", err);
      update({
        id: toastId,
        variant: "destructive",
        title: "❌ Gagal menemukan perangkat TV",
        description: "Mirror manual akan dijalankan.",
      });
      setTimeout(() => startMirror(), 2000);
    }
  };


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
    
    // Check if the Cast SDK is already available
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
        // Otherwise, wait for the API to become available
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


    // Clean up on unmount
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

  return { status, mode, deviceName, startMiracast, startMirror, stopSession, startAutoCast };
}
