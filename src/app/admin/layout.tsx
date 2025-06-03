
import { AdminNav } from '@/components/layout/admin-nav';
import { Header } from '@/components/layout/header'; 
import { Footer } from '@/components/layout/footer'; 
import { Card } from '@/components/ui/card';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
