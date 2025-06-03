'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

interface ConfirmationDetails {
  serviceName: string;
  date: string;
  time: string;
  userName: string;
  meetingLink: string;
  transactionId: string;
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const [details, setDetails] = useState<ConfirmationDetails | null>(null);

  useEffect(() => {
    const storedDetails = localStorage.getItem('confirmationDetails');
    if (storedDetails) {
      setDetails(JSON.parse(storedDetails));
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

  return (
    <>
      <PageHeader
        title="Booking Confirmed!"
        description={`Thank you, ${details.userName}, your session for ${details.serviceName} is confirmed.`}
      />
      <div className="container py-12">
        <Card className="max-w-xl mx-auto shadow-lg animate-subtle-appear">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="font-headline text-2xl text-primary">Booking Successful</CardTitle>
            <CardDescription>
              An email with your booking details and meeting link has been sent to you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-md bg-secondary/50">
              <p><strong>Service:</strong> {details.serviceName}</p>
              <p><strong>Date:</strong> {new Date(details.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> {details.time}</p>
              <p><strong>Transaction ID:</strong> {details.transactionId}</p>
            </div>
            
            <Button asChild variant="outline" className="w-full border-accent text-accent hover:bg-accent/10">
              <a href={details.meetingLink} target="_blank" rel="noopener noreferrer">
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
