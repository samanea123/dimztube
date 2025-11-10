'use client';

import { Button } from '@/components/ui/button';
import { Cast, MonitorSmartphone } from 'lucide-react';
import { startMiracast } from '@/lib/miracast';

/**
 * Deteksi device environment
 */
function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Deteksi apakah browser mendukung native cast (YouTube / Chrome Desktop)
 */
function isNativeCastSupported() {
  return !!(window.chrome && (window as any).cast && (window as any).cast.framework);
}

/**
 * Trigger cast bawaan Android (panduan manual)
 */
function triggerSystemCast() {
  try {
    alert(
      '📺 Untuk melakukan cast dari HP:\n\n' +
      '1️⃣ Tekan tombol tiga titik (⋮) di kanan atas browser\n' +
      '2️⃣ Pilih "Cast" atau "Bagikan layar"\n' +
      '3️⃣ Pilih perangkat TV Anda\n\n' +
      'Setelah itu, video akan tampil di TV 🔥'
    );
  } catch (e) {
    console.warn('Cast system intent gagal:', e);
    alert('⚠️ Browser ini tidak mendukung fitur cast langsung.');
  }
}

export default function CastAndMirrorButton() {
  const handleCast = async () => {
    if (isNativeCastSupported()) {
      // ✅ Chrome Desktop native cast (YouTube style)
      alert('🎬 Cast native aktif — gunakan ikon Cast di pemutar video YouTube.');
    } else if (isMobile()) {
      // 📱 Mobile fallback
      triggerSystemCast();
    } else {
      // 💻 Default ke Miracast / WebRTC Cast
      await startMiracast('cast');
    }
  };

  const handleMirror = async () => {
    await startMiracast('mirror');
  };

  return (
    <div className="flex items-center gap-1">
      {/* Tombol CAST */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCast}
        title="Cast Video ke TV atau Perangkat"
        className="hover:text-primary"
      >
        <Cast className="h-5 w-5" />
        <span className="sr-only">Cast</span>
      </Button>

      {/* Tombol MIRROR */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMirror}
        title="Mirror Layar ke TV"
        className="hover:text-primary"
      >
        <MonitorSmartphone className="h-5 w-5" />
        <span className="sr-only">Mirror</span>
      </Button>
    </div>
  );
}
