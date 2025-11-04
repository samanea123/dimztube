'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocalStorage } from 'react-use';
import { getQueue, playNext, playPrev, setCurrentIndex } from "@/lib/queue";
import type { VideoItem } from "@/lib/youtube";
import { Button } from "./ui/button";
import { Maximize, Play, SkipBack, SkipForward } from "lucide-react";

export default function MiniPlayer({ onPlay }: { onPlay: (videoId: string) => void }) {
  const [queue, setQueue] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIdx] = useLocalStorage<number>('dimztubeCurrentIndex', 0);
  
  // This state listens to the queueUpdated event to re-render
  const [lastUpdate, setLastUpdate] = useState(0);

  useEffect(() => {
    const updateState = () => {
      setQueue(getQueue());
      setLastUpdate(Date.now()); 
    };

    updateState(); // Initial load

    window.addEventListener("queueUpdated", updateState);
    return () => {
      window.removeEventListener("queueUpdated", updateState);
    };
  }, []);

  const handlePlayNext = () => {
    playNext();
    const nextIndex = Math.min(queue.length - 1, (currentIndex || 0) + 1);
    onPlay(queue[nextIndex].id);
  }

  const handlePlayPrev = () => {
      playPrev();
      const prevIndex = Math.max(0, (currentIndex || 0) - 1);
      onPlay(queue[prevIndex].id);
  }

  if (!queue.length || currentIndex === undefined || !queue[currentIndex]) {
    return null;
  }

  const video = queue[currentIndex];

  return (
    <div className="fixed bottom-16 sm:bottom-4 right-4 bg-card/95 border border-border rounded-xl shadow-lg p-3 flex gap-3 items-center w-[340px] z-40 backdrop-blur-sm">
      {video.thumbnailUrl && (
         <div className="relative w-24 h-16 rounded-md overflow-hidden flex-shrink-0">
            <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover"/>
         </div>
      )}
      <div className="flex-1 overflow-hidden">
        <p className="text-foreground text-sm font-semibold truncate">{video.title}</p>
        <p className="text-muted-foreground text-xs truncate">{video.channelTitle}</p>
      </div>
      <div className="flex gap-1">
          <Button onClick={handlePlayPrev} variant="ghost" size="icon" className="h-8 w-8" disabled={(currentIndex || 0) === 0}>
            <SkipBack className="w-4 h-4"/>
          </Button>
          <Button onClick={() => onPlay(video.id)} variant="ghost" size="icon" className="h-8 w-8">
            <Maximize className="w-4 h-4"/>
          </Button>
          <Button onClick={handlePlayNext} variant="ghost" size="icon" className="h-8 w-8" disabled={(currentIndex || 0) === queue.length - 1}>
            <SkipForward className="w-4 h-4"/>
          </Button>
      </div>
    </div>
  );
}