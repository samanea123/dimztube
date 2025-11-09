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

    // --- Coba ambil stream berdasarkan mode ---
    if (mode === 'cast' && videoEl && 'captureStream' in videoEl) {
      // CAST VIDEO
      // @ts-ignore
      stream = videoEl.captureStream();
      console.log('🎥 Menggunakan video.captureStream()');
    } else if (mode === 'mirror' && navigator.mediaDevices?.getDisplayMedia) {
      // MIRROR SCREEN
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      console.log('🪞 Menggunakan getDisplayMedia()');
    } else {
      // Fallback: gunakan kamera (bisa di HP)
      console.warn('⚠️ Browser tidak mendukung mirroring penuh, fallback ke kamera.');
      if (navigator.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        alert('Browser Anda tidak mendukung fitur casting atau mirroring.');
        return;
      }
    }

    // --- Tambahkan track ke peer connection ---
    stream!.getTracks().forEach((track) => pc.addTrack(track, stream!));

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addIceCandidate(sessionId, 'sender', event.candidate.toJSON());
      }
    };

    // --- Buka halaman penerima (receiver) ---
    const senderUrl = `${window.location.origin}/cast/sender/${sessionId}`;
    window.open(senderUrl, '_blank', 'noopener,noreferrer');

    alert(
      `✅ ${mode === 'cast' ? 'Casting video' : 'Mirroring layar'} dimulai!\n\n` +
      `ID sesi: ${sessionId}\nBuka tab baru (receiver) untuk melanjutkan.`
    );

  } catch (err) {
    console.error('❌ Gagal memulai Miracast:', err);
    alert(
      `❌ Gagal memulai ${mode === 'cast' ? 'Cast Video' : 'Mirror Layar'}.\n\n` +
      'Pastikan browser Anda mendukung fitur ini dan izin berbagi layar telah diberikan.'
    );
  }
}
