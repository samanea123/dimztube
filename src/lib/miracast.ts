'use client';
import { createSession, addIceCandidate } from './webrtc';

export async function startMiracast(mode: 'cast' | 'mirror') {
  try {
    console.log(`🔌 Memulai mode ${mode}...`);
    const sessionId = await createSession();
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
      ],
    });

    let stream: MediaStream | null = null;
    const videoEl = document.querySelector('video');

    if (mode === 'cast' && videoEl && 'captureStream' in videoEl) {
      if (videoEl.paused) {
        await videoEl.play().catch(() => {
          alert("Klik play dulu di video sebelum melakukan cast.");
          throw new Error("Video belum diputar.");
        });
      }
    
      // Tunggu sampai video bisa dicapture
      await new Promise((resolve) => {
        if (videoEl.readyState >= 2) resolve(true);
        else videoEl.addEventListener('canplay', () => resolve(true), { once: true });
      });
    
      // @ts-ignore
      stream = videoEl.captureStream();
      console.log('🎥 Menggunakan video.captureStream() (video aktif)');
    } else if (mode === 'mirror') {
      if (navigator.mediaDevices?.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        console.log('🪞 Menggunakan getDisplayMedia() untuk mirror.');
      } else if (navigator.mediaDevices?.getUserMedia) {
        alert("⚠️ Browser ini tidak mendukung screen mirroring penuh. Menyalakan kamera sebagai fallback.");
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        alert("❌ Browser Anda tidak mendukung fitur ini.");
        return;
      }
    } else {
        alert('Browser tidak mendukung fitur ini atau video tidak ditemukan.');
        return;
    }

    if (!stream) {
        alert(`Gagal mendapatkan stream untuk mode ${mode}.`);
        return;
    }
    
    stream!.getTracks().forEach((track) => pc.addTrack(track, stream!));

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addIceCandidate(sessionId, 'sender', event.candidate.toJSON());
      }
    };

    // Buka halaman penerima (receiver)
    const senderUrl = `${window.location.origin}/cast/sender/${sessionId}`;
    window.open(senderUrl, '_blank', 'noopener,noreferrer');

    alert(
      `✅ ${mode === 'cast' ? 'Casting video' : 'Mirroring'} dimulai!\n\n` +
      `Buka tab baru (receiver) untuk melanjutkan.`
    );

  } catch (err) {
    console.error('❌ Gagal memulai Miracast:', err);
    alert(
      `❌ Gagal memulai ${mode === 'cast' ? 'Cast Video' : 'Mirror Layar'}.\n\n` +
      'Pastikan browser Anda mendukung fitur ini dan izin yang diperlukan telah diberikan.'
    );
  }
}
