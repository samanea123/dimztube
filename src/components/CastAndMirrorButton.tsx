'use client';

import { Button } from '@/components/ui/button';
import { Cast, MonitorSmartphone } from 'lucide-react';
import { startMiracast } from '@/lib/miracast';

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function CastAndMirrorButton() {
  const handleCast = async () => {
    try {
      // Cek apakah ada native Google Cast (YouTube / Chromecast SDK)
      const hasNativeCast = !!(window.chrome && (window as any).cast && (window as any).cast.framework);

      if (hasNativeCast) {
        alert('🎬 Cast bawaan YouTube aktif. Gunakan ikon Cast di player.');
        return;
      }

      // 🌐 1️⃣ Fallback pertama — Presentation API (native Android cast)
      if ('PresentationRequest' in window) {
        console.log('📺 Menjalankan Cast via PresentationRequest...');
        const presentationUrl = `${window.location.origin}/cast/receiver`;
        const request = new (window as any).PresentationRequest(presentationUrl);

        const connection = await request.start();
        console.log('✅ Presentation connection', connection);
        return;
      }

      // 📱 2️⃣ Fallback kedua — Android share screen
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        console.log('📲 Jalankan getDisplayMedia() fallback...');
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const videoEl = document.createElement('video');
        videoEl.srcObject = stream;
        videoEl.play();
        alert('✅ Cast layar aktif.');
        return;
      }

      // 💻 3️⃣ Fallback terakhir — WebRTC cast custom
      await startMiracast('cast');
    } catch (err) {
      console.error('❌ Gagal memulai Cast:', err);
      alert('Cast gagal dijalankan. Browser ini mungkin tidak mendukung.');
    }
  };

  const handleMirror = async () => {
    await startMiracast('mirror');
  };

  return (
    <div className="flex items-center gap-1">
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
