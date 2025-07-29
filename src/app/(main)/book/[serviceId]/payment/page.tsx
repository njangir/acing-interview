
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Service, Booking } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, XCircle, CreditCard, Info, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// PRODUCTION TODO: Import Firebase and Firestore methods:
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
// import { functions } from '@/lib/firebase'; // If using Firebase Functions for backend logic
// import { httpsCallable } from 'firebase/functions';

type PaymentOption = 'payNow' | 'payLater';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParamsHook = useSearchParams(); 
  const serviceId = params.serviceId as string;
  const bookingId = searchParamsHook.get('bookingId');
  const { toast } = useToast();
  const { currentUser, loadingAuth } = useAuth(); // Added loadingAuth
  
  const [service, setService] = useState<Service | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false); // General loading for page actions
  const [isDataLoading, setIsDataLoading] = useState(true); // Specific for initial data load
  const [error, setError] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('payNow');

  useEffect(() => {
    if (loadingAuth) {
      setIsDataLoading(true);
      return;
    }
    if (!currentUser) {
      setIsDataLoading(false);
      setError("User not authenticated. Please login.");
      router.push(`/login?redirect=/book/${serviceId}/slots`);
      return;
    }

    if (!bookingId) {
        setError("Booking ID is missing. Please start over.");
        setIsDataLoading(false);
        return;
    }

    const loadInitialData = async () => {
      setIsDataLoading(true);
      setError(null);
      try {
        const bookingDocRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingDocRef);

        if (!bookingSnap.exists() || bookingSnap.data().uid !== currentUser.uid) {
            setError("Booking not found or access denied.");
            setIsDataLoading(false);
            return;
        }

        const bookingData = bookingSnap.data() as Booking;
        setBooking(bookingData);

        if(bookingData.paymentStatus === 'paid') {
            setError("This booking has already been paid.");
        }

        const serviceDocRef = doc(db, "services", bookingData.serviceId);
        const serviceSnap = await getDoc(serviceDocRef);
        if (serviceSnap.exists()) {
          setService({ id: serviceSnap.id, ...serviceSnap.data() } as Service);
        } else {
          setError("Service associated with this booking not found.");
          setIsDataLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error loading payment page data:", err);
        setError("Failed to load payment details. Please try again.");
      }
      setIsDataLoading(false);
    };

    loadInitialData();
  }, [serviceId, bookingId, router, currentUser, loadingAuth]);

  const handlePaymentOrConfirmation = async () => {
    setIsLoading(true);
    setError(null);

    if (!service || !booking || !currentUser || !bookingId) {
      setError("Critical booking information is missing. Please start over.");
      setIsLoading(false);
      return;
    }
    
    let paymentSuccess = true;
    let newBookingStatus: Booking['status'] = 'pending_approval';
    let newPaymentStatus: Booking['paymentStatus'] = 'pay_later_pending';
    let transactionId: string | null = null;
    const bookingDocRef = doc(db, "bookings", bookingId);

    if (paymentOption === 'payNow') {
      // PRODUCTION TODO: Payment Gateway Integration
      // 1. Call backend API to create a payment order, e.g. using `httpsCallable`
      // 2. Initialize Payment Gateway SDK on client-side with orderId & key
      // 3. In the success handler, call another backend API to verify payment and update booking.
      // 4. On failure, update UI with error.
      // For this prototype, we simulate this process.

      // MOCK PAYMENT SIMULATION
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      paymentSuccess = Math.random() > 0.1; // 90% success rate

      if (paymentSuccess) {
        transactionId = "mock_txn_" + Date.now();
        newPaymentStatus = 'paid';
        newBookingStatus = 'accepted'; // Admin needs to provide link
        
        try {
            await updateDoc(bookingDocRef, {
              paymentStatus: newPaymentStatus,
              status: newBookingStatus,
              transactionId: transactionId,
              updatedAt: serverTimestamp()
            });

            toast({
              title: "Payment Successful!",
              description: "Your booking is paid. Admin will schedule and provide meeting link.",
            });
        } catch (dbError) {
             console.error("Error updating booking after payment:", dbError);
             setError("Payment was successful, but we failed to update your booking record. Please contact support.");
             setIsLoading(false);
             return;
        }

      } else {
        setError("Payment failed. Please try again or choose 'Pay Later'.");
        toast({ title: "Payment Failed", description: "There was an issue processing your payment.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    } else { // Pay Later
      if(booking.status !== 'pending_payment') {
          setError("Pay Later option is only available for new bookings.");
          setIsLoading(false);
          return;
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate short processing
      newPaymentStatus = 'pay_later_pending';
      newBookingStatus = 'pending_approval';
      
      try {
          await updateDoc(bookingDocRef, {
            paymentStatus: newPaymentStatus,
            status: newBookingStatus,
            updatedAt: serverTimestamp(),
          });
          toast({
            title: "Booking Tentatively Confirmed!",
            description: "Your slot is reserved. Payment will be due before the session if approved. Redirecting...",
          });
      } catch (dbError) {
          console.error("Error updating booking for Pay Later:", dbError);
          setError("Failed to reserve your slot. Please try again.");
          setIsLoading(false);
          return;
      }
    }
    
    // Redirect to confirmation page
    router.push(`/book/confirmation?bookingId=${bookingId}`);
    
    setIsLoading(false);
  };

  if (isDataLoading || loadingAuth) {
    return <div className="container py-12"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error && !service && !booking) { // Critical error
     return (
      <div className="container py-12">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error} Please start the booking process again.</AlertDescription>
           <Button onClick={() => router.push('/services')} className="mt-4">Go to Services</Button>
        </Alert>
      </div>
    );
  }
  
  if (!service || !booking) { // Should be caught by isDataLoading, but as fallback
    return <div className="container py-12">Loading payment details... Ensure you are logged in and have selected a slot.</div>;
  }
  
  const isExistingBooking = booking.status !== 'pending_payment';

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
              Service: {booking.serviceName} <br />
              Date: {new Date(booking.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} <br/>
              Time: {booking.time} <br />
              Name: {booking.userName} <br />
              Email: {booking.userEmail}
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
                // If it's an existing booking being paid for, default and lock to 'Pay Now'
                value={isExistingBooking ? 'payNow' : paymentOption}
            >
              <Label className="font-semibold text-md">Payment Options:</Label>
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:border-primary transition-colors">
                <RadioGroupItem 
                    value="payNow" 
                    id="payNow" 
                    disabled={booking.paymentStatus === 'paid'}
                />
                <Label htmlFor="payNow" className="flex-1 cursor-pointer">Pay Now & Confirm Slot</Label>
              </div>
              {!isExistingBooking && ( // 'Pay Later' only for brand new bookings
                <div className="flex items-center space-x-2 p-3 border rounded-md hover:border-primary transition-colors">
                    <RadioGroupItem value="payLater" id="payLater" />
                    <Label htmlFor="payLater" className="flex-1 cursor-pointer">Pay Later (Tentative, Requires Approval)</Label>
                </div>
              )}
            </RadioGroup>

            {paymentOption === 'payLater' && !isExistingBooking && (
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
                {/* PRODUCTION TODO: Replace with actual payment gateway button/integration (e.g., Razorpay button) */}
                <Image src="https://placehold.co/300x80.png?text=Mock+Payment+Gateway" alt="Mock Payment Gateway" width={300} height={80} className="mx-auto rounded border" data-ai-hint="payment gateway logo"/>
                </div>
            )}

             {error && ( // General error display if not critical
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handlePaymentOrConfirmation} 
              disabled={isLoading || booking.paymentStatus === 'paid'} 
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
