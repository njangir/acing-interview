
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle as RadixSheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, LogIn, UserPlus, ShieldCheck, LayoutDashboard, LogOut, Home, Briefcase, UserCircle, BookCheck, Award, MessageSquare, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { DASHBOARD_NAV_LINKS, ADMIN_DASHBOARD_NAV_LINKS, MOCK_BOOKINGS, MOCK_USER_MESSAGES } from '@/constants';
import type { Booking, UserMessage } from '@/types';
import { cn } from '@/lib/utils';

const mainSiteNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Home Base', icon: Home },
  { href: '/services', label: 'Training Ops', icon: Briefcase },
  { href: '/mentor', label: 'Your Mentor', icon: Award },
  { href: '/testimonials', label: 'Success Stories', icon: MessageSquare },
];

const getNotificationEventId = (item: Booking | UserMessage, type: string): string => {
  if ('serviceId' in item) { // It's a Booking
    return `booking-${item.id}-${type}`;
  }
  // It's a UserMessage
  return `message-${item.id}-${type}`;
};


export function Header() {
  const { currentUser, logout, isAdmin } = useAuth();
  const isLoggedIn = !!currentUser;
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeNotificationEventIds, setActiveNotificationEventIds] = useState<string[]>([]);

  const getSeenNotifications = useCallback((): string[] => {
    if (!currentUser) return [];
    const seen = localStorage.getItem(`seenNotifications_${currentUser.email}`);
    return seen ? JSON.parse(seen) : [];
  }, [currentUser]);

  const calculateNotifications = useCallback(() => {
    if (!isLoggedIn || isAdmin) {
      setNotificationCount(0);
      setActiveNotificationEventIds([]);
      return;
    }

    const seenNotifications = getSeenNotifications();
    let count = 0;
    const currentActiveIds: string[] = [];

    // Check booking notifications
    MOCK_BOOKINGS.forEach(booking => {
      if (booking.userEmail === currentUser?.email) {
        // New schedule/acceptance
        if ((booking.status === 'accepted' || booking.status === 'scheduled')) {
          const eventId = getNotificationEventId(booking, booking.status);
          if (!seenNotifications.includes(eventId)) {
            count++;
            currentActiveIds.push(eventId);
          }
        }
        // Cancellation
        if (booking.status === 'cancelled') {
          const eventId = getNotificationEventId(booking, 'cancelled');
          if (!seenNotifications.includes(eventId)) {
            count++;
            currentActiveIds.push(eventId);
          }
        }
        // Feedback/Report added
        if (booking.status === 'completed' && (booking.reportUrl || (booking.detailedFeedback && booking.detailedFeedback.length > 0))) {
          const eventId = getNotificationEventId(booking, 'feedback');
           if (!seenNotifications.includes(eventId)) {
            count++;
            currentActiveIds.push(eventId);
          }
        }
        // Refund approved (simplified: check if status is cancelled and was paid - more complex logic might be needed)
        if (booking.requestedRefund === false && booking.status === 'cancelled' && initialBookingWasPaid(booking.id)) {
             const eventId = getNotificationEventId(booking, 'refund_approved');
             if (!seenNotifications.includes(eventId)) {
                count++;
                currentActiveIds.push(eventId);
            }
        }
      }
    });

    // Check message notifications
    const userMessageThreads: { [key: string]: UserMessage[] } = {};
    MOCK_USER_MESSAGES.forEach(msg => {
        if (msg.userEmail === currentUser?.email) {
            if (!userMessageThreads[msg.userEmail + (msg.subject.startsWith("Re:") ? msg.subject.substring(3) : msg.subject)]) { // Basic grouping by subject
                 userMessageThreads[msg.userEmail + (msg.subject.startsWith("Re:") ? msg.subject.substring(3) : msg.subject)] = [];
            }
            userMessageThreads[msg.userEmail + (msg.subject.startsWith("Re:") ? msg.subject.substring(3) : msg.subject)].push(msg);
        }
    });

    Object.values(userMessageThreads).forEach(thread => {
        const lastMessage = thread.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()).pop();
        if (lastMessage && lastMessage.senderType === 'admin') {
            const eventId = getNotificationEventId(lastMessage, 'admin_reply');
            if (!seenNotifications.includes(eventId)) {
                count++;
                currentActiveIds.push(eventId);
            }
        }
    });

    setNotificationCount(count);
    setActiveNotificationEventIds(currentActiveIds);
  }, [isLoggedIn, isAdmin, currentUser, getSeenNotifications]);

  // Helper to check if a booking was initially paid (very simplified for mock)
  const initialBookingWasPaid = (bookingId: string): boolean => {
    // In a real app, you'd check payment history.
    // For mock, let's assume if it's not 'pay_later_pending' or 'pay_later_unpaid' and it was requested for refund, it was paid.
    const booking = MOCK_BOOKINGS.find(b => b.id === bookingId);
    return booking?.paymentStatus === 'paid' && booking.requestedRefund === true; // Check if refund was true *before* it was processed
  };

  useEffect(() => {
    calculateNotifications();
  }, [calculateNotifications, pathname]); // Recalculate on navigation

  const handleNotificationClick = () => {
    if (!currentUser) return;
    const seenNotifications = getSeenNotifications();
    const updatedSeenNotifications = Array.from(new Set([...seenNotifications, ...activeNotificationEventIds]));
    localStorage.setItem(`seenNotifications_${currentUser.email}`, JSON.stringify(updatedSeenNotifications));
    setNotificationCount(0);
    setActiveNotificationEventIds([]);
    // Potentially navigate to a notifications page or open a dropdown
    // For now, just clears them.
    // router.push('/dashboard/notifications'); // Example navigation
  };


  React.useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  const isDashboardPath = pathname.startsWith('/dashboard');
  const isAdminPath = pathname.startsWith('/admin');

  let contextualNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [];
  let contextualNavTitle = "Field Menu"; // Default title
  let displayMainSiteNavSeparately = false;

  if (isLoggedIn && !isAdmin) {
    if (isDashboardPath) {
      contextualNavTitle = "Officer Candidate HQ";
      contextualNavItems = DASHBOARD_NAV_LINKS.map(link => ({...link, label: link.label.replace("My ", "")}));
      displayMainSiteNavSeparately = true;
    } else {
      // Logged in, not admin, not on dashboard path - main nav is primary
      contextualNavItems = mainSiteNavItems;
    }
  } else if (isAdmin && isAdminPath) {
    contextualNavTitle = "Admin Command";
    contextualNavItems = ADMIN_DASHBOARD_NAV_LINKS;
    displayMainSiteNavSeparately = true;
  } else {
    // Not logged in, or admin on non-admin page
     contextualNavItems = mainSiteNavItems;
  }


  const renderNavLinks = (items: Array<{ href: string; label: string; icon: LucideIcon }>) => {
    return items.map((link) => {
      const LinkIcon = link.icon;
      const isActive = pathname === link.href ||
                       (link.href === '/dashboard' && isDashboardPath) || // Ensures "Overview" is active for /dashboard/*
                       (link.href === '/admin' && isAdminPath) || // Ensures "Admin Overview" is active for /admin/*
                       (link.href !== '/' && link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href) && link.href.length > 1);
      return (
        <Link
          key={link.href}
          href={link.href}
          className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive && "bg-primary/10 text-primary"
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
          <Logo />
        </Link>
        <nav className="hidden md:flex gap-6 items-center">
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
              Officer Candidate HQ
            </Link>
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isLoggedIn ? (
            <>
              {currentUser && !isAdmin && (
                <Button variant="ghost" size="icon" onClick={handleNotificationClick} className="relative mr-1">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                      {notificationCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
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
                  <span className="hidden sm:inline">Enlist</span>
                </Link>
              </Button>
            </>
          )}
           {isAdmin && !isAdminPath && (
             <Button asChild variant="outline" size="sm" className="hidden lg:flex border-primary text-primary hover:bg-primary/10 ml-2">
                <Link href="/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Admin Command
                </Link>
              </Button>
           )}
        </div>
        <div className="md:hidden ml-2">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
              <RadixSheetTitle className="sr-only">Mobile Navigation Menu</RadixSheetTitle>
              <ScrollArea className="h-full">
                <nav className="grid gap-2 text-base font-medium p-4">
                  <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4" onClick={() => setIsSheetOpen(false)}>
                    <Logo />
                  </Link>

                  <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">{contextualNavTitle}</h3>
                  {renderNavLinks(contextualNavItems)}

                  {displayMainSiteNavSeparately && contextualNavItems.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">Main Menu</h3>
                      {renderNavLinks(mainSiteNavItems)}
                    </>
                  )}
                  
                  {isLoggedIn && !isAdmin && !isDashboardPath && !mainSiteNavItems.find(item => item.href === '/dashboard') && !contextualNavItems.find(item => item.href === '/dashboard') && (
                    <Link
                        href="/dashboard"
                        className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                      (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) && "bg-primary/10 text-primary"
                        )}
                        onClick={() => setIsSheetOpen(false)}
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Officer Candidate HQ
                      </Link>
                  )}

                  {isAdmin && !isAdminPath && (
                      <Link
                          href="/admin"
                          className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary mt-2 border-t pt-3",
                                        isAdminPath && "bg-primary/10 text-primary")}
                          onClick={() => setIsSheetOpen(false)}
                          >
                          <ShieldCheck className="h-5 w-5" /> Admin Command
                      </Link>
                  )}

                  <div className="pt-4 border-t">
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
                                  <UserPlus className="mr-2 h-4 w-4" /> Enlist
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
      </div>
    </header>
  );
}

    