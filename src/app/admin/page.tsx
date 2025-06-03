
import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ADMIN_DASHBOARD_NAV_LINKS, MOCK_BOOKINGS, MOCK_USER_MESSAGES, MOCK_SERVICES } from "@/constants";
import { ArrowRight, BellRing, TrendingUp, MessagesSquare, Star } from "lucide-react";

export default function AdminOverviewPage() {
  const newBookingRequests = MOCK_BOOKINGS.filter(b => b.status === 'pending_approval').length;
  
  const totalSales = MOCK_BOOKINGS.reduce((acc, booking) => {
    if (booking.paymentStatus === 'paid') {
      const service = MOCK_SERVICES.find(s => s.name === booking.serviceName);
      if (service) {
        return acc + service.price;
      }
    }
    return acc;
  }, 0);

  const newMessagesCount = MOCK_USER_MESSAGES.filter(m => m.status === 'new').length;
  const averageRating = "4.7/5 Stars"; // Placeholder as rating system is not implemented

  return (
    <>
      <PageHeader
        title="Admin Dashboard Overview"
        description="Welcome to the admin panel. Get quick insights and manage your application's operations from here."
      />
      
      {/* Quick Insights Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Booking Requests</CardTitle>
            <BellRing className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{newBookingRequests}</div>
            <p className="text-xs text-muted-foreground">pending approval</p>
          </CardContent>
        </Card>
        <Card className="shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Confirmed Sales</CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹{totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">from paid bookings</p>
          </CardContent>
        </Card>
        <Card className="shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New User Messages</CardTitle>
            <MessagesSquare className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{newMessagesCount}</div>
            <p className="text-xs text-muted-foreground">unread messages</p>
          </CardContent>
        </Card>
        <Card className="shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average User Rating</CardTitle>
            <Star className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{averageRating}</div>
            <p className="text-xs text-muted-foreground">(Placeholder)</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Links Section */}
      <h2 className="text-2xl font-semibold mb-4 font-headline text-primary">Admin Sections</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ADMIN_DASHBOARD_NAV_LINKS.filter(link => link.href !== '/admin').map((link) => {
          const Icon = link.icon;
          return (
            <Card key={link.href} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium font-headline text-primary">{link.label}</CardTitle>
                <Icon className="h-6 w-6 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription>Manage {link.label.toLowerCase()}.</CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={link.href}>
                    Go to {link.label} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
