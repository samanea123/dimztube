'use client';

import { useCastManager } from '@/lib/useCastManager';
import { Button } from './ui/button';
import { MonitorSmartphone, Tv, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CastStatusIndicator() {
  const { status, mode, deviceName, stopSession } = useCastManager();

  if (status !== 'connected') {
    return null;
  }
  
  const isCasting = mode === 'miracast' || mode === 'chromecast';
  const isMirroring = mode === 'mirror';
  
  const getBackgroundColor = () => {
    if (mode === 'chromecast') return 'bg-purple-600/20 text-purple-400 border-purple-500/50';
    if (mode === 'miracast') return 'bg-green-600/20 text-green-400 border-green-500/50';
    if (mode === 'mirror') return 'bg-blue-600/20 text-blue-400 border-blue-500/50';
    return 'bg-card/80';
  }

  return (
    <div
      className={cn(
        'fixed top-16 right-4 z-50 w-72 rounded-xl border bg-card/80 p-3 text-card-foreground shadow-lg backdrop-blur-md animate-in fade-in-0 sm:top-4 transition-all duration-300',
        getBackgroundColor()
      )}
    >
      <div className="flex items-center gap-3">
        {isCasting && (
          <Tv className={cn("h-5 w-5 flex-shrink-0")} />
        )}
        {isMirroring && (
          <MonitorSmartphone className="h-5 w-5 flex-shrink-0" />
        )}
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-semibold truncate text-foreground">
            {mode === 'chromecast' && 'Casting ke perangkat'}
            {mode === 'miracast' && 'Miracast aktif'}
            {mode === 'mirror' && 'Mirroring aktif'}
          </p>
          <p className="text-xs truncate text-current/80">
            {deviceName || (isMirroring ? 'Seluruh layar' : 'Perangkat tidak dikenal')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => stopSession()}
          className="h-8 w-8 flex-shrink-0 text-foreground hover:bg-white/20"
          title="Putuskan"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
