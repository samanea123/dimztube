"use client";

import { useState, useEffect } from "react";
import { Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

// Type definition for WakeLockSentinel for TypeScript
interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: "screen";
  release(): Promise<void>;
  onrelease: ((this: WakeLockSentinel, ev: Event) => any) | null;
}

export default function MirrorButton() {
  const [isMirroring, setIsMirroring] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startMirror = async () => {
    try {
      // Request screen capture permission
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true
      });
      setStream(displayStream);

      // Activate Wake Lock (prevents screen from turning off)
      if ("wakeLock" in navigator) {
        try {
          const lock = await (navigator as any).wakeLock.request("screen");
          setWakeLock(lock);
          console.log("✅ Wake Lock aktif — layar tidak akan mati selama mirror aktif");
          lock.addEventListener("release", () => {
            console.log("⚠️ Wake Lock dilepas");
          });
        } catch (err) {
            console.warn("Wake Lock tidak bisa diaktifkan:", err);
        }
      }

      setIsMirroring(true);
      alert(
        "✅ Mirror Mode aktif!\nBuka menu Cast di Chrome → pilih 'Cast tab ini' untuk tampil di TV.\nLayar HP/Laptop bisa diredupkan, aplikasi tetap jalan."
      );

      // Detect if user stops mirroring from the browser UI
      displayStream.getVideoTracks()[0].addEventListener("ended", () => {
        stopMirror(false); // Stop mirror without showing alert again
      });

    } catch (err) {
      console.error("❌ Gagal mirror:", err);
      alert("Gagal memulai mirror, periksa izin layar dan browser.");
    }
  };

  const stopMirror = (showAlert = true) => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);

    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    }
    
    setIsMirroring(false);
    if(showAlert) {
        alert("🛑 Mirror Mode dimatikan.");
    }
  };

  // Cleanup wake lock when component unmounts
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [wakeLock]);
  
  return (
    <Button
        variant="ghost"
        size="icon"
        onClick={isMirroring ? () => stopMirror() : startMirror}
        className={isMirroring ? 'bg-red-600 text-white hover:bg-red-700 hover:text-white' : 'hover:text-primary'}
        aria-label={isMirroring ? "Stop mirror" : "Mirror to TV"}
        title={isMirroring ? "Hentikan Mirror" : "Mirror ke TV"}
    >
      <Monitor className="h-5 w-5" />
    </Button>
  );
}
