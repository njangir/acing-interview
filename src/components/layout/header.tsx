
      
'use client';

import React from 'react'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, LogIn, UserPlus, ShieldCheck, LayoutDashboard, LogOut, Home, Briefcase, UserCircle, BookCheck, Award, MessageSquare } from 'lucide-react'; 
import { Logo } from '@/components/icons/logo';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation'; 
import { DASHBOARD_NAV_LINKS, ADMIN_DASHBOARD_NAV_LINKS } from '@/constants'; // Import dashboard and admin nav links
import { cn } from '@/lib/utils'; // Import the cn utility

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/services', label: 'Services', icon: Briefcase }, // This is the main entry for booking now
  { href: '/mentor', label: 'Mentor', icon: Award },
  { href: '/testimonials', label: 'Testimonials', icon: MessageSquare },
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

  let mobileNavLinks = navLinks;
  let mobileNavTitle = "Menu";

  if (isDashboardPath && isLoggedIn) {
    mobileNavLinks = DASHBOARD_NAV_LINKS;
    mobileNavTitle = "Dashboard Menu";
  } else if (isAdminPath && isAdmin) {
    mobileNavLinks = ADMIN_DASHBOARD_NAV_LINKS;
    mobileNavTitle = "Admin Menu";
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo />
        </Link>
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn && !isDashboardPath && !isAdminPath && ( // Show dashboard link only if not already in dashboard/admin section for desktop
             <Link
              href="/dashboard"
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isLoggedIn ? (
            <>
              {currentUser && <span className="text-sm text-muted-foreground hidden sm:inline">Hi, {currentUser.name.split(' ')[0]}!</span>}
               {/* Show dashboard button on desktop only if not already on a dashboard page */}
              {!isDashboardPath && (
                <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                    <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                    </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">
                  <LogIn className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
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
           {isAdmin && !isAdminPath && ( // Show Admin button only if user is admin and not on an admin page
             <Button asChild variant="outline" size="sm" className="hidden lg:flex border-primary text-primary hover:bg-primary/10 ml-2">
                <Link href="/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Admin
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
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetTitle className="sr-only">{mobileNavTitle}</SheetTitle>
              <nav className="grid gap-2 text-base font-medium mt-8">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4" onClick={() => setIsSheetOpen(false)}>
                  <Logo />
                </Link>
                
                {mobileNavTitle !== "Menu" && (
                    <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">{mobileNavTitle}</h3>
                )}

                {mobileNavLinks.map((link) => {
                  const LinkIcon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                    pathname === link.href && "bg-primary/10 text-primary"
                      )}
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <LinkIcon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}

                {/* Separator and Auth links if not in Dashboard/Admin specific views */}
                {(!isDashboardPath && !isAdminPath) && isLoggedIn && (
                  <>
                    <hr className="my-2"/>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                  </>
                )}
                 {isAdmin && (
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary mt-2 border-t pt-3"
                        onClick={() => setIsSheetOpen(false)}
                        >
                        <ShieldCheck className="h-5 w-5" /> Admin Panel
                    </Link>
                 )}

                 {/* Login/Logout buttons for mobile sheet */}
                 <div className="mt-auto pt-4 border-t">
                    {isLoggedIn ? (
                         <Button variant="outline" size="sm" onClick={() => { logout(); setIsSheetOpen(false);}} className="w-full">
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <Button asChild size="sm" className="w-full">
                                <Link href="/login" onClick={() => setIsSheetOpen(false)}>
                                <LogIn className="mr-2 h-4 w-4" /> Login
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
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}


    

