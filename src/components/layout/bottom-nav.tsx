'use client';

import { Home, Flame, PlusCircle, Users, Library, ListMusic } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/queue', label: 'Queue', icon: ListMusic },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center flex-1 text-center">
              <Icon className={cn('h-6 w-6 mb-1', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-xs', isActive ? 'text-foreground font-semibold' : 'text-muted-foreground')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
