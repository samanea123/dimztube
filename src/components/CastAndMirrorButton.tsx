'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cast, Monitor, MonitorSmartphone, Tv, X } from 'lucide-react';
import { useCastManager } from '@/lib/useCastManager';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function CastAndMirrorButton() {
  const { toast } = useToast();
  const { status, mode, startMiracast, startMirror, stopSession, startAutoCast } = useCastManager();

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

  const handleMiracast = () => {
    setIsOpen(false);
    startMiracast();
  };

  const handleMirror = () => {
    setIsOpen(false);
    startAutoCast(); // Use auto cast flow
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
          mode === 'miracast' && 'bg-green-600 text-white hover:bg-green-700',
          mode === 'mirror' && 'bg-blue-600 text-white hover:bg-blue-700',
          mode === 'chromecast' && 'bg-purple-600 text-white hover:bg-purple-700'
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
             <div className="absolute top-full right-0 mt-2 w-64 bg-card rounded-xl shadow-lg border p-2 z-[9999] animate-fadeIn">
                <div className="space-y-2 mb-2 p-2">
                    <h4 className="font-medium leading-none">Sambungkan ke perangkat</h4>
                    <p className="text-sm text-muted-foreground">
                    Pilih mode untuk menampilkan konten.
                    </p>
                </div>
                <div className="grid gap-1">
                    {/* Tombol Chromecast bawaan */}
                    <div className="flex items-center gap-2 hover:bg-muted p-2 rounded-md cursor-pointer">
                        <Tv className="mr-2 h-4 w-4" />
                        <google-cast-launcher class="cast-button-in-popover" />
                    </div>
                    
                    <button
                        className="w-full text-left flex items-center px-3 py-2 rounded-lg hover:bg-muted"
                        onClick={handleMiracast}
                    >
                       <MonitorSmartphone className="mr-2 h-4 w-4" />
                        Cast Video (Layar)
                    </button>
                    <button
                        className="w-full text-left flex items-center px-3 py-2 rounded-lg hover:bg-muted mt-1"
                        onClick={handleMirror}
                    >
                        <Monitor className="mr-2 h-4 w-4" />
                        Mirror Tampilan (Auto Detect)
                    </button>

                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsOpen(false)}>Batal</Button>
                </div>
             </div>
        )}
    </div>
  );
}
