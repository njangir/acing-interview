
'use client';

import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { useAuth } from '@/hooks/use-auth';

export function Footer() {
  const { isLoggedIn } = useAuth(); // isLoggedIn derived from currentUser

  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground">
              Your partner in acing the SSB interview.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 font-headline">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/services" className="text-sm text-muted-foreground hover:text-foreground">Services</Link></li>
              <li><Link href="/mentor" className="text-sm text-muted-foreground hover:text-foreground">Mentor Profile</Link></li>
              <li><Link href="/book" className="text-sm text-muted-foreground hover:text-foreground">Book Interview</Link></li>
              <li><Link href="/testimonials" className="text-sm text-muted-foreground hover:text-foreground">Testimonials</Link></li>
              <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</Link></li>
              <li><Link href="/terms-and-conditions" className="text-sm text-muted-foreground hover:text-foreground">Terms & Conditions</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 font-headline">Contact Us</h3>
            <p className="text-sm text-muted-foreground">Email: info@afinterviewace.com</p>
            <p className="text-sm text-muted-foreground">Phone: +91 12345 67890</p>
            {isLoggedIn && (
              <p className="text-sm text-muted-foreground mt-2">
                <Link href="/dashboard/contact" className="hover:text-foreground">Send us a message</Link>
              </p>
            )}
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Armed Forces Interview Ace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
