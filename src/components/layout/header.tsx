
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle as RadixSheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollArea
import { Menu, LogIn, UserPlus, ShieldCheck, LayoutDashboard, LogOut, Home, Briefcase, UserCircle, BookCheck, Award, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { DASHBOARD_NAV_LINKS, ADMIN_DASHBOARD_NAV_LINKS } from '@/constants';
import { cn } from '@/lib/utils';

const mainSiteNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Home Base', icon: Home },
  { href: '/services', label: 'Training Ops', icon: Briefcase },
  { href: '/mentor', label: 'Your Mentor', icon: Award },
  { href: '/testimonials', label: 'Success Stories', icon: MessageSquare },
];

export function Header() {
  const { currentUser, logout, isAdmin } = useAuth();
  const isLoggedIn = !!currentUser;
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  React.useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  const isDashboardPath = pathname.startsWith('/dashboard');
  const isAdminPath = pathname.startsWith('/admin');

  let contextualNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [];
  let contextualNavTitle = "";
  let displayMainSiteNavSeparately = false;

  if (isLoggedIn && !isAdmin) {
    if (isDashboardPath) {
      contextualNavTitle = "Officer Candidate HQ Menu";
      contextualNavItems = DASHBOARD_NAV_LINKS.map(link => ({...link, label: link.label.replace("My ", "")}));
      displayMainSiteNavSeparately = true;
    }
  } else if (isAdmin && isAdminPath) {
    contextualNavTitle = "Admin Command Menu";
    contextualNavItems = ADMIN_DASHBOARD_NAV_LINKS;
    displayMainSiteNavSeparately = true;
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
              {currentUser && <span className="text-sm text-muted-foreground hidden sm:inline">Officer Candidate {currentUser.name.split(' ')[0]}</span>}
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
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0"> {/* Removed padding here */}
              <RadixSheetTitle className="sr-only">Mobile Navigation Menu</RadixSheetTitle>
              <ScrollArea className="h-full"> {/* ScrollArea wraps the nav */}
                <nav className="grid gap-2 text-base font-medium p-4"> {/* Added padding here */}
                  <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4" onClick={() => setIsSheetOpen(false)}>
                    <Logo />
                  </Link>

                  {contextualNavTitle && (
                    <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">{contextualNavTitle}</h3>
                  )}
                  {renderNavLinks(contextualNavItems)}

                  {displayMainSiteNavSeparately && contextualNavItems.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">Main Menu</h3>
                    </>
                  )}
                  
                  {(!contextualNavTitle || displayMainSiteNavSeparately) && renderNavLinks(mainSiteNavItems) }
                  
                  {isLoggedIn && !isAdmin && !isDashboardPath && !mainSiteNavItems.find(item => item.href === '/dashboard') && (
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

                  <div className="pt-4 border-t"> {/* Removed mt-auto */}
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
