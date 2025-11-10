'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cast, MonitorSmartphone, UploadCloud } from 'lucide-react';
import { startMiracast } from '@/lib/miracast';

/**
 * Tombol adaptif untuk Cast dan Mirror
 * - Laptop/Desktop: Cast langsung & Mirror layar
 * - Mobile/Tablet: Upload Cast & Mirror kamera
 */
export default function CastAndMirrorButton() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Deteksi device via User-Agent
    const ua = navigator.userAgent.toLowerCase();
    const mobileCheck =
      /android|iphone|ipad|ipod|mobile|tablet|opera mini|iemobile/.test(ua);
    setIsMobile(mobileCheck);
  }, []);

  const handleCast = async () => {
    if (isMobile) {
      alert('📤 Mode Upload Cast aktif untuk perangkat mobile.');
    }
    await startMiracast('cast');
  };

  const handleMirror = async () => {
    if (isMobile) {
      alert('📷 Mirror akan menggunakan kamera jika screen share tidak tersedia.');
    }
    await startMiracast('mirror');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Tombol Cast */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCast}
        title={isMobile ? 'Upload Video ke Perangkat' : 'Cast ke Perangkat'}
        className="hover:text-primary"
      >
        {isMobile ? (
          <UploadCloud className="h-5 w-5" />
        ) : (
          <Cast className="h-5 w-5" />
        )}
        <span className="sr-only">
          {isMobile ? 'Upload Cast' : 'Cast ke Perangkat'}
        </span>
      </Button>

      {/* Tombol Mirror */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMirror}
        title={isMobile ? 'Mirror Kamera' : 'Mirror Layar'}
        className="hover:text-primary"
      >
        <MonitorSmartphone className="h-5 w-5" />
        <span className="sr-only">
          {isMobile ? 'Mirror Kamera' : 'Mirror Layar'}
        </span>
      </Button>
    </div>
  );
}
