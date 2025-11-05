"use client";
import React from "react";
import Link from "next/link";
import { Cast, RotateCw, Mic, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import MirrorButton from "./MirrorButton";
import type { VideoItem } from "./SearchBar";
import SearchBar from "./SearchBar";

interface NavbarProps {
  onReload: () => void;
  onCast: () => void;
  category?: string;
  onSelectVideo?: (video: VideoItem) => void;
}

export default function Navbar({ onReload, onCast, category, onSelectVideo }: NavbarProps) {
  const userAvatar = PlaceHolderImages.find(img => img.id === 'avatar1');

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
          <RotateCw className="h-5 w-5" />
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
            {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User" />}
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
