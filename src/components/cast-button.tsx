'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cast } from 'lucide-react';

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    chrome: any;
  }
}

export default function CastButton() {
  useEffect(() => {
    const initializeCastApi = () => {
      if (window.chrome && window.chrome.cast && window.chrome.cast.framework) {
        const castContext = window.chrome.cast.framework.CastContext.getInstance();
        castContext.setOptions({
          receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
      }
    };

    if (window.chrome && window.chrome.cast) {
        initializeCastApi();
    } else {
        window.__onGCastApiAvailable = (isAvailable) => {
            if (isAvailable) {
                initializeCastApi();
            }
        };
    }
  }, []);

  return (
    <div className="hidden sm:flex">
      {/* The google-cast-launcher component will be rendered here by the Cast SDK */}
      <google-cast-launcher style={{
          width: '40px',
          height: '40px',
          '--connected-color': 'hsl(var(--primary))',
          '--disconnected-color': 'hsl(var(--foreground))',
          cursor: 'pointer',
      }}></google-cast-launcher>
    </div>
  );
}
