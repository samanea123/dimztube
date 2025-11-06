'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Cast, Monitor, MonitorSmartphone, X } from 'lucide-react';
import { useCastManager } from '@/lib/useCastManager';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function CastAndMirrorButton() {
  const { toast } = useToast();
  const { status, mode, startMiracast, startMirror, stopSession } = useCastManager({
    onNoMiracastDevice: () => {
      toast({
        variant: 'destructive',
        title: 'Tidak ada perangkat ditemukan',
        description: 'Tidak ada perangkat Miracast yang ditemukan di jaringan Anda.',
      });
    },
  });

  const isActive = status === 'connected';

  const handleMiracast = () => {
    // Untuk video-only, kita perlu ID video. Untuk contoh ini, kita hardcode.
    // Dalam aplikasi nyata, ini akan diambil dari video yang sedang dipilih/diputar.
    const currentVideoUrl = `https://www.youtube.com/watch?v=dQw4w9WgXcQ`;
    startMiracast(currentVideoUrl);
  };

  const handleMirror = () => {
    startMirror();
  };

  if (isActive) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={stopSession}
        className={cn(
          'hover:text-white',
          mode === 'miracast' && 'bg-green-600 text-white hover:bg-green-700',
          mode === 'mirror' && 'bg-blue-600 text-white hover:bg-blue-700'
        )}
        aria-label="Stop Session"
        title={mode === 'mirror' ? 'Hentikan Mirror' : 'Hentikan Cast'}
      >
        <X className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-primary"
          aria-label="Cast to device"
        >
          <Cast className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Sambungkan ke perangkat</h4>
            <p className="text-sm text-muted-foreground">
              Pilih mode untuk menampilkan konten di layar lain.
            </p>
          </div>
          <div className="grid gap-2">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={handleMiracast}
            >
              <MonitorSmartphone className="mr-2 h-4 w-4" />
              Cast Video (Miracast)
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={handleMirror}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Mirror Tampilan Penuh
            </Button>
            <PopoverTrigger asChild>
              <Button variant="outline">Batal</Button>
            </PopoverTrigger>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
