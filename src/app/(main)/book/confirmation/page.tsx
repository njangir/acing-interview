
'use client';

import { useEffect, useState, useRef } from 'react'; // Added useRef
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ConfirmationDetails {
  serviceName: string;
  date: string;
  time: string;
  userName: string;
  meetingLink: string;
  transactionId: string | null;
  paymentStatus: 'paid' | 'pay_later_pending' | 'accepted' | 'scheduled'; // Added accepted/scheduled
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const [details, setDetails] = useState<ConfirmationDetails | null>(null);
  const effectGuard = useRef(false); // To prevent effect from running multiple times in StrictMode

  useEffect(() => {
    // In StrictMode (development), effects run twice. This guard ensures logic runs once.
    if (process.env.NODE_ENV === 'development') {
      if (effectGuard.current) {
        return; // Already ran, bail out
      }
      effectGuard.current = true; // Mark as ran for this mount
    }

    // If details are already populated in state (e.g., from a previous successful run, HMR), don't re-process.
    if (details) {
      return;
    }

    const storedDetails = localStorage.getItem('confirmationDetails');
    if (storedDetails) {
      try {
        const parsedDetails = JSON.parse(storedDetails);
        setDetails(parsedDetails);
        // It's crucial to remove these only *after* successfully setting state.
        localStorage.removeItem('bookingDetails');
        localStorage.removeItem('userDetails');
        localStorage.removeItem('confirmationDetails');
      } catch (error) {
        console.error("Error parsing confirmation details from localStorage:", error);
        router.push('/services'); // Redirect on parse error
      }
    } else {
      // No details found in localStorage. This typically means the user navigated here directly
      // or the data wasn't set correctly.
      console.warn("No confirmationDetails found in localStorage on page load. Redirecting to services.");
      // We check !details again because setDetails is async, state might not be updated yet in this path.
      if (!details) {
         router.push('/services');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, details]); // `details` in dependency array ensures if it changes externally, effect can react (though guarded by `if(details)`).
                         // `router` is generally stable.

  if (!details) {
    return <div className="container py-12">Loading confirmation...</div>;
  }

  const isPaid = details.paymentStatus === 'paid';
  const isScheduled = details.paymentStatus === 'scheduled'; // Admin has added link
  const isAccepted = details.paymentStatus === 'accepted'; // Paid, admin needs to add link
  const isTentative = details.paymentStatus === 'pay_later_pending';

  let pageTitle = "Booking Confirmed!";
  let pageDescription = `Thank you, ${details.userName}, your session for ${details.serviceName} is confirmed.`;
  let cardTitle = "Booking Successful";
  let cardDescription = "An email with your booking details and meeting link has been sent to you (or will be sent once the admin schedules it).";
  let cardIcon = <CheckCircle className="h-16 w-16 text-green-500" />;
  let cardBgClass = 'bg-secondary/50';

  if (isTentative) {
    pageTitle = "Booking Tentatively Confirmed!";
    pageDescription = `Thank you, ${details.userName}, your session for ${details.serviceName} is tentatively scheduled.`;
    cardTitle = "Slot Tentatively Reserved";
    cardDescription = "Your slot is reserved for now. Please complete your payment before the session to fully confirm your booking. An email with these details has been sent.";
    cardIcon = <AlertTriangle className="h-16 w-16 text-yellow-500" />;
    cardBgClass = 'bg-yellow-50 border-yellow-300';
  } else if (isAccepted) {
    pageTitle = "Booking Payment Confirmed!";
    pageDescription = `Thank you, ${details.userName}! Your payment for ${details.serviceName} is confirmed.`;
    cardTitle = "Payment Successful, Awaiting Schedule";
    cardDescription = "Your payment is confirmed. The admin will schedule your session and provide the meeting link soon. You'll receive an email update.";
    cardIcon = <CheckCircle className="h-16 w-16 text-green-500" />;
  } else if (isScheduled) {
     pageTitle = "Booking Scheduled!";
     pageDescription = `Thank you, ${details.userName}! Your session for ${details.serviceName} is scheduled.`;
     cardTitle = "Session Scheduled";
     cardDescription = "Your session is confirmed and scheduled. An email with your booking details and meeting link has been sent to you.";
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
            <CardTitle className={`font-headline text-2xl ${isTentative ? 'text-yellow-600' : 'text-primary'}`}>
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
              <p><strong>Payment Status:</strong> <span className={`font-semibold ${isPaid || isScheduled || isAccepted ? 'text-green-600' : 'text-yellow-700'}`}>{details.paymentStatus.replace('_', ' ').toUpperCase()}</span></p>
            </div>
            
            {isTentative && (
                <Button variant="default" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    {/* In a real app, this would link to a payment page with the booking ID */}
                    Complete Payment Now (Mock) 
                </Button>
            )}

            {(isPaid || isScheduled) && details.meetingLink && (
                <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                <a href={details.meetingLink} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="mr-2 h-4 w-4" /> Join Meeting (Test Link)
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
