'use client';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';

type CategoryBarProps = {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

export default function CategoryBar({ categories, selectedCategory, onSelectCategory }: CategoryBarProps) {
  return (
    <div className="px-4 border-b">
      <div className="flex space-x-2 overflow-x-auto py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {categories.map((category) => (
          <Button
            key={category}
            variant="ghost"
            size="sm"
            onClick={() => onSelectCategory(category)}
            className={cn(
              'rounded-full whitespace-nowrap',
              selectedCategory === category
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
