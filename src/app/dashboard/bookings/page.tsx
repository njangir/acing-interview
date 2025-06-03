import { PageHeader } from "@/components/core/page-header";
import { BookingCard } from "@/components/core/booking-card";
import { MOCK_BOOKINGS } from "@/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MyBookingsPage() {
  const upcomingBookings = MOCK_BOOKINGS.filter(b => b.status === 'upcoming');
  const pastBookings = MOCK_BOOKINGS.filter(b => b.status !== 'upcoming');

  return (
    <>
      <PageHeader
        title="My Bookings"
        description="View your scheduled sessions and access past booking details."
      />
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {upcomingBookings.length > 0 ? (
            <div className="space-y-6">
              {upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">No upcoming bookings.</p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/book">Book a Session</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="past">
          {pastBookings.length > 0 ? (
            <div className="space-y-6">
              {pastBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No past bookings found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
