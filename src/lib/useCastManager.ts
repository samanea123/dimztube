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
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [deviceName, setDeviceName] = useState<string>('');
  const { toast } = useToast();

  // Detect environment on mount
  useEffect(() => {
    const ua = navigator.userAgent;
    if (window.AndroidInterface) {
      setEnvironment('android');
    } else if (window.electronAPI) {
      setEnvironment('electron');
    } else if (ua.includes('CrKey')) { // Basic detection for Android TV
      setEnvironment('android-tv');
    } else {
      setEnvironment('browser');
    }
  }, []);

  const acquireWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLock(lock);
        lock.addEventListener('release', () => {
          setWakeLock(null);
        });
      } catch (err) {
        console.warn('Gagal mengaktifkan Wake Lock:', err);
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
  }, [wakeLock, stream]);


  const stopSession = useCallback((showAlert = true) => {
    if (environment === 'android') window.AndroidInterface?.stopSession();
    if (environment === 'electron') window.electronAPI?.stopSession();
    
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
        setDeviceName('Perangkat Android'); // Placeholder
        setStatus('connected'); 
        break;
      case 'electron':
        window.electronAPI?.startCast(videoUrl);
        setDeviceName('Perangkat Windows'); // Placeholder
        setStatus('connected');
        break;
      default: // Browser environment
        if ('remote' in HTMLMediaElement.prototype) {
          try {
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            
            videoElement.addEventListener('remotepromptclosed', () => {
              if (videoElement.remote.state === 'disconnected') {
                 stopSession(false);
              }
            });

            await (videoElement as any).remote.prompt();
            setDeviceName(videoElement.remote.deviceName || 'Perangkat Miracast');
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
      default: // Browser environment
        if ('getDisplayMedia' in navigator.mediaDevices) {
          try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            setStream(displayStream);
            
            displayStream.getVideoTracks()[0].addEventListener('ended', () => {
              stopSession(false); 
            });

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


  // Handle Chromecast (Google Cast) specifically
  const startChromecast = useCallback(() => {
    if (window.cast && window.cast.framework) {
        const castSession = window.cast.framework.CastContext.getInstance().getCurrentSession();
        if (castSession) {
            setDeviceName(castSession.getCastDevice().friendlyName);
            setMode('chromecast');
            setStatus('connected');
        } else {
            window.cast.framework.CastContext.getInstance().requestSession()
            .then((session: any) => {
                setDeviceName(session.getCastDevice().friendlyName);
                setMode('chromecast');
                setStatus('connected');
            })
            .catch((err: any) => {
                console.error(err);
                toast({ variant: 'destructive', title: 'Gagal terhubung', description: 'Tidak bisa memulai sesi Chromecast.' });
            });
        }
    } else {
        toast({ title: 'Chromecast tidak siap', description: 'Pastikan Anda berada di lingkungan yang mendukung Google Cast.' });
    }
  }, [toast]);

  // Listener for Chromecast session state changes
  useEffect(() => {
      const castContext = window.cast?.framework?.CastContext?.getInstance();
      if (!castContext) return;

      const handleSessionState = (event: any) => {
          if (event.sessionState === 'SESSION_STARTED' || event.sessionState === 'SESSION_RESUMED') {
              setStatus('connected');
              setMode('chromecast');
              setDeviceName(event.session.getCastDevice().friendlyName);
          } else if (event.sessionState === 'SESSION_ENDED') {
              stopSession(false);
          }
      };
      
      castContext.addEventListener(window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED, handleSessionState);

      return () => {
        castContext.removeEventListener(window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED, handleSessionState);
      }
  }, [stopSession]);

  return { status, mode, deviceName, startMiracast, startMirror, startChromecast, stopSession };
}
