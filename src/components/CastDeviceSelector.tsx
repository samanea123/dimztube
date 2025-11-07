
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "./ui/button";
import { Loader2, Tv } from "lucide-react";
import { useEffect, useState } from "react";

interface CastDeviceSelectorProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSelectDevice: (deviceName: string) => void;
}

// Perangkat simulasi karena API browser tidak menyediakan daftar publik
const SIMULATED_DEVICES = ['Living Room TV', 'Bedroom Chromecast', 'Office Display'];

export default function CastDeviceSelector({ isOpen, onOpenChange, onSelectDevice }: CastDeviceSelectorProps) {
    const [isDetecting, setIsDetecting] = useState(true);
    const [devices, setDevices] = useState<string[]>([]);
    const [isBrowserSupported, setIsBrowserSupported] = useState(true);
    
    useEffect(() => {
        if (isOpen) {
            setIsDetecting(true);
            setDevices([]);

            const videoEl = document.createElement('video');
            const isSupported = 'remote' in videoEl;
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

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="w-full max-w-lg mx-auto bg-card border-none rounded-t-2xl">
                <SheetHeader>
                    <SheetTitle>Sambungkan ke perangkat</SheetTitle>
                    <SheetDescription>
                        Pilih perangkat yang tersedia di jaringan Anda untuk memulai cast.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <div className="space-y-2">
                        {isDetecting && (
                             <div className="flex items-center justify-center p-8 text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                Mendeteksi perangkat...
                             </div>
                        )}
                        {!isBrowserSupported && (
                             <div className="text-destructive text-center p-4">
                                Browser ini belum sepenuhnya mendukung fitur cast.
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
            </SheetContent>
        </Sheet>
    )
}
