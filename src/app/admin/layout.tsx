
'use client';

import { useEffect, useState }
from 'react';
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
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const isAdmin = userProfile?.roles?.includes('admin');

  useEffect(() => {
    if (user === undefined || userProfile === undefined) {
      setIsLoading(true);
      return;
    }
    if (!isAdmin) {
      router.push('/login?redirect=/admin');
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, user, userProfile, router]);

  if (isLoading) { 
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking admin authentication...</p>
      </div>
    );
  }
  if (!isAdmin && !isLoading) { 
     return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }
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
