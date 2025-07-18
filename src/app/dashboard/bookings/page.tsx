
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { BookingCard } from "@/components/core/booking-card";
import type { Booking } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Loader2, AlertTriangle } from 'lucide-react'; // Added Loader2, AlertTriangle
import { parse, isBefore } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { bookingService } from '@/lib/firebase-services';

// PRODUCTION TODO: Import Firebase and Firestore methods:
// import { db } from '@/lib/firebase'; // Assuming firebase.ts setup
// import { collection, query, where, getDocs, Timestamp, orderBy, onSnapshot } from 'firebase/firestore';


// Helper function to get full Date object from booking date and time
const getBookingDateTime = (bookingDate: string, bookingTime: string): Date => {
  const [timePart, ampm] = bookingTime.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0; 

  const dateObj = parse(bookingDate, 'yyyy-MM-dd', new Date());
  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
};

export default function MyBookingsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [userBookingsData, setUserBookingsData] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // forceUpdate can be used if BookingCard needs to signal a local state change
  // that might not warrant a full re-fetch but needs parent re-render.
  const [forceUpdate, setForceUpdate] = useState(0); 

  useEffect(() => {
    if (loading) {
      setIsLoading(true);
      return;
    }

    if (!user) {
      setIsLoading(false);
      // Error/redirect is handled by the return statement below
      return;
    }

    setIsLoading(true);
    setError(null);

    bookingService.getUserBookings(user.uid)
      .then(fetchedBookings => {
        setUserBookingsData(fetchedBookings);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching user bookings:', err);
        setError('Failed to load your bookings. Please try again later.');
        setIsLoading(false);
      });

  }, [user, loading, toast, forceUpdate]);


  const upcomingBookings = useMemo(() => userBookingsData.filter(b => b.status === 'scheduled' || b.status === 'accepted' || b.status === 'pending_approval').sort((a,b) => getBookingDateTime(a.date, a.time).getTime() - getBookingDateTime(b.date, b.time).getTime()), [userBookingsData]);
  const pastBookings = useMemo(() => userBookingsData.filter(b => b.status === 'completed' || b.status === 'cancelled').sort((a,b) => getBookingDateTime(b.date, b.time).getTime() - getBookingDateTime(a.date, a.time).getTime()), [userBookingsData]);
  
  const handleBookingUpdate = async (updatedBooking: Booking) => {
    try {
      await bookingService.updateBooking(updatedBooking.id, updatedBooking);
      setForceUpdate(prev => prev + 1);
    } catch (err) {
      console.error('Error updating booking:', err);
      toast({ title: 'Update Failed', description: 'Could not update booking.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
        <div className="container py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your bookings...</p>
        </div>
    );
  }

  if (!user) {
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
  
  if (isLoading && !loading) { // Show loading only after auth check is complete
     return (
        <div className="container py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Fetching your bookings...</p>
        </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Bookings</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
                <Link href="/services">Book a Session</Link>
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

