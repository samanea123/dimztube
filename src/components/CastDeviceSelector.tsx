
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "./ui/button";
import { Loader2, Tv, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

interface CastDeviceSelectorProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSelectDevice: (deviceName: string) => void;
}

// Perangkat simulasi karena API browser tidak menyediakan daftar publik
const SIMULATED_DEVICES = ['Living Room TV', 'Bedroom Chromecast', 'Office Display'];
const LAST_DEVICE_KEY = 'lastCastDevice';

export default function CastDeviceSelector({ isOpen, onOpenChange, onSelectDevice }: CastDeviceSelectorProps) {
    const [isDetecting, setIsDetecting] = useState(true);
    const [devices, setDevices] = useState<string[]>([]);
    const [lastDevice, setLastDevice] = useState<string | null>(null);
    const [isBrowserSupported, setIsBrowserSupported] = useState(true);
    const isMobile = useIsMobile();
    
    useEffect(() => {
        if (isOpen) {
            setIsDetecting(true);
            setDevices([]);
            
            const lastUsed = localStorage.getItem(LAST_DEVICE_KEY);
            setLastDevice(lastUsed);

            const videoEl = document.createElement('video');
            const isSupported = ('remote' in videoEl || 'presentation' in navigator) && window.isSecureContext;
            setIsBrowserSupported(isSupported);

            if (!isSupported) {
                 setIsDetecting(false);
                 return;
            }
            
            // Simulasi deteksi perangkat
            const timer = setTimeout(() => {
                setIsDetecting(false);
                setDevices(SIMULATED_DEVICES);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSelect = (deviceName: string) => {
        onSelectDevice(deviceName);
    };

    const content = (
      <>
        <SheetHeader className="sm:hidden">
          <SheetTitle>Sambungkan ke perangkat</SheetTitle>
          <SheetDescription>
              Pilih perangkat yang tersedia di jaringan Anda untuk memulai cast.
          </SheetDescription>
        </SheetHeader>
        <DialogHeader className="hidden sm:block">
            <DialogTitle>Sambungkan ke perangkat</DialogTitle>
            <DialogDescription>
                Pilih perangkat yang tersedia di jaringan Anda untuk memulai cast.
            </DialogDescription>
        </DialogHeader>

        <div className="py-4">
            <div className="space-y-2">
                {lastDevice && !isDetecting && (
                   <Button
                        variant="default"
                        className="w-full justify-start text-left h-16 bg-sky-600/20 text-sky-400 hover:bg-sky-600/30 border border-sky-500"
                        onClick={() => handleSelect(lastDevice)}
                     >
                        <RefreshCw className="mr-4 h-6 w-6"/>
                        <div className="flex flex-col">
                            <span className="text-base">{lastDevice}</span>
                            <span className="text-xs text-sky-500">Terakhir digunakan</span>
                        </div>
                     </Button>
                )}
                 {isDetecting && (
                     <div className="flex items-center justify-center p-8 text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        Mendeteksi perangkat...
                     </div>
                )}
                {!isBrowserSupported && !isDetecting && (
                     <div className="text-destructive text-center p-4 rounded-lg bg-destructive/10">
                        Browser ini belum mendukung fitur Miracast atau halaman tidak aman (non-HTTPS).
                     </div>
                )}
                {!isDetecting && isBrowserSupported && devices.length === 0 && (
                    <div className="text-muted-foreground text-center p-8">
                        Tidak ada perangkat yang ditemukan. Pastikan Anda berada di jaringan yang sama.
                    </div>
                )}
                {devices.map((device) => (
                     <Button
                        key={device}
                        variant="ghost"
                        className="w-full justify-start text-left h-14"
                        onClick={() => handleSelect(device)}
                     >
                        <Tv className="mr-4 h-6 w-6"/>
                        <span className="text-base">{device}</span>
                     </Button>
                ))}
            </div>
        </div>
      </>
    );

    if (isMobile) {
      return (
          <Sheet open={isOpen} onOpenChange={onOpenChange}>
              <SheetContent side="bottom" className="w-full max-w-lg mx-auto bg-card border-none rounded-t-2xl">
                  {content}
              </SheetContent>
          </Sheet>
      )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                {content}
            </DialogContent>
        </Dialog>
    )
}
