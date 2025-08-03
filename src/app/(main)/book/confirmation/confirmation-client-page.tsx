
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, Link as LinkIcon, Info, Loader2, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import type { Booking } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ConfirmationClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { currentUser, loadingAuth } = useAuth();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (loadingAuth) {
        setIsLoading(true);
        return;
    }
    if (!currentUser) {
        router.push(`/login?redirect=/book/confirmation${bookingId ? `?bookingId=${bookingId}`:''}`);
        return;
    }
    if (!bookingId) {
      setError("No booking ID provided.");
      setIsLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const bookingDocRef = doc(db, 'bookings', bookingId);
            const docSnap = await getDoc(bookingDocRef);

            if (docSnap.exists() && docSnap.data().uid === currentUser.uid) {
                setBooking({ id: docSnap.id, ...docSnap.data() } as Booking);
            } else {
                setError("Booking not found or you do not have permission to view it.");
            }
        } catch (err) {
            console.error("Error fetching booking confirmation details:", err);
            setError("Failed to load booking details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchBookingDetails();
  }, [bookingId, currentUser, loadingAuth, router]); 

  if (isLoading || loadingAuth) {
    return (
        <>
            <PageHeader title="Loading Confirmation..." description="Please wait while we retrieve your booking details." />
            <div className="container py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
        </>
    );
  }

  if (error) {
    return (
        <div className="container py-12">
            <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={() => router.push('/dashboard/bookings')} className="mt-4">Go to My Bookings</Button>
            </Alert>
        </div>
    );
  }

  if (!booking) {
    return <div className="container py-12">No booking details found.</div>;
  }

  const isPaymentPaid = booking.paymentStatus === 'paid';
  const isBookingPendingApproval = booking.status === 'pending_approval';
  const isBookingAccepted = booking.status === 'accepted';
  const isBookingScheduled = booking.status === 'scheduled';

  let pageTitle = "Booking Confirmed!";
  let pageDescription = `Thank you, ${booking.userName}, your session for ${booking.serviceName} is confirmed.`;
  let cardTitle = "Booking Successful";
  let cardDescription = "An email with your booking details has been sent. The meeting link will be provided by the admin if not already available.";
  let cardIcon = <CheckCircle className="h-16 w-16 text-green-500" />;
  let cardBgClass = 'bg-secondary/50';

  if (isBookingPendingApproval) {
    pageTitle = "Booking Request Received!";
    pageDescription = `Thank you, ${booking.userName}. Your request for ${booking.serviceName} is pending approval.`;
    cardTitle = "Slot Tentatively Reserved";
    cardDescription = "Your slot request has been received and is pending admin approval. You'll be notified once it's confirmed, and payment will be due before the session.";
    cardIcon = <Info className="h-16 w-16 text-blue-500" />;
    cardBgClass = 'bg-blue-50 border-blue-300';
  } else if (isBookingAccepted) {
    pageTitle = "Booking Payment Confirmed!";
    pageDescription = `Thank you, ${booking.userName}! Your payment for ${booking.serviceName} is confirmed.`;
    cardTitle = "Payment Successful, Awaiting Schedule";
    cardDescription = "Your payment is confirmed. The admin will schedule your session and provide the meeting link soon. You'll receive an email update.";
    cardIcon = <CheckCircle className="h-16 w-16 text-green-500" />;
  } else if (isBookingScheduled) {
     pageTitle = "Booking Scheduled!";
     pageDescription = `Thank you, ${booking.userName}! Your session for ${booking.serviceName} is scheduled.`;
     cardTitle = "Session Scheduled & Confirmed";
     cardDescription = "Your session is confirmed and scheduled. An email with your booking details and meeting link has been sent to you (or is available below).";
     cardIcon = <CheckCircle className="h-16 w-16 text-green-500" />;
  }


  return (
    <>
      <PageHeader
        title={pageTitle}
        description={pageDescription}
      />
      <div className="container py-12">
        <Card className="max-w-xl mx-auto shadow-lg animate-subtle-appear">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {cardIcon}
            </div>
            <CardTitle className={`font-headline text-2xl ${isBookingPendingApproval ? 'text-blue-600' : (isBookingAccepted || isBookingScheduled ? 'text-primary' : 'text-primary')}`}>
              {cardTitle}
            </CardTitle>
            <CardDescription>
                {cardDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 border rounded-md ${cardBgClass}`}>
              <p><strong>Service:</strong> {booking.serviceName}</p>
              <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> {booking.time}</p>
              {booking.transactionId && <p><strong>Transaction ID:</strong> {booking.transactionId}</p>}
              <p><strong>Payment Status:</strong> <span className={`font-semibold ${isPaymentPaid ? 'text-green-600' : (booking.paymentStatus === 'pay_later_pending' ? 'text-yellow-700' : 'text-red-600')}`}>{booking.paymentStatus.replace(/_/g, ' ').toUpperCase()}</span></p>
              <p><strong>Booking Status:</strong> <span className={`font-semibold ${isBookingScheduled ? 'text-green-600' : (isBookingAccepted ? 'text-blue-600' : (isBookingPendingApproval ? 'text-yellow-700' : 'text-gray-600')) }`}>{booking.status.replace(/_/g, ' ').toUpperCase()}</span></p>
            </div>
            
            {isBookingPendingApproval && (
                <Button asChild variant="default" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href="/dashboard/bookings">Check Booking Status</Link>
                </Button>
            )}

            {isBookingScheduled && booking.meetingLink && (
                <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="mr-2 h-4 w-4" /> Join Meeting
                </a>
                </Button>
            )}
            
            <Button asChild className="w-full">
              <Link href="/dashboard/bookings">
                <Calendar className="mr-2 h-4 w-4" /> View My Bookings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
