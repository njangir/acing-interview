
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Menu, LogIn, UserPlus, ShieldCheck, LayoutDashboard, LogOut, Home, Briefcase, UserCircle, BookCheck, Award, MessageSquare, Bell, X as XIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { DASHBOARD_NAV_LINKS, ADMIN_DASHBOARD_NAV_LINKS } from '@/constants';
import type { UserNotification } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { IndianFlagIcon } from '../icons/indian-flag-icon';


const mainSiteNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/services', label: 'Services', icon: Briefcase },
  { href: '/mentor', label: 'Mentor', icon: Award },
  { href: '/testimonials', label: 'Testimonials', icon: MessageSquare },
];


export function Header() {
  const { currentUser, logout, isAdmin } = useAuth();
  const isLoggedIn = !!currentUser;
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !currentUser?.uid) {
      setNotifications([]);
      return;
    }

    const notifsColRef = collection(db, `userProfiles/${currentUser.uid}/notifications`);
    const q = query(notifsColRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate(),
      } as UserNotification));
      setNotifications(fetchedNotifications);
    });

    return () => unsubscribe();
  }, [isLoggedIn, currentUser]);


  const unreadNotifications = notifications.filter(n => !n.seen);


  const handleNotificationClick = async (notificationId: string) => {
    if (!currentUser) return;
    const notifRef = doc(db, `userProfiles/${currentUser.uid}/notifications/${notificationId}`);
    try {
      await updateDoc(notifRef, { seen: true });
    } catch (e) {
      console.error("Failed to mark notification as seen:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser || unreadNotifications.length === 0) return;
    const batch = writeBatch(db);
    unreadNotifications.forEach(notif => {
      const notifRef = doc(db, `userProfiles/${currentUser.uid}/notifications`, notif.id);
      batch.update(notifRef, { seen: true });
    });
    try {
      await batch.commit();
    } catch(e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  };

  React.useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  const isDashboardPath = pathname.startsWith('/dashboard');
  const isAdminPath = pathname.startsWith('/admin');

  let contextualNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [];
  let contextualNavTitle = "Main Menu";
  
  if (isLoggedIn && !isAdmin) {
    if (isDashboardPath) {
      contextualNavTitle = "Dashboard";
      contextualNavItems = DASHBOARD_NAV_LINKS.map(link => ({...link, label: link.label.replace("My ", "")}));
    } else {
      contextualNavItems = [];
    }
  } else if (isAdmin && isAdminPath) {
    contextualNavTitle = "Admin Panel";
    contextualNavItems = ADMIN_DASHBOARD_NAV_LINKS;
  }

  const renderNavLinks = (items: Array<{ href: string; label: string; icon: LucideIcon }>) => {
    return items.map((link) => {
      const LinkIcon = link.icon;
      const isActive = pathname === link.href ||
                       (link.href === '/dashboard' && isDashboardPath && pathname.startsWith('/dashboard')) ||
                       (link.href === '/admin' && isAdminPath && pathname.startsWith('/admin')) ||
                       (link.href !== '/' && link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href) && link.href.length > 1);
      return (
        <Link
          key={link.href}
          href={link.href}
          className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive && "bg-primary/10 text-primary font-medium"
          )}
          onClick={() => setIsSheetOpen(false)}
        >
          <LinkIcon className="h-5 w-5" />
          {link.label}
        </Link>
      );
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <IndianFlagIcon />
          <Logo />
        </Link>
        <nav className="hidden lg:flex gap-6 items-center">
          {mainSiteNavItems.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium text-foreground/70 transition-colors hover:text-foreground",
                pathname === link.href && "text-primary font-semibold"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn && !isAdmin && (
             <Link
              href="/dashboard"
              className={cn(
                "text-sm font-medium text-foreground/70 transition-colors hover:text-foreground",
                (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) && "text-primary font-semibold"
              )}
            >
              Dashboard
            </Link>
          )}
           {isAdmin && (
             <Link
              href="/admin"
              className={cn(
                "text-sm font-medium text-foreground/70 transition-colors hover:text-foreground",
                (pathname === '/admin' || pathname.startsWith('/admin/')) && "text-primary font-semibold"
              )}
            >
              Admin Panel
            </Link>
           )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isLoggedIn ? (
            <>
              {currentUser && !isAdmin && (
                <Popover open={isNotificationPopoverOpen} onOpenChange={setIsNotificationPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative mr-1">
                      <Bell className="h-5 w-5" />
                      {unreadNotifications.length > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                          {unreadNotifications.length}
                        </span>
                      )}
                      <span className="sr-only">Notifications</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 sm:w-96 p-0" 
                    align="end" 
                    side="bottom"
                    sideOffset={8}
                  >
                    <div className="flex justify-between items-center p-3 border-b">
                        <h3 className="font-medium text-sm">Notifications</h3>
                        {unreadNotifications.length > 0 && (
                          <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllAsRead}>Mark all as read</Button>
                        )}
                    </div>
                    <ScrollArea className="h-auto max-h-80 custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={cn("block p-3 hover:bg-accent/50 text-sm", !item.seen && "bg-blue-50/50 dark:bg-blue-900/20")}
                            onClick={() => {
                              if (!item.seen) handleNotificationClick(item.id);
                              setIsNotificationPopoverOpen(false);
                            }} 
                          >
                            <p className={cn("truncate", !item.seen ? "font-semibold text-foreground" : "font-normal text-muted-foreground")}>{item.message}</p>
                            <p className="text-xs text-muted-foreground/80">
                              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                            </p>
                          </Link>
                        ))
                      ) : (
                        <div className="p-4 text-sm text-center text-muted-foreground">
                          No notifications yet.
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              )}
              {currentUser && <span className="text-sm text-muted-foreground hidden sm:inline">{isAdmin ? 'Admin' : 'OC'} {currentUser.name.split(' ')[0]}</span>}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">
                  <LogIn className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Log In</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/signup">
                  <UserPlus className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </div>
        {isMounted && (
            <div className="lg:hidden ml-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-grow">
                    <nav className="grid gap-2 text-base font-medium p-4">
                    <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4" onClick={() => setIsSheetOpen(false)}>
                        <Logo />
                    </Link>

                    {contextualNavItems.length > 0 && (
                        <>
                            <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">{contextualNavTitle}</h3>
                            {renderNavLinks(contextualNavItems)}
                            <Separator className="my-2" />
                            {(isDashboardPath || isAdminPath) && <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">Main Menu</h3>}
                            {(isDashboardPath || isAdminPath) && renderNavLinks(mainSiteNavItems)}
                        </>
                    )}

                    {contextualNavItems.length === 0 && (
                        <>
                            <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">{contextualNavTitle}</h3>
                            {renderNavLinks(mainSiteNavItems)}
                        </>
                    )}
                    
                    {isLoggedIn && !isAdmin && !isDashboardPath && !contextualNavItems.some(item => item.href.startsWith('/dashboard')) && (
                        <>
                        <Separator className="my-2" />
                        <Link
                            href="/dashboard"
                            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                        (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) && "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={() => setIsSheetOpen(false)}
                        >
                            <LayoutDashboard className="h-5 w-5" />
                            Dashboard
                        </Link>
                        </>
                    )}

                    {isAdmin && !isAdminPath && (
                        <>
                        <Separator className="my-2" />
                        <Link
                            href="/admin"
                            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                            isAdminPath && "bg-primary/10 text-primary font-medium")}
                            onClick={() => setIsSheetOpen(false)}
                            >
                            <ShieldCheck className="h-5 w-5" /> Admin Panel
                        </Link>
                        </>
                    )}

                    <div className="pt-4 mt-2 border-t">
                        {isLoggedIn ? (
                            <Button variant="outline" size="sm" onClick={() => { logout(); setIsSheetOpen(false);}} className="w-full">
                                <LogOut className="mr-2 h-4 w-4" /> Log Out
                            </Button>
                        ) : (
                            <div className="space-y-2">
                                <Button asChild size="sm" className="w-full">
                                    <Link href="/login" onClick={() => setIsSheetOpen(false)}>
                                    <LogIn className="mr-2 h-4 w-4" /> Log In
                                    </Link>
                                </Button>
                                <Button asChild size="sm" variant="outline" className="w-full">
                                    <Link href="/signup" onClick={() => setIsSheetOpen(false)}>
                                    <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                    </nav>
                </ScrollArea>
                </SheetContent>
            </Sheet>
            </div>
        )}
      </div>
    </header>
  );
}
