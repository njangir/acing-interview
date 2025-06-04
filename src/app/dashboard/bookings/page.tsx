
'use client';

import { useState, useEffect } from 'react'; // Added useState, useEffect
import { PageHeader } from "@/components/core/page-header";
import { BookingCard } from "@/components/core/booking-card";
import { MOCK_BOOKINGS } from "@/constants";
import type { Booking } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { parse } from 'date-fns'; // Added import
import { useToast } from '@/hooks/use-toast'; // Added import

// Helper function to get full Date object from booking date and time
const getBookingDateTime = (bookingDate: string, bookingTime: string): Date => {
  const [timePart, ampm] = bookingTime.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0; // Midnight case

  const dateObj = parse(bookingDate, 'yyyy-MM-dd', new Date());
  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
};

export default function MyBookingsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast(); // Initialize toast
  const [forceUpdate, setForceUpdate] = useState(0); // For re-rendering after mock data mutation

  useEffect(() => {
    if (!currentUser) return;

    let bookingsWereUpdated = false;
    const now = new Date().getTime();
    const oneHourInMs = 60 * 60 * 1000;

    MOCK_BOOKINGS.forEach((booking, index) => {
      if (
        booking.userEmail === currentUser.email &&
        booking.status === 'upcoming' &&
        booking.paymentStatus === 'pay_later_pending'
      ) {
        const bookingDateTime = getBookingDateTime(booking.date, booking.time);
        // Check if current time is past booking time OR within 1 hour before booking time
        if (now >= bookingDateTime.getTime() || (bookingDateTime.getTime() - now < oneHourInMs)) {
          MOCK_BOOKINGS[index] = {
            ...booking,
            status: 'cancelled',
            paymentStatus: 'pay_later_unpaid',
            // You could add a cancellation reason here, e.g.,
            // refundReason: "Auto-cancelled: Payment not received before session." 
          };
          bookingsWereUpdated = true;
        }
      }
    });

    if (bookingsWereUpdated) {
      toast({
        title: "Booking Status Update",
        description: "One or more 'Pay Later' bookings were automatically cancelled due to pending payment close to the session time.",
        variant: "default",
      });
      setForceUpdate(prev => prev + 1); // Trigger re-render
    }
  }, [currentUser, toast]); // Removed MOCK_BOOKINGS from deps as it's mutated

  let userBookings: Booking[] = [];
  if (currentUser) {
    userBookings = MOCK_BOOKINGS.filter(b => b.userEmail === currentUser.email);
  }

  const upcomingBookings = userBookings.filter(b => b.status === 'upcoming' || b.status === 'pending_approval');
  const pastBookings = userBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  
  const handleBookingUpdate = (updatedBooking: Booking) => {
    const index = MOCK_BOOKINGS.findIndex(b => b.id === updatedBooking.id);
    if (index !== -1) {
      MOCK_BOOKINGS[index] = updatedBooking;
      setForceUpdate(prev => prev + 1); // Force re-render
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
