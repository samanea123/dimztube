'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cast, Monitor, MonitorSmartphone, Tv, X } from 'lucide-react';
import { useCastManager } from '@/lib/useCastManager';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CastAndMirrorButton() {
  const { toast } = useToast();
  const { status, mode, startMiracast, stopSession, startAutoCast } = useCastManager();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isActive = status === 'connected';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);

  const handleAutoCast = () => {
    setIsOpen(false);
    startAutoCast();
  };
  
  const handleToggle = () => {
      if (isActive) {
          stopSession();
      } else {
          setIsOpen(!isOpen);
      }
  }

  if (isActive) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => stopSession()}
        className={cn(
          'hover:text-white',
          'bg-blue-600 text-white hover:bg-blue-700'
        )}
        aria-label="Stop Session"
        title={mode === 'mirror' ? 'Hentikan Mirror' : 'Hentikan Cast'}
      >
        <X className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-primary"
          aria-label="Cast to device"
          onClick={handleToggle}
        >
          <Cast className="h-5 w-5" />
        </Button>
      
        {isOpen && (
             <div className="absolute top-full right-0 mt-2 w-72 bg-card rounded-xl shadow-lg border p-2 z-[9999] animate-fadeIn">
                <div className="space-y-2 mb-2 p-2">
                    <h4 className="font-medium leading-none">Sambungkan ke perangkat</h4>
                    <p className="text-sm text-muted-foreground">
                    Pilih mode untuk menampilkan konten ke layar lebar.
                    </p>
                </div>
                <div className="grid gap-1">
                    {/* Tombol Chromecast bawaan */}
                    <div className="flex items-center gap-2 hover:bg-muted p-2 rounded-md cursor-pointer">
                        <Tv className="mr-2 h-4 w-4" />
                        <google-cast-launcher class="cast-button-in-popover" />
                    </div>
                    
                    <Link href="/cast/receiver" target="_blank" className="w-full">
                        <button
                            className="w-full text-left flex items-center px-3 py-2 rounded-lg hover:bg-muted"
                            onClick={() => setIsOpen(false)}
                        >
                           <MonitorSmartphone className="mr-2 h-4 w-4" />
                            Cast Video (WebRTC)
                        </button>
                    </Link>

                    <button
                        className="w-full text-left flex items-center px-3 py-2 rounded-lg hover:bg-muted mt-1"
                        onClick={handleAutoCast}
                    >
                        <Monitor className="mr-2 h-4 w-4" />
                        Mirror Tampilan Penuh (Auto)
                    </button>

                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsOpen(false)}>Batal</Button>
                </div>
             </div>
        )}
    </div>
  );
}
