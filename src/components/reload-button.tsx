'use client';

import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReloadButton() {
  const router = useRouter();

  const handleReload = () => {
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleReload}
      className="ml-2 flex-shrink-0"
    >
      <RotateCw className="h-5 w-5" />
    </Button>
  );
}
