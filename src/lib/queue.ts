'use client';

import type { VideoItem } from './youtube';

const QUEUE_KEY = "dimztubeQueue";
const SETTINGS_KEY = "dimztubeSettings";
const CURRENT_INDEX_KEY = "dimztubeCurrentIndex";

function dispatchQueueUpdate() {
  window.dispatchEvent(new Event("queueUpdated"));
}

// Queue Management
export function setQueue(videos: VideoItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(videos));
  if (videos.length === 0) {
      localStorage.removeItem(CURRENT_INDEX_KEY);
  }
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
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
}

export function removeFromQueue(index: number) {
  if (typeof window === 'undefined') return;
  const queue = getQueue();
  queue.splice(index, 1);
  setQueue(queue);
  
  // Adjust current index if necessary
  const currentIndex = getCurrentIndex();
  if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
  } else if (index === currentIndex && index >= queue.length) {
      setCurrentIndex(Math.max(0, queue.length - 1));
  }
}

export function clearQueue() {
  if (typeof window === 'undefined') return;
  setQueue([]);
  setCurrentIndex(0);
}


// Playback State Management
export function setCurrentIndex(index: number) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CURRENT_INDEX_KEY, JSON.stringify(index));
    dispatchQueueUpdate();
}

export function getCurrentIndex(): number {
    if (typeof window === 'undefined') return 0;
    try {
      return JSON.parse(localStorage.getItem(CURRENT_INDEX_KEY) || "0");
    } catch {
      return 0;
    }
}

export function playNext(): number {
    const queue = getQueue();
    if(queue.length === 0) return -1;
    const currentIndex = getCurrentIndex();
    const newIndex = Math.min(queue.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
    return newIndex;
}

export function playPrev(): number {
    if(getQueue().length === 0) return -1;
    const currentIndex = getCurrentIndex();
    const newIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(newIndex);
    return newIndex;
}


// Settings Management
export function toggleShuffle() {
  if (typeof window === 'undefined') return;
  const settings = getSettings();
  settings.shuffle = !settings.shuffle;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  dispatchQueueUpdate();
}

export function toggleRepeat() {
  if (typeof window === 'undefined') return;
  const settings = getSettings();
  settings.repeat = !settings.repeat;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  dispatchQueueUpdate();
}

export function getSettings() {
  if (typeof window === 'undefined') return { shuffle: false, repeat: false };
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"shuffle":false, "repeat":false}');
  } catch {
    return { shuffle: false, repeat: false };
  }
}
