
"use client";
import React from "react";
import Link from "next/link";
import { Cast, RotateCw, Search, Mic, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import MirrorButton from "./MirrorButton";
import SearchBar, { type VideoItem } from "./SearchBar";

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

      <div className="flex-1 flex justify-center px-4">
        <div className="w-full max-w-2xl flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <SearchBar category={category} onSelect={onSelectVideo} />
          </div>
          <Button variant="ghost" size="icon" className="ml-2 flex-shrink-0">
            <Mic className="h-5 w-5" />
          </Button>
        </div>
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
            <AvatarImage src={userAvatar?.imageUrl} alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
