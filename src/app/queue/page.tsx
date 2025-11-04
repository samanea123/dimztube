'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getQueue, removeFromQueue, clearQueue, setQueue } from '@/lib/queue';
import type { VideoItem } from '@/lib/youtube';
import { Button } from '@/components/ui/button';
import { Play, Trash2, GripVertical, ListMusic } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { cn } from '@/lib/utils';

export default function QueuePage() {
  const [queue, setLocalQueue] = useState<VideoItem[]>([]);
  
  // Workaround untuk error hidrasi dengan react-beautiful-dnd di React 18
  const [isBrowser, setIsBrowser] = useState(false);
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    const updateQueue = () => {
      setLocalQueue(getQueue());
    };
    updateQueue();

    window.addEventListener('queueUpdated', updateQueue);
    return () => window.removeEventListener('queueUpdated', updateQueue);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(queue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setLocalQueue(items); // Update UI secara optimis
    setQueue(items); // Simpan ke localStorage
  };

  const openVideoInNewTab = (startVideoId: string) => {
    const url = `/player/${startVideoId}?autoplay=1`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <ListMusic className="w-8 h-8 text-primary" />
          Daftar Antrian
        </h1>
        {queue.length > 0 && (
          <Button onClick={clearQueue} variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Semua
          </Button>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-16 bg-muted rounded-xl">
            <p className="text-muted-foreground">Belum ada video dalam antrian.</p>
            <Button variant="link" asChild className="mt-2">
                <a href="/">Jelajahi video</a>
            </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {isBrowser && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="droppable-queue">
                {(provided) => (
                  <ul {...provided.droppableProps} ref={provided.innerRef}>
                    {queue.map((video, index) => (
                      <Draggable key={`${video.id}-${index}`} draggableId={`${video.id}-${index}`} index={index}>
                        {(provided, snapshot) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "flex items-center gap-4 bg-card p-3 rounded-lg border transition-shadow",
                              snapshot.isDragging ? "shadow-2xl scale-105" : "shadow-sm"
                            )}
                          >
                            <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="relative w-24 h-14 rounded-md overflow-hidden flex-shrink-0">
                              <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-semibold truncate">{video.title}</p>
                              <p className="text-sm text-muted-foreground truncate">{video.channelTitle}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => openVideoInNewTab(video.id)} variant="ghost" size="icon" title="Putar">
                                <Play className="h-5 w-5 text-primary" />
                              </Button>
                              <Button onClick={() => removeFromQueue(index)} variant="ghost" size="icon" title="Hapus">
                                <Trash2 className="h-5 w-5 text-destructive" />
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
        </div>
      )}
    </div>
  );
}
