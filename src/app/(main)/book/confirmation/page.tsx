
'use client';

import { useEffect, useState } from 'react';
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
  paymentStatus: 'paid' | 'pay_later_pending';
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const [details, setDetails] = useState<ConfirmationDetails | null>(null);

  useEffect(() => {
    const storedDetails = localStorage.getItem('confirmationDetails');
    if (storedDetails) {
      const parsedDetails = JSON.parse(storedDetails);
      setDetails(parsedDetails);
      // Clean up local storage items after displaying confirmation
      localStorage.removeItem('bookingDetails');
      localStorage.removeItem('userDetails');
      localStorage.removeItem('confirmationDetails');
    } else {
      // If no details, redirect to booking start, or show error
      router.push('/book');
    }
  }, [router]);

  if (!details) {
    return <div className="container py-12">Loading confirmation...</div>;
  }

  const isPaid = details.paymentStatus === 'paid';

  return (
    <>
      <PageHeader
        title={isPaid ? "Booking Confirmed!" : "Booking Tentatively Confirmed!"}
        description={`Thank you, ${details.userName}, your session for ${details.serviceName} is ${isPaid ? 'confirmed' : 'tentatively scheduled'}.`}
      />
      <div className="container py-12">
        <Card className="max-w-xl mx-auto shadow-lg animate-subtle-appear">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {isPaid ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <AlertTriangle className="h-16 w-16 text-yellow-500" />
              )}
            </div>
            <CardTitle className={`font-headline text-2xl ${isPaid ? 'text-primary' : 'text-yellow-600'}`}>
              {isPaid ? 'Booking Successful' : 'Slot Tentatively Reserved'}
            </CardTitle>
            <CardDescription>
              {isPaid ? "An email with your booking details and meeting link has been sent to you." 
                      : "Your slot is reserved for now. Please complete your payment before the session to fully confirm your booking and receive joining instructions. An email with these details has been sent."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 border rounded-md ${isPaid ? 'bg-secondary/50' : 'bg-yellow-50 border-yellow-300'}`}>
              <p><strong>Service:</strong> {details.serviceName}</p>
              <p><strong>Date:</strong> {new Date(details.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> {details.time}</p>
              {details.transactionId && <p><strong>Transaction ID:</strong> {details.transactionId}</p>}
              <p><strong>Payment Status:</strong> <span className={`font-semibold ${isPaid ? 'text-green-600' : 'text-yellow-700'}`}>{details.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}</span></p>
            </div>
            
            {!isPaid && (
                <Button variant="default" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    {/* In a real app, this would link to a payment page with the booking ID */}
                    Complete Payment Now (Mock) 
                </Button>
            )}

            <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
              <a href={details.meetingLink} target="_blank" rel="noopener noreferrer" className={!isPaid ? 'opacity-50 cursor-not-allowed' : ''} title={!isPaid ? "Payment required to join meeting" : "Join Meeting"}>
                <LinkIcon className="mr-2 h-4 w-4" /> Join Meeting (Test Link)
              </a>
            </Button>
            
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
