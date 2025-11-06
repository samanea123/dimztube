'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { getQueue, playNext, playPrev, getSettings, setCurrentIndex } from "@/lib/queue";
import type { VideoItem } from "@/lib/youtube";
import { Button } from "./ui/button";
import { Maximize, Play, SkipBack, SkipForward, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MiniPlayer({ onPlay }: { onPlay: (videoId: string) => void }) {
  const [queue, setQueue] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIdx] = useState<number>(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  useEffect(() => {
    const updateState = () => {
      setQueue(getQueue());
      setCurrentIdx(getQueue().findIndex(v => v.id === getQueue()[getCurrentIndex()]?.id) || 0);

      // Check if queue sidebar is open by checking for its data attribute
      const queueSidebar = document.querySelector('[data-state="open"]');
      setIsQueueOpen(!!queueSidebar);
    };

    const getCurrentIndex = () => {
        const storedIndex = localStorage.getItem('dimztubeCurrentIndex');
        return storedIndex ? JSON.parse(storedIndex) : 0;
    }

    updateState(); // Initial load

    window.addEventListener("queueUpdated", updateState);
    const observer = new MutationObserver(updateState);
    const queueNode = document.getElementById('queue-sidebar');
    if (queueNode) {
        observer.observe(queueNode, { attributes: true, attributeFilter: ['data-state'] });
    }
    
    return () => {
      window.removeEventListener("queueUpdated", updateState);
      observer.disconnect();
    };
  }, []);

  const handlePlayNext = () => {
    const nextIndex = playNext();
    if(nextIndex !== -1) onPlay(queue[nextIndex].id);
  }

  const handlePlayPrev = () => {
      const prevIndex = playPrev();
      if(prevIndex !== -1) onPlay(queue[prevIndex].id);
  }

  if (!queue.length || currentIndex === -1 || !queue[currentIndex] || isQueueOpen) {
    return null;
  }

  const video = queue[currentIndex];

  return (
    <div className={cn(
        "fixed bottom-[70px] sm:bottom-4 right-4 bg-card/95 border border-border rounded-xl shadow-lg p-3 flex gap-3 items-center w-[calc(100%-2rem)] sm:w-[340px] z-40 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-300",
        isQueueOpen && "hidden"
    )}>
      {video.thumbnailUrl && (
         <div className="relative w-16 h-10 sm:w-24 sm:h-16 rounded-md overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => onPlay(video.id)}>
            <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover"/>
         </div>
      )}
      <div className="flex-1 overflow-hidden cursor-pointer" onClick={() => onPlay(video.id)}>
        <p className="text-foreground text-sm font-semibold truncate">{video.title}</p>
        <p className="text-muted-foreground text-xs truncate">{video.channelTitle}</p>
      </div>
      <div className="flex gap-1">
          <Button onClick={handlePlayPrev} variant="ghost" size="icon" className="h-8 w-8" disabled={currentIndex === 0}>
            <SkipBack className="w-4 h-4"/>
          </Button>
          <Button onClick={() => onPlay(video.id)} variant="ghost" size="icon" className="h-8 w-8">
            <Play className="w-4 h-4"/>
          </Button>
          <Button onClick={handlePlayNext} variant="ghost" size="icon" className="h-8 w-8" disabled={currentIndex === queue.length - 1}>
            <SkipForward className="w-4 h-4"/>
          </Button>
      </div>
    </div>
  );
}
