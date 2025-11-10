'use client';
import { createSession, updateSession, addIceCandidate } from './webrtc';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Fungsi universal untuk CAST dan MIRROR di semua device/browser.
 * - CAST: kirim video ke TV / receiver
 * - MIRROR: cerminkan layar atau kamera
 */
export async function startMiracast(mode: 'cast' | 'mirror') {
  try {
    console.log(`🎬 Memulai mode: ${mode}`);
    const sessionId = await createSession();
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun1.l.google.com:19302'] }],
    });

    let stream: MediaStream | null = null;
    const videoEl = document.querySelector('video');

    // ============= 🎥 CAST MODE =============
    if (mode === 'cast') {
      if (videoEl && typeof videoEl.captureStream === 'function') {
        // Pastikan video aktif
        if (videoEl.paused) {
          await videoEl.play().catch(() => {
            throw new Error('Video harus di-play dulu sebelum cast.');
          });
        }

        // Tunggu sampai bisa di-capture
        await new Promise((resolve) => {
          if (videoEl.readyState >= 2) resolve(true);
          else videoEl.addEventListener('canplay', () => resolve(true), { once: true });
        });

        // @ts-ignore
        stream = videoEl.captureStream();
        console.log('✅ Cast via captureStream()');

      } else if (navigator.mediaDevices?.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        console.log('✅ Cast via getDisplayMedia()');

      } else {
        // Fallback ke upload video (mobile / no WebRTC support)
        console.warn('⚠️ captureStream/getDisplayMedia tidak didukung. Gunakan upload fallback.');
        const uploadedUrl = await uploadVideoToFirebase(sessionId);
        if (!uploadedUrl) throw new Error('Upload dibatalkan.');

        await updateSession(sessionId, {
          status: 'ready',
          command: { type: 'play', payload: uploadedUrl, ts: Date.now() },
        });

        const receiverUrl = `${window.location.origin}/cast/receiver/${sessionId}`;
        // Gunakan setTimeout agar popup tidak diblokir
        setTimeout(() => window.open(receiverUrl, '_blank', 'noopener,noreferrer'), 200);
        alert('📡 Video diunggah dan siap diputar di perangkat tujuan.');
        return;
      }
    }

    // ============= 🪞 MIRROR MODE =============
    else if (mode === 'mirror') {
      if (navigator.mediaDevices?.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        console.log('✅ Mirror via getDisplayMedia()');
      } else if (navigator.mediaDevices?.getUserMedia) {
        alert('⚠️ Screen share tidak didukung. Menggunakan kamera sebagai mirror.');
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        alert('❌ Mirror tidak didukung pada browser ini.');
        return;
      }
    }

    // Tambahkan track stream ke peer connection
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream!));
    }

    // ICE candidates untuk signaling via Firestore
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addIceCandidate(sessionId, 'sender', event.candidate.toJSON());
      }
    };

    // Buka halaman sender (sumber)
    const senderUrl = `${window.location.origin}/cast/sender/${sessionId}`;
    setTimeout(() => window.open(senderUrl, '_blank', 'noopener,noreferrer'), 200);

    alert(`✅ Mode ${mode === 'cast' ? 'Cast ke perangkat' : 'Mirror layar'} dimulai.`);

  } catch (err: any) {
    console.error('❌ Error Miracast:', err);
    alert(`❌ Gagal memulai ${mode === 'cast' ? 'Cast Video' : 'Mirror Layar'}.\n${err.message || err}`);
  }
}

/**
 * Upload video manual ke Firebase (fallback untuk HP)
 */
async function uploadVideoToFirebase(sessionId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.click();

    input.onchange = async () => {
      if (!input.files?.[0]) {
        alert('Tidak ada file yang dipilih.');
        resolve(null);
        return;
      }
      const file = input.files[0];
      const storage = getStorage();
      const fileRef = ref(storage, `uploads/${sessionId}-${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      console.log('📤 Upload selesai:', url);
      resolve(url);
    };
  });
}
