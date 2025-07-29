
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
import { Shield, Loader2, AlertTriangle } from 'lucide-react';
import { parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// PRODUCTION TODO: Import Firebase and Firestore methods:
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';


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
  const { currentUser, loadingAuth } = useAuth();
  const { toast } = useToast();
  const [userBookingsData, setUserBookingsData] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    if (loadingAuth) {
      setIsLoading(true);
      return;
    }

    if (!currentUser) {
      setIsLoading(false);
      // Error/redirect is handled by the return statement below
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const bookingsCol = collection(db, 'bookings');
    const q = query(
      bookingsCol,
      where('uid', '==', currentUser.uid),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedBookings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        } as Booking;
      });
      setUserBookingsData(fetchedBookings);
      setIsLoading(false);
    }, (err) => {
      console.error("Error with real-time bookings listener:", err);
      setError("Failed to load your bookings. Please try again later.");
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount

  }, [currentUser, loadingAuth, toast]);


  const upcomingBookings = useMemo(() => userBookingsData.filter(b => b.status === 'scheduled' || b.status === 'accepted' || b.status === 'pending_approval').sort((a,b) => getBookingDateTime(a.date, a.time).getTime() - getBookingDateTime(b.date, b.time).getTime()), [userBookingsData]);
  const pastBookings = useMemo(() => userBookingsData.filter(b => b.status === 'completed' || b.status === 'cancelled').sort((a,b) => getBookingDateTime(b.date, b.time).getTime() - getBookingDateTime(a.date, a.time).getTime()), [userBookingsData]);
  

  if (loadingAuth) {
    return (
        <div className="container py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your bookings...</p>
        </div>
    );
  }

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
  
  if (isLoading && !loadingAuth) { // Show loading only after auth check is complete
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
                <BookingCard key={booking.id} booking={booking} />
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
