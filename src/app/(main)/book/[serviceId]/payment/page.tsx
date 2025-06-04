
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MOCK_SERVICES, MOCK_BOOKINGS } from "@/constants"; 
import type { Service, Booking } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, XCircle, CreditCard, Info, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

type PaymentOption = 'payNow' | 'payLater';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParamsHook = useSearchParams(); 
  const serviceId = params.serviceId as string;
  const bookingIdFromQuery = searchParamsHook.get('bookingId'); 
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [service, setService] = useState<Service | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null); // Slot details
  const [userDetails, setUserDetails] = useState<any>(null); // User info
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

    if (bookingIdFromQuery) {
      const existingBooking = MOCK_BOOKINGS.find(b => b.id === bookingIdFromQuery && b.serviceId === serviceId);
      if (existingBooking) {
        setBookingDetails({
            date: existingBooking.date,
            time: existingBooking.time,
            serviceId: existingBooking.serviceId,
        });
        setUserDetails({ 
            name: existingBooking.userName,
            email: existingBooking.userEmail,
            phone: existingBooking.userEmail, 
        });
      } else {
        setError("Existing booking information not found. Please try again or start a new booking.");
      }
    } else {
        const storedBookingDetails = localStorage.getItem('bookingDetails');
        if (storedBookingDetails) {
          setBookingDetails(JSON.parse(storedBookingDetails));
        } else {
          setError("Booking slot information not found.");
          router.push(`/book/${serviceId}/slots`); 
          return;
        }

        const storedUserDetails = localStorage.getItem('userDetails');
        if (storedUserDetails) {
          setUserDetails(JSON.parse(storedUserDetails));
        } else {
          setError("User details not found.");
           router.push(`/book/${serviceId}/slots`); 
          return;
        }
    }
  }, [serviceId, bookingIdFromQuery, router]);

  const handlePaymentOrConfirmation = async () => {
    setIsLoading(true);
    setError(null);

    if (!service || !bookingDetails || !userDetails || !currentUser) {
      setError("Critical booking information is missing or you are not logged in. Please start over.");
      setIsLoading(false);
      return;
    }
    
    let paymentSuccess = true;
    let newBookingStatus: Booking['status'];
    let newPaymentStatus: Booking['paymentStatus'];
    let transactionId: string | null = null;
    let finalMeetingLink: string = '';

    if (paymentOption === 'payNow') {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate payment processing
      paymentSuccess = Math.random() > 0.1; // 90% success rate

      if (paymentSuccess) {
        newPaymentStatus = 'paid';
        transactionId = "mock_txn_" + Date.now();

        if (bookingIdFromQuery) { // Paying for an existing 'pay_later_pending' booking
            const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingIdFromQuery);
            if (bookingIndex !== -1) {
                MOCK_BOOKINGS[bookingIndex].paymentStatus = 'paid';
                MOCK_BOOKINGS[bookingIndex].transactionId = transactionId;
                // Status becomes 'accepted', or 'scheduled' if admin already added a link
                MOCK_BOOKINGS[bookingIndex].status = MOCK_BOOKINGS[bookingIndex].meetingLink ? 'scheduled' : 'accepted';
                newBookingStatus = MOCK_BOOKINGS[bookingIndex].status;
                finalMeetingLink = MOCK_BOOKINGS[bookingIndex].meetingLink || '';
            } else {
                setError("Could not find the booking to update. Please try again.");
                setIsLoading(false);
                return;
            }
        } else { // New booking, paid now
            newBookingStatus = 'accepted'; // Admin needs to provide link
            finalMeetingLink = ''; // No meeting link generated here
        }
        toast({
          title: "Payment Successful!",
          description: newBookingStatus === 'accepted' ? "Your booking is paid. Admin will schedule and provide meeting link." : "Your booking is confirmed. Redirecting...",
          variant: "default",
        });
      } else {
        setError("Payment failed. Please try again.");
        toast({
          title: "Payment Failed",
          description: "There was an issue processing your payment. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    } else { // Pay Later (always a new booking)
      if (bookingIdFromQuery) { 
          setError("Pay Later option is not available for existing bookings being paid now.");
          setIsLoading(false);
          return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      newPaymentStatus = 'pay_later_pending';
      newBookingStatus = 'pending_approval'; // Admin needs to approve
      finalMeetingLink = ''; // No meeting link
      transactionId = null;
      toast({
        title: "Booking Tentatively Confirmed!",
        description: "Your slot is reserved. Payment will be due before the session if approved. Redirecting...",
        variant: "default",
      });
    }

    if (paymentSuccess) {
      if (!bookingIdFromQuery) { // If it's a brand new booking, add it to MOCK_BOOKINGS
        const newBookingId = `booking-${Date.now()}`;
        const newBookingEntry: Booking = {
          id: newBookingId,
          serviceName: service.name,
          serviceId: service.id,
          date: bookingDetails.date,
          time: bookingDetails.time,
          userName: userDetails.name,
          userEmail: currentUser.email,
          meetingLink: finalMeetingLink, 
          status: newBookingStatus,
          paymentStatus: newPaymentStatus,
          transactionId: transactionId,
          requestedRefund: false,
        };
        MOCK_BOOKINGS.push(newBookingEntry);
      }
      // For existing bookings, MOCK_BOOKINGS was updated directly in the 'payNow' block.

      localStorage.setItem('confirmationDetails', JSON.stringify({
        serviceName: service.name,
        date: bookingDetails.date,
        time: bookingDetails.time,
        userName: userDetails.name,
        meetingLink: finalMeetingLink,
        transactionId: transactionId,
        paymentStatus: newPaymentStatus,
        status: newBookingStatus, // Pass the actual booking status
      }));
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
          <AlertDescription>{error} Please start the booking process again from the service selection or slot page.</AlertDescription>
           <Button onClick={() => router.push('/services')} className="mt-4">Go to Services</Button>
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
              Name: {userDetails.name} <br />
              Email: {userDetails.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-primary">₹{service.price}</span>
            </div>

            <RadioGroup 
                onValueChange={(value: PaymentOption) => setPaymentOption(value)} 
                className="space-y-2"
                value={bookingIdFromQuery ? 'payNow' : paymentOption} 
            >
              <Label className="font-semibold text-md">Payment Options:</Label>
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:border-primary transition-colors">
                <RadioGroupItem value="payNow" id="payNow" disabled={bookingIdFromQuery && MOCK_BOOKINGS.find(b=>b.id===bookingIdFromQuery)?.paymentStatus === 'paid'} />
                <Label htmlFor="payNow" className="flex-1 cursor-pointer">Pay Now & Confirm Slot</Label>
              </div>
              {!bookingIdFromQuery && ( 
                <div className="flex items-center space-x-2 p-3 border rounded-md hover:border-primary transition-colors">
                    <RadioGroupItem value="payLater" id="payLater" />
                    <Label htmlFor="payLater" className="flex-1 cursor-pointer">Pay Later (Tentative, Requires Approval)</Label>
                </div>
              )}
            </RadioGroup>

            {paymentOption === 'payLater' && !bookingIdFromQuery && (
              <Alert variant="default" className="bg-accent/10 border-accent/50 text-accent-foreground">
                <Info className="h-4 w-4 !text-accent" />
                <AlertTitle className="!text-accent">Important Notice</AlertTitle>
                <AlertDescription className="!text-accent/80">
                  Slots booked with 'Pay Later' are tentative and require admin approval. If approved, payment will be due before your scheduled session to fully confirm your booking.
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
              disabled={isLoading || (bookingIdFromQuery && MOCK_BOOKINGS.find(b=>b.id===bookingIdFromQuery)?.paymentStatus === 'paid')} 
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
                paymentOption === 'payNow' ? `Pay ₹${service.price} Securely` : 'Request Booking (Pay Later)'
              }
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
