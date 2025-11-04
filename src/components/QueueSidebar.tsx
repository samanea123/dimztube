'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { getQueue, removeFromQueue, clearQueue, setQueue, getSettings, toggleShuffle, toggleRepeat } from "@/lib/queue";
import type { VideoItem } from "@/lib/youtube";
import { Button } from "./ui/button";
import { ListMusic, Play, Repeat, Shuffle, Trash2, X } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { cn } from "@/lib/utils";

export default function QueueSidebar({ onPlay }: { onPlay: (videoId: string) => void }) {
  const [queue, setLocalQueue] = useState<VideoItem[]>([]);
  const [settings, setSettings] = useState({ shuffle: false, repeat: false });
  const [isOpen, setIsOpen] = useState(true);
  
  // Workaround for hydration error with react-beautiful-dnd in React 18 strict mode
  const [isBrowser, setIsBrowser] = useState(false);
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    const updateQueueAndSettings = () => {
        setLocalQueue(getQueue());
        setSettings(getSettings());
    };
    updateQueueAndSettings(); 

    window.addEventListener("queueUpdated", updateQueueAndSettings);
    return () => window.removeEventListener("queueUpdated", updateQueueAndSettings);
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newQueue = Array.from(queue);
    const [reorderedItem] = newQueue.splice(result.source.index, 1);
    newQueue.splice(result.destination.index, 0, reorderedItem);
    
    setLocalQueue(newQueue); // Optimistically update local state
    setQueue(newQueue); // Persist to localStorage
  };

  if (!queue.length) return null;

  if (!isOpen) {
    return (
        <Button 
            className="fixed bottom-16 sm:bottom-4 right-4 z-50 rounded-full shadow-lg"
            onClick={() => setIsOpen(true)}
            size="lg"
        >
            <ListMusic className="mr-2" />
            Show Queue ({queue.length})
        </Button>
    )
  }

  return (
    <div className="fixed bottom-14 sm:bottom-0 right-0 bg-card/95 w-full sm:w-96 p-4 border-t sm:border-l sm:border-t-0 sm:rounded-tl-xl border-border backdrop-blur-lg max-h-[60vh] sm:max-h-full sm:h-screen z-50 flex flex-col shadow-2xl">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h2 className="text-foreground font-bold text-lg flex items-center gap-2">
            <ListMusic className="w-5 h-5"/>
            Antrian
        </h2>
        <div className="flex items-center">
            <Button onClick={clearQueue} variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                Clear
            </Button>
            <Button onClick={() => setIsOpen(false)} variant="ghost" size="icon" className="h-8 w-8">
                <X className="w-4 h-4" />
            </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
         <Button onClick={toggleShuffle} variant="ghost" size="sm" className={cn(settings.shuffle && "text-primary bg-primary/10")}>
            <Shuffle className="mr-2 w-4 h-4" /> Shuffle
        </Button>
        <Button onClick={toggleRepeat} variant="ghost" size="sm" className={cn(settings.repeat && "text-primary bg-primary/10")}>
            <Repeat className="mr-2 w-4 h-4" /> Repeat
        </Button>
      </div>

      <Separator className="mb-3 flex-shrink-0" />
      
      <ScrollArea className="flex-1">
        {isBrowser && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="queue">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 pr-3">
                  {queue.map((video, index) => (
                    <Draggable key={`${video.id}-${index}`} draggableId={`${video.id}-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "bg-background p-2 rounded-lg flex justify-between items-center hover:bg-secondary/80 transition-colors group",
                            snapshot.isDragging && "shadow-lg scale-105"
                          )}
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
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </ScrollArea>
    </div>
  );
}