'use client';
import { createSession, updateSession, addIceCandidate } from './webrtc';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Fungsi utama untuk Cast dan Mirror yang jalan di semua browser/device
 */
export async function startMiracast(mode: 'cast' | 'mirror') {
  try {
    console.log(`🚀 Mulai mode: ${mode}`);

    // Buat sesi Firestore untuk signaling WebRTC
    const sessionId = await createSession();
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun1.l.google.com:19302'] }],
    });

    let stream: MediaStream | null = null;
    const videoEl = document.querySelector('video');

    // ===== CAST MODE =====
    if (mode === 'cast') {
      if (videoEl && typeof (videoEl as any).captureStream === 'function') {
        // Play dulu biar bisa di-capture
        if (videoEl.paused) await videoEl.play().catch(() => {});
        // @ts-ignore
        stream = videoEl.captureStream();
        console.log('🎬 Cast pakai captureStream()');
      } 
      else if (navigator.mediaDevices?.getDisplayMedia) {
        // Desktop browser / Android fallback
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: true,
        });
        console.log('🖥️ Cast pakai getDisplayMedia()');
      }
      else if (navigator.mediaDevices?.getUserMedia) {
        // Mobile fallback: kamera belakang
        console.log('📱 Cast fallback pakai kamera (mobile)');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: true,
        });
      }
      else {
        // Fallback terakhir: upload manual
        console.warn('⚠️ Device tidak support stream capture, fallback ke upload.');
        const uploaded = await uploadVideoToFirebase(sessionId);
        if (!uploaded) throw new Error('Upload dibatalkan.');

        await updateSession(sessionId, {
          status: 'ready',
          command: { type: 'play', payload: uploaded, ts: Date.now() },
        });

        const receiverUrl = `${window.location.origin}/cast/receiver/${sessionId}`;
        window.open(receiverUrl, '_blank', 'noopener,noreferrer');
        alert('✅ Video dikirim ke TV via upload Firebase.');
        return;
      }
    }

    // ===== MIRROR MODE =====
    if (mode === 'mirror') {
      if (navigator.mediaDevices?.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: true,
        });
        console.log('🪞 Mirror pakai getDisplayMedia()');
      } 
      else if (navigator.mediaDevices?.getUserMedia) {
        // HP fallback mirror kamera depan
        alert('⚠️ Mirror pakai kamera depan (browser HP tidak support full screen share).');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true,
        });
      } 
      else {
        alert('❌ Browser tidak mendukung screen mirroring.');
        return;
      }
    }

    if (!stream) {
      alert('❌ Tidak ada stream yang bisa diambil.');
      return;
    }

    // Tambahkan tracks ke peer connection
    stream.getTracks().forEach((track) => pc.addTrack(track, stream!));

    // Simpan ICE Candidate
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addIceCandidate(sessionId, 'sender', event.candidate.toJSON());
      }
    };

    // Buka halaman pengirim (sender)
    const senderUrl = `${window.location.origin}/cast/sender/${sessionId}`;
    window.open(senderUrl, '_blank', 'noopener,noreferrer');

    alert(`✅ Mode ${mode === 'cast' ? 'Cast' : 'Mirror'} dimulai di semua device.`);
  } catch (err: any) {
    console.error('❌ Error Miracast:', err);
    alert(`❌ Gagal memulai ${mode}: ${err.message || err}`);
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
