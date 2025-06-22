
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
import { DASHBOARD_NAV_LINKS, ADMIN_DASHBOARD_NAV_LINKS, MOCK_BOOKINGS, MOCK_USER_MESSAGES } from '@/constants';
import type { Booking, UserMessage } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// PRODUCTION TODO: For a production notification system:
// - Notifications should ideally be fetched from a dedicated Firestore collection (e.g., "userNotifications/{userId}/notifications").
// - These notifications would be created by backend triggers (Cloud Functions) in response to events like new messages, booking status changes, etc.
// - The "seen" status of notifications should also be stored in Firestore for persistence across devices.

const mainSiteNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Home Base', icon: Home },
  { href: '/services', label: 'Training Ops', icon: Briefcase },
  { href: '/mentor', label: 'Your Mentor', icon: Award },
  { href: '/testimonials', label: 'Success Stories', icon: MessageSquare },
];

interface NotificationItem {
  id: string; // Unique ID for the notification event (e.g., "booking-booking1-status-scheduled")
  message: string;
  timestamp: Date;
  href: string;
  type: 'booking' | 'message';
}

// Helper to create consistent notification event IDs
const getNotificationEventId = (itemId: string, type: string, subType?: string): string => {
  return `${type}-${itemId}${subType ? `-${subType}` : ''}`;
};


export function Header() {
  const { currentUser, logout, isAdmin } = useAuth();
  const isLoggedIn = !!currentUser;
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsToShow, setNotificationsToShow] = useState<NotificationItem[]>([]);
  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getSeenNotifications = useCallback((): string[] => {
    if (typeof window === 'undefined' || !currentUser) return [];
    // For mock, using email. In production, use currentUser.uid for localStorage key or fetch from Firestore.
    const seen = localStorage.getItem(`seenNotifications_${currentUser.email}`);
    return seen ? JSON.parse(seen) : [];
  }, [currentUser]);

  const calculateNotifications = useCallback(() => {
    if (typeof window === 'undefined' || !isLoggedIn || isAdmin || !currentUser) {
      setNotificationCount(0);
      setNotificationsToShow([]);
      return;
    }

    const seenNotifications = getSeenNotifications();
    const currentActiveNotifications: NotificationItem[] = [];

    // PRODUCTION TODO: Fetch actual bookings and messages for the current user (currentUser.uid)
    // from Firestore instead of using MOCK_BOOKINGS and MOCK_USER_MESSAGES.
    // This logic would then process these fetched items to generate notifications.

    // Mock processing of MOCK_BOOKINGS
    MOCK_BOOKINGS.forEach(booking => {
      if (booking.userEmail === currentUser.email) { // Filter for current user
        let eventId: string | null = null;
        let message: string | null = null;
        let eventTimestamp = new Date(booking.date);
        const href = '/dashboard/bookings';
        const serviceName = booking.serviceName.length > 20 ? booking.serviceName.substring(0, 17) + '...' : booking.serviceName;

        // Mock check for initial payment status (simplified)
        const bookingWasOriginallyPaid = booking.transactionId !== null && booking.paymentStatus !== 'pay_later_pending' && booking.paymentStatus !== 'pay_later_unpaid';

        if ((booking.status === 'accepted' || booking.status === 'scheduled')) {
          eventId = getNotificationEventId(booking.id, 'booking', booking.status);
          message = `Booking for '${serviceName}' is ${booking.status}.`;
           const linkAddedEventId = getNotificationEventId(booking.id, 'booking', 'link_added');
           if (booking.meetingLink && !seenNotifications.includes(linkAddedEventId) && booking.paymentStatus === 'paid') {
               eventId = linkAddedEventId;
               message = `Meeting link for '${serviceName}' on ${booking.date} is available.`;
               eventTimestamp = new Date();
           }
        } else if (booking.status === 'cancelled') {
          eventId = getNotificationEventId(booking.id, 'booking', 'cancelled');
          message = `Booking for '${serviceName}' on ${booking.date} was cancelled.`;
          eventTimestamp = new Date();
        } else if (booking.status === 'completed' && (booking.reportUrl || (booking.detailedFeedback && booking.detailedFeedback.length > 0))) {
          const feedbackReadyEventId = getNotificationEventId(booking.id, 'booking', 'feedback_ready');
          if (!seenNotifications.includes(feedbackReadyEventId)){
            eventId = feedbackReadyEventId;
            message = `Feedback/Report for '${serviceName}' is ready.`;
            eventTimestamp = new Date();
          }
        }
        
        // Notification for refund processing (mock)
        if (bookingWasOriginallyPaid && booking.requestedRefund === false && booking.status === 'cancelled' && (booking.paymentStatus === 'pay_later_unpaid' /* or a specific 'refunded' status */)) {
            const refundEventId = getNotificationEventId(booking.id, 'booking', 'refund_processed');
            const alreadyNotifiedRefund = currentActiveNotifications.some(n => n.id === refundEventId) || seenNotifications.includes(refundEventId);
            if (!alreadyNotifiedRefund) {
                 currentActiveNotifications.push({
                    id: refundEventId,
                    message: `Your refund for '${serviceName}' has been processed.`,
                    timestamp: new Date(),
                    href,
                    type: 'booking',
                 });
            }
        }

        if (eventId && message && !seenNotifications.includes(eventId) && !currentActiveNotifications.some(n=>n.id === eventId)) {
          currentActiveNotifications.push({ id: eventId, message, timestamp: eventTimestamp, href, type: 'booking' });
        }
      }
    });

    // Mock processing of MOCK_USER_MESSAGES
    const userMessageThreads: { [key: string]: UserMessage[] } = {};
     MOCK_USER_MESSAGES.forEach(msg => {
        if (msg.userEmail === currentUser.email) { // Filter for current user
            const threadKey = msg.userEmail + (msg.subject.startsWith("Re:") ? msg.subject.substring(3).trim() : msg.subject.trim());
            if (!userMessageThreads[threadKey]) {
                 userMessageThreads[threadKey] = [];
            }
            userMessageThreads[threadKey].push(msg);
        }
    });

    Object.values(userMessageThreads).forEach(thread => {
        const lastMessage = thread.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).pop();
        if (lastMessage && lastMessage.senderType === 'admin') { // Admin reply notification
            const eventId = getNotificationEventId(lastMessage.id, 'message', 'admin_reply');
            const subjectSnippet = lastMessage.subject.replace('Re: ','').substring(0,25);
            if (!seenNotifications.includes(eventId)  && !currentActiveNotifications.some(n=>n.id === eventId)) {
                currentActiveNotifications.push({
                    id: eventId,
                    message: `Admin replied in: "${subjectSnippet}${subjectSnippet.length === 25 ? '...' : ''}"`,
                    timestamp: new Date(lastMessage.timestamp),
                    href: '/dashboard/contact',
                    type: 'message',
                });
            }
        }
    });

    currentActiveNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setNotificationsToShow(currentActiveNotifications);
    setNotificationCount(currentActiveNotifications.length);

  }, [isLoggedIn, isAdmin, currentUser, getSeenNotifications]);


  useEffect(() => {
    calculateNotifications();
  }, [calculateNotifications, pathname]); // Recalculate on path change too, e.g. if a notification leads to a page that resolves it

  const handleNotificationClick = (notificationId: string) => {
    if (typeof window === 'undefined' || !currentUser) return;
    
    // For mock, using email. In production, use currentUser.uid.
    const seenNotifications = getSeenNotifications();
    const updatedSeenNotifications = Array.from(new Set([...seenNotifications, notificationId]));
    localStorage.setItem(`seenNotifications_${currentUser.email}`, JSON.stringify(updatedSeenNotifications));
    
    calculateNotifications();
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsNotificationPopoverOpen(open);
    if (open) {
        calculateNotifications();
    }
  };


  React.useEffect(() => {
    // Close mobile sheet on route change
    setIsSheetOpen(false);
  }, [pathname]);

  const isDashboardPath = pathname.startsWith('/dashboard');
  const isAdminPath = pathname.startsWith('/admin');

  let contextualNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [];
  let contextualNavTitle = "Field Menu"; // Default title for main site navigation
  
  if (isLoggedIn && !isAdmin) {
    if (isDashboardPath) {
      contextualNavTitle = "Officer Candidate HQ";
      // Remove "My " prefix for brevity in mobile menu
      contextualNavItems = DASHBOARD_NAV_LINKS.map(link => ({...link, label: link.label.replace("My ", "")}));
    } else {
      // When on main site pages, non-admin logged-in users still see "Field Menu"
      // and main site nav items, plus a prominent link to their dashboard.
      contextualNavItems = []; // Main site nav items will be primary
    }
  } else if (isAdmin && isAdminPath) {
    contextualNavTitle = "Admin Command";
    contextualNavItems = ADMIN_DASHBOARD_NAV_LINKS;
  }


  const renderNavLinks = (items: Array<{ href: string; label: string; icon: LucideIcon }>) => {
    return items.map((link) => {
      const LinkIcon = link.icon;
      // Adjusted isActive logic for more precise highlighting
      const isActive = pathname === link.href ||
                       (link.href === '/dashboard' && isDashboardPath && pathname.startsWith('/dashboard')) || // Highlight "Dashboard" if anywhere in dashboard
                       (link.href === '/admin' && isAdminPath && pathname.startsWith('/admin')) || // Highlight "Admin" if anywhere in admin
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

  const getOverallNotificationsLink = () => {
    if (notificationsToShow.length === 0) return "/dashboard"; // Default if no specific preference
    const bookingNotifs = notificationsToShow.filter(n => n.type === 'booking').length;
    const messageNotifs = notificationsToShow.filter(n => n.type === 'message').length;
    // Prioritize booking notifications if they exist, otherwise message notifications, then default
    if (bookingNotifs > 0) return "/dashboard/bookings";
    if (messageNotifs > 0) return "/dashboard/contact";
    return "/dashboard";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo />
        </Link>
        {/* Desktop Navigation */}
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
          {isLoggedIn && !isAdmin && ( // Link to Dashboard for regular logged-in users
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
              {currentUser && !isAdmin && ( // Notification bell for regular users
                <Popover open={isNotificationPopoverOpen} onOpenChange={handlePopoverOpenChange}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative mr-1">
                      <Bell className="h-5 w-5" />
                      {notificationCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                          {notificationCount}
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
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => setIsNotificationPopoverOpen(false)} // Ensure popover closes
                            aria-label="Close notifications"
                        >
                            <XIcon className="h-4 w-4" />
                        </Button>
                    </div>
                    <ScrollArea className="h-auto max-h-80 custom-scrollbar">
                      {notificationsToShow.length > 0 ? (
                        notificationsToShow.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            className="block p-3 hover:bg-accent/50 text-sm"
                            onClick={() => {
                              handleNotificationClick(item.id);
                              setIsNotificationPopoverOpen(false); // Close popover on click
                            }} 
                          >
                            <p className="truncate font-medium text-foreground">{item.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                            </p>
                          </Link>
                        ))
                      ) : (
                        <div className="p-4 text-sm text-center text-muted-foreground">
                          No new notifications.
                        </div>
                      )}
                    </ScrollArea>
                     {notificationsToShow.length > 0 && (
                         <div className="p-2 border-t text-center">
                            <Button variant="link" size="sm" asChild onClick={() => setIsNotificationPopoverOpen(false)}>
                                <Link href={getOverallNotificationsLink()}>
                                  View All in Dashboard
                                </Link>
                            </Button>
                        </div>
                    )}
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
                  <span className="hidden sm:inline">Enlist</span>
                </Link>
              </Button>
            </>
          )}
           {isAdmin && !isAdminPath && ( // Link to Admin panel for admins if not already in admin section
             <Button asChild variant="outline" size="sm" className="hidden lg:flex border-primary text-primary hover:bg-primary/10 ml-2">
                <Link href="/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Admin Command
                </Link>
              </Button>
           )}
        </div>
        {/* Mobile Menu Trigger - Conditionally rendered after mount */}
        {isMounted && (
            <div className="md:hidden ml-2">
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

                    {/* Contextual Nav Section for Mobile */}
                    {contextualNavItems.length > 0 && (
                        <>
                            <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">{contextualNavTitle}</h3>
                            {renderNavLinks(contextualNavItems)}
                            <Separator className="my-2" />
                            {/* Show main site links only if contextual nav is not the main site nav itself */}
                            {(isDashboardPath || isAdminPath) && <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">Main Menu</h3>}
                            {(isDashboardPath || isAdminPath) && renderNavLinks(mainSiteNavItems)}
                        </>
                    )}

                    {/* If no specific contextual items (e.g., logged out, or logged-in user on main site) */}
                    {contextualNavItems.length === 0 && (
                        <>
                            <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">{contextualNavTitle}</h3>
                            {renderNavLinks(mainSiteNavItems)}
                        </>
                    )}
                    
                    {/* Explicit link to Dashboard if logged in, not admin, and not on a dashboard page */}
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
                            Officer Candidate HQ
                        </Link>
                        </>
                    )}

                    {/* Explicit link to Admin Command if admin and not on an admin page */}
                    {isAdmin && !isAdminPath && (
                        <>
                        <Separator className="my-2" />
                        <Link
                            href="/admin"
                            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                            isAdminPath && "bg-primary/10 text-primary font-medium")}
                            onClick={() => setIsSheetOpen(false)}
                            >
                            <ShieldCheck className="h-5 w-5" /> Admin Command
                        </Link>
                        </>
                    )}

                    {/* Auth actions at the bottom */}
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
        )}
      </div>
    </header>
  );
}
    
    

    
