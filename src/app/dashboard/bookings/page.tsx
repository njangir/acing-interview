
'use client';
// Removed useMemo as MOCK_BOOKINGS is mutated directly
import { PageHeader } from "@/components/core/page-header";
import { BookingCard } from "@/components/core/booking-card";
import { MOCK_BOOKINGS } from "@/constants";
import type { Booking } from '@/types'; // Import Booking type if not already
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function MyBookingsPage() {
  const { currentUser } = useAuth();

  // Directly filter MOCK_BOOKINGS on each render to get the latest data
  // This is suitable for client-side mock data mutation.
  let userBookings: Booking[] = [];
  if (currentUser) {
    // Ensure we are using the up-to-date MOCK_BOOKINGS array
    userBookings = MOCK_BOOKINGS.filter(b => b.userEmail === currentUser.email);
  }

  const upcomingBookings = userBookings.filter(b => b.status === 'upcoming' || b.status === 'pending_approval');
  const pastBookings = userBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  
  const handleBookingUpdate = (updatedBooking: Booking) => {
    // This function can be used to trigger a re-render if needed,
    // but direct mutation of MOCK_BOOKINGS and standard navigation
    // should cause this page to re-render and pick up changes.
    // For instance, if BookingCard itself updated MOCK_BOOKINGS and we needed to force a refresh here.
    // For now, we'll rely on the re-render from navigation.
    const index = MOCK_BOOKINGS.findIndex(b => b.id === updatedBooking.id);
    if (index !== -1) {
      MOCK_BOOKINGS[index] = updatedBooking;
      // Force a re-render by updating a dummy state if direct MOCK_BOOKINGS mutation isn't enough
      // This is a common pattern for forcing updates when external mutable sources are used.
      // However, for this case, simply re-filtering on render should be sufficient.
    }
  };


  if (!currentUser) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need to be logged in to view your bookings.
            <Button asChild className="mt-4 ml-2">
              <Link href="/login?redirect=/dashboard/bookings">Login</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }


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
                <BookingCard key={booking.id} booking={booking} onBookingUpdate={handleBookingUpdate} />
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
                <BookingCard key={booking.id} booking={booking} onBookingUpdate={handleBookingUpdate}/>
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
