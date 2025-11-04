'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Cast, Tv, MonitorSmartphone } from 'lucide-react';

export default function CastButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-primary"
          aria-label="Cast to device"
        >
          <Cast className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Sambungkan ke perangkat</h4>
            <p className="text-sm text-muted-foreground">
              Pilih perangkat untuk melakukan cast.
            </p>
          </div>
          <div className="grid gap-2">
            <Button variant="ghost" className="justify-start">
              <Tv className="mr-2 h-4 w-4" />
              TV Ruang Tamu
            </Button>
            <Button variant="ghost" className="justify-start">
              <MonitorSmartphone className="mr-2 h-4 w-4" />
              Chromecast Dapur
            </Button>
             <PopoverTrigger asChild>
                <Button variant="outline">Batal</Button>
             </PopoverTrigger>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
