
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AdminNav } from '@/components/layout/admin-nav';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We need to wait for the initial isLoggedIn state to be determined from localStorage
    // which happens in useAuth's own useEffect.
    // A simple check here might run before useAuth has updated isLoggedIn.
    // For a more robust check, you might need a loading state in useAuth itself.
    // For this prototype, a slight delay or trusting the initial false then update is okay.
    
    // Let's give a brief moment for useAuth to initialize
    const timer = setTimeout(() => {
      if (!isLoggedIn) {
        router.push('/login?redirect=/admin'); // Optional: redirect back after login
      } else {
        setIsLoading(false);
      }
    }, 100); // Small delay to allow auth state to settle

    return () => clearTimeout(timer);

  }, [isLoggedIn, router]);

  if (isLoading && !isLoggedIn) { // Show loading only if we are about to redirect or not yet sure
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }
  
  if (!isLoggedIn && !isLoading) { // Should have been redirected, but as a fallback
     return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  // If loading is done and user is logged in, show admin content
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex-1 items-start py-8 md:grid md:grid-cols-[260px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
          <Card className="h-full p-4 bg-card shadow-sm">
             <h2 className="mb-4 px-2 text-lg font-semibold tracking-tight font-headline text-primary">
                Admin Panel
              </h2>
            <AdminNav />
          </Card>
        </aside>
        <main className="w-full overflow-hidden">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
