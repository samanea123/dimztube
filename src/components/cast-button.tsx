'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cast } from 'lucide-react';

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    chrome: any;
    cast: any;
  }
}

export default function CastButton() {
  const [castState, setCastState] = useState<string>('no_devices_available');
  const [isApiAvailable, setIsApiAvailable] = useState(false);

  useEffect(() => {
    const initializeCastApi = () => {
      if (window.chrome && window.chrome.cast && window.chrome.cast.framework) {
        const castContext = window.chrome.cast.framework.CastContext.getInstance();
        castContext.setOptions({
          receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });

        const handleCastStateChange = (event: any) => {
          setCastState(event.castState);
        };
        
        castContext.addEventListener(
          window.chrome.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
          handleCastStateChange
        );

        setIsApiAvailable(true);
        setCastState(castContext.getCastState());

        return () => {
            castContext.removeEventListener(
                window.chrome.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
                handleCastStateChange
            );
        };
      }
    };

    if (window.cast && window.cast.framework) {
      initializeCastApi();
    } else {
      window.__onGCastApiAvailable = (isAvailable) => {
        if (isAvailable) {
          initializeCastApi();
        }
      };
    }
  }, []);

  const handleCastClick = () => {
    window.chrome.cast.requestSession(
      (session) => {
        console.log('Session initialized:', session);
      },
      (error) => {
        console.error('Session initialization error:', error);
      }
    );
  };
  
  if (!isApiAvailable || castState === 'no_devices_available') {
    return null; // Don't show the button if Cast is not available or no devices are found
  }

  const isConnected = castState === 'connected';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCastClick}
      className={`hidden sm:flex ${isConnected ? 'text-primary' : ''}`}
    >
      <Cast className="h-5 w-5" />
    </Button>
  );
}
