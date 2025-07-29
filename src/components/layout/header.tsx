
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
import type { Booking, UserMessage } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';


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
  const [isMounted, setIsMounted] = useState(false);

  const [notificationsToShow, setNotificationsToShow] = useState<NotificationItem[]>([]);
  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getSeenNotifications = useCallback((): string[] => {
    if (typeof window === 'undefined' || !currentUser) return [];
    const seen = localStorage.getItem(`seenNotifications_${currentUser.uid}`);
    return seen ? JSON.parse(seen) : [];
  }, [currentUser]);

  const calculateAndSetNotifications = useCallback((bookings: Booking[], messages: UserMessage[]) => {
    if (typeof window === 'undefined' || !isLoggedIn || isAdmin || !currentUser) {
      setNotificationsToShow([]);
      return;
    }

    const seenNotifications = getSeenNotifications();
    const currentActiveNotifications: NotificationItem[] = [];

    bookings.forEach(booking => {
      let eventId: string | null = null;
      let message: string | null = null;
      let eventTimestamp = booking.updatedAt instanceof Timestamp ? booking.updatedAt.toDate() : new Date();
      const href = '/dashboard/bookings';
      const serviceName = booking.serviceName.length > 20 ? booking.serviceName.substring(0, 17) + '...' : booking.serviceName;
      const bookingWasOriginallyPaid = booking.transactionId !== null && booking.paymentStatus !== 'pay_later_pending' && booking.paymentStatus !== 'pay_later_unpaid';

      if ((booking.status === 'accepted' || booking.status === 'scheduled')) {
        eventId = getNotificationEventId(booking.id, 'booking', booking.status);
        message = `Booking for '${serviceName}' is ${booking.status}.`;
         const linkAddedEventId = getNotificationEventId(booking.id, 'booking', 'link_added');
         if (booking.meetingLink && !seenNotifications.includes(linkAddedEventId) && booking.paymentStatus === 'paid') {
             eventId = linkAddedEventId;
             message = `Meeting link for '${serviceName}' on ${booking.date} is available.`;
         }
      } else if (booking.status === 'cancelled') {
        eventId = getNotificationEventId(booking.id, 'booking', 'cancelled');
        message = `Booking for '${serviceName}' on ${booking.date} was cancelled.`;
      } else if (booking.status === 'completed' && (booking.reportUrl || (booking.detailedFeedback && booking.detailedFeedback.length > 0))) {
        const feedbackReadyEventId = getNotificationEventId(booking.id, 'booking', 'feedback_ready');
        if (!seenNotifications.includes(feedbackReadyEventId)){
          eventId = feedbackReadyEventId;
          message = `Feedback/Report for '${serviceName}' is ready.`;
        }
      }
      
      if (bookingWasOriginallyPaid && booking.requestedRefund === false && booking.status === 'cancelled' && (booking.paymentStatus === 'pay_later_unpaid')) {
          const refundEventId = getNotificationEventId(booking.id, 'booking', 'refund_processed');
          const alreadyNotifiedRefund = currentActiveNotifications.some(n => n.id === refundEventId) || seenNotifications.includes(refundEventId);
          if (!alreadyNotifiedRefund) {
               currentActiveNotifications.push({
                  id: refundEventId,
                  message: `Your refund for '${serviceName}' has been processed.`,
                  timestamp: eventTimestamp,
                  href,
                  type: 'booking',
               });
          }
      }

      if (eventId && message && !seenNotifications.includes(eventId) && !currentActiveNotifications.some(n=>n.id === eventId)) {
        currentActiveNotifications.push({ id: eventId, message, timestamp: eventTimestamp, href, type: 'booking' });
      }
    });

    const userMessageThreads: { [key: string]: UserMessage[] } = {};
    messages.forEach(msg => {
      const threadKey = msg.subject.startsWith("Re:") ? msg.subject.substring(3).trim() : msg.subject.trim();
      if (!userMessageThreads[threadKey]) {
           userMessageThreads[threadKey] = [];
      }
      userMessageThreads[threadKey].push(msg);
    });

    Object.values(userMessageThreads).forEach(thread => {
        const lastMessage = thread.sort((a,b) => (a.timestamp as Timestamp).toMillis() - (b.timestamp as Timestamp).toMillis()).pop();
        if (lastMessage && lastMessage.senderType === 'admin') {
            const eventId = getNotificationEventId(lastMessage.id, 'message', 'admin_reply');
            const subjectSnippet = lastMessage.subject.replace('Re: ','').substring(0,25);
            if (!seenNotifications.includes(eventId)  && !currentActiveNotifications.some(n=>n.id === eventId)) {
                currentActiveNotifications.push({
                    id: eventId,
                    message: `Admin replied in: "${subjectSnippet}${subjectSnippet.length === 25 ? '...' : ''}"`,
                    timestamp: (lastMessage.timestamp as Timestamp).toDate(),
                    href: '/dashboard/contact',
                    type: 'message',
                });
            }
        }
    });

    currentActiveNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setNotificationsToShow(currentActiveNotifications);

  }, [isLoggedIn, isAdmin, currentUser, getSeenNotifications]);

  useEffect(() => {
    if (!isLoggedIn || isAdmin || !currentUser?.uid) {
      setNotificationsToShow([]);
      return;
    }

    const bookingsQuery = query(collection(db, 'bookings'), where('uid', '==', currentUser.uid));
    const messagesQuery = query(collection(db, 'userMessages'), where('userEmail', '==', currentUser.email));
    
    let bookingsData: Booking[] = [];
    let messagesData: UserMessage[] = [];

    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      calculateAndSetNotifications(bookingsData, messagesData);
    });

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserMessage));
      calculateAndSetNotifications(bookingsData, messagesData);
    });
    
    return () => {
      unsubBookings();
      unsubMessages();
    };
  }, [isLoggedIn, isAdmin, currentUser, calculateAndSetNotifications]);

  const handleNotificationClick = (notificationId: string) => {
    if (typeof window === 'undefined' || !currentUser) return;
    
    const seenNotifications = getSeenNotifications();
    const updatedSeenNotifications = Array.from(new Set([...seenNotifications, notificationId]));
    localStorage.setItem(`seenNotifications_${currentUser.uid}`, JSON.stringify(updatedSeenNotifications));
    
    const updatedNotifications = notificationsToShow.filter(n => n.id !== notificationId);
    setNotificationsToShow(updatedNotifications);
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsNotificationPopoverOpen(open);
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

  const getOverallNotificationsLink = () => {
    if (notificationsToShow.length === 0) return "/dashboard";
    const bookingNotifs = notificationsToShow.filter(n => n.type === 'booking').length;
    const messageNotifs = notificationsToShow.filter(n => n.type === 'message').length;
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
                      {notificationsToShow.length > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                          {notificationsToShow.length}
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
                            onClick={() => setIsNotificationPopoverOpen(false)}
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
                              setIsNotificationPopoverOpen(false);
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
           {isAdmin && !isAdminPath && (
             <Button asChild variant="outline" size="sm" className="hidden lg:flex border-primary text-primary hover:bg-primary/10 ml-2">
                <Link href="/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Admin Command
                </Link>
              </Button>
           )}
        </div>
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
                            Officer Candidate HQ
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
                            <ShieldCheck className="h-5 w-5" /> Admin Command
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
