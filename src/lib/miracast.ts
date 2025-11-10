'use client';
import { createSession, updateSession, addIceCandidate } from './webrtc';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Versi universal: otomatis pakai Cast API, Presentation API, atau fallback ke WebRTC.
 */
export async function startMiracast(mode: 'cast' | 'mirror') {
  try {
    console.log(`🚀 Memulai mode: ${mode}`);

    // ==== [1] 🔍 Deteksi dukungan Chrome Cast API ====
    if (window.chrome?.cast?.isAvailable) {
      console.log('✅ Google Cast API tersedia');
      await startNativeCast(mode);
      return;
    }

    // ==== [2] 🔍 Deteksi dukungan Presentation API ====
    if ('presentation' in navigator) {
      console.log('✅ Presentation API tersedia');
      await startPresentationCast(mode);
      return;
    }

    // ==== [3] 🧩 Fallback: WebRTC seperti sebelumnya ====
    console.warn('⚠️ Cast API tidak tersedia. Menggunakan fallback WebRTC.');
    await startWebRTCMirrorCast(mode);
  } catch (err: any) {
    console.error(err);
    alert(`❌ Gagal memulai ${mode === 'cast' ? 'Cast' : 'Mirror'}: ${err.message || err}`);
  }
}

/**
 * [A] Gunakan Google Cast API (native)
 */
async function startNativeCast(mode: 'cast' | 'mirror') {
  return new Promise<void>((resolve, reject) => {
    const context = (window as any).cast.framework.CastContext.getInstance();
    context.setOptions({
      receiverApplicationId: (window as any).chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: (window as any).chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    const session = context.getCurrentSession();
    if (!session) {
      alert('🔹 Pilih perangkat TV dari daftar Cast yang muncul.');
    }

    const mediaUrl = getCurrentMediaUrl(mode);
    if (!mediaUrl) {
      alert('⚠️ Tidak ada video untuk dikirim.');
      reject('No media');
      return;
    }

    const mediaInfo = new (window as any).chrome.cast.media.MediaInfo(mediaUrl, 'video/mp4');
    const request = new (window as any).chrome.cast.media.LoadRequest(mediaInfo);

    session.loadMedia(request).then(() => {
      alert('📺 Video berhasil dikirim ke TV melalui Google Cast!');
      resolve();
    }).catch(reject);
  });
}

/**
 * [B] Gunakan Presentation API
 */
async function startPresentationCast(mode: 'cast' | 'mirror') {
  const url = `${window.location.origin}/cast/receiver/presentation?mode=${mode}`;
  const pres = (navigator as any).presentation.requestSession(url);
  await pres;
  alert('📡 Menghubungkan ke TV menggunakan Presentation API');
}

/**
 * [C] Fallback: WebRTC (mode sekarang)
 */
async function startWebRTCMirrorCast(mode: 'cast' | 'mirror') {
  const sessionId = await createSession();
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: ['stun:stun1.l.google.com:19302'] }],
  });

  let stream: MediaStream | null = null;
  const videoEl = document.querySelector('video');

  if (mode === 'cast') {
    if (videoEl && 'captureStream' in videoEl) {
      // @ts-ignore
      stream = videoEl.captureStream();
      console.log('🎥 Cast pakai captureStream()');
    } else {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    }
  } else {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    console.log('🪞 Mirror pakai getDisplayMedia()');
  }

  stream?.getTracks().forEach((track) => pc.addTrack(track, stream!));
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await addIceCandidate(sessionId, 'sender', event.candidate.toJSON());
    }
  };

  const senderUrl = `${window.location.origin}/cast/sender/${sessionId}`;
  window.open(senderUrl, '_blank', 'noopener,noreferrer');

  alert(`✅ ${mode === 'cast' ? 'Cast Video' : 'Mirror Layar'} dimulai!`);
}

/**
 * Ambil URL media aktif (untuk Cast)
 */
function getCurrentMediaUrl(mode: 'cast' | 'mirror'): string | null {
  const videoEl = document.querySelector('video') as HTMLVideoElement | null;
  if (!videoEl) return null;
  if (videoEl.src.startsWith('blob:')) {
    console.warn('⚠️ Video blob tidak bisa dikirim langsung via Cast.');
    return null;
  }
  return videoEl.currentSrc || videoEl.src;
}
