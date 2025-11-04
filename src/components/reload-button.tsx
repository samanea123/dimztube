'use client';

import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';

export default function ReloadButton() {
  const handleReload = () => {
    // Clear the specific video caches from sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('videos_')) {
        sessionStorage.removeItem(key);
      }
    });
    // Perform a full page reload
    window.location.reload();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleReload}
      className="ml-2 flex-shrink-0"
      aria-label="Reload page"
    >
      <RotateCw className="h-5 w-5" />
    </Button>
  );
}
