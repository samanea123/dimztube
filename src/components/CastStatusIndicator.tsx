'use client';

import { useCastManager } from '@/lib/useCastManager';
import { Button } from './ui/button';
import { Monitor, Tv, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CastStatusIndicator() {
  const { status, mode, deviceName, stopSession } = useCastManager();

  const isCasting = status === 'connected' && (mode === 'miracast' || mode === 'chromecast');
  const isMirroring = status === 'connected' && mode === 'mirror';

  if (status !== 'connected') {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-16 right-4 z-50 w-72 rounded-xl border bg-card/80 p-3 text-card-foreground shadow-lg backdrop-blur-md animate-in fade-in-0',
        'sm:top-4'
      )}
    >
      <div className="flex items-center gap-3">
        {isCasting && (
          <Tv className="h-5 w-5 flex-shrink-0 text-green-500" />
        )}
        {isMirroring && (
          <Monitor className="h-5 w-5 flex-shrink-0 text-blue-500" />
        )}
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-semibold truncate">
            {isCasting ? 'Casting ke perangkat' : 'Mirroring aktif'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {deviceName || (isMirroring ? 'Seluruh layar' : 'Perangkat tidak dikenal')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => stopSession()}
          className="h-8 w-8 flex-shrink-0"
          title="Putuskan"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
