
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { BookingCard } from "@/components/core/booking-card";
import { MOCK_BOOKINGS } from "@/constants"; // Keep for fallback/initial display
import type { Booking } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Loader2, AlertTriangle } from 'lucide-react'; // Added Loader2, AlertTriangle
import { parse, isBefore } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  const { currentUser, loadingAuth } = useAuth();
  const { toast } = useToast();
  const [userBookingsData, setUserBookingsData] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // forceUpdate can be used if BookingCard needs to signal a local state change
  // that might not warrant a full re-fetch but needs parent re-render.
  const [forceUpdate, setForceUpdate] = useState(0); 

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

    // PRODUCTION TODO: Replace mock data filtering with actual Firestore query.
    // Example Firestore query (fetch once):
    /*
    const fetchBookings = async () => {
      try {
        const bookingsCol = collection(db, 'bookings');
        const q = query(
          bookingsCol,
          where('uid', '==', currentUser.uid), // Query by user ID
          orderBy('createdAt', 'desc') // Example ordering
        );
        const bookingSnapshot = await getDocs(q);
        const fetchedBookings = bookingSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Ensure timestamp fields from Firestore are converted if needed
            // e.g., date: (data.date as Timestamp)?.toDate ? (data.date as Timestamp).toDate().toISOString().split('T')[0] : data.date,
            // createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : data.createdAt,
            // updatedAt: (data.updatedAt as Timestamp)?.toDate ? (data.updatedAt as Timestamp).toDate().toISOString() : data.updatedAt,
          } as Booking;
        });

        // PRODUCTION TODO: The auto-cancellation logic below should ideally be a backend function (e.g., Cloud Function)
        // triggered by a cron job or event, rather than client-side logic.
        let bookingsWereUpdated = false;
        const now = new Date();
        const oneHourInMs = 60 * 60 * 1000;

        const processedBookings = fetchedBookings.map(booking => {
          let updatedBooking = { ...booking };
          if (
            (updatedBooking.status === 'scheduled' || updatedBooking.status === 'accepted') && // 'upcoming' is not a valid status
            updatedBooking.paymentStatus === 'pay_later_pending'
          ) {
            const bookingDateTime = getBookingDateTime(updatedBooking.date, updatedBooking.time);
            if (isBefore(bookingDateTime, now) || (bookingDateTime.getTime() - now.getTime() < oneHourInMs)) {
              updatedBooking.status = 'cancelled';
              updatedBooking.paymentStatus = 'pay_later_unpaid';
              // updatedBooking.cancellationReason = "Auto-cancelled: Payment not received before session."; // Example field
              bookingsWereUpdated = true;
              // In a real app, you'd also update this booking document in Firestore
              // await updateDoc(doc(db, 'bookings', booking.id), { status: 'cancelled', paymentStatus: 'pay_later_unpaid' });
            }
          }
          return updatedBooking;
        });

        setUserBookingsData(processedBookings);
        if (bookingsWereUpdated) {
          toast({
            title: "Booking Status Update",
            description: "One or more 'Pay Later' bookings were automatically updated due to pending payment close to the session time.",
            variant: "default",
          });
        }
        
      } catch (err) {
        console.error("Error fetching user bookings:", err);
        setError("Failed to load your bookings. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
    */

    // --- MOCK IMPLEMENTATION (using MOCK_BOOKINGS) ---
    // Simulate API call delay
    setTimeout(() => {
        const mockUserSpecificBookings = MOCK_BOOKINGS.filter(b => b.userEmail === currentUser.email);
        
        let bookingsWereUpdated = false;
        const now = new Date();
        const oneHourInMs = 60 * 60 * 1000;

        const processedMockBookings = mockUserSpecificBookings.map((booking, index) => {
          let updatedBooking = { ...booking }; // Create a copy to avoid direct mutation if needed
          if (
            (updatedBooking.status === 'scheduled' || updatedBooking.status === 'accepted') &&
            updatedBooking.paymentStatus === 'pay_later_pending'
          ) {
            const bookingDateTime = getBookingDateTime(updatedBooking.date, updatedBooking.time);
            if (isBefore(bookingDateTime, now) || (bookingDateTime.getTime() - now.getTime() < oneHourInMs)) {
              // For MOCK_BOOKINGS, we might directly mutate it or handle it via onBookingUpdate
              // To ensure data consistency if BookingCard updates MOCK_BOOKINGS:
              const originalBookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === updatedBooking.id);
              if (originalBookingIndex !== -1) {
                  MOCK_BOOKINGS[originalBookingIndex].status = 'cancelled';
                  MOCK_BOOKINGS[originalBookingIndex].paymentStatus = 'pay_later_unpaid';
                  updatedBooking.status = 'cancelled'; // Update local copy too
                  updatedBooking.paymentStatus = 'pay_later_unpaid';
                  // MOCK_BOOKINGS[originalBookingIndex].cancellationReason = "Auto-cancelled: Payment not received";
                  bookingsWereUpdated = true;
              }
            }
          }
          return updatedBooking;
        });
        setUserBookingsData(processedMockBookings);
        if (bookingsWereUpdated) {
          toast({
            title: "Booking Status Update (Mock)",
            description: "One or more 'Pay Later' bookings were automatically updated due to pending payment.",
            variant: "default",
          });
        }
        setIsLoading(false);
    }, 1000);
    // --- END OF MOCK IMPLEMENTATION ---

    // PRODUCTION TODO: For real-time updates, use onSnapshot:
    /*
    const bookingsCol = collection(db, 'bookings');
    const q = query(bookingsCol, where('uid', '==', currentUser.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      // Process fetchedBookings (e.g., date conversions, auto-cancellation logic simulation)
      setUserBookingsData(processedBookings);
      setIsLoading(false);
    }, (err) => {
      console.error("Error with real-time bookings listener:", err);
      setError("Failed to load bookings in real-time.");
      setIsLoading(false);
    });
    return () => unsubscribe(); // Cleanup listener on component unmount
    */

  }, [currentUser, loadingAuth, toast, forceUpdate]); // forceUpdate is added to re-trigger if BookingCard mutates MOCK_BOOKINGS directly


  const upcomingBookings = useMemo(() => userBookingsData.filter(b => b.status === 'scheduled' || b.status === 'accepted' || b.status === 'pending_approval').sort((a,b) => getBookingDateTime(a.date, a.time).getTime() - getBookingDateTime(b.date, b.time).getTime()), [userBookingsData]);
  const pastBookings = useMemo(() => userBookingsData.filter(b => b.status === 'completed' || b.status === 'cancelled').sort((a,b) => getBookingDateTime(b.date, b.time).getTime() - getBookingDateTime(a.date, a.time).getTime()), [userBookingsData]);
  
  const handleBookingUpdate = (updatedBooking: Booking) => {
    // This function is called by BookingCard when a local action (like refund request) changes the booking state.
    // In a real app, BookingCard would ideally call an API, and Firestore's onSnapshot would update the list.
    // For mock, we update MOCK_BOOKINGS and trigger a re-fetch/re-process.
    const index = MOCK_BOOKINGS.findIndex(b => b.id === updatedBooking.id);
    if (index !== -1) {
      MOCK_BOOKINGS[index] = updatedBooking;
    }
    setForceUpdate(prev => prev + 1); 
  };

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

