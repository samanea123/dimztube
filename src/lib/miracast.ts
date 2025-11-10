'use client';
import { createSession, updateSession, addIceCandidate } from './webrtc';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Fungsi universal untuk CAST dan MIRROR di semua device/browser.
 */
export async function startMiracast(mode: 'cast' | 'mirror') {
  try {
    console.log(`🔌 Memulai mode: ${mode}`);

    // Buat sesi WebRTC di Firestore
    const sessionId = await createSession();
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun1.l.google.com:19302'] }],
    });

    let stream: MediaStream | null = null;
    const videoEl = document.querySelector('video');

    // ============= 🎥 CAST MODE =============
    if (mode === 'cast') {
      if (videoEl && 'captureStream' in videoEl) {
        // Jalankan video dulu biar bisa di-stream
        if (videoEl.paused) await videoEl.play().catch(() => {});
        // @ts-ignore
        stream = videoEl.captureStream();
        console.log('✅ Cast pakai captureStream()');

      } else if (navigator.mediaDevices?.getDisplayMedia) {
        // Fallback: capture layar (desktop)
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        console.log('✅ Cast pakai getDisplayMedia()');

      } else {
        // Fallback terakhir (HP)
        console.warn('⚠️ Device tidak support capture stream. Fallback ke upload video.');
        const uploaded = await uploadVideoToFirebase(sessionId);
        if (!uploaded) throw new Error('Upload gagal atau dibatalkan.');

        // Update session agar receiver bisa play video upload
        await updateSession(sessionId, {
          status: 'ready',
          command: { type: 'play', payload: uploaded, ts: Date.now() },
        });

        const receiverUrl = `${window.location.origin}/cast/receiver/${sessionId}`;
        window.open(receiverUrl, '_blank', 'noopener,noreferrer');
        alert('🎬 Video berhasil dikirim ke TV melalui upload.');
        return;
      }
    }

    // ============= 🪞 MIRROR MODE =============
    else if (mode === 'mirror') {
      if (navigator.mediaDevices?.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        console.log('✅ Mirror pakai getDisplayMedia()');
      } else if (navigator.mediaDevices?.getUserMedia) {
        // Mobile fallback — mirror kamera
        alert('⚠️ Browser tidak mendukung screen share penuh. Menggunakan kamera.');
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        alert('❌ Mirror tidak didukung browser ini.');
        return;
      }
    }

    // Tambahkan tracks ke PeerConnection
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream!));
    }

    // Tangani ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addIceCandidate(sessionId, 'sender', event.candidate.toJSON());
      }
    };

    const senderUrl = `${window.location.origin}/cast/sender/${sessionId}`;
    window.open(senderUrl, '_blank', 'noopener,noreferrer');

    alert(`✅ Sesi ${mode === 'cast' ? 'Cast Video' : 'Mirror Layar'} dimulai!`);

  } catch (err: any) {
    console.error(err);
    alert(`❌ Gagal memulai ${mode === 'cast' ? 'Cast Video' : 'Mirror Layar'}: ${err}`);
  }
}

/**
 * Upload video manual ke Firebase (fallback HP)
 */
async function uploadVideoToFirebase(sessionId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.click();

    input.onchange = async () => {
      if (!input.files || !input.files[0]) {
        alert('Tidak ada file dipilih.');
        resolve(null);
        return;
      }
      const file = input.files[0];
      const storage = getStorage();
      const fileRef = ref(storage, `uploads/${sessionId}-${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      console.log('📤 File berhasil diupload:', url);
      resolve(url);
    };
  });
}
