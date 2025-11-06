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

interface CastManagerOptions {
    onNoMiracastDevice?: () => void;
}

export function useCastManager({ onNoMiracastDevice }: CastManagerOptions = {}) {
  const [status, setStatus] = useState<CastStatus>('disconnected');
  const [mode, setMode] = useState<CastMode>('none');
  const [environment, setEnvironment] = useState<Environment>('browser');
  const [wakeLock, setWakeLock] = useState<any | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [deviceName, setDeviceName] = useState<string>('');
  const { toast } = useToast();

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

  const startMiracast = useCallback(async (videoUrl: string) => {
    if (status === 'connected') return;

    setStatus('connecting');
    setMode('miracast');

    switch (environment) {
      case 'android':
        window.AndroidInterface?.startMiracast(videoUrl);
        setDeviceName('Perangkat Android');
        setStatus('connected'); 
        break;
      case 'electron':
        window.electronAPI?.startCast(videoUrl);
        setDeviceName('Perangkat Windows');
        setStatus('connected');
        break;
      default:
        if ('remote' in (HTMLMediaElement.prototype as any)) {
          try {
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            
            (videoElement as any).remote.addEventListener('disconnect', () => stopSession(false));
            
            await (videoElement as any).remote.prompt();
            setDeviceName((videoElement as any).remote.deviceName || 'Perangkat Miracast');
            setStatus('connected');
            acquireWakeLock();
          } catch (error) {
            console.error('Remote Playback API gagal:', error);
            stopSession(false);
            toast({ variant: 'destructive', title: 'Cast Gagal', description: 'Gagal memulai sesi cast video.' });
          }
        } else {
            onNoMiracastDevice?.();
            console.warn('Remote Playback API tidak didukung.');
            stopSession(false);
        }
        break;
    }
  }, [environment, status, onNoMiracastDevice, toast, stopSession]);

  const startMirror = useCallback(async () => {
    if (status === 'connected') return;

    setStatus('connecting');
    setMode('mirror');

    switch (environment) {
      case 'android':
        window.AndroidInterface?.startMirror();
        setDeviceName('Layar Android');
        setStatus('connected');
        break;
      case 'electron':
        window.electronAPI?.startMirror();
        setDeviceName('Layar Windows');
        setStatus('connected');
        break;
      default:
        if ('getDisplayMedia' in navigator.mediaDevices) {
          try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            setStream(displayStream);
            
            displayStream.getVideoTracks()[0].addEventListener('ended', () => stopSession(false));

            setDeviceName('Seluruh Layar');
            setStatus('connected');
            acquireWakeLock();
            toast({ title: '✅ Mirror Mode Aktif', description: 'Tampilan layar Anda sekarang sedang dibagikan.' });

          } catch (error) {
            console.error('Gagal memulai mirror:', error);
            stopSession(false);
          }
        } else {
          toast({ variant: 'destructive', title: 'Fitur Tidak Didukung', description: 'Mirroring layar tidak didukung di browser ini.' });
          stopSession(false);
        }
        break;
    }
  }, [environment, status, toast, stopSession]);

  useEffect(() => {
    const handleCastStateChange = (event: any) => {
      const state = event.sessionState;
      const session = window.cast.framework.CastContext.getInstance().getCurrentSession();

      if (state === 'SESSION_STARTED' || state === 'SESSION_RESUMED') {
        setStatus('connected');
        setMode('chromecast');
        setDeviceName(session?.getCastDevice()?.friendlyName || 'Perangkat Chromecast');
        acquireWakeLock();
      } else if (state === 'SESSION_ENDED') {
        stopSession(false);
      }
    };
    
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

  return { status, mode, deviceName, startMiracast, startMirror, stopSession };
}
