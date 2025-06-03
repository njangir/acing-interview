import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_BOOKINGS, MOCK_SERVICES } from "@/constants";
import { BookingCard } from "@/components/core/booking-card";
import Link from "next/link";
import { CalendarCheck, BookOpen, UserCircle, Edit } from "lucide-react";

export default function DashboardOverviewPage() {
  const upcomingBookings = MOCK_BOOKINGS.filter(b => b.status === 'upcoming');
  const recentService = MOCK_SERVICES[0]; // Mock recent service

  return (
    <>
      <PageHeader
        title="Welcome to Your Dashboard"
        description="Manage your bookings, access resources, and track your progress."
      />
      <div className="space-y-8">
        {/* Quick Stats or Summary */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
              <CalendarCheck className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{upcomingBookings.length}</div>
              <p className="text-xs text-muted-foreground">sessions scheduled</p>
            </CardContent>
          </Card>
          <Card className="shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources Accessed</CardTitle>
              <BookOpen className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">0 {/* Mock Value */}</div>
              <p className="text-xs text-muted-foreground">premium resources available</p>
            </CardContent>
          </Card>
           <Card className="shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
              <UserCircle className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">Complete</div>
               <Link href="/dashboard/profile" className="text-xs text-muted-foreground hover:text-primary flex items-center">
                View/Edit Profile <Edit className="ml-1 h-3 w-3"/>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Bookings Preview */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 font-headline text-primary">Next Upcoming Session</h2>
          {upcomingBookings.length > 0 ? (
            <BookingCard booking={upcomingBookings[0]} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">No upcoming bookings.</p>
                <Button asChild className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/book">Book a New Session</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Access to Resources or Rebook */}
        {recentService && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 font-headline text-primary">Quick Actions</h2>
            <Card className="shadow">
              <CardHeader>
                <CardTitle className="text-lg font-headline text-primary/90">Explore {recentService.name} Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Access exclusive materials related to your recent service.
                </p>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                        <Link href={`/dashboard/resources?service=${recentService.id}`}>Go to Resources</Link>
                    </Button>
                    <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Link href={`/book?serviceId=${recentService.id}`}>Book {recentService.name} Again</Link>
                    </Button>
                 </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
