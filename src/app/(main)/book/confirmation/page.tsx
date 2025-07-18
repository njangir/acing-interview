
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, Link as LinkIcon, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import type { Booking } from '@/types'; // Import Booking type
import { bookingService } from '@/lib/firebase-services';
import { useAuth } from '@/hooks/use-auth';

interface ConfirmationDetails {
  serviceName: string;
  date: string;
  time: string;
  userName: string;
  meetingLink: string; // Can be empty
  transactionId: string | null;
  paymentStatus: Booking['paymentStatus']; // Actual payment status
  status: Booking['status']; // Actual booking status
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const [details, setDetails] = useState<ConfirmationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    const fetchConfirmationDetails = async () => {
      if (!user || !userProfile) {
        setError("User not authenticated.");
        return;
      }

      try {
        setLoading(true);
        const booking = await bookingService.getBookingByTransactionId(userProfile.uid);
        if (booking) {
          setDetails(booking);
        } else {
          setError("Booking not found.");
        }
      } catch (err) {
        setError("Failed to fetch booking details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmationDetails();
  }, [user, userProfile]);

  if (loading) {
    return <div className="container py-12">Loading confirmation...</div>;
  }

  if (error) {
    return <div className="container py-12 text-center text-red-500">{error}</div>;
  }

  if (!details) {
    return <div className="container py-12 text-center">No booking details found.</div>;
  }

  // Derive states from details.status and details.paymentStatus
  const isPaymentPaid = details.paymentStatus === 'paid';
  const isBookingPendingApproval = details.status === 'pending_approval'; // Typically Pay Later
  const isBookingAccepted = details.status === 'accepted'; // Paid, but admin needs to schedule (add link)
  const isBookingScheduled = details.status === 'scheduled'; // Paid/Approved and link provided by admin

  let pageTitle = "Booking Confirmed!";
  let pageDescription = `Thank you, ${details.userName}, your session for ${details.serviceName} is confirmed.`;
  let cardTitle = "Booking Successful";
  let cardDescription = "An email with your booking details has been sent. The meeting link will be provided by the admin if not already available.";
  let cardIcon = <CheckCircle className="h-16 w-16 text-green-500" />;
  let cardBgClass = 'bg-secondary/50';

  if (isBookingPendingApproval) {
    pageTitle = "Booking Request Received!";
    pageDescription = `Thank you, ${details.userName}. Your request for ${details.serviceName} is pending approval.`;
    cardTitle = "Slot Tentatively Reserved";
    cardDescription = "Your slot request has been received and is pending admin approval. You'll be notified once it's confirmed, and payment will be due before the session.";
    cardIcon = <Info className="h-16 w-16 text-blue-500" />;
    cardBgClass = 'bg-blue-50 border-blue-300';
  } else if (isBookingAccepted) {
    pageTitle = "Booking Payment Confirmed!";
    pageDescription = `Thank you, ${details.userName}! Your payment for ${details.serviceName} is confirmed.`;
    cardTitle = "Payment Successful, Awaiting Schedule";
    cardDescription = "Your payment is confirmed. The admin will schedule your session and provide the meeting link soon. You'll receive an email update.";
    cardIcon = <CheckCircle className="h-16 w-16 text-green-500" />;
  } else if (isBookingScheduled) {
     pageTitle = "Booking Scheduled!";
     pageDescription = `Thank you, ${details.userName}! Your session for ${details.serviceName} is scheduled.`;
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
              <p><strong>Service:</strong> {details.serviceName}</p>
              <p><strong>Date:</strong> {new Date(details.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> {details.time}</p>
              {details.transactionId && <p><strong>Transaction ID:</strong> {details.transactionId}</p>}
              <p><strong>Payment Status:</strong> <span className={`font-semibold ${isPaymentPaid ? 'text-green-600' : (details.paymentStatus === 'pay_later_pending' ? 'text-yellow-700' : 'text-red-600')}`}>{details.paymentStatus.replace('_', ' ').toUpperCase()}</span></p>
              <p><strong>Booking Status:</strong> <span className={`font-semibold ${isBookingScheduled ? 'text-green-600' : (isBookingAccepted ? 'text-blue-600' : (isBookingPendingApproval ? 'text-yellow-700' : 'text-gray-600')) }`}>{details.status.replace('_', ' ').toUpperCase()}</span></p>
            </div>
            
            {isBookingPendingApproval && (
                <Button asChild variant="default" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    {/* This would ideally link to a page to pay for this specific pending booking IF it gets approved */}
                    <Link href="/dashboard/bookings">Check Booking Status</Link>
                </Button>
            )}

            {isBookingScheduled && details.meetingLink && (
                <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                <a href={details.meetingLink} target="_blank" rel="noopener noreferrer">
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
