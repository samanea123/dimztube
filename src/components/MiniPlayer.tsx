'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { getQueue, playNext, playPrev, setCurrentIndex, getCurrentIndex, setQueue } from "@/lib/queue";
import type { VideoItem } from "@/lib/youtube";
import { Button } from "./ui/button";
import { Maximize, Play, SkipBack, SkipForward, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MiniPlayer({ onPlay }: { onPlay: (videoId: string) => void }) {
  const [queue, setLocalQueue] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIdx] = useState<number>(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  useEffect(() => {
    const updateState = () => {
      const currentQueue = getQueue();
      const currentIdx = getCurrentIndex();
      setLocalQueue(currentQueue);
      setCurrentIdx(currentIdx);

      // Check if queue sidebar is open by checking for its data attribute
      const queueSidebar = document.querySelector('[data-state="open"]');
      setIsQueueOpen(!!queueSidebar);
    };

    updateState(); // Initial load

    window.addEventListener("queueUpdated", updateState);
    
    // Also listen for changes to localStorage from other tabs
    window.addEventListener("storage", (e) => {
        if (e.key === 'dimztubeQueue' || e.key === 'dimztubeCurrentIndex') {
            updateState();
        }
    });

    const observer = new MutationObserver(updateState);
    const queueNode = document.getElementById('queue-sidebar');
    if (queueNode) {
        observer.observe(queueNode, { attributes: true, attributeFilter: ['data-state'] });
    }
    
    return () => {
      window.removeEventListener("queueUpdated", updateState);
      window.removeEventListener("storage", updateState);
      observer.disconnect();
    };
  }, []);

  const handlePlayNext = () => {
    const nextIndex = playNext();
    if(nextIndex !== -1 && queue[nextIndex]) onPlay(queue[nextIndex].id);
  }

  const handlePlayPrev = () => {
      const prevIndex = playPrev();
      if(prevIndex !== -1 && queue[prevIndex]) onPlay(queue[prevIndex].id);
  }
  
  const handleClose = (e: React.MouseEvent) => {
      e.stopPropagation();
      setQueue([]); // Clear the queue which will hide the player
  }

  const currentVideo = queue[currentIndex];

  if (!currentVideo || isQueueOpen) {
    return null;
  }

  return (
    <div 
        onClick={() => onPlay(currentVideo.id)}
        className={cn(
        "fixed bottom-[70px] sm:bottom-4 right-4 bg-card/95 border border-border rounded-xl shadow-lg p-3 flex gap-3 items-center w-[calc(100%-2rem)] sm:w-[340px] z-40 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-300 cursor-pointer",
        isQueueOpen && "hidden"
    )}>
      {currentVideo.thumbnailUrl && (
         <div className="relative w-16 h-10 sm:w-20 sm:h-12 rounded-md overflow-hidden flex-shrink-0">
            <Image src={currentVideo.thumbnailUrl} alt={currentVideo.title} fill className="object-cover"/>
         </div>
      )}
      <div className="flex-1 overflow-hidden">
        <p className="text-foreground text-sm font-semibold truncate">{currentVideo.title}</p>
        <p className="text-muted-foreground text-xs truncate">{currentVideo.channelTitle}</p>
      </div>
      <div className="flex gap-1 items-center">
          <Button onClick={(e) => { e.stopPropagation(); handlePlayPrev(); }} variant="ghost" size="icon" className="h-8 w-8" disabled={currentIndex === 0}>
            <SkipBack className="w-4 h-4"/>
          </Button>
          <Button onClick={(e) => { e.stopPropagation(); onPlay(currentVideo.id); }} variant="ghost" size="icon" className="h-8 w-8">
            <Play className="w-4 h-4"/>
          </Button>
          <Button onClick={(e) => { e.stopPropagation(); handlePlayNext(); }} variant="ghost" size="icon" className="h-8 w-8" disabled={currentIndex === queue.length - 1}>
            <SkipForward className="w-4 h-4"/>
          </Button>
           <Button onClick={handleClose} variant="ghost" size="icon" className="h-8 w-8">
            <X className="w-4 h-4"/>
          </Button>
      </div>
    </div>
  );
}
