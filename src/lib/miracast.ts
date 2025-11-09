'use client';
import { createSession, updateSession, addIceCandidate, onIceCandidate } from './webrtc';

export async function startMiracast(mode: 'cast' | 'mirror') {
  try {
    console.log(`🔌 Memulai ${mode}...`);

    const sessionId = await createSession();
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
      ],
    });

    const videoEl = document.querySelector('video');
    // For cast mode, we must have a video element. For mirror, we don't.
    if (mode === 'cast' && !videoEl) { 
      alert("Video belum ditemukan di halaman untuk di-cast.");
      return;
    }

    let stream: MediaStream;
    if (mode === 'cast' && videoEl) {
      // @ts-ignore - captureStream is widely supported but may not be in all TS defs
      stream = videoEl.captureStream();
    } else {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    }

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addIceCandidate(sessionId, 'sender', event.candidate.toJSON());
      }
    };
    
    // When the sender page is opened, it will create an offer and update the session.
    // The receiver page will then respond with an answer.
    const senderUrl = `${window.location.origin}/cast/sender/${sessionId}`;
    window.open(senderUrl, '_blank', 'noopener,noreferrer');

    alert(`Sesi ${mode === 'cast' ? 'Cast Video' : 'Mirror Layar'} dimulai! Buka tab baru dan ikuti instruksi.`);

  } catch (err) {
    console.error(err);
    alert(`❌ Gagal memulai ${mode === 'cast' ? 'Cast Video' : 'Mirror Layar'}. Pastikan Anda memberikan izin berbagi layar.`);
  }
}
