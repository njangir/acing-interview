
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MOCK_SERVICES } from "@/constants";
import type { Service } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, XCircle, CreditCard, Info, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

type PaymentOption = 'payNow' | 'payLater';

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
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('payNow');

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

  const handlePaymentOrConfirmation = async () => {
    setIsLoading(true);
    setError(null);

    if (paymentOption === 'payNow') {
      // Simulate API call to Razorpay and backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      const paymentSuccess = Math.random() > 0.1; // 90% success rate for mock

      if (paymentSuccess) {
        localStorage.setItem('confirmationDetails', JSON.stringify({
          serviceName: service?.name,
          date: bookingDetails?.date,
          time: bookingDetails?.time,
          userName: userDetails?.name,
          meetingLink: "https://meet.google.com/mock-link-" + Math.random().toString(36).substring(7),
          transactionId: "mock_txn_" + Date.now(),
          paymentStatus: 'paid',
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
    } else { // Pay Later
      await new Promise(resolve => setTimeout(resolve, 1000)); // Shorter delay for pay later
      localStorage.setItem('confirmationDetails', JSON.stringify({
        serviceName: service?.name,
        date: bookingDetails?.date,
        time: bookingDetails?.time,
        userName: userDetails?.name,
        meetingLink: "https://meet.google.com/mock-link-" + Math.random().toString(36).substring(7), // Still generate a link
        transactionId: null,
        paymentStatus: 'pay_later_pending',
      }));
      toast({
        title: "Booking Tentatively Confirmed!",
        description: "Your slot is reserved. Payment will be due before the session. Redirecting...",
        variant: "default",
      });
      router.push(`/book/confirmation`);
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
        title="Complete Your Booking"
        description={`You are booking ${service.name}. Please review and choose your payment option.`}
      />
      <div className="container py-12">
        <Card className="max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Booking Summary</CardTitle>
            <CardDescription>
              Service: {service.name} <br />
              Date: {new Date(bookingDetails.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} <br/>
              Time: {bookingDetails.time} <br />
              Name: {userDetails.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-primary">₹{service.price}</span>
            </div>

            <RadioGroup defaultValue="payNow" onValueChange={(value: PaymentOption) => setPaymentOption(value)} className="space-y-2">
              <Label className="font-semibold text-md">Payment Options:</Label>
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:border-primary transition-colors">
                <RadioGroupItem value="payNow" id="payNow" />
                <Label htmlFor="payNow" className="flex-1 cursor-pointer">Pay Now & Confirm Slot</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:border-primary transition-colors">
                <RadioGroupItem value="payLater" id="payLater" />
                <Label htmlFor="payLater" className="flex-1 cursor-pointer">Pay Later (Tentative Slot)</Label>
              </div>
            </RadioGroup>

            {paymentOption === 'payLater' && (
              <Alert variant="default" className="bg-accent/10 border-accent/50 text-accent-foreground">
                <Info className="h-4 w-4 !text-accent" />
                <AlertTitle className="!text-accent">Important Notice</AlertTitle>
                <AlertDescription className="!text-accent/80">
                  Slots booked with 'Pay Later' are tentative. If another user books the same slot with advance payment, the slot will be allocated to them. We recommend paying in advance to secure your spot. Payment will be due before your scheduled session.
                </AlertDescription>
              </Alert>
            )}
            
            {paymentOption === 'payNow' && (
                <div className="text-center pt-4">
                <Image src="https://placehold.co/300x80.png?text=Mock+Razorpay+Gateway" alt="Mock Razorpay Gateway" width={300} height={80} className="mx-auto rounded border" data-ai-hint="payment gateway logo"/>
                </div>
            )}

             {error && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Payment Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handlePaymentOrConfirmation} 
              disabled={isLoading} 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : paymentOption === 'payNow' ? (
                <CreditCard className="mr-2 h-4 w-4" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Processing...' : 
                paymentOption === 'payNow' ? `Pay ₹${service.price} Securely` : 'Confirm Booking (Pay Later)'
              }
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
