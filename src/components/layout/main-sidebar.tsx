'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Home, Flame, Users, Library, History, Settings } from 'lucide-react';
import Logo from '@/components/logo';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/shorts', label: 'Shorts', icon: Flame },
  { href: '/subscriptions', label: 'Subscriptions', icon: Users },
];

const libraryItems = [
  { href: '/library', label: 'Library', icon: Library },
  { href: '/history', label: 'History', icon: History },
];

export default function MainSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={(pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/')}
                  tooltip={item.label}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          <SidebarSeparator />
          {libraryItems.map((item) => (
             <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton 
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.label}
                    >
                        <a>
                            <item.icon />
                            <span>{item.label}</span>
                        </a>
                    </SidebarMenuButton>
                </Link>
             </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/settings" legacyBehavior passHref>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')} tooltip="Settings">
                        <a>
                            <Settings />
                            <span>Settings</span>
                        </a>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
