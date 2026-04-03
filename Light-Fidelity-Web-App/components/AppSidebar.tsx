'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Radio, Wifi, Settings,
  BarChart3, HelpCircle, Zap, Home,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Home',             url: '/',            icon: Home },
  { title: 'Dashboard',        url: '/dashboard',   icon: LayoutDashboard },
  { title: 'Transmitter',      url: '/transmitter', icon: Radio },
  { title: 'Receiver',         url: '/receiver',    icon: Wifi },
  { title: 'Network Settings', url: '/settings',    icon: Settings },
  { title: 'Analytics',        url: '/analytics',   icon: BarChart3 },
  { title: 'About',            url: '/about',       icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const isCollapsed = state === 'collapsed';

  const isActive = (url: string) => {

    if (url === '/') return pathname === '/';
    return pathname === url || pathname.startsWith(url + '/');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {!isCollapsed && <span>Li-Fi Control</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
