'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { getQueue, playNext, playPrev, getCurrentIndex, setQueue } from "@/lib/queue";
import type { VideoItem } from "@/lib/youtube";
import { Button } from "./ui/button";
import { Play, SkipBack, SkipForward, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom hook for draggable functionality
const useDraggable = (initialPos: { x: number, y: number }) => {
  const [position, setPosition] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  
  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // Prevent main click event
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        dragStartPos.current = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  const onDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    // Prevent default scrolling behavior on touch devices
    if ('touches' in e) {
        e.preventDefault();
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches'in e ? e.touches[0].clientY : e.clientY;
    
    if (elementRef.current) {
        const parent = elementRef.current.parentElement;
        if (!parent) return;

        const parentRect = parent.getBoundingClientRect();
        const elRect = elementRef.current.getBoundingClientRect();

        let newX = clientX - dragStartPos.current.x;
        let newY = clientY - dragStartPos.current.y;

        // Constrain to viewport
        newX = Math.max(0, Math.min(newX, parentRect.width - elRect.width));
        newY = Math.max(0, Math.min(newY, parentRect.height - elRect.height));
        
        setPosition({ x: newX, y: newY });
    }
  }, [isDragging]);

  const onDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';

    // Save position to localStorage
    if (typeof window !== 'undefined') {
        localStorage.setItem('miniPlayerPosition', JSON.stringify(position));
    }
  }, [isDragging, position]);
  
  useEffect(() => {
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);

    return () => {
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('touchend', onDragEnd);
    };
  }, [onDragMove, onDragEnd]);
  
  // Load initial position from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedPos = localStorage.getItem('miniPlayerPosition');
        if (savedPos) {
            try {
                const parsedPos = JSON.parse(savedPos);
                // Basic validation
                if (typeof parsedPos.x === 'number' && typeof parsedPos.y === 'number') {
                    setPosition(parsedPos);
                }
            } catch(e) {
                console.warn("Failed to parse mini player position from storage.");
            }
        }
    }
  }, []);

  return { ref: elementRef, style: { transform: `translate(${position.x}px, ${position.y}px)`, position: 'fixed', top: 0, left: 0 }, onMouseDown: onDragStart, onTouchStart: onDragStart, isDragging };
};

export default function MiniPlayer({ onPlay }: { onPlay: (videoId: string) => void }) {
  const [queue, setLocalQueue] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIdx] = useState<number>(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  const defaultPosition = { x: window.innerWidth - 356 - 16, y: window.innerHeight - 144 - 84 };
  const { ref, style, onMouseDown, onTouchStart, isDragging } = useDraggable(defaultPosition);

  useEffect(() => {
    const updateState = () => {
      const currentQueue = getQueue();
      const currentIdx = getCurrentIndex();
      setLocalQueue(currentQueue);
      setCurrentIdx(currentIdx);

      const queueSidebar = document.querySelector('[data-state="open"]');
      setIsQueueOpen(!!queueSidebar);
    };

    updateState();
    window.addEventListener("queueUpdated", updateState);
    window.addEventListener("storage", (e) => {
      if (e.key === 'dimztubeQueue' || e.key === 'dimztubeCurrentIndex') updateState();
    });

    const observer = new MutationObserver(updateState);
    const queueNode = document.getElementById('queue-sidebar');
    if (queueNode) observer.observe(queueNode, { attributes: true, attributeFilter: ['data-state'] });
    
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
    setQueue([]);
  }
  
  const handleClick = () => {
      if(isDragging) return;
      if (currentVideo) onPlay(currentVideo.id);
  };

  const currentVideo = queue[currentIndex];

  if (!currentVideo || isQueueOpen) {
    return null;
  }

  return (
    <div 
        ref={ref}
        style={style}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={handleClick}
        className={cn(
        "bg-card/95 border rounded-xl shadow-lg p-3 flex gap-3 items-center w-[340px] z-40 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-300",
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        isQueueOpen && "hidden"
    )}>
      {currentVideo.thumbnailUrl && (
         <div className="relative w-16 h-10 sm:w-20 sm:h-12 rounded-md overflow-hidden flex-shrink-0 pointer-events-none">
            <Image src={currentVideo.thumbnailUrl} alt={currentVideo.title} fill className="object-cover"/>
         </div>
      )}
      <div className="flex-1 overflow-hidden pointer-events-none">
        <p className="text-foreground text-sm font-semibold truncate">{currentVideo.title}</p>
        <p className="text-muted-foreground text-xs truncate">{currentVideo.channelTitle}</p>
      </div>
      <div className="flex gap-1 items-center">
          <Button onClick={(e) => { e.stopPropagation(); handlePlayPrev(); }} variant="ghost" size="icon" className="h-8 w-8" disabled={currentIndex === 0}>
            <SkipBack className="w-4 h-4"/>
          </Button>
          <Button onClick={(e) => { e.stopPropagation(); if(currentVideo) onPlay(currentVideo.id); }} variant="ghost" size="icon" className="h-8 w-8">
            <Play className="w-4 h-4"/>
          </Button>
          <Button onClick={(e) => { e.stopPropagation(); handlePlayNext(); }} variant="ghost" size="icon" className="h-8 w-8" disabled={currentIndex >= queue.length - 1}>
            <SkipForward className="w-4 h-4"/>
          </Button>
           <Button onClick={handleClose} variant="ghost" size="icon" className="h-8 w-8">
            <X className="w-4 h-4"/>
          </Button>
      </div>
    </div>
  );
}
