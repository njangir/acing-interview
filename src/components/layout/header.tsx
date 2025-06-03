
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/icons/logo';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/mentor', label: 'Mentor Profile' },
  { href: '/book', label: 'Book Interview' },
  { href: '/testimonials', label: 'Testimonials' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Header() {
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
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:flex border-primary text-primary hover:bg-primary/10">
            <Link href="/admin">
              <ShieldCheck className="mr-2 h-4 w-4" /> Admin Panel
            </Link>
          </Button>
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
        </div>
        <div className="md:hidden ml-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Logo />
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                 <Link
                    href="/admin"
                    className="text-muted-foreground hover:text-foreground flex items-center"
                  >
                    <ShieldCheck className="mr-2 h-5 w-5" /> Admin Panel
                  </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
