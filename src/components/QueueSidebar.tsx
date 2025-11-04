'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { getQueue, removeFromQueue, clearQueue } from "@/lib/queue";
import type { VideoItem } from "@/lib/youtube";
import { Button } from "./ui/button";
import { ListMusic, Play, Trash2, X } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

export default function QueueSidebar({ onPlay }: { onPlay: (videoId: string) => void }) {
  const [queue, setQueue] = useState<VideoItem[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const updateQueue = () => setQueue(getQueue());
    updateQueue(); // Initial load

    window.addEventListener("queueUpdated", updateQueue);
    return () => window.removeEventListener("queueUpdated", updateQueue);
  }, []);

  if (!queue.length) return null;

  if (!isOpen) {
    return (
        <Button 
            className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
            onClick={() => setIsOpen(true)}
            size="lg"
        >
            <ListMusic className="mr-2" />
            Show Queue ({queue.length})
        </Button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 bg-card/95 w-full sm:w-96 p-4 border-t sm:border-l sm:border-t-0 sm:rounded-tl-xl border-border backdrop-blur-lg max-h-[60vh] sm:max-h-[calc(100vh_-_8rem)] sm:bottom-4 sm:right-4 z-50 flex flex-col shadow-2xl">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h2 className="text-foreground font-bold text-lg flex items-center gap-2">
            <ListMusic className="w-5 h-5"/>
            Antrian
        </h2>
        <div className="flex items-center gap-2">
            <Button onClick={clearQueue} variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                Clear
            </Button>
            <Button onClick={() => setIsOpen(false)} variant="ghost" size="icon" className="h-8 w-8">
                <X className="w-4 h-4" />
            </Button>
        </div>
      </div>
      <Separator className="mb-3" />
      <ScrollArea className="flex-1">
        <ul className="space-y-2 pr-3">
          {queue.map((video, index) => (
            <li
              key={`${video.id}-${index}`}
              className="bg-background p-2 rounded-lg flex justify-between items-center hover:bg-secondary/80 transition-colors group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative w-16 h-9 rounded flex-shrink-0">
                    <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover rounded-md" />
                </div>
                <div className="overflow-hidden">
                    <p className="text-foreground text-sm font-medium truncate">{video.title}</p>
                    <p className="text-muted-foreground text-xs truncate">{video.channelTitle}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button onClick={() => onPlay(video.id)} variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary">
                  <Play className="w-4 h-4" />
                </Button>
                <Button onClick={() => removeFromQueue(index)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
