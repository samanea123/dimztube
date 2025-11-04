'use client';

import type { VideoItem } from './youtube';

function dispatchQueueUpdate() {
  window.dispatchEvent(new Event("queueUpdated"));
}

export function setQueue(videos: VideoItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem("dimztubeQueue", JSON.stringify(videos));
  dispatchQueueUpdate();
}

export function addToQueue(video: VideoItem) {
  if (typeof window === 'undefined') return;
  const currentQueue: VideoItem[] = getQueue();
  if (!currentQueue.find(v => v.id === video.id)) {
    currentQueue.push(video);
    setQueue(currentQueue);
  }
}

export function getQueue(): VideoItem[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem("dimztubeQueue") || "[]");
}

export function removeFromQueue(index: number) {
  if (typeof window === 'undefined') return;
  const queue = getQueue();
  queue.splice(index, 1);
  setQueue(queue);
}

export function clearQueue() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem("dimztubeQueue");
  dispatchQueueUpdate();
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
