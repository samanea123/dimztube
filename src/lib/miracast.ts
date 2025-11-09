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
    if (!videoEl && mode === 'cast') { // Only require video element for cast mode
      alert("Video belum ditemukan di halaman untuk di-cast.");
      return;
    }

    let stream: MediaStream;
    if (mode === 'cast' && videoEl) {
      // @ts-ignore
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

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await updateSession(sessionId, { offer, status: 'connecting' });

    // Open the sender page in a new tab
    const senderUrl = `${window.location.origin}/cast/sender/${sessionId}`;
    window.open(senderUrl, '_blank');

    alert(`Sesi ${mode === 'cast' ? 'Cast Video' : 'Mirror Layar'} dimulai! Pindai QR code di TV Anda.`);

  } catch (err) {
    console.error(err);
    alert(`❌ Gagal memulai ${mode === 'cast' ? 'Cast Video' : 'Mirror Layar'}.`);
  }
}
