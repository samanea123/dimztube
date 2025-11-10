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
      // 🔍 Cek apakah ada cast framework (YouTube Cast)
      const hasNativeCast = !!(window.chrome && (window as any).cast && (window as any).cast.framework);

      if (hasNativeCast) {
        alert('🎬 YouTube Cast aktif. Gunakan ikon Cast di pemutar video untuk streaming ke TV.');
        return;
      }

      if (isMobile()) {
        alert(
          '📱 Untuk melakukan Cast dari HP:\n\n' +
          '1️⃣ Tekan ikon ⋮ (tiga titik) di browser.\n' +
          '2️⃣ Pilih "Cast" atau "Bagikan layar".\n' +
          '3️⃣ Pilih perangkat TV Anda.\n\n' +
          '💡 Setelah itu, video akan muncul di TV.'
        );
        return;
      }

      // 💻 Fallback: jalankan Miracast manual
      await startMiracast('cast');
    } catch (err) {
      console.error('Gagal memulai Cast:', err);
      alert('❌ Cast gagal dijalankan di perangkat ini.');
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
