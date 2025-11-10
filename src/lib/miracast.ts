'use client';
import { createSession, updateSession, addIceCandidate } from './webrtc';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Universal Miracast handler (Cast & Mirror) untuk semua device & browser.
 */
export async function startMiracast(mode: 'cast' | 'mirror') {
  try {
    console.log(`🚀 Memulai mode: ${mode}`);

    const sessionId = await createSession();
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun1.l.google.com:19302'] }],
    });

    let stream: MediaStream | null = null;
    const videoEl = document.querySelector('video');

    // ======== CAST MODE (video only) ========
    if (mode === 'cast') {
      if (videoEl && 'captureStream' in videoEl) {
        if (videoEl.paused) await videoEl.play().catch(() => {});
        // @ts-ignore
        stream = videoEl.captureStream();
        console.log('✅ Menggunakan captureStream()');

      } else if (navigator.mediaDevices?.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        console.log('✅ Menggunakan getDisplayMedia()');

      } else {
        console.warn('⚠️ Tidak support capture. Fallback ke upload.');
        const uploaded = await uploadVideoToFirebase(sessionId);
        if (!uploaded) throw new Error('Upload gagal atau dibatalkan.');

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

    // ======== MIRROR MODE (full screen / fallback kamera) ========
    else if (mode === 'mirror') {
      if (navigator.mediaDevices?.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        console.log('✅ Menggunakan getDisplayMedia()');
      } else if (navigator.mediaDevices?.getUserMedia) {
        alert('⚠️ Mirror penuh tidak didukung, menggunakan kamera sebagai fallback.');
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        alert('❌ Browser ini tidak mendukung fitur mirror.');
        return;
      }
    }

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream!));
    }

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
 * Upload video ke Firebase Storage (fallback HP)
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
