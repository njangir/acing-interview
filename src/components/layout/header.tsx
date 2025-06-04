
'use client';

import React from 'react'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, LogIn, UserPlus, ShieldCheck, LayoutDashboard, LogOut, Home, Briefcase, UserCircle, BookCheck, Award, MessageSquare } from 'lucide-react'; 
import { Logo } from '@/components/icons/logo';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation'; 

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/services', label: 'Services', icon: Briefcase },
  { href: '/mentor', label: 'Mentor', icon: Award },
  { href: '/book', label: 'Book Now', icon: BookCheck },
  { href: '/testimonials', label: 'Testimonials', icon: MessageSquare },
];

export function Header() {
  const { currentUser, logout, isAdmin } = useAuth(); // Use currentUser and isAdmin
  const isLoggedIn = !!currentUser; // Determine isLoggedIn based on currentUser
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  React.useEffect(() => {
    setIsSheetOpen(false); 
  }, [pathname]);

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
          {isLoggedIn && (
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
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
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
           {isAdmin && ( // Show Admin button only if user is admin
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
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <nav className="grid gap-2 text-base font-medium mt-8">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4" onClick={() => setIsSheetOpen(false)}>
                  <Logo />
                </Link>
                {navLinks.map((link) => {
                  const LinkIcon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <LinkIcon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}
                {isLoggedIn && (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </Link>
                )}
                 {isAdmin && ( // Show Admin link in sheet only if user is admin
                   <Link
                      href="/admin"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary mt-4 border-t pt-4"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <ShieldCheck className="h-5 w-5" /> Admin Panel
                    </Link>
                 )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
