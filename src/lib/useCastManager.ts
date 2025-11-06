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
          console.log('Wake Lock dilepas.');
          setWakeLock(null);
        });
        console.log('Wake Lock aktif.');
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


  const startMiracast = useCallback(async (videoUrl: string) => {
    if (status === 'connected') return;

    setStatus('connecting');
    setMode('miracast');

    switch (environment) {
      case 'android':
        window.AndroidInterface?.startMiracast(videoUrl);
        setStatus('connected'); // Assume native handles it
        break;
      case 'electron':
        window.electronAPI?.startCast(videoUrl);
        setStatus('connected');
        break;
      default: // Browser environment
        if ('remote' in HTMLMediaElement.prototype) {
          try {
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            await (videoElement as any).remote.prompt();
            setStatus('connected');
            acquireWakeLock();
          } catch (error) {
            console.error('Remote Playback API gagal:', error);
            setStatus('disconnected');
            setMode('none');
            toast({ variant: 'destructive', title: 'Cast Gagal', description: 'Gagal memulai sesi cast video.' });
          }
        } else {
            onNoMiracastDevice?.();
            console.warn('Remote Playback API tidak didukung.');
            setStatus('disconnected');
            setMode('none');
        }
        break;
    }
  }, [environment, status, onNoMiracastDevice, toast]);

  const startMirror = useCallback(async () => {
    if (status === 'connected') return;

    setStatus('connecting');
    setMode('mirror');

    switch (environment) {
      case 'android':
        window.AndroidInterface?.startMirror();
        setStatus('connected');
        break;
      case 'electron':
        window.electronAPI?.startMirror();
        setStatus('connected');
        break;
      default: // Browser environment
        if ('getDisplayMedia' in navigator.mediaDevices) {
          try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true
            });
            setStream(displayStream);
            
            // This is where you would implement the WebRTC logic to send the stream.
            // For now, we'll just activate wake lock and set status.
            await acquireWakeLock();

            displayStream.getVideoTracks()[0].addEventListener('ended', () => {
              stopSession(false); // Stop session if user stops sharing from browser UI
            });

            setStatus('connected');
            toast({ title: '✅ Mirror Mode Aktif', description: 'Buka menu Cast di browser Anda dan pilih "Cast tab" untuk menampilkan di TV.' });

          } catch (error) {
            console.error('Gagal memulai mirror:', error);
            stopSession(false);
          }
        } else {
          // Fallback to WebRTC PeerConnection (not fully implemented here)
          toast({ variant: 'destructive', title: 'Fitur Tidak Didukung', description: 'Mirroring layar tidak didukung di browser ini.' });
          stopSession(false);
        }
        break;
    }
  }, [environment, status, toast]);


  const stopSession = useCallback((showAlert = true) => {
    if (environment === 'android') window.AndroidInterface?.stopSession();
    if (environment === 'electron') window.electronAPI?.stopSession();
    
    releaseWakeLock();
    setStatus('disconnected');
    setMode('none');

    if (showAlert) {
        toast({ title: '🛑 Sesi Cast/Mirror Dihentikan' });
    }
  }, [environment, releaseWakeLock, toast]);

  // Handle Chromecast (Google Cast) specifically
  const startChromecast = useCallback(() => {
    if (window.cast && window.cast.framework) {
        const castSession = window.cast.framework.CastContext.getInstance().getCurrentSession();
        if (castSession) {
            // Further logic to load media
            setMode('chromecast');
            setStatus('connected');
        } else {
            window.cast.framework.CastContext.getInstance().requestSession()
            .then(() => {
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

  return { status, mode, environment, startMiracast, startMirror, startChromecast, stopSession };
}
