
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; // Added SheetHeader, SheetTitle
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Menu, LogIn, UserPlus, ShieldCheck, LayoutDashboard, LogOut, Home, Briefcase, UserCircle, BookCheck, Award, MessageSquare, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { DASHBOARD_NAV_LINKS, ADMIN_DASHBOARD_NAV_LINKS, MOCK_BOOKINGS, MOCK_USER_MESSAGES, MOCK_SERVICES } from '@/constants';
import type { Booking, UserMessage } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const mainSiteNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Home Base', icon: Home },
  { href: '/services', label: 'Training Ops', icon: Briefcase },
  { href: '/mentor', label: 'Your Mentor', icon: Award },
  { href: '/testimonials', label: 'Success Stories', icon: MessageSquare },
];

interface NotificationItem {
  id: string;
  message: string;
  timestamp: Date;
  href: string;
  type: 'booking' | 'message';
}

const getNotificationEventId = (itemId: string, type: string, subType?: string): string => {
  return `${type}-${itemId}${subType ? `-${subType}` : ''}`;
};


export function Header() {
  const { currentUser, logout, isAdmin } = useAuth();
  const isLoggedIn = !!currentUser;
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsToShow, setNotificationsToShow] = useState<NotificationItem[]>([]);
  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);

  const getSeenNotifications = useCallback((): string[] => {
    if (!currentUser) return [];
    const seen = localStorage.getItem(`seenNotifications_${currentUser.email}`);
    return seen ? JSON.parse(seen) : [];
  }, [currentUser]);

  const calculateNotifications = useCallback(() => {
    if (!isLoggedIn || isAdmin || !currentUser) {
      setNotificationCount(0);
      setNotificationsToShow([]);
      return;
    }

    const seenNotifications = getSeenNotifications();
    const currentActiveNotifications: NotificationItem[] = [];

    MOCK_BOOKINGS.forEach(booking => {
      if (booking.userEmail === currentUser.email) {
        let eventId: string | null = null;
        let message: string | null = null;
        let eventTimestamp = new Date(booking.date); // Default to booking date
        const href = '/dashboard/bookings';
        const serviceName = booking.serviceName.length > 20 ? booking.serviceName.substring(0, 17) + '...' : booking.serviceName;

        if ((booking.status === 'accepted' || booking.status === 'scheduled')) {
          eventId = getNotificationEventId(booking.id, 'booking', booking.status);
          message = `Booking for '${serviceName}' is ${booking.status}.`;
           // Check if the link was *just* added or status *just* changed to scheduled with link
           const linkAddedEventId = getNotificationEventId(booking.id, 'booking', 'link_added');
           if (booking.meetingLink && !seenNotifications.includes(linkAddedEventId) && booking.paymentStatus === 'paid') {
               eventId = linkAddedEventId; // Prioritize link added notification
               message = `Meeting link for '${serviceName}' on ${booking.date} is available.`;
               eventTimestamp = new Date(); // Use current time for "just now" feel
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
        
        // Refund processed notification
        if (booking.requestedRefund === false && booking.status === 'cancelled' && booking.paymentStatus === 'pay_later_unpaid') {
            const refundEventId = getNotificationEventId(booking.id, 'booking', 'refund_processed');
            if (!seenNotifications.includes(refundEventId)) {
                 currentActiveNotifications.push({
                    id: refundEventId,
                    message: `Your refund for '${serviceName}' has been processed.`,
                    timestamp: new Date(), 
                    href,
                    type: 'booking',
                 });
            }
        }


        if (eventId && message && !seenNotifications.includes(eventId)) {
          currentActiveNotifications.push({ id: eventId, message, timestamp: eventTimestamp, href, type: 'booking' });
        }
      }
    });

    // Message notifications
    const userMessageThreads: { [key: string]: UserMessage[] } = {};
     MOCK_USER_MESSAGES.forEach(msg => {
        if (msg.userEmail === currentUser.email) {
            // Group by original subject to form a thread
            const threadKey = msg.userEmail + (msg.subject.startsWith("Re:") ? msg.subject.substring(3).trim() : msg.subject.trim());
            if (!userMessageThreads[threadKey]) {
                 userMessageThreads[threadKey] = [];
            }
            userMessageThreads[threadKey].push(msg);
        }
    });

    Object.values(userMessageThreads).forEach(thread => {
        const lastMessage = thread.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()).pop();
        if (lastMessage && lastMessage.senderType === 'admin') {
            const eventId = getNotificationEventId(lastMessage.id, 'message', 'admin_reply');
            const subjectSnippet = lastMessage.subject.replace('Re: ','').substring(0,25);
            if (!seenNotifications.includes(eventId)) {
                currentActiveNotifications.push({
                    id: eventId,
                    message: `Admin replied in: "${subjectSnippet}${subjectSnippet.length === 25 ? '...' : ''}"`,
                    timestamp: lastMessage.timestamp,
                    href: '/dashboard/contact', // Or a specific message thread page if implemented
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
  }, [calculateNotifications, pathname]); 

 const handlePopoverOpenChange = (open: boolean) => {
    setIsNotificationPopoverOpen(open);
    if (!open) { // When popover closes
        calculateNotifications(); // Recalculate to ensure badge is up-to-date
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    if (!currentUser) return;

    const seenNotifications = getSeenNotifications();
    const updatedSeenNotifications = Array.from(new Set([...seenNotifications, notificationId]));
    localStorage.setItem(`seenNotifications_${currentUser.email}`, JSON.stringify(updatedSeenNotifications));
    
    // Instead of closing popover, just re-calculate to update list and count
    calculateNotifications(); 
  };


  React.useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  const isDashboardPath = pathname.startsWith('/dashboard');
  const isAdminPath = pathname.startsWith('/admin');

  let contextualNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [];
  let contextualNavTitle = "Field Menu";
  
  if (isLoggedIn && !isAdmin) {
    if (isDashboardPath) {
      contextualNavTitle = "Officer Candidate HQ";
      contextualNavItems = DASHBOARD_NAV_LINKS.map(link => ({...link, label: link.label.replace("My ", "")}));
    } else {
      contextualNavItems = []; 
    }
  } else if (isAdmin && isAdminPath) {
    contextualNavTitle = "Admin Command";
    contextualNavItems = ADMIN_DASHBOARD_NAV_LINKS;
  }


  const renderNavLinks = (items: Array<{ href: string; label: string; icon: LucideIcon }>) => {
    return items.map((link) => {
      const LinkIcon = link.icon;
      const isActive = pathname === link.href ||
                       (link.href === '/dashboard' && isDashboardPath) ||
                       (link.href === '/admin' && isAdminPath) ||
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

  const getOverallNotificationsLink = () => {
    if (notificationsToShow.length === 0) return "/dashboard"; // Fallback if no active notifs shown
    const bookingNotifs = notificationsToShow.filter(n => n.type === 'booking').length;
    const messageNotifs = notificationsToShow.filter(n => n.type === 'message').length;
    if (bookingNotifs >= messageNotifs) return "/dashboard/bookings";
    return "/dashboard/contact";
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
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-3 font-medium border-b">Notifications</div>
                    <ScrollArea className="h-auto max-h-80 custom-scrollbar">
                      {notificationsToShow.length > 0 ? (
                        notificationsToShow.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            className="block p-3 hover:bg-accent/50 text-sm"
                            onClick={() => {
                              handleNotificationClick(item.id);
                              // Navigation is handled by Link, popover can stay open or close
                              // If you want to close it on click:
                              // setIsNotificationPopoverOpen(false);
                            }} 
                          >
                            <p className="truncate font-medium text-foreground">{item.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
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
                                  View All
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
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 flex flex-col"> {/* Added flex flex-col */}
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-grow"> {/* Added flex-grow */}
                <nav className="grid gap-2 text-base font-medium p-4">
                  <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4" onClick={() => setIsSheetOpen(false)}>
                    <Logo />
                  </Link>

                  {contextualNavItems.length > 0 && (
                    <>
                        <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">{contextualNavTitle}</h3>
                        {renderNavLinks(contextualNavItems)}
                        <Separator className="my-2" />
                        <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">Main Menu</h3>
                        {renderNavLinks(mainSiteNavItems)}
                    </>
                  )}

                  {contextualNavItems.length === 0 && (
                     <>
                        <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">{contextualNavTitle}</h3>
                        {renderNavLinks(mainSiteNavItems)}
                     </>
                  )}
                  
                  {isLoggedIn && !isAdmin && !isDashboardPath && !contextualNavItems.some(item => item.href.startsWith('/dashboard')) && (
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

                  <div className="pt-4 mt-2 border-t"> {/* Adjusted mt-auto */}
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
    

    
