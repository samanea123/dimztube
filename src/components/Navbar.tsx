"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, RefreshCcw, Cast, Bell } from "lucide-react";
import Link from "next/link";
import Logo from "./logo";
import MirrorButton from "./MirrorButton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { VideoItem as SearchVideoItem } from "./SearchBar";
import SearchBar from "./SearchBar";
import { Button } from "./ui/button";

const CUSTOM_AVATAR_KEY = 'dimztubeCustomAvatar';

interface NavbarProps {
  onReload: () => void;
  onCast: () => void;
  category?: string;
  onSelectVideo?: (video: SearchVideoItem) => void;
}

export default function Navbar({ onReload, onCast, category, onSelectVideo }: NavbarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const defaultAvatar = PlaceHolderImages.find(img => img.id === 'avatar1')?.imageUrl;

  useEffect(() => {
    // Function to update avatar from localStorage
    const updateAvatar = () => {
      const customAvatar = localStorage.getItem(CUSTOM_AVATAR_KEY);
      setAvatarUrl(customAvatar || defaultAvatar);
    };

    updateAvatar(); // Initial load

    // Listen for changes from other tabs (e.g., from the admin page)
    window.addEventListener('storage', updateAvatar);

    return () => {
      window.removeEventListener('storage', updateAvatar);
    };
  }, [defaultAvatar]);


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-bold text-lg hidden sm:inline-block">DimzTube</span>
        </Link>
      </div>

      <div className="flex-1 flex justify-center px-0 sm:px-4">
        <SearchBar category={category} onSelect={onSelectVideo} />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onReload}
          className="flex-shrink-0 hover:text-primary"
          aria-label="Reload page"
          title="Perbarui Video"
        >
          <RefreshCcw className="h-5 w-5" />
        </Button>

        <Button
            variant="ghost"
            size="icon"
            onClick={onCast}
            className="hover:text-primary"
            aria-label="Cast to device"
            title="Cast ke perangkat"
        >
            <Cast className="h-5 w-5" />
        </Button>
        
        <MirrorButton />
        
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Bell className="h-5 w-5" />
        </Button>

        <Link href="/admin/monitor" title="Halaman Admin">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
