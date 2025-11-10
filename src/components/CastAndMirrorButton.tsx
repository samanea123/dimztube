'use client';

import { Button } from '@/components/ui/button';
import { Cast, MonitorSmartphone } from 'lucide-react';
import { startMiracast } from '@/lib/miracast';

// This console.log helps ensure the module is included in the build.
console.log('Miracast module loaded:', typeof startMiracast);

export default function CastAndMirrorButton() {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => startMiracast('cast')}
        title="Cast Video ke TV"
        className="hover:text-primary"
      >
        <Cast className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => startMiracast('mirror')}
        title="Mirror Layar"
        className="hover:text-primary"
      >
        <MonitorSmartphone className="h-5 w-5" />
      </Button>
    </div>
  );
}
