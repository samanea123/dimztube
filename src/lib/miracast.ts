'use client';
import { createSession, updateSession, addIceCandidate } from './webrtc';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function startMiracast(mode: 'cast' | 'mirror') {
  try {
    console.log(`🚀 Mulai ${mode.toUpperCase()} ...`);

    const sessionId = await createSession();
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun1.l.google.com:19302'] }],
    });

    let stream: MediaStream | null = null;
    const videoEl = document.querySelector('video');

    // === CAST MODE ===
    if (mode === 'cast') {
      if (videoEl && typeof videoEl.captureStream === 'function') {
        // desktop/laptop
        if (videoEl.paused) await videoEl.play().catch(() => {});
        // @ts-ignore
        stream = videoEl.captureStream();
        console.log('🎬 Cast pakai captureStream()');

      } else if (navigator.mediaDevices?.getDisplayMedia) {
        // mobile fallback or no video found
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: true,
        });
        console.log('📺 Cast pakai getDisplayMedia()');

      } else {
        // fallback terakhir (HP)
        console.warn('⚠️ Tidak support cast langsung, fallback upload.');
        const uploaded = await uploadVideoToFirebase(sessionId);
        if (!uploaded) throw new Error('Upload dibatalkan.');

        await updateSession(sessionId, {
          status: 'ready',
          command: { type: 'play', payload: uploaded },
        });
        window.open(`${window.location.origin}/cast/receiver/${sessionId}`, '_blank');
        alert('✅ Video diunggah ke TV melalui Firebase.');
        return;
      }
    }

    // === MIRROR MODE ===
    if (mode === 'mirror') {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: true,
        });
        console.log('🪞 Mirror pakai getDisplayMedia()');
      } catch {
        console.warn('⚠️ Mirror fallback ke kamera (mobile).');
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }
    }

    if (!stream) throw new Error('Tidak ada stream yang bisa digunakan.');

    stream.getTracks().forEach((track) => pc.addTrack(track, stream!));

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addIceCandidate(sessionId, 'sender', event.candidate.toJSON());
      }
    };

    const senderUrl = `${window.location.origin}/cast/sender/${sessionId}`;
    window.open(senderUrl, '_blank', 'noopener,noreferrer');

    alert(`✅ ${mode === 'cast' ? 'Casting video' : 'Mirroring layar'} dimulai!`);
  } catch (err: any) {
    console.error('❌ Gagal memulai Miracast:', err);
    alert(`❌ ${err.message || err}`);
  }
}

async function uploadVideoToFirebase(sessionId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.click();

    input.onchange = async () => {
      if (!input.files?.[0]) {
        resolve(null);
        return;
      }
      const file = input.files[0];
      const storage = getStorage();
      const fileRef = ref(storage, `uploads/${sessionId}-${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      console.log('📤 File diupload:', url);
      resolve(url);
    };
  });
}
