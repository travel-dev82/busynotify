// =====================================================
// APP SHELL - Main Layout with Sidebar and Header
// =====================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Menu,
  Package,
} from 'lucide-react';
import { useAuthStore, useCartStore } from '../lib/stores';
import { useTranslation } from '../lib/language-context';
import { getNavigationForRole } from '../config/navigation.config';
import { UserMenu } from './user-menu';
import { CompanySelector } from './company-selector';
import type { Role, NavigationItem } from '../types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
};

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();
  const t = useTranslation();
  
  const role = user?.role as Role;
  const navigation = getNavigationForRole(role);
  
  const renderNavItems = (items: NavigationItem[], mobile = false) => {
    return items.map((item) => {
      const Icon = iconMap[item.icon || 'LayoutDashboard'];
      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
      const label = item.labelKey.split('.').reduce((obj: unknown, key: string) => {
        if (obj && typeof obj === 'object') {
          return (obj as Record<string, unknown>)[key];
        }
        return item.labelKey;
      }, t) as string;
      
      return (
        <Link
          key={item.id}
          href={item.href}
          onClick={() => mobile && setOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
            isActive
              ? 'bg-primary text-primary-foreground hover:bg-primary'
              : 'text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      );
    });
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex h-14 items-center border-b px-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Package className="h-6 w-6 text-primary" />
                <span>{t.common.appName}</span>
              </Link>
            </div>
            <ScrollArea className="h-[calc(100vh-3.5rem)]">
              <nav className="flex flex-col gap-1 p-4">
                {renderNavItems(navigation, true)}
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6 text-primary" />
          <span>{t.common.appName}</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <CompanySelector />
          <CartBadge />
          <UserMenu />
        </div>
      </header>
      
      {/* Desktop Layout */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-muted/40 lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Package className="h-6 w-6 text-primary" />
                <span>{t.common.appName}</span>
              </Link>
            </div>
            <ScrollArea className="flex-1">
              <nav className="flex flex-col gap-1 p-4">
                {renderNavItems(navigation)}
              </nav>
            </ScrollArea>
            <div className="border-t p-4">
              <div className="flex items-center justify-between">
                <CartBadge />
                <UserMenu />
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main Content Area with Header */}
        <div className="flex flex-1 flex-col">
          {/* Desktop Header Bar */}
          <header className="sticky top-0 z-40 hidden h-14 items-center justify-between border-b bg-background px-6 lg:flex">
            <CompanySelector />
            <div className="flex items-center gap-2">
              <CartBadge />
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto max-w-7xl p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Cart Badge Component
function CartBadge() {
  const { user } = useAuthStore();
  const { items } = useCartStore();
  
  const showCart = user?.role === 'customer' || user?.role === 'salesman';
  const itemCount = showCart ? items.length : 0;
  
  return (
    <Link href="/order?cart=true">
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {itemCount}
          </span>
        )}
      </Button>
    </Link>
  );
}
