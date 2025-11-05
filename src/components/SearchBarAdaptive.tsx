"use client";

import SearchBar from "./SearchBar";
import SearchBarMobile from "./SearchBarMobile";
import type { VideoItem } from "./SearchBar";

interface SearchBarAdaptiveProps {
  category?: string;
  onSelectVideo?: (video: VideoItem) => void;
}

export default function SearchBarAdaptive({ category, onSelectVideo }: SearchBarAdaptiveProps) {
  return (
    <>
      <div className="hidden sm:flex flex-1 justify-center">
        <SearchBar category={category} onSelect={onSelectVideo} />
      </div>
      <div className="sm:hidden">
        <SearchBarMobile category={category} onSelect={onSelectVideo} />
      </div>
    </>
  );
}
