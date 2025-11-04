"use client";
import React from "react";
import Link from "next/link";
import { Cast, RotateCw, Search, Mic, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import MirrorButton from "./MirrorButton";

interface NavbarProps {
  onReload: () => void;
  onCast: () => void;
}

export default function Navbar({ onReload, onCast }: NavbarProps) {
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search"
              className="w-full h-10 pl-10 pr-4 rounded-full border bg-background focus:bg-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
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

        <Avatar className="h-8 w-8">
          <AvatarImage src={userAvatar?.imageUrl} alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
