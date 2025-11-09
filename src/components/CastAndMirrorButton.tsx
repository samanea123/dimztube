'use client';

import { Button } from '@/components/ui/button';
import { Cast, MonitorSmartphone } from 'lucide-react';
import { startMiracast } from '@/lib/miracast';

// Log to ensure module is included in the build
console.log('Miracast module loaded:', startMiracast);

export default function CastAndMirrorButton() {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => startMiracast('cast')}
        title="Cast Video to Device"
        className="hover:text-primary"
      >
        <Cast className="h-5 w-5" />
        <span className="sr-only">Cast</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => startMiracast('mirror')}
        title="Mirror Screen"
        className="hover:text-primary"
      >
        <MonitorSmartphone className="h-5 w-5" />
        <span className="sr-only">Mirror</span>
      </Button>
    </div>
  );
}
