import { DashboardNav } from '@/components/layout/dashboard-nav';
import { Header } from '@/components/layout/header'; // Using main header for now, can be a simplified one
import { Footer } from '@/components/layout/footer'; // Using main footer
import { Card } from '@/components/ui/card';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex-1 items-start py-8 md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
          <Card className="h-full p-4 bg-card shadow-sm">
             <h2 className="mb-4 px-2 text-lg font-semibold tracking-tight font-headline text-primary">
                Dashboard
              </h2>
            <DashboardNav />
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
