'use client';

import { useEffect } from 'react';

export default function CastPage() {
  useEffect(() => {
    // Pastikan Cast SDK sudah dimuat
    if (window.chrome && window.chrome.cast && window.chrome.cast.isAvailable) {
      initializeCastApi();
    } else {
      // Jika SDK belum siap, tambahkan event listener
      window['__onGCastApiAvailable'] = (isAvailable) => {
        if (isAvailable) {
          initializeCastApi();
        }
      };
    }
  }, []);

  const initializeCastApi = () => {
    const sessionRequest = new chrome.cast.SessionRequest(
      chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
    );

    const apiConfig = new chrome.cast.ApiConfig(
      sessionRequest,
      (session) => {
        // Callback saat sesi berhasil dibuat
        console.log('Sesi Cast berhasil dibuat:', session);
      },
      (receiver) => {
        // Callback saat perangkat ditemukan
        if (receiver === chrome.cast.ReceiverAvailability.AVAILABLE) {
          console.log('Perangkat Cast ditemukan.');
        } else {
          console.log('Tidak ada perangkat Cast yang ditemukan.');
        }
      }
    );

    chrome.cast.initialize(apiConfig, onInitSuccess, onError);
  };

  const onInitSuccess = () => {
    console.log('Google Cast API berhasil diinisialisasi.');
  };

  const onError = (error: any) => {
    console.error('Gagal inisialisasi Google Cast API:', error);
  };

  const handleCast = () => {
    chrome.cast.requestSession(onSessionSuccess, onError);
  };

  const onSessionSuccess = (session: chrome.cast.Session) => {
    console.log('Berhasil terhubung ke sesi:', session);
    // Di sini Anda bisa mulai memuat media
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Halaman Tes Google Cast</h1>
      <p className="mb-4">Buka konsol browser (F12) untuk melihat log inisialisasi Cast.</p>
      <button 
        onClick={handleCast}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Mulai Cast
      </button>
    </div>
  );
}
