'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function CastPage() {
  useEffect(() => {
    // Fungsi ini akan dipanggil oleh Cast SDK setelah dimuat
    window['__onGCastApiAvailable'] = (isAvailable) => {
      if (isAvailable) {
        initializeCastApi();
      }
    };

    // Jika SDK sudah ada saat komponen dimuat, inisialisasi langsung
    if (window.cast && window.cast.framework) {
        initializeCastApi();
    }

  }, []);

  const initializeCastApi = () => {
    try {
        const context = cast.framework.CastContext.getInstance();
        context.setOptions({
            receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        console.log('Google Cast API berhasil diinisialisasi.');
    } catch(error) {
        console.error('Gagal inisialisasi Google Cast API:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Halaman Tes Google Cast</h1>
      <p className="mb-4">Buka konsol browser (F12) untuk melihat log inisialisasi Cast. Tombol cast di bawah ini akan muncul secara otomatis jika ada perangkat yang tersedia.</p>
      <div className="mt-8">
        {/* Tombol ini akan otomatis muncul dan berfungsi jika Cast API berhasil diinisialisasi */}
        <google-cast-launcher class="cast-button"></google-cast-launcher>
      </div>
       <style jsx global>{`
        .cast-button {
          --cast-button-size: 2.5rem;
          --cast-button-color: hsl(var(--foreground));
          --cast-button-hover-color: hsl(var(--primary));
        }
       `}</style>
    </div>
  );
}
