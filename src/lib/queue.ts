'use client';

import type { VideoItem } from './youtube';

export function addToQueue(video: VideoItem) {
  if (typeof window === 'undefined') return;
  const currentQueue: VideoItem[] = JSON.parse(localStorage.getItem("dimztubeQueue") || "[]");
  // Hindari duplikat
  if (!currentQueue.find(v => v.id === video.id)) {
    currentQueue.push(video);
    localStorage.setItem("dimztubeQueue", JSON.stringify(currentQueue));
  }
}

export function getQueue(): VideoItem[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem("dimztubeQueue") || "[]");
}

export function clearQueue() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem("dimztubeQueue");
}

export function getNextVideo(currentVideoId: string): VideoItem | null {
    if (typeof window === 'undefined') return null;
    const queue = getQueue();
    const currentIndex = queue.findIndex(v => v.id === currentVideoId);
    if (currentIndex > -1 && currentIndex < queue.length - 1) {
        return queue[currentIndex + 1];
    }
    return null;
}
