"use client";

import { useState } from "react";
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
        video: true,
        audio: true
      });
      setStream(displayStream);

      // Activate Wake Lock (prevents screen from turning off)
      if ("wakeLock" in navigator) {
        const lock = await (navigator as any).wakeLock.request("screen");
        setWakeLock(lock);
        lock.addEventListener("release", () => {
          console.log("Wake lock was released");
        });
      }

      setIsMirroring(true);

      // Detect if user stops mirroring from the browser UI
      displayStream.getVideoTracks()[0].addEventListener("ended", () => {
        stopMirror(false); // Stop mirror without showing alert again
      });

    } catch (err) {
      console.error("Failed to start mirror:", err);
      // User likely cancelled the request
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
        // You might want to use a more integrated notification system here
    }
  };
  
  return (
    <Button
        variant="ghost"
        size="icon"
        onClick={isMirroring ? () => stopMirror() : startMirror}
        className="hover:text-primary"
        aria-label={isMirroring ? "Stop mirror" : "Mirror to TV"}
        title={isMirroring ? "Hentikan Mirror" : "Mirror ke TV"}
    >
      <Monitor className="h-5 w-5" />
    </Button>
  );
}
