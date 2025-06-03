'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_SERVICES } from "@/constants";
import type { Service } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, XCircle, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const { toast } = useToast();
  
  const [service, setService] = useState<Service | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentService = MOCK_SERVICES.find(s => s.id === serviceId);
    if (currentService) {
      setService(currentService);
    } else {
      setError("Service not found.");
    }

    const storedBookingDetails = localStorage.getItem('bookingDetails');
    if (storedBookingDetails) {
      setBookingDetails(JSON.parse(storedBookingDetails));
    } else {
      setError("Booking slot information not found.");
    }

    const storedUserDetails = localStorage.getItem('userDetails');
    if (storedUserDetails) {
      setUserDetails(JSON.parse(storedUserDetails));
    } else {
      setError("User details not found.");
    }
  }, [serviceId]);

  const handleMockPayment = async () => {
    setIsLoading(true);
    setError(null);

    // Simulate API call to Razorpay and backend
    await new Promise(resolve => setTimeout(resolve, 2000));

    const paymentSuccess = Math.random() > 0.1; // 90% success rate for mock

    if (paymentSuccess) {
      const meetingLink = "https://meet.google.com/mock-link-" + Math.random().toString(36).substring(7);
      localStorage.setItem('confirmationDetails', JSON.stringify({
        serviceName: service?.name,
        date: bookingDetails?.date,
        time: bookingDetails?.time,
        userName: userDetails?.name,
        meetingLink,
        transactionId: "mock_txn_" + Date.now(),
      }));
      toast({
        title: "Payment Successful!",
        description: "Your booking is confirmed. Redirecting...",
        variant: "default",
      });
      router.push(`/book/confirmation`);
    } else {
      setError("Payment failed. Please try again.");
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  if (error && (!service || !bookingDetails || !userDetails)) {
     return (
      <div className="container py-12">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error} Please start the booking process again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!service || !bookingDetails || !userDetails) {
    return <div className="container py-12">Loading payment details...</div>;
  }

  return (
    <>
      <PageHeader
        title="Complete Your Payment"
        description={`You are booking ${service.name}. Please review and proceed to payment.`}
      />
      <div className="container py-12">
        <Card className="max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Payment Summary</CardTitle>
            <CardDescription>
              Service: {service.name} <br />
              Date: {new Date(bookingDetails.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} <br/>
              Time: {bookingDetails.time} <br />
              Name: {userDetails.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-primary">₹{service.price}</span>
            </div>
            <div className="text-center">
              <Image src="https://placehold.co/300x80.png?text=Mock+Razorpay+Gateway" alt="Mock Razorpay Gateway" width={300} height={80} className="mx-auto rounded border" data-ai-hint="payment gateway logo"/>
            </div>
             {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Payment Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleMockPayment} 
              disabled={isLoading} 
              size="lg" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Processing...' : `Pay ₹${service.price} Securely`}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
